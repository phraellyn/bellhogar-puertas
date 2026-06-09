<template>
  <v-card color="surface" class="border-golden fill-height d-flex flex-column" rounded="lg">
    <!-- Área del Lienzo -->
    <v-card-text class="pa-0 canvas-container flex-grow-1 position-relative">
      <!-- Wrapper centrado que mantiene el aspect ratio -->
      <div class="canvas-aspect-wrapper">
        <!-- Lienzo Principal -->
        <canvas
          ref="canvas"
          class="main-canvas"
          @pointerdown="startDrawing"
          @pointermove="draw"
          @pointerup="stopDrawing"
          @pointerleave="stopDrawing"
          @pointercancel="stopDrawing"
          @touchstart.prevent.stop
          @touchmove.prevent.stop
          @touchend.prevent.stop
        ></canvas>

        <!-- Capa de Cuadrícula de Plano (Siempre Visible, sobre el canvas centrado) -->
        <div v-if="showGrid" class="grid-overlay" :class="{ 'grid-only-clear': canvasType === 'anotaciones' }"></div>
      </div>

      <!-- Mensaje de Carga del Dibujo Guardado -->
      <div v-if="loadingImage" class="canvas-loader d-flex align-center justify-center">
        <v-progress-circular indeterminate color="primary" class="mr-2"></v-progress-circular>
        <span class="text-subtitle-1 text-grey-darken-3 font-weight-bold">Cargando dibujo existente...</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

