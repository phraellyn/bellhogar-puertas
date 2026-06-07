<template>
  <v-row class="w-100 ma-0">
    <!-- Cabecera de la Página -->
    <v-col cols="12" class="pa-0 mb-4 d-flex align-start justify-space-between flex-wrap gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-white d-flex align-center" style="line-height: 1.2;">
          <v-icon color="primary" class="mr-2" size="36">mdi-view-dashboard</v-icon>
          Proyectos
        </h1>
        <p class="text-subtitle-1 text-grey-lighten-1 mt-1">
          Gestiona los datos de mediciones y clientes de la empresa
        </p>
      </div>

      <!-- Botón Nuevo Proyecto -->
      <v-btn
        prepend-icon="mdi-plus"
        color="primary"
        size="large"
        elevation="2"
        class="font-weight-bold text-uppercase px-6 align-self-start"
        @click="openCreateDialog"
        style="margin-top: 4px;"
      >
        Nuevo Proyecto
      </v-btn>
    </v-col>

    <!-- Barra de Filtros y Búsqueda -->
    <v-col cols="12" class="pa-0 mb-6">
      <v-card class="glass-panel" elevation="2">
        <v-card-text class="pa-4">
          <v-row class="align-center">
            <!-- Buscador -->
            <v-col cols="12" sm="5" class="py-1">
              <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-magnify"
                label="Buscar por cliente, dirección o email..."
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                color="primary"
              ></v-text-field>
            </v-col>

            <!-- Filtro por Estado -->
            <v-col cols="12" sm="4" class="py-1">
              <v-select
                v-model="statusFilter"
                prepend-inner-icon="mdi-filter-variant"
                label="Estado"
                :items="[
                  { title: 'Todos los estados', value: '' },
                  { title: 'En curso', value: 'borrador' },
                  { title: 'Terminado', value: 'completado' },
                  { title: 'Archivado', value: 'archivado' }
                ]"
                variant="outlined"
                density="comfortable"
                hide-details
                color="primary"
              ></v-select>
            </v-col>

            <!-- Botón Limpiar Filtros -->
            <v-col cols="12" sm="3" class="py-1 text-right">
              <v-btn
                variant="text"
                color="grey-lighten-1"
                prepend-icon="mdi-filter-off"
                block
                @click="clearFilters"
              >
                Limpiar Filtros
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Cargando Proyectos -->
    <v-col v-if="loading" cols="12" class="text-center py-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-h6 text-grey">Cargando proyectos desde Firestore...</div>
    </v-col>

    <!-- Lista de Proyectos Vacía -->
    <v-col v-else-if="filteredProjects.length === 0" cols="12" class="text-center py-12">
      <v-icon size="96" color="grey-darken-2">mdi-folder-open-outline</v-icon>
      <div class="text-h5 text-grey-lighten-1 mt-4 font-weight-bold">No se encontraron proyectos</div>
      <p class="text-grey-lighten-2 mt-2">Prueba a limpiar tus filtros o crea un nuevo proyecto</p>
      <v-btn color="primary" class="mt-6" @click="openCreateDialog">
        Crear Primer Proyecto
      </v-btn>
    </v-col>

    <!-- Cuadrícula de Proyectos (Responsiva: Tarjetas en Tablet, Listado en Laptop) -->
    <v-col v-else cols="12" class="pa-0">
      <v-row>
        <!-- Tarjeta del Proyecto -->
        <v-col 
          v-for="project in filteredProjects" 
          :key="project.id" 
          cols="12" 
          sm="6" 
          md="4" 
          class="pb-4"
        >
          <v-card 
            class="elevation-2 border-golden hover-card" 
            color="surface" 
            height="100%"
            @click="navigateToProject(project.id)"
          >
            <v-card-item class="pb-2">
              <div class="d-flex justify-space-between align-center">
                <!-- Estado Badge -->
                <v-chip
                  :color="getStatusColor(project.estado)"
                  size="small"
                  class="font-weight-bold text-uppercase"
                  @click.stop="toggleProjectStatus(project)"
                  title="Haz clic para cambiar de estado"
                  style="cursor: pointer;"
                >
                  {{ getStatusText(project.estado) }}
                </v-chip>

                <!-- Cantidad de fichas -->
                <span class="text-caption text-grey-lighten-1">
                  <v-icon size="14" class="mr-1">mdi-home-plus</v-icon>
                  {{ project.formularios?.length || 0 }} Fichas
                </span>
              </div>

              <!-- Nombre del Cliente -->
              <v-card-title class="text-h5 font-weight-bold text-white mt-3 text-truncate">
                {{ project.cliente }}
              </v-card-title>
            </v-card-item>

            <v-card-text class="pb-2">
              <div class="d-flex align-center mb-2">
                <v-icon size="18" color="primary" class="mr-2">mdi-map-marker</v-icon>
                <span class="text-body-2 text-grey-lighten-1 text-truncate">{{ project.direccion }}</span>
              </div>
              <div class="d-flex align-center mb-2">
                <v-icon size="18" color="primary" class="mr-2">mdi-cellphone</v-icon>
                <span class="text-body-2 text-grey-lighten-1">{{ project.telefonoMovil }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon size="18" color="primary" class="mr-2">mdi-store</v-icon>
                <span class="text-body-2 text-grey-lighten-1">{{ project.tienda || 'No asignada' }}</span>
              </div>
            </v-card-text>

            <v-divider class="mx-4 opacity-15"></v-divider>

            <v-card-actions class="px-4 py-3 justify-space-between bg-surface-variant">
              <div class="text-caption text-grey d-flex align-center">
                <v-icon size="14" class="mr-1">mdi-calendar</v-icon>
                Visita: {{ formatDate(project.fechaVisita) }}
              </div>
              <div @click.stop>
                <v-btn
                  icon="mdi-trash-can-outline"
                  size="small"
                  color="error"
                  variant="text"
                  @click="confirmDeleteProject(project)"
                  title="Eliminar proyecto permanentemente"
                ></v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-col>

    <!-- DIÁLOGO: CREAR NUEVO PROYECTO (Formulario de Datos Comunes) -->
    <v-dialog v-model="createDialog" max-width="800px" persistent scrollable>
      <v-card class="elevation-4" color="surface">
        <v-card-title class="pa-4 bg-secondary border-b-golden d-flex align-center justify-space-between">
          <span class="text-h5 font-weight-bold text-white d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-home-account</v-icon>
            Iniciar Nueva Reforma
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="createDialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="createForm" v-model="formValid" lazy-validation>
            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-4 text-uppercase">1. Datos del Cliente</h3>
            
            <v-row>
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="newProjectData.cliente"
                  label="Nombre del Cliente *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'El nombre es obligatorio']"
                  color="primary"
                  prepend-inner-icon="mdi-account"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="newProjectData.email"
                  label="Correo Electrónico"
                  variant="outlined"
                  density="comfortable"
                  :rules="emailRules"
                  color="primary"
                  prepend-inner-icon="mdi-email"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="newProjectData.telefonoMovil"
                  label="Teléfono Móvil *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'El móvil es obligatorio', v => /^[0-9+ ]{9,15}$/.test(v) || 'Formato de teléfono no válido']"
                  color="primary"
                  prepend-inner-icon="mdi-cellphone"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="newProjectData.telefonoFijo"
                  label="Teléfono Fijo"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  prepend-inner-icon="mdi-phone"
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="py-1">
                <v-text-field
                  v-model="newProjectData.direccion"
                  label="Dirección de la Vivienda *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'La dirección es obligatoria']"
                  color="primary"
                  prepend-inner-icon="mdi-map-marker"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-divider class="my-5 opacity-15"></v-divider>
            
            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-4 text-uppercase">2. Datos Técnicos y de Visita</h3>

            <v-row>
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="newProjectData.fechaVisita"
                  label="Fecha de Visita *"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'La fecha de visita es obligatoria']"
                  color="primary"
                  prepend-inner-icon="mdi-calendar-clock"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="newProjectData.fechaEjecucion"
                  label="Fecha Prevista de Ejecución"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  prepend-inner-icon="mdi-calendar-check"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="newProjectData.vendedor"
                  label="Vendedor / Técnico *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'El vendedor es obligatorio']"
                  color="primary"
                  prepend-inner-icon="mdi-account-tie"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="newProjectData.tienda"
                  label="Tienda / Delegación *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'La tienda es obligatoria']"
                  color="primary"
                  prepend-inner-icon="mdi-store"
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="py-1">
                <v-radio-group
                  v-model="newProjectData.zonaParquimetro"
                  label="¿Zona de Parquímetro / Estacionamiento Regulado? *"
                  inline
                  :rules="[v => !!v || 'Por favor, selecciona una opción']"
                  color="primary"
                >
                  <v-radio label="No hay parquímetro" value="No"></v-radio>
                  <v-radio label="Zona Verde (Residentes)" value="Zona Verde"></v-radio>
                  <v-radio label="Zona Azul (Rotación)" value="Zona Azul"></v-radio>
                  <v-radio label="Otros / Peaje" value="Otros"></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider class="opacity-15"></v-divider>

        <v-card-actions class="pa-4 bg-surface-variant d-flex justify-end gap-2">
          <v-btn variant="text" color="grey-lighten-1" class="px-4" @click="createDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="px-6 font-weight-bold"
            :disabled="!formValid"
            @click="submitCreateProject"
          >
            Iniciar Proyecto
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO: CONFIRMAR ELIMINAR PROYECTO -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card color="surface" class="border-golden">
        <v-card-title class="text-h5 font-weight-bold text-white pa-4 bg-error-darken-1 d-flex align-center">
          <v-icon class="mr-2">mdi-alert-circle</v-icon>
          ¿Eliminar Proyecto?
        </v-card-title>
        <v-card-text class="pa-6">
          <p class="text-body-1 text-white">
            Estás a punto de eliminar permanentemente el proyecto de <strong>{{ selectedProject?.cliente }}</strong>.
          </p>
          <p class="text-body-2 text-error mt-3 d-flex align-center">
            <v-icon size="16" class="mr-1">mdi-alert</v-icon>
            Esta acción no se puede deshacer y borrará también TODOS los bocetos y archivos adjuntos del Storage.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 bg-surface-variant justify-end gap-2">
          <v-btn variant="text" color="white" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" class="font-weight-bold" @click="deleteSelectedProject">
            Eliminar Todo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../store/projectStore';

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter();
    const projectStore = useProjectStore();

    // Filtros de Búsqueda
    const searchQuery = ref('');
    const statusFilter = ref('');

    // Control de Diálogos
    const createDialog = ref(false);
    const formValid = ref(false);
    const createForm = ref(null);
    const deleteDialog = ref(false);
    const selectedProject = ref(null);

    // Inicializador del formulario
    const newProjectData = ref({
      cliente: '',
      direccion: '',
      email: '',
      telefonoMovil: '',
      telefonoFijo: '',
      vendedor: '',
      tienda: '',
      fechaVisita: new Date().toISOString().substring(0, 10),
      fechaEjecucion: '',
      zonaParquimetro: 'No',
    });

    // Reglas de validación
    const emailRules = [
      v => !v || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(v) || 'Correo no válido'
    ];

    // Cargar proyectos al montar el componente
    onMounted(() => {
      projectStore.fetchProjects();
    });

    // Proyectos filtrados de forma reactiva
    const filteredProjects = computed(() => {
      return projectStore.projects.filter(project => {
        // Filtro por texto (Cliente, Dirección o Email)
        const matchText = 
          !searchQuery.value ||
          project.cliente?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          project.direccion?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          project.email?.toLowerCase().includes(searchQuery.value.toLowerCase());

        // Filtro por estado
        const matchStatus = !statusFilter.value || project.estado === statusFilter.value;

        return matchText && matchStatus;
      });
    });

    // Colores para el chip del estado del proyecto
    const getStatusColor = (status) => {
      switch (status) {
        case 'borrador': return 'info';
        case 'completado': return 'success';
        case 'archivado': return 'secondary';
        default: return 'grey';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'borrador': return 'En curso';
        case 'completado': return 'Terminado';
        case 'archivado': return 'Archivado';
        default: return status;
      }
    };

    const toggleProjectStatus = async (project) => {
      const newEstado = project.estado === 'borrador' ? 'completado' : 'borrador';
      try {
        await projectStore.updateProjectCommon(project.id, { estado: newEstado });
      } catch (err) {
        alert('Error al cambiar el estado del proyecto: ' + err.message);
      }
    };

    // Formatear fechas de ISO a formato español DD/MM/AAAA
    const formatDate = (dateStr) => {
      if (!dateStr) return '—';
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return new Date(dateStr).toLocaleDateString('es-ES');
      } catch (e) {
        return dateStr;
      }
    };

    // Abrir modal de creación
    const openCreateDialog = () => {
      newProjectData.value = {
        cliente: '',
        direccion: '',
        email: '',
        telefonoMovil: '',
        telefonoFijo: '',
        vendedor: '',
        tienda: '',
        fechaVisita: new Date().toISOString().substring(0, 10),
        fechaEjecucion: '',
        zonaParquimetro: 'No',
      };
      createDialog.value = true;
      if (createForm.value) {
        createForm.value.resetValidation();
      }
    };

    // Guardar proyecto
    const submitCreateProject = async () => {
      if (createForm.value) {
        const { valid } = await createForm.value.validate();
        if (valid) {
          try {
            const newProjectId = await projectStore.createProject(newProjectData.value);
            createDialog.value = false;
            // Redirigir al editor del proyecto directamente
            router.push(`/proyecto/${newProjectId}`);
          } catch (err) {
            alert('Error al crear el proyecto en Firebase. Verifica la conexión.');
          }
        }
      }
    };

    // Navegar al editor
    const navigateToProject = (id) => {
      router.push(`/proyecto/${id}`);
    };

    // Abrir modal de confirmación de borrado
    const confirmDeleteProject = (project) => {
      selectedProject.value = project;
      deleteDialog.value = true;
    };

    // Eliminar proyecto
    const deleteSelectedProject = async () => {
      if (selectedProject.value) {
        try {
          await projectStore.deleteProject(selectedProject.value.id);
          deleteDialog.value = false;
          selectedProject.value = null;
        } catch (err) {
          alert('Error al eliminar el proyecto: ' + err.message);
        }
      }
    };

    // Limpiar todos los filtros
    const clearFilters = () => {
      searchQuery.value = '';
      statusFilter.value = '';
    };

    return {
      projects: computed(() => projectStore.projects),
      loading: computed(() => projectStore.loading),
      searchQuery,
      statusFilter,
      filteredProjects,
      createDialog,
      formValid,
      createForm,
      newProjectData,
      emailRules,
      deleteDialog,
      selectedProject,
      openCreateDialog,
      submitCreateProject,
      navigateToProject,
      confirmDeleteProject,
      deleteSelectedProject,
      getStatusColor,
      getStatusText,
      toggleProjectStatus,
      formatDate,
      clearFilters,
    };
  },
};
</script>

<style scoped>
.hover-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
  border-radius: 12px;
}

.hover-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(224, 192, 96, 0.15) !important;
}

/* Borde dorado sutil corporativo para separar la tarjeta */
.border-golden {
  border: 1px solid rgba(226, 192, 96, 0.2) !important;
}

.bg-surface-variant {
  background-color: rgba(30, 30, 27, 0.4) !important;
}

.opacity-15 {
  opacity: 0.15 !important;
}
</style>
