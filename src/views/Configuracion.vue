<template>
  <v-row class="w-100 ma-0">
    <!-- Cabecera de la Página con Botón de Regreso -->
    <v-col cols="12" class="pa-0 mb-4 d-flex align-center">
      <v-btn
        icon="mdi-arrow-left"
        color="primary"
        variant="text"
        class="mr-3"
        @click="$router.push('/')"
        title="Regresar a mediciones"
      ></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold text-white d-flex align-center" style="line-height: 1.2;">
          <v-icon color="primary" class="mr-2" size="36">mdi-cog</v-icon>
          Configuración del Sitio
        </h1>
        <p class="text-subtitle-1 text-grey-lighten-1 mt-1">
          Gestiona las tiendas y vendedores activos del sistema de mediciones
        </p>
      </div>
    </v-col>

    <!-- Indicador de Guardado o Carga -->
    <v-col v-if="loading" cols="12" class="text-center py-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-h6 text-grey">Cargando configuración...</div>
    </v-col>

    <v-col v-else cols="12" class="pa-0">
      <v-row>
        <!-- Panel de Tiendas / Delegaciones -->
        <v-col cols="12" md="6" class="pb-4">
          <v-card class="glass-panel border-golden elevation-3" color="surface">
            <v-card-title class="pa-4 bg-secondary border-b-golden d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-store</v-icon>
              Tiendas / Delegaciones
            </v-card-title>
            
            <v-card-text class="pa-6">
              <!-- Formulario para agregar -->
              <v-row class="align-center mb-4">
                <v-col cols="8" class="py-1">
                  <v-text-field
                    v-model="nuevaTienda"
                    label="Nueva Tienda"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    color="primary"
                    prepend-inner-icon="mdi-plus-box"
                    @keyup.enter="agregarTienda"
                  ></v-text-field>
                </v-col>
                <v-col cols="4" class="py-1 text-right">
                  <v-btn
                    color="primary"
                    class="font-weight-bold"
                    block
                    prepend-icon="mdi-plus"
                    @click="agregarTienda"
                  >
                    Añadir
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Listado de tiendas actuales -->
              <v-list v-if="tiendas.length > 0" class="bg-transparent pa-0 border rounded-lg" style="border-color: rgba(224, 192, 96, 0.25) !important;">
                <v-list-item
                  v-for="(tienda, index) in tiendas"
                  :key="index"
                  class="border-b"
                  style="border-color: rgba(224, 192, 96, 0.15) !important;"
                >
                  <div class="d-flex align-center justify-space-between w-100">
                    <span class="text-body-1 font-weight-medium text-white">{{ tienda }}</span>
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      variant="text"
                      @click="eliminarTienda(index)"
                      title="Eliminar tienda"
                    ></v-btn>
                  </div>
                </v-list-item>
              </v-list>
              <div v-else class="text-center py-6 text-grey">
                <v-icon size="40" class="mb-2" color="grey-darken-2">mdi-store-off</v-icon>
                <div>No hay tiendas configuradas.</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Panel de Vendedores / Técnicos -->
        <v-col cols="12" md="6" class="pb-4">
          <v-card class="glass-panel border-golden elevation-3" color="surface">
            <v-card-title class="pa-4 bg-secondary border-b-golden d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-account-tie</v-icon>
              Vendedores / Técnicos
            </v-card-title>
            
            <v-card-text class="pa-6">
              <!-- Formulario para agregar -->
              <v-row class="align-center mb-4">
                <v-col cols="8" class="py-1">
                  <v-text-field
                    v-model="nuevoVendedor"
                    label="Nuevo Vendedor / Técnico"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    color="primary"
                    prepend-inner-icon="mdi-account-plus"
                    @keyup.enter="agregarVendedor"
                  ></v-text-field>
                </v-col>
                <v-col cols="4" class="py-1 text-right">
                  <v-btn
                    color="primary"
                    class="font-weight-bold"
                    block
                    prepend-icon="mdi-plus"
                    @click="agregarVendedor"
                  >
                    Añadir
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Listado de vendedores actuales -->
              <v-list v-if="vendedores.length > 0" class="bg-transparent pa-0 border rounded-lg" style="border-color: rgba(224, 192, 96, 0.25) !important;">
                <v-list-item
                  v-for="(vendedor, index) in vendedores"
                  :key="index"
                  class="border-b"
                  style="border-color: rgba(224, 192, 96, 0.15) !important;"
                >
                  <div class="d-flex align-center justify-space-between w-100">
                    <span class="text-body-1 font-weight-medium text-white">{{ vendedor }}</span>
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      variant="text"
                      @click="eliminarVendedor(index)"
                      title="Eliminar vendedor"
                    ></v-btn>
                  </div>
                </v-list-item>
              </v-list>
              <div v-else class="text-center py-6 text-grey">
                <v-icon size="40" class="mb-2" color="grey-darken-2">mdi-account-off</v-icon>
                <div>No hay vendedores configurados.</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>

    <!-- Alerta Global de Notificación de Operación -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="2500" rounded="lg">
      <div class="d-flex align-center">
        <v-icon class="mr-2">{{ snackbarIcon }}</v-icon>
        <span class="font-weight-bold">{{ snackbarText }}</span>
      </div>
    </v-snackbar>
  </v-row>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useProjectStore } from '../store/projectStore';