export default {
  name: 'SketchCanvas',
  props: {
    // URL de la imagen guardada previamente en Firebase Storage
    imageUrl: {
      type: String,
      default: null
    },
    // ID del proyecto
    projectId: {
      type: String,
      required: true
    },
    // ID de la estancia/formulario
    formId: {
      type: String,
      required: true
    },
    // Tipo de canvas: 'anotaciones' | 'boceto'
    canvasType: {
      type: String,
      default: 'anotaciones'
    },
    // Si la pestaña está activa o no (para guardar instantáneamente al cambiar)
    isActive: {
      type: Boolean,
      default: true
    },
    // ID de la página
    pageId: {
      type: String,
      required: true
    },
    // Herramientas e hilos de dibujo compartidos desde el padre
    activeTool: {
      type: String,
      default: 'draw'
    },
    brushSize: {
      type: Number,
      default: 5
    },
    brushColor: {
      type: String,
      default: '#101010'
    }
  },
  emits: ['save', 'focus'],
  setup(props, { emit }) {
    const canvas = ref(null);
    const context = ref(null);
    const isDrawing = ref(false);
    
    // Cuadrícula siempre encendida
    const showGrid = ref(true);
    
    const loadingImage = ref(false);
    
    // Relación de aspecto bloqueada permanente a formato A4 Vertical (210mm x 297mm)
    let lockedAspectRatio = 210 / 297; // width / height
    
    // Estados de autoguardado premium
    const saveStatus = ref('saved'); // 'saved' | 'dirty' | 'saving'
    let autoSaveTimer = null;
    let currentSavePromise = null;

    // Historial para Undo (Deshacer)
    const history = ref([]);
    const historyIndex = ref(-1);
    const maxHistory = 20;

    // Coordenadas del último trazo
    const lastX = ref(0);
    const lastY = ref(0);

    // Inicializar el canvas y ajustar su resolución (preservando el aspect ratio bloqueado)
    const resizeCanvas = () => {
      const cvs = canvas.value;
      if (!cvs) return;

      // El contenedor padre es el .canvas-aspect-wrapper, pero medimos el .canvas-container (el abuelo)
      const container = cvs.closest('.canvas-container');
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = Math.floor(containerRect.width) || 0;
      const containerHeight = Math.floor(containerRect.height) || 0;

      // Si las dimensiones del contenedor son 0 (por estar oculto), abortamos.
      if (containerWidth === 0 || containerHeight === 0) return;



      // Calcular dimensiones que caben en el contenedor manteniendo el aspect ratio
      let targetWidth, targetHeight;
      const containerAR = containerWidth / containerHeight;
      if (containerAR > lockedAspectRatio) {
        // Contenedor más ancho que el ratio: limitar por alto (pillarbox)
        targetHeight = containerHeight;
        targetWidth = Math.floor(containerHeight * lockedAspectRatio);
      } else {
        // Contenedor más alto que el ratio: limitar por ancho (letterbox)
        targetWidth = containerWidth;
        targetHeight = Math.floor(containerWidth / lockedAspectRatio);
      }

      // EVITAR BUCLE INFINITO DE RESIZEOBSERVER Y OPTIMIZAR EL RENDIMIENTO:
      const currentStyleWidth = parseInt(cvs.style.width, 10);
      const currentStyleHeight = parseInt(cvs.style.height, 10);
      if (currentStyleWidth === targetWidth && currentStyleHeight === targetHeight) {
        return;
      }

      // Guardar contenido actual antes de redimensionar
      let tempImage = null;
      const ctx = cvs.getContext('2d', { willReadFrequently: true });
      if (cvs.width > 0 && cvs.height > 0) {
        tempImage = ctx.getImageData(0, 0, cvs.width, cvs.height);
      }

      // Ajustamos la resolución interna del canvas multiplicada por 2 para Retina / pantallas táctiles nítidas
      const scale = 2;
      cvs.width = targetWidth * scale;
      cvs.height = targetHeight * scale;
      cvs.style.width = `${targetWidth}px`;
      cvs.style.height = `${targetHeight}px`;

      // Dimensionar el wrapper para centrado
      const wrapper = cvs.closest('.canvas-aspect-wrapper');
      if (wrapper) {
        wrapper.style.width = `${targetWidth}px`;
        wrapper.style.height = `${targetHeight}px`;
      }

      // Reconfigurar contexto usando setTransform para evitar la acumulación de escala al redimensionar
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      context.value = ctx;

      // Restaurar imagen o limpiar a blanco
      if (tempImage) {
        // Redibujar la imagen antigua ajustando proporciones
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tempImage.width;
        tempCanvas.height = tempImage.height;
        tempCanvas.getContext('2d', { willReadFrequently: true }).putImageData(tempImage, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
      } else {
        clearCanvasRaw();
      }

      // Si hay una URL de imagen guardada en Firestore y es la primera carga (sin historial previo), dibujarla
      if (props.imageUrl && history.value.length === 0) {
        loadSavedImage(props.imageUrl);
      } else if (history.value.length === 0) {
        saveToHistory(); // Guardar estado blanco inicial
      }
    };

    const clearCanvasRaw = () => {
      const ctx = context.value;
      const cvs = canvas.value;
      if (!ctx || !cvs) return;
      
      const width = cvs.width / 2;
      const height = cvs.height / 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    };

    const confirmClear = () => {
      if (confirm('¿Seguro que deseas limpiar todo este lienzo? El historial también se borrará.')) {
        clearCanvasRaw();
        history.value = [];
        historyIndex.value = -1;
        saveToHistory();
        saveStatus.value = 'dirty';
      }
    };

    // Manejadores de eventos táctiles y de puntero
    const getCoordinates = (e) => {
      const cvs = canvas.value;
      if (!cvs) return { x: 0, y: 0 };
      const rect = cvs.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const startDrawing = (e) => {
      e.preventDefault();
      // Asegurar que use pointer events correctamente
      canvas.value.setPointerCapture(e.pointerId);

      isDrawing.value = true;
      emit('focus', props.pageId);
      const coords = getCoordinates(e);
      lastX.value = coords.x;
      lastY.value = coords.y;
    };

    const draw = (e) => {
      if (!isDrawing.value || !context.value) return;
      e.preventDefault();

      const coords = getCoordinates(e);
      const ctx = context.value;

      ctx.beginPath();
      ctx.moveTo(lastX.value, lastY.value);
      ctx.lineTo(coords.x, coords.y);

      // Configurar color y grosor según herramienta
      if (props.activeTool === 'erase') {
        ctx.strokeStyle = '#ffffff'; // Color de borrador es blanco
        ctx.lineWidth = props.brushSize * 2.5; // Goma más ancha
      } else {
        ctx.strokeStyle = props.brushColor;
        ctx.lineWidth = props.brushSize;
      }

      ctx.stroke();

      lastX.value = coords.x;
      lastY.value = coords.y;
    };

    const stopDrawing = (e) => {
      if (!isDrawing.value) return;
      isDrawing.value = false;
      
      try {
        canvas.value.releasePointerCapture(e.pointerId);
      } catch (err) {}

      // Guardar el trazo terminado en el historial
      saveToHistory();
      saveStatus.value = 'dirty';
    };

    // Historial y Undo (Deshacer)
    const saveToHistory = () => {
      const cvs = canvas.value;
      const ctx = context.value;
      if (!cvs || !ctx) return;

      const state = ctx.getImageData(0, 0, cvs.width, cvs.height);
      
      // Si estamos en medio del historial y dibujamos, truncamos el futuro rehecho
      if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1);
      }

      history.value.push(state);
      if (history.value.length > maxHistory) {
        history.value.shift();
      }
      historyIndex.value = history.value.length - 1;
    };

    const undo = () => {
      if (historyIndex.value > 0) {
        historyIndex.value--;
        const state = history.value[historyIndex.value];
        context.value.putImageData(state, 0, 0);
        saveStatus.value = 'dirty';
      }
    };

    // Cargar imagen remota de Firebase Storage en el lienzo
    const loadSavedImage = (url) => {
      if (!url) return;
      loadingImage.value = true;
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Evitar problemas de CORS
      
      // Cache-buster para evitar que el navegador use la versión sin CORS en la caché
      const cacheBustedUrl = url.startsWith('data:') ? url : `${url}${url.includes('?') ? '&' : '?'}_cb=${new Date().getTime()}`;
      img.src = cacheBustedUrl;
      img.onload = () => {
        resizeCanvas();

        const ctx = context.value;
        const cvs = canvas.value;
        if (ctx && cvs) {
          clearCanvasRaw();
          const width = cvs.width / 2;
          const height = cvs.height / 2;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Resetear historial al cargar la imagen
          history.value = [];
          historyIndex.value = -1;
          saveToHistory();
        }
        loadingImage.value = false;
      };
      img.onerror = () => {
        console.error('Error al cargar dibujo desde Storage:', url);
        loadingImage.value = false;
        saveToHistory(); // Iniciar con lienzo en blanco
      };
    };

    // Exportar el lienzo como Blob PNG y emitir evento
    const saveDrawing = () => {
      const cvs = canvas.value;
      if (!cvs) return Promise.resolve(false);

      // Si ya está guardado y no hay promesa pendiente, retornar de inmediato
      if (saveStatus.value === 'saved' && !currentSavePromise) {
        return Promise.resolve(true);
      }

      // Si ya hay una promesa de guardado en curso, retornar la misma para evitar duplicados
      if (currentSavePromise) {
        return currentSavePromise;
      }

      saveStatus.value = 'saving';
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      
      currentSavePromise = new Promise((resolve) => {
        // Exportar a blob
        cvs.toBlob((blob) => {
          if (blob) {
            emit('save', {
              blob,
              canvasType: props.canvasType,
              formId: props.formId,
              pageId: props.pageId,
              callback: (err) => {
                currentSavePromise = null;
                if (!err) {
                  saveStatus.value = 'saved';
                } else {
                  saveStatus.value = 'dirty';
                }
              }
            });
            resolve(true); // Resolverse inmediatamente tras emitir el blob
          } else {
            currentSavePromise = null;
            saveStatus.value = 'dirty';
            resolve(false);
          }
        }, 'image/png');
      });

      return currentSavePromise;
    };

    // Atajos de teclado (Ctrl+Z para Undo)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', resizeCanvas);
      
      // Forzar redimensionamiento inicial con un pequeño retraso
      setTimeout(resizeCanvas, 100);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', resizeCanvas);
      
      // Guardar inmediatamente si hay cambios al desmontar
      if (saveStatus.value === 'dirty') {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        saveDrawing();
      }
    });

    // Escuchar si la URL cambia dinámicamente
    watch(() => props.imageUrl, (newUrl) => {
      if (newUrl && history.value.length <= 1) {
        loadSavedImage(newUrl);
      }
    });

    // Redimensionamiento cuando se activa la pestaña
    watch(() => props.isActive, (newActive) => {
      if (newActive) {
        setTimeout(resizeCanvas, 150); // Tiempo para que termine la transición de pestaña de Vuetify
      }
    });

    // Mantener showGrid sincronizado si cambia el tipo
    watch(() => props.canvasType, () => {
      showGrid.value = true;
    });

    return {
      canvas,
      showGrid,
      loadingImage,
      saveStatus,
      historyIndex,
      confirmClear,
      startDrawing,
      draw,
      stopDrawing,
      undo,
      saveDrawing,
    };
  },
};
</script>

