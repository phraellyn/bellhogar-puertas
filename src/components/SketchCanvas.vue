<template>
  <v-card
    color="surface"
    class="border-golden fill-height d-flex flex-column"
    :class="{ 'fit-width-sheet': fitWidth }"
    rounded="lg"
  >
    <!-- Área del Lienzo -->
    <v-card-text
      class="pa-0 canvas-container flex-grow-1 position-relative"
      @wheel="onWheel"
      @gesturestart="startTrackpadGesture"
      @gesturechange="moveTrackpadGesture"
      @gestureend="endTrackpadGesture"
    >
      <div v-if="canvasType === 'boceto' && showGrid" class="infinite-grid" :style="gridStyle"></div>
      <div v-if="canvasType === 'boceto'" class="viewport-controls d-flex align-center gap-1">
        <v-btn icon="mdi-hand-back-right-outline" size="small" :color="panTool ? 'primary' : 'white'" :variant="panTool ? 'flat' : 'tonal'" title="Arrastrar hoja" @click="panTool = !panTool"></v-btn>
        <v-btn icon="mdi-minus" size="small" variant="tonal" color="white" title="Alejar" @click="changeZoom(-0.2)"></v-btn>
        <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
        <v-btn icon="mdi-plus" size="small" variant="tonal" color="white" title="Acercar" @click="changeZoom(0.2)"></v-btn>
        <v-btn icon="mdi-fit-to-screen-outline" size="small" variant="tonal" color="white" title="Centrar y ajustar plano" @click="autoFit"></v-btn>
      </div>
      <!-- Wrapper centrado que mantiene el aspect ratio -->
      <div class="canvas-aspect-wrapper" :class="{ 'pan-mode': panTool, 'infinite-workspace': canvasType === 'boceto' }" :style="viewportStyle">
        <!-- Lienzo Principal -->
        <canvas
          ref="canvas"
          class="main-canvas"
          @pointerdown="startDrawing"
          @pointermove="draw"
          @pointerup="stopDrawing"
          @pointerleave="stopDrawing"
          @pointercancel="stopDrawing"
        ></canvas>

        <!-- Capa de Texto/Plano IA detrás del Canvas -->
        <div
          v-if="textoReconocido"
          class="text-layer"
          :style="{ padding: isSvg ? '0px' : '25px' }"
          v-html="textoReconocido"
        >
        </div>

        <!-- Capa de Cuadrícula de Plano (Sobre el canvas centrado, según showGrid) -->
        <div
          v-if="showGrid && canvasType !== 'boceto'"
          class="grid-overlay"
          :class="{ 'grid-only-clear': canvasType === 'anotaciones' }"
        ></div>
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
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue';
// html2canvas eliminado: la captura del canvas se hace directamente con canvas.toDataURL()

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
    },
    textoReconocido: {
      type: String,
      default: ""
    },
    // Control externo de visibilidad de la cuadrícula/rejilla
    showGrid: {
      type: Boolean,
      default: true
    },
    fitWidth: {
      type: Boolean,
      default: false
    }
  },
  emits: ['save', 'focus'],
  setup(props, { emit }) {
    const canvas = ref(null);
    const context = ref(null);
    const isDrawing = ref(false);
    const zoom = ref(1);
    const panX = ref(0);
    const panY = ref(0);
    const panTool = ref(false);
    const viewportStyle = computed(() => ({ transform: `translate3d(${panX.value}px, ${panY.value}px, 0) scale(${zoom.value})` }));
    const gridStyle = computed(() => {
      const currentZoom = Math.max(0.1, zoom.value);
      let minorStep = 20;

      // Cambiar de nivel de rejilla cuando las divisiones quedarían demasiado
      // juntas o separadas en pantalla. El plano sigue arrastrando y escalando la
      // rejilla, pero sus líneas nunca se reducen hasta hacerse invisibles.
      while (minorStep * currentZoom < 12) minorStep *= 2;
      while (minorStep * currentZoom > 40 && minorStep > 2.5) minorStep /= 2;

      const majorStep = minorStep * 5;
      // El grosor cambia solo al saltar de nivel de rejilla. Evita volver a
      // rasterizar el patrón completo en cada evento del gesto táctil.
      const gridLevel = minorStep / 20;
      const minorLine = Math.max(0.125, gridLevel);
      const majorLine = Math.max(0.2, gridLevel * 1.35);

      return {
        ...viewportStyle.value,
        backgroundImage: [
          `linear-gradient(rgba(75, 75, 75, 0.42) ${minorLine}px, transparent ${minorLine}px)`,
          `linear-gradient(90deg, rgba(75, 75, 75, 0.42) ${minorLine}px, transparent ${minorLine}px)`,
          `linear-gradient(rgba(45, 45, 45, 0.58) ${majorLine}px, transparent ${majorLine}px)`,
          `linear-gradient(90deg, rgba(45, 45, 45, 0.58) ${majorLine}px, transparent ${majorLine}px)`
        ].join(', '),
        backgroundSize: [
          `${minorStep}px ${minorStep}px`,
          `${minorStep}px ${minorStep}px`,
          `${majorStep}px ${majorStep}px`,
          `${majorStep}px ${majorStep}px`
        ].join(', ')
      };
    });
    const activePointers = new Map();
    let panStart = null;
    let gestureStart = null;
    let wheelGesture = null;
    let wheelGestureTimer = null;
    let trackpadGesture = null;
    let gestureAnimationFrame = null;
    let pendingGestureTransform = null;
    let notesScrollGesture = null;
    let notesScrollAnimationFrame = null;
    let pendingNotesScrollTop = null;
    
    // Determinar si el texto digitalizado es un plano SVG
    const isSvg = computed(() => props.textoReconocido?.trim().startsWith('<svg') || false);
    
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
    // Los bocetos usan una superficie mucho mayor que el viewport. Limitamos su
    // historial para no multiplicar innecesariamente el consumo de memoria.
    const maxHistory = props.canvasType === 'boceto' ? 3 : 20;

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



      // El boceto dispone de un área de trabajo real amplia alrededor del
      // viewport. El fondo visual ya era infinito, pero el canvas anterior solo
      // medía dos viewports y provocaba límites invisibles al dibujar.
      let targetWidth, targetHeight;
      if (props.canvasType === 'boceto') {
        targetWidth = Math.min(3600, Math.max(2400, Math.floor(containerWidth * 4)));
        targetHeight = Math.min(3600, Math.max(2400, Math.floor(containerHeight * 4)));
      } else if (props.canvasType === 'anotaciones' && props.fitWidth) {
        targetWidth = containerWidth;
        targetHeight = Math.floor(containerWidth / lockedAspectRatio);
      } else {
        const containerAR = containerWidth / containerHeight;
        if (containerAR > lockedAspectRatio) {
          targetHeight = containerHeight;
          targetWidth = Math.floor(containerHeight * lockedAspectRatio);
        } else {
          targetWidth = containerWidth;
          targetHeight = Math.floor(containerWidth / lockedAspectRatio);
        }
      }

      // EVITAR BUCLE INFINITO DE RESIZEOBSERVER Y OPTIMIZAR EL RENDIMIENTO:
      const currentStyleWidth = parseInt(cvs.style.width, 10);
      const currentStyleHeight = parseInt(cvs.style.height, 10);
      if (currentStyleWidth === targetWidth && currentStyleHeight === targetHeight) {
        return;
      }

      // Guardar contenido y dimensiones actuales antes de redimensionar.
      const previousCssWidth = parseInt(cvs.style.width, 10) || cvs.width;
      const previousCssHeight = parseInt(cvs.style.height, 10) || cvs.height;
      let tempImage = null;
      const ctx = cvs.getContext('2d', { willReadFrequently: true });
      if (cvs.width > 0 && cvs.height > 0) {
        tempImage = ctx.getImageData(0, 0, cvs.width, cvs.height);
      }

      // El espacio de boceto usa una resolución 1:1 para mantener una superficie amplia.
      const scale = props.canvasType === 'boceto' ? 1 : 2;
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

      // Restaurar imagen o limpiar el lienzo.
      if (tempImage) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tempImage.width;
        tempCanvas.height = tempImage.height;
        tempCanvas.getContext('2d', { willReadFrequently: true }).putImageData(tempImage, 0, 0);
        if (props.canvasType === 'boceto') {
          // Conservar el tamaño del plano y añadir espacio por igual a su
          // alrededor. Estirarlo hasta el nuevo borde volvía a dejar el dibujo
          // sin margen y hacía reaparecer el límite invisible.
          const copyWidth = Math.min(previousCssWidth, targetWidth);
          const copyHeight = Math.min(previousCssHeight, targetHeight);
          const sourceX = Math.max(0, (previousCssWidth - targetWidth) / 2);
          const sourceY = Math.max(0, (previousCssHeight - targetHeight) / 2);
          const destinationX = Math.max(0, (targetWidth - previousCssWidth) / 2);
          const destinationY = Math.max(0, (targetHeight - previousCssHeight) / 2);
          ctx.drawImage(
            tempCanvas,
            sourceX,
            sourceY,
            copyWidth,
            copyHeight,
            destinationX,
            destinationY,
            copyWidth,
            copyHeight
          );
        } else {
          ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
        }
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
      
      const pixelRatio = cvs.width / (parseInt(cvs.style.width, 10) || cvs.width);
      const width = cvs.width / pixelRatio;
      const height = cvs.height / pixelRatio;
      
      ctx.clearRect(0, 0, width, height);
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
      const cssWidth = parseInt(cvs.style.width, 10) || rect.width;
      const cssHeight = parseInt(cvs.style.height, 10) || rect.height;
      return {
        x: ((e.clientX - rect.left) / rect.width) * cssWidth,
        y: ((e.clientY - rect.top) / rect.height) * cssHeight
      };
    };

    const clampZoom = (value) => Math.min(12, Math.max(0.1, value));
    const changeZoom = (amount) => { zoom.value = clampZoom(zoom.value + amount); };
    const viewportPoint = (point) => {
      const container = canvas.value?.closest('.canvas-container');
      if (!container) return point;
      const rect = container.getBoundingClientRect();
      return {
        x: point.x - rect.left - rect.width / 2,
        y: point.y - rect.top - rect.height / 2
      };
    };
    const applyGestureTransform = (start, currentCenter, nextZoom) => {
      const startCenter = viewportPoint(start.center);
      const endCenter = viewportPoint(currentCenter);
      const scaleRatio = nextZoom / start.zoom;

      zoom.value = nextZoom;
      // Conserva bajo el punto medio actual el mismo punto del plano que había
      // bajo el punto medio inicial, incluso al trasladar y escalar a la vez.
      panX.value = endCenter.x - scaleRatio * (startCenter.x - start.panX);
      panY.value = endCenter.y - scaleRatio * (startCenter.y - start.panY);
    };
    const scheduleGestureTransform = (start, currentCenter, nextZoom) => {
      pendingGestureTransform = { start, currentCenter, nextZoom };
      if (gestureAnimationFrame !== null) return;
      gestureAnimationFrame = requestAnimationFrame(() => {
        const pending = pendingGestureTransform;
        pendingGestureTransform = null;
        gestureAnimationFrame = null;
        if (pending) applyGestureTransform(pending.start, pending.currentCenter, pending.nextZoom);
      });
    };
    const zoomAtPoint = (nextZoom, center) => {
      applyGestureTransform({
        center,
        zoom: zoom.value,
        panX: panX.value,
        panY: panY.value
      }, center, nextZoom);
    };
    const getContentBounds = () => {
      const cvs = canvas.value;
      const ctx = context.value;
      if (!cvs || !ctx) return null;
      const pixels = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
      let minX = cvs.width, minY = cvs.height, maxX = -1, maxY = -1;
      for (let y = 0; y < cvs.height; y++) {
        for (let x = 0; x < cvs.width; x++) {
          const pixelIndex = (y * cvs.width + x) * 4;
          const alpha = pixels[pixelIndex + 3];
          const isVisibleInk = alpha > 5 && (
            pixels[pixelIndex] < 245 ||
            pixels[pixelIndex + 1] < 245 ||
            pixels[pixelIndex + 2] < 245
          );
          if (isVisibleInk) {
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          }
        }
      }
      const pixelRatio = cvs.width / (parseInt(cvs.style.width, 10) || cvs.width);
      const detectedBounds = [];
      if (maxX >= 0) {
        detectedBounds.push({
          x: minX / pixelRatio,
          y: minY / pixelRatio,
          width: (maxX - minX + 1) / pixelRatio,
          height: (maxY - minY + 1) / pixelRatio
        });
      }

      const svg = cvs.closest('.canvas-aspect-wrapper')?.querySelector('.text-layer svg');
      if (svg) {
        const viewBox = svg.viewBox?.baseVal;
        const svgWidth = viewBox?.width || svg.width?.baseVal?.value || parseInt(cvs.style.width, 10) || cvs.width;
        const svgHeight = viewBox?.height || svg.height?.baseVal?.value || parseInt(cvs.style.height, 10) || cvs.height;
        let svgMinX = Infinity, svgMinY = Infinity, svgMaxX = -Infinity, svgMaxY = -Infinity;
        const graphicalElements = svg.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect, text');
        graphicalElements.forEach((element) => {
          try {
            const box = element.getBBox();
            if (!box || (box.width === 0 && box.height === 0)) return;
            const fill = (element.getAttribute('fill') || '').toLowerCase();
            const isBackgroundRect = element.tagName.toLowerCase() === 'rect'
              && box.width >= svgWidth * 0.9
              && box.height >= svgHeight * 0.9
              && ['white', '#fff', '#ffffff', 'rgb(255,255,255)'].includes(fill.replaceAll(' ', ''));
            if (isBackgroundRect) return;
            const matrix = element.getCTM();
            if (!matrix) return;
            const corners = [
              [box.x, box.y], [box.x + box.width, box.y],
              [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]
            ];
            corners.forEach(([x, y]) => {
              const mappedX = matrix.a * x + matrix.c * y + matrix.e;
              const mappedY = matrix.b * x + matrix.d * y + matrix.f;
              svgMinX = Math.min(svgMinX, mappedX); svgMinY = Math.min(svgMinY, mappedY);
              svgMaxX = Math.max(svgMaxX, mappedX); svgMaxY = Math.max(svgMaxY, mappedY);
            });
          } catch (err) {}
        });
        if (Number.isFinite(svgMinX)) {
          detectedBounds.push({ x: svgMinX, y: svgMinY, width: svgMaxX - svgMinX, height: svgMaxY - svgMinY });
        }
      }

      if (!detectedBounds.length) return null;
      const unionMinX = Math.min(...detectedBounds.map(bound => bound.x));
      const unionMinY = Math.min(...detectedBounds.map(bound => bound.y));
      const unionMaxX = Math.max(...detectedBounds.map(bound => bound.x + bound.width));
      const unionMaxY = Math.max(...detectedBounds.map(bound => bound.y + bound.height));
      return { x: unionMinX, y: unionMinY, width: unionMaxX - unionMinX, height: unionMaxY - unionMinY };
    };
    const autoFit = () => {
      const cvs = canvas.value;
      const container = cvs?.closest('.canvas-container');
      const bounds = getContentBounds();
      if (!cvs || !container || !bounds) {
        zoom.value = 1;
        panX.value = 0;
        panY.value = 0;
        return;
      }
      const canvasWidth = parseInt(cvs.style.width, 10) || cvs.width;
      const canvasHeight = parseInt(cvs.style.height, 10) || cvs.height;
      const containerRect = container.getBoundingClientRect();
      const padding = 72;
      zoom.value = clampZoom(Math.min(
        (containerRect.width - padding) / bounds.width,
        (containerRect.height - padding) / bounds.height
      ));
      panX.value = -((bounds.x + bounds.width / 2) - canvasWidth / 2) * zoom.value;
      panY.value = -((bounds.y + bounds.height / 2) - canvasHeight / 2) * zoom.value;
    };
    const onWheel = (event) => {
      if (props.canvasType !== 'boceto' || trackpadGesture) return;
      event.preventDefault();

      const center = { x: event.clientX, y: event.clientY };
      const isTrackpadPinch = event.ctrlKey;
      const isLikelyMouseWheel = !isTrackpadPinch
        && Math.abs(event.deltaX) < 0.01
        && Math.abs(event.deltaY) >= 80
        && Math.abs(event.deltaY % 100) < 0.01;

      if (isTrackpadPinch) {
        // Chrome/Safari representan el pellizco del trackpad como Ctrl+wheel.
        // El escalado exponencial ofrece una respuesta continua y mantiene el
        // punto situado bajo el centro del gesto estable durante el gesto.
        const factor = Math.exp(-event.deltaY * 0.01);
        const currentCenter = {
          x: center.x - event.deltaX,
          y: center.y
        };
        const gestureFrame = {
          center: wheelGesture?.center || center,
          zoom: zoom.value,
          panX: panX.value,
          panY: panY.value
        };
        applyGestureTransform(gestureFrame, currentCenter, clampZoom(zoom.value * factor));
        wheelGesture = { center: currentCenter };
      } else if (isLikelyMouseWheel) {
        wheelGesture = null;
        zoomAtPoint(clampZoom(zoom.value + (event.deltaY > 0 ? -0.1 : 0.1)), center);
      } else {
        wheelGesture = null;
        // El scroll continuo del trackpad equivale a trasladar el punto medio
        // de los dos dedos. El signo inverso mueve el plano con los dedos.
        if (event.shiftKey && Math.abs(event.deltaX) < 0.01) {
          panX.value -= event.deltaY;
        } else {
          panX.value -= event.deltaX;
          panY.value -= event.deltaY;
        }
      }

      if (wheelGestureTimer) clearTimeout(wheelGestureTimer);
      wheelGestureTimer = setTimeout(() => {
        wheelGesture = null;
        wheelGestureTimer = null;
      }, 140);
    };
    const trackpadGestureCenter = (event) => {
      const container = canvas.value?.closest('.canvas-container');
      const rect = container?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const hasClientPoint = Number.isFinite(event.clientX)
        && Number.isFinite(event.clientY)
        && (event.clientX !== 0 || event.clientY !== 0);
      return hasClientPoint
        ? { x: event.clientX, y: event.clientY }
        : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const startTrackpadGesture = (event) => {
      if (props.canvasType !== 'boceto' || navigator.maxTouchPoints > 0) return;
      event.preventDefault();
      trackpadGesture = {
        center: trackpadGestureCenter(event),
        scale: event.scale || 1,
        zoom: zoom.value,
        panX: panX.value,
        panY: panY.value
      };
    };
    const moveTrackpadGesture = (event) => {
      if (!trackpadGesture) return;
      event.preventDefault();
      const scaleRatio = (event.scale || 1) / trackpadGesture.scale;
      scheduleGestureTransform(
        trackpadGesture,
        trackpadGestureCenter(event),
        clampZoom(trackpadGesture.zoom * scaleRatio)
      );
    };
    const endTrackpadGesture = (event) => {
      if (trackpadGesture) event.preventDefault();
      trackpadGesture = null;
    };
    const pointerCenter = () => {
      const points = [...activePointers.values()];
      return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    };
    const pointerDistance = () => {
      const points = [...activePointers.values()];
      return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    };
    const startGesture = () => {
      if (activePointers.size < 2) return;
      gestureStart = { distance: pointerDistance(), center: pointerCenter(), zoom: zoom.value, panX: panX.value, panY: panY.value };
      isDrawing.value = false;
      panStart = null;
    };
    const startNotesScrollGesture = () => {
      if (activePointers.size < 2) return;
      const scrollContainer = canvas.value?.closest('.notes-canvas-scroll');
      if (!scrollContainer) return;
      notesScrollGesture = {
        centerY: pointerCenter().y,
        scrollTop: scrollContainer.scrollTop,
        container: scrollContainer
      };
      // El segundo dedo convierte la interacción en desplazamiento. Si el
      // primero llegó a dejar un trazo antes de detectarlo, restauramos el
      // último estado para que el scroll no ensucie las anotaciones.
      const previousState = history.value[historyIndex.value];
      if (isDrawing.value && previousState && context.value && canvas.value
        && previousState.width === canvas.value.width
        && previousState.height === canvas.value.height) {
        context.value.putImageData(previousState, 0, 0);
      }
      isDrawing.value = false;
    };
    const moveNotesScrollGesture = () => {
      if (!notesScrollGesture || activePointers.size < 2) return;
      const centerY = pointerCenter().y;
      pendingNotesScrollTop = notesScrollGesture.scrollTop - (centerY - notesScrollGesture.centerY);
      if (notesScrollAnimationFrame !== null) return;
      notesScrollAnimationFrame = requestAnimationFrame(() => {
        if (notesScrollGesture && pendingNotesScrollTop !== null) {
          notesScrollGesture.container.scrollTop = pendingNotesScrollTop;
        }
        pendingNotesScrollTop = null;
        notesScrollAnimationFrame = null;
      });
    };
    const startDrawing = (e) => {
      e.preventDefault();
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { canvas.value.setPointerCapture(e.pointerId); } catch (err) {}
      if (props.canvasType === 'boceto' && e.pointerType === 'touch' && activePointers.size >= 2) {
        startGesture();
        return;
      }
      if (props.canvasType === 'anotaciones' && e.pointerType === 'touch' && activePointers.size >= 2) {
        startNotesScrollGesture();
        return;
      }
      if (props.canvasType === 'boceto' && (panTool.value || e.button === 1)) {
        panStart = { x: e.clientX, y: e.clientY, panX: panX.value, panY: panY.value };
        return;
      }
      isDrawing.value = true;
      emit('focus', props.pageId);
      const coords = getCoordinates(e);
      lastX.value = coords.x;
      lastY.value = coords.y;
    };

    const draw = (e) => {
      e.preventDefault();
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (props.canvasType === 'anotaciones' && notesScrollGesture && activePointers.size >= 2) {
        moveNotesScrollGesture();
        return;
      }
      if (props.canvasType === 'boceto' && gestureStart && activePointers.size >= 2) {
        const center = pointerCenter();
        const nextZoom = clampZoom(gestureStart.zoom * (pointerDistance() / gestureStart.distance));
        scheduleGestureTransform(gestureStart, center, nextZoom);
        return;
      }
      if (props.canvasType === 'boceto' && panStart) {
        panX.value = panStart.panX + e.clientX - panStart.x;
        panY.value = panStart.panY + e.clientY - panStart.y;
        return;
      }
      if (!isDrawing.value || !context.value) return;

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
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) {
        gestureStart = null;
        notesScrollGesture = null;
      }
      try { canvas.value.releasePointerCapture(e.pointerId); } catch (err) {}
      if (panStart) {
        panStart = null;
        return;
      }
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
          const pixelRatio = cvs.width / (parseInt(cvs.style.width, 10) || cvs.width);
          const width = cvs.width / pixelRatio;
          const height = cvs.height / pixelRatio;
          if (props.canvasType === 'boceto') {
            // Las imágenes antiguas suelen tener el tamaño del viewport que
            // existía al guardarlas. Se mantienen a su tamaño natural y se
            // centran dentro de la nueva superficie en vez de ampliarlas hasta
            // ocuparla por completo.
            const imageScale = Math.min(1, width / img.naturalWidth, height / img.naturalHeight);
            const drawWidth = img.naturalWidth * imageScale;
            const drawHeight = img.naturalHeight * imageScale;
            ctx.drawImage(
              img,
              (width - drawWidth) / 2,
              (height - drawHeight) / 2,
              drawWidth,
              drawHeight
            );
          } else {
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          // Resetear historial al cargar la imagen
          history.value = [];
          historyIndex.value = -1;
          saveToHistory();
          if (props.canvasType === 'boceto' && props.isActive) {
            requestAnimationFrame(autoFit);
          }
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
      if (wheelGestureTimer) clearTimeout(wheelGestureTimer);
      if (gestureAnimationFrame !== null) cancelAnimationFrame(gestureAnimationFrame);
      if (notesScrollAnimationFrame !== null) cancelAnimationFrame(notesScrollAnimationFrame);
      
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

    watch(() => props.textoReconocido, async () => {
      if (props.canvasType !== 'boceto' || !props.isActive) return;
      await nextTick();
      requestAnimationFrame(autoFit);
    });

    // Redimensionamiento cuando se activa la pestaña
    watch(() => props.isActive, (newActive) => {
      if (newActive) {
        setTimeout(() => {
          resizeCanvas();
          if (props.canvasType === 'boceto') autoFit();
        }, 150);
      }
    });

    const optimizeCanvasForAI = (sourceCanvas) => {
      const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
      const { width, height } = sourceCanvas;
      const pixels = sourceCtx.getImageData(0, 0, width, height).data;
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;

      // Localizar tinta real sobre el fondo blanco para no enviar varios
      // megapíxeles vacíos después de ampliar la superficie de boceto.
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          if (pixels[index] < 248 || pixels[index + 1] < 248 || pixels[index + 2] < 248) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (maxX < 0) return sourceCanvas;

      const inkWidth = maxX - minX + 1;
      const inkHeight = maxY - minY + 1;
      const padding = Math.max(32, Math.round(Math.max(inkWidth, inkHeight) * 0.08));
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropWidth = Math.min(width - cropX, inkWidth + padding * 2);
      const cropHeight = Math.min(height - cropY, inkHeight + padding * 2);
      const maxDimension = props.canvasType === 'boceto' ? 1800 : 1600;
      const outputScale = Math.min(1, maxDimension / cropWidth, maxDimension / cropHeight);

      const optimizedCanvas = document.createElement('canvas');
      optimizedCanvas.width = Math.max(1, Math.round(cropWidth * outputScale));
      optimizedCanvas.height = Math.max(1, Math.round(cropHeight * outputScale));
      const optimizedCtx = optimizedCanvas.getContext('2d');
      optimizedCtx.fillStyle = '#ffffff';
      optimizedCtx.fillRect(0, 0, optimizedCanvas.width, optimizedCanvas.height);
      optimizedCtx.imageSmoothingEnabled = true;
      optimizedCtx.imageSmoothingQuality = 'high';
      optimizedCtx.drawImage(
        sourceCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        optimizedCanvas.width,
        optimizedCanvas.height
      );

      return optimizedCanvas;
    };

    /**
     * Captura el contenido relevante y lo reduce antes de enviarlo a la IA.
     * El fondo se fuerza a blanco para mejorar la lectura de trazos y cotas.
     */
    const captureCanvasOnly = async () => {
      const cvs = canvas.value;
      if (!cvs) return null;

      // Calcular escala real entre la resolución interna del canvas y su tamaño CSS
      const targetWidth = parseInt(cvs.style.width, 10) || cvs.width;
      const scale = cvs.width / targetWidth;

      // Crear un canvas temporal con fondo blanco para que los trazos sean legibles
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = cvs.width;
      exportCanvas.height = cvs.height;
      const exportCtx = exportCanvas.getContext('2d');

      // Fondo blanco
      exportCtx.fillStyle = '#ffffff';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Si es de tipo anotaciones y hay texto previo, dibujarlo de fondo
      if (props.canvasType === 'anotaciones' && props.textoReconocido) {
        const paddingLeft = 25 * scale;
        const paddingTop = 25 * scale;
        const fontSize = 16 * scale;
        const lineHeight = fontSize * 1.5;

        exportCtx.font = `${fontSize}px 'Outfit', 'Inter', sans-serif`;
        exportCtx.fillStyle = '#1a1a1a'; // Gris oscuro igual que el CSS de .text-layer
        exportCtx.textBaseline = 'top';

        const lines = props.textoReconocido.split('\n');
        let currentY = paddingTop;
        for (const line of lines) {
          exportCtx.fillText(line, paddingLeft, currentY);
          currentY += lineHeight;
        }
      } else if (props.canvasType === 'boceto' && props.textoReconocido && props.textoReconocido.trim().startsWith('<svg')) {
        // Renderizar el SVG anterior de fondo
        await new Promise((resolve) => {
          let svgContent = props.textoReconocido;
          // Forzar que el SVG tenga las dimensiones exactas del canvas de exportación para una rasterización nativa a escala
          svgContent = svgContent.replace(/<svg([^>]*)/i, (match, p1) => {
            let cleaned = p1.replace(/\b(width|height)\s*=\s*['"][^'"]*['"]/g, '');
            return `<svg${cleaned} width="${exportCanvas.width}" height="${exportCanvas.height}"`;
          });

          const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.onload = () => {
            // Dibujar el SVG ocupando todo el lienzo
            exportCtx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = (err) => {
            console.error('Error al cargar imagen SVG de fondo en el canvas temporal:', err);
            URL.revokeObjectURL(url);
            resolve(); // Continuamos igual
          };
          img.src = url;
        });
      }

      // Dibujar los trazos del usuario encima
      exportCtx.drawImage(cvs, 0, 0);

      const optimizedCanvas = optimizeCanvasForAI(exportCanvas);

      // JPEG de alta legibilidad, ya recortado y limitado a 1.800 px.
      return optimizedCanvas.toDataURL('image/jpeg', 0.9);
    };

    /**
     * Comprueba si el canvas está en blanco (sin trazos del usuario).
     * Útil para evitar llamar a la IA cuando no hay nada dibujado.
     */
    const isCanvasBlank = () => {
      const cvs = canvas.value;
      const ctx = context.value;
      if (!cvs || !ctx) return true;

      const pixelData = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
      // Si todos los píxeles son transparentes (alpha = 0), el canvas está en blanco
      for (let i = 3; i < pixelData.length; i += 4) {
        if (pixelData[i] > 0) return false;
      }
      return true;
    };

    // Limpiar completamente el canvas de dibujos y resetear historial
    const clearCanvas = () => {
      clearCanvasRaw();
      history.value = [];
      historyIndex.value = -1;
      saveToHistory();
      saveStatus.value = 'dirty';
      saveDrawing(); // Guarda el lienzo limpio y transparente
    };

    return {
      canvas,
      isSvg,
      loadingImage,
      saveStatus,
      historyIndex,
      confirmClear,
      startDrawing,
      draw,
      stopDrawing,
      undo,
      saveDrawing,
      captureCanvasOnly,
      isCanvasBlank,
      clearCanvas,
      zoom,
      panTool,
      viewportStyle,
      gridStyle,
      changeZoom,
      autoFit,
      onWheel,
      startTrackpadGesture,
      moveTrackpadGesture,
      endTrackpadGesture,
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
  background-color: #ffffff !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fit-width-sheet {
  width: 100%;
  height: auto !important;
  min-height: 0 !important;
  aspect-ratio: 210 / 297;
  flex: 0 0 auto !important;
}

.canvas-aspect-wrapper {
  position: relative;
  flex: 0 0 auto;
  background-color: #ffffff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
  transform-origin: center center;
}

.canvas-aspect-wrapper.infinite-workspace {
  background: transparent;
  box-shadow: none;
  z-index: 1;
}

.infinite-grid {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10000px;
  height: 10000px;
  margin-top: -5000px;
  margin-left: -5000px;
  pointer-events: none;
  z-index: 3;
  transform-origin: center center;
  background-image:
    linear-gradient(rgba(75, 75, 75, 0.32) 1px, transparent 1px),
    linear-gradient(90deg, rgba(75, 75, 75, 0.32) 1px, transparent 1px),
    linear-gradient(rgba(55, 55, 55, 0.38) 1px, transparent 1px),
    linear-gradient(90deg, rgba(55, 55, 55, 0.38) 1px, transparent 1px);
  background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
  background-repeat: repeat;
}

.canvas-aspect-wrapper.pan-mode .main-canvas {
  cursor: grab;
}

.viewport-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  gap: 7px !important;
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(16, 16, 8, 0.82);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
}

.zoom-label {
  min-width: 42px;
  color: white;
  font-size: 0.72rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
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

.text-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0; /* Detrás del canvas de dibujo */
  color: #1a1a1a;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-y: auto;
  user-select: none;
  pointer-events: none; /* Crucial para dejar interactuar al canvas táctil */
  text-align: left;
  padding: 25px; /* Relleno por defecto para texto */
}

/* Si la capa contiene un elemento SVG, quitamos el padding para que el plano vectorial ocupe el 100% */
.text-layer:has(svg) {
  padding: 0;
  overflow: hidden;
}

.text-layer :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
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