export default {
  name: 'Configuracion',
  setup() {
    const projectStore = useProjectStore();

    // Inputs locales
    const nuevaTienda = ref('');
    const nuevoVendedor = ref('');
    const loading = ref(false);

    // Snackbar (Notificaciones)
    const snackbar = ref(false);
    const snackbarText = ref('');
    const snackbarColor = ref('success');
    const snackbarIcon = ref('mdi-check-circle');

    const showSnackbar = (text, type = 'success') => {
      snackbarText.value = text;
      snackbarColor.value = type === 'success' ? 'success' : 'error';
      snackbarIcon.value = type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle';
      snackbar.value = true;
    };

    onMounted(async () => {
      loading.value = true;
      await projectStore.fetchConfig();
      loading.value = false;
    });

    const tiendas = computed(() => projectStore.config?.tiendas || []);
    const vendedores = computed(() => projectStore.config?.vendedores || []);

    // Acciones de Tiendas
    const agregarTienda = async () => {
      const valor = nuevaTienda.value.trim();
      if (!valor) {
        showSnackbar('Escribe un nombre de tienda válido.', 'error');
        return;
      }
      if (tiendas.value.includes(valor)) {
        showSnackbar('La tienda ya existe en la lista.', 'error');
        return;
      }

      try {
        const nuevasTiendas = [...tiendas.value, valor];
        await projectStore.saveConfig({
          tiendas: nuevasTiendas,
          vendedores: vendedores.value
        });
        nuevaTienda.value = '';
        showSnackbar(`Tienda "${valor}" agregada correctamente.`);
      } catch (err) {
        showSnackbar('Error al guardar en la base de datos.', 'error');
      }
    };

    const eliminarTienda = async (index) => {
      const eliminado = tiendas.value[index];
      try {
        const nuevasTiendas = [...tiendas.value];
        nuevasTiendas.splice(index, 1);
        await projectStore.saveConfig({
          tiendas: nuevasTiendas,
          vendedores: vendedores.value
        });
        showSnackbar(`Tienda "${eliminado}" eliminada.`);
      } catch (err) {
        showSnackbar('Error al guardar en la base de datos.', 'error');
      }
    };

    // Acciones de Vendedores
    const agregarVendedor = async () => {
      const valor = nuevoVendedor.value.trim();
      if (!valor) {
        showSnackbar('Escribe un nombre de vendedor válido.', 'error');
        return;
      }
      if (vendedores.value.includes(valor)) {
        showSnackbar('El vendedor ya existe en la lista.', 'error');
        return;
      }

      try {
        const nuevosVendedores = [...vendedores.value, valor];
        await projectStore.saveConfig({
          tiendas: tiendas.value,
          vendedores: nuevosVendedores
        });
        nuevoVendedor.value = '';
        showSnackbar(`Vendedor "${valor}" agregado correctamente.`);
      } catch (err) {
        showSnackbar('Error al guardar en la base de datos.', 'error');
      }
    };

    const eliminarVendedor = async (index) => {
      const eliminado = vendedores.value[index];
      try {
        const nuevosVendedores = [...vendedores.value];
        nuevosVendedores.splice(index, 1);
        await projectStore.saveConfig({
          tiendas: tiendas.value,
          vendedores: nuevosVendedores
        });
        showSnackbar(`Vendedor "${eliminado}" eliminado.`);
      } catch (err) {
        showSnackbar('Error al guardar en la base de datos.', 'error');
      }
    };

    return {
      tiendas,
      vendedores,
      nuevaTienda,
      nuevoVendedor,
      loading,
      agregarTienda,
      eliminarTienda,
      agregarVendedor,
      eliminarVendedor,
      snackbar,
      snackbarText,
      snackbarColor,
      snackbarIcon,
    };
  },
};
</script>

<style scoped>
.glass-panel {
  border-radius: 12px;
}
.border-golden {
  border: 1px solid rgba(226, 192, 96, 0.2) !important;
}
</style>