<style scoped>
.canvas-container {
  overflow: hidden;
  touch-action: none; /* Desactivar gestos por defecto en móvil para evitar scroll al dibujar */
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
  background-color: #e8e8e8 !important; /* Fondo gris claro detrás del canvas centrado */
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-aspect-wrapper {
  position: relative;
  background-color: #ffffff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
}

.main-canvas {
  display: block;
  cursor: crosshair;
  z-index: 1; /* Mantenemos el lienzo abajo */
  position: relative;
  touch-action: none; /* Desactivar gestos de scroll/gestos en el propio lienzo para iPad/iOS */
}

/* Capa de rejilla a escala translúcida */
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none; /* No interceptar clics */
  z-index: 2; /* Por encima del canvas */
  background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='rgba(90,90,90,0.8)' stroke-width='1.1' stroke-dasharray='2%202'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='40' height='40' fill='url(%23grid)'/%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(90,90,90,0.7)' stroke-width='1.4'/%3E%3C/svg%3E");
  background-size: 40px 40px;
  background-repeat: repeat;
}

.grid-overlay.grid-only-clear {
  background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='rgba(90,90,90,0.8)' stroke-width='1.1' stroke-dasharray='2%202'/%3E%3C/svg%3E");
  background-size: 20px 20px;
}

.canvas-loader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.85);
  z-index: 5;
}

.color-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.color-dot:hover {
  transform: scale(1.15);
}

.border-golden {
  border: 1px solid rgba(226, 192, 96, 0.2) !important;
}

.bg-surface-variant {
  background-color: rgba(30, 30, 27, 0.4) !important;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rotate-icon :deep(.v-icon) {
  animation: spin 1.2s infinite linear;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
