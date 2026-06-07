<template>
  <v-card color="surface" class="border-golden" rounded="lg">
    <v-card-text class="pa-6">
      <div class="text-h6 font-weight-bold text-white mb-2 d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-cloud-upload</v-icon>
        Adjuntar Documentos y Multimedia
      </div>
      <p class="text-body-2 text-grey-lighten-1 mb-5">
        Sube fotos del estado actual de la estancia, planos en PDF o vídeos explicativos. Los archivos se asocian de forma exclusiva al proyecto.
      </p>

      <!-- Zona de Carga / Input Táctil -->
      <v-row class="mb-6">
        <v-col cols="12" class="py-1">
          <v-file-input
            v-model="selectedFiles"
            label="Selecciona o arrastra imágenes, PDFs o vídeos..."
            variant="outlined"
            prepend-icon=""
            prepend-inner-icon="mdi-camera-plus"
            show-size
            multiple
            chips
            color="primary"
            class="upload-input"
            accept="image/*,application/pdf,video/*"
            :loading="uploading"
            @update:model-value="onFilesSelected"
          >
            <template v-slot:selection="{ fileNames }">
              <template v-for="fileName in fileNames" :key="fileName">
                <v-chip size="small" label color="primary" class="mr-1">
                  {{ fileName }}
                </v-chip>
              </template>
            </template>
          </v-file-input>
        </v-col>
      </v-row>

      <!-- Lista de Carga en Curso (Progreso) -->
      <v-expand-transition>
        <div v-if="uploadQueue.length > 0" class="mb-6">
          <div class="text-subtitle-2 text-primary font-weight-bold mb-3 d-flex align-center">
            <v-icon size="16" class="mr-1">mdi-swap-vertical</v-icon>
            Subiendo archivos ({{ uploadQueue.length }})...
          </div>
          <v-card color="secondary" variant="flat" rounded="lg" class="pa-4">
            <div v-for="file in uploadQueue" :key="file.name" class="mb-3">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2 text-white text-truncate mr-4" style="max-width: 70%;">
                  {{ file.name }}
                </span>
                <span class="text-caption text-grey">{{ file.progress }}%</span>
              </div>
              <v-progress-linear
                :model-value="file.progress"
                color="primary"
                height="6"
                rounded
                striped
                active
              ></v-progress-linear>
            </div>
          </v-card>
        </div>
      </v-expand-transition>

      <v-divider class="my-5 opacity-15"></v-divider>

      <!-- Galería de Archivos Adjuntos -->
      <div class="text-subtitle-1 font-weight-bold text-white mb-4 d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-image-multiple</v-icon>
        Galería de Archivos ({{ archivos.length }})
      </div>

      <!-- Estado Vacío -->
      <div v-if="archivos.length === 0" class="text-center py-8 border-dashed rounded-lg bg-surface-variant">
        <v-icon size="48" color="grey-darken-1">mdi-image-off-outline</v-icon>
        <div class="text-subtitle-1 text-grey-lighten-1 mt-2">No hay archivos adjuntos en esta ficha</div>
        <p class="text-caption text-grey">Sube fotos o PDFs para documentar esta estancia</p>
      </div>

      <!-- Lista de Ficheros -->
      <v-row v-else>
        <v-col
          v-for="file in archivos"
          :key="file.id"
          cols="6"
          sm="4"
          md="3"
          class="pb-4"
        >
          <v-card class="file-card h-100 border-golden bg-secondary-darken-1 d-flex flex-column" rounded="lg">
            <!-- Miniatura / Previsualizador según Tipo -->
            <div class="file-thumbnail-container" @click="viewFile(file)">
              <!-- Imagen -->
              <v-img
                v-if="file.tipo === 'imagen'"
                :src="file.url"
                cover
                class="file-thumbnail"
                height="130"
              >
                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </v-row>
                </template>
              </v-img>

              <!-- PDF -->
              <div v-else-if="file.tipo === 'pdf'" class="file-thumbnail-icon flex-column fill-height py-8 d-flex align-center justify-center bg-grey-darken-3" style="height: 130px;">
                <v-icon size="48" color="error">mdi-file-pdf-box</v-icon>
                <span class="text-caption text-error font-weight-bold mt-1">DOCUMENTO PDF</span>
              </div>

              <!-- Video -->
              <div v-else-if="file.tipo === 'video'" class="file-thumbnail-icon flex-column fill-height py-8 d-flex align-center justify-center bg-grey-darken-3 position-relative" style="height: 130px;">
                <v-icon size="48" color="primary">mdi-video</v-icon>
                <span class="text-caption text-primary font-weight-bold mt-1">VÍDEO MP4</span>
                <v-icon size="24" color="white" class="video-play-badge">mdi-play-circle</v-icon>
              </div>
            </div>

            <!-- Datos del Archivo -->
            <v-card-text class="pa-3 flex-grow-1 d-flex flex-column justify-space-between">
              <div>
                <div class="text-body-2 text-white font-weight-bold text-truncate" :title="file.nombre">
                  {{ file.nombre }}
                </div>
                <div class="text-caption text-grey">
                  {{ formatBytes(file.sizeBytes) }} | {{ formatDate(file.fechaSubida) }}
                </div>
              </div>
            </v-card-text>

            <v-divider class="opacity-15"></v-divider>

            <!-- Acciones -->
            <v-card-actions class="pa-2 d-flex justify-end gap-1 bg-surface-variant">
              <v-btn
                v-if="file.tipo === 'pdf'"
                icon="mdi-open-in-new"
                size="small"
                color="primary"
                variant="text"
                :href="file.url"
                target="_blank"
                title="Abrir PDF en pestaña nueva"
              ></v-btn>
              <v-btn
                icon="mdi-eye"
                size="small"
                color="primary"
                variant="text"
                @click="viewFile(file)"
                title="Ver archivo"
              ></v-btn>
              <v-btn
                icon="mdi-trash-can-outline"
                size="small"
                color="error"
                variant="text"
                @click="confirmDeleteFile(file)"
                title="Eliminar archivo permanentemente"
              ></v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- DIÁLOGO: VISUALIZADOR MULTIMEDIA (Lightbox) -->
    <v-dialog v-model="viewerDialog" max-width="900px" scrollable>
      <v-card color="secondary" class="border-golden overflow-hidden">
        <v-card-title class="pa-4 bg-secondary border-b d-flex justify-space-between align-center">
          <span class="text-subtitle-1 font-weight-bold text-white text-truncate" style="max-width: 80%;">
            {{ activeFile?.nombre }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="viewerDialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-0 d-flex justify-center align-center bg-black" style="min-height: 350px;">
          <!-- Visualizar Imagen -->
          <v-img
            v-if="activeFile?.tipo === 'imagen'"
            :src="activeFile?.url"
            max-height="70dvh"
            contain
          ></v-img>

          <!-- Visualizar Video -->
          <video
            v-else-if="activeFile?.tipo === 'video'"
            :src="activeFile?.url"
            controls
            autoplay
            style="max-width: 100%; max-height: 70dvh;"
            class="video-player"
          ></video>

          <!-- Visualizar PDF -->
          <div v-else-if="activeFile?.tipo === 'pdf'" class="pa-8 text-center text-white">
            <v-icon size="96" color="error" class="mb-4">mdi-file-pdf-box</v-icon>
            <div class="text-h6 font-weight-bold">Visor de PDF no soportado inline</div>
            <p class="text-body-2 text-grey-lighten-1 mt-2">Haz clic abajo para abrir o descargar el documento plano</p>
            <v-btn
              prepend-icon="mdi-download"
              color="primary"
              class="mt-6 font-weight-bold"
              :href="activeFile?.url"
              target="_blank"
            >
              Abrir / Descargar PDF
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { ref } from 'vue';
import { useProjectStore } from '../store/projectStore';

export default {
  name: 'FileUploader',
  props: {
    // Array de archivos existentes del formulario
    archivos: {
      type: Array,
      default: () => []
    },
    projectId: {
      type: String,
      required: true
    },
    formId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const projectStore = useProjectStore();
    const selectedFiles = ref([]);
    const uploading = ref(false);
    const uploadQueue = ref([]);

    // Visor Lightbox
    const viewerDialog = ref(false);
    const activeFile = ref(null);

    // Detectar archivos seleccionados y procesar subida secuencial
    const onFilesSelected = async (files) => {
      if (!files || files.length === 0) return;
      uploading.value = true;

      // Inicializar cola visual
      const filesArray = Array.isArray(files) ? files : [files];
      
      for (const file of filesArray) {
        // Estimar tipo
        let fileType = 'imagen';
        if (file.type.includes('pdf')) fileType = 'pdf';
        else if (file.type.includes('video')) fileType = 'video';

        // Añadir a cola de progreso local (simulado por subida real simplificada)
        const queueItem = { name: file.name, progress: 20 };
        uploadQueue.value.push(queueItem);

        try {
          // Subida real a Firebase Storage
          queueItem.progress = 50;
          await projectStore.uploadFileToForm(
            props.projectId,
            props.formId,
            file,
            file.name,
            fileType
          );
          queueItem.progress = 100;
        } catch (err) {
          console.error('Error al subir archivo:', file.name, err);
          alert(`Error al subir ${file.name}: ${err.message}`);
        } finally {
          // Eliminar de la cola de progreso visual con retraso corto
          setTimeout(() => {
            uploadQueue.value = uploadQueue.value.filter(q => q.name !== file.name);
          }, 1000);
        }
      }

      selectedFiles.value = [];
      uploading.value = false;
    };

    // Eliminar archivo
    const confirmDeleteFile = async (file) => {
      if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el archivo "${file.nombre}"?`)) {
        try {
          await projectStore.deleteFileFromForm(props.projectId, props.formId, file.id);
        } catch (err) {
          alert('Error al borrar el archivo: ' + err.message);
        }
      }
    };

    // Abrir visor
    const viewFile = (file) => {
      activeFile.value = file;
      viewerDialog.value = true;
    };

    // Formateadores auxiliares
    const formatBytes = (bytes, decimals = 2) => {
      if (!bytes) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const formatDate = (isoString) => {
      if (!isoString) return '—';
      try {
        const d = new Date(isoString);
        return d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return isoString;
      }
    };

    return {
      selectedFiles,
      uploading,
      uploadQueue,
      viewerDialog,
      activeFile,
      onFilesSelected,
      confirmDeleteFile,
      viewFile,
      formatBytes,
      formatDate,
    };
  },
};
</script>

<style scoped>
.upload-input {
  cursor: pointer;
}

.border-dashed {
  border: 2px dashed rgba(226, 192, 96, 0.3) !important;
}

.bg-surface-variant {
  background-color: rgba(30, 30, 27, 0.4) !important;
}

.file-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  border: 1px solid rgba(226, 192, 96, 0.15) !important;
}

.file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(226, 192, 96, 0.1) !important;
}

.file-thumbnail-container {
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.file-thumbnail-icon {
  transition: background-color 0.2s ease;
}

.file-card:hover .file-thumbnail-icon {
  background-color: #3e3e3b !important;
}

.video-play-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(16, 16, 8, 0.5);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.border-golden {
  border: 1px solid rgba(226, 192, 96, 0.2) !important;
}

.opacity-15 {
  opacity: 0.15 !important;
}

.bg-black {
  background-color: #000000 !important;
}
</style>
