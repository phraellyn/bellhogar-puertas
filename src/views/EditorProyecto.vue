<template>
  <div class="editor-viewport" :class="{ 'dashboard-flow': !selectedForm }" v-if="project">
    <!-- VISTA PRINCIPAL: Panel de Control del Proyecto (Datos y Fichas en 50/50 split) -->
    <v-row class="w-100 h-desktop-100 ma-0 align-stretch" v-if="!selectedForm">
      <!-- Ficha de Datos Comunes del Cliente (50% de ancho en Desktop/Tablet) -->
      <v-col v-if="!embedded" cols="12" lg="6" class="pa-2 h-desktop-100 d-flex flex-column">
        <v-card color="surface" class="elevation-2 border-golden h-desktop-100 d-flex flex-column" rounded="lg">
          <v-card-title class="pa-4 bg-secondary border-b d-flex justify-space-between align-center flex-wrap gap-2">
            <span class="text-subtitle-1 font-weight-bold text-white d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-account-box</v-icon>
              Datos Comunes del Proyecto
            </span>
            <div class="d-flex align-center gap-2">
              <v-btn
                prepend-icon="mdi-email"
                color="primary"
                variant="flat"
                size="small"
                class="font-weight-bold text-uppercase"
                @click="openSendEmailDialog"
              >
                Enviar por Email
              </v-btn>
              <v-chip
                size="small"
                :color="getStatusColor(project.estado)"
                class="font-weight-bold cursor-pointer"
                @click="toggleProjectStatus"
                title="Haz clic para cambiar de estado"
              >
                {{ getStatusText(project.estado) }}
              </v-chip>
            </div>
          </v-card-title>
          
          <v-card-text class="pa-4 overflow-y-auto">
            <v-form ref="commonForm" v-model="commonFormValid">
              <v-text-field
                v-model="project.cliente"
                label="Cliente"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3"
                @input="saveCommonData"
              ></v-text-field>
              <v-text-field
                v-model="project.direccion"
                label="Dirección"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3"
                @input="saveCommonData"
              ></v-text-field>
              <v-row class="ma-0">
                <v-col cols="6" class="pa-0 pr-1">
                  <v-text-field
                    v-model="project.telefonoMovil"
                    label="Móvil"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    class="mb-3"
                    @input="saveCommonData"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" class="pa-0 pl-1">
                  <v-text-field
                    v-model="project.telefonoFijo"
                    label="Fijo"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    class="mb-3"
                    @input="saveCommonData"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-text-field
                v-model="project.email"
                label="Email"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3"
                @input="saveCommonData"
              ></v-text-field>
              <v-row class="ma-0">
                <v-col cols="6" class="pa-0 pr-1">
                  <v-select
                    v-model="project.vendedor"
                    label="Vendedor"
                    :items="vendedoresOptions"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    class="mb-3"
                    @update:modelValue="saveCommonData"
                  ></v-select>
                </v-col>
                <v-col cols="6" class="pa-0 pl-1">
                  <v-select
                    v-model="project.tienda"
                    label="Tienda"
                    :items="tiendasOptions"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    class="mb-3"
                    @update:modelValue="saveCommonData"
                  ></v-select>
                </v-col>
              </v-row>
              <v-row class="ma-0">
                <v-col cols="6" class="pa-0 pr-1">
                  <v-text-field
                    v-model="project.fechaVisita"
                    label="Fecha de Visita"
                    type="date"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    class="mb-3"
                    @input="saveCommonData"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" class="pa-0 pl-1">
                  <v-text-field
                    v-model="project.fechaEjecucion"
                    label="Fecha Ejecución"
                    type="date"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    class="mb-3"
                    @input="saveCommonData"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-select
                v-model="project.zonaParquimetro"
                label="Zona de Parquímetro"
                :items="[
                  { title: 'No hay parquímetro', value: 'No' },
                  { title: 'Zona Verde (Residentes)', value: 'Zona Verde' },
                  { title: 'Zona Azul (Rotación)', value: 'Zona Azul' },
                  { title: 'Otros / Peaje', value: 'Otros' }
                ]"
                variant="outlined"
                density="compact"
                hide-details="auto"
                @update:model-value="saveCommonData"
              ></v-select>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Lista de Fichas Técnicas Añadidas (50% de ancho) -->
      <v-col cols="12" :lg="embedded ? 12 : 6" class="pa-2 h-desktop-100 d-flex flex-column">
        <v-toolbar
          v-if="embedded"
          color="surface"
          density="comfortable"
          class="embed-actions elevation-2 border-golden rounded-lg mb-2 px-2"
        >
          <v-spacer></v-spacer>
          <v-btn
            size="small"
            color="primary"
            prepend-icon="mdi-email"
            variant="flat"
            class="font-weight-bold mr-2"
            @click="openSendEmailDialog"
          >
            Enviar por email
          </v-btn>
          <v-btn
            size="small"
            color="primary"
            prepend-icon="mdi-file-pdf-box"
            variant="outlined"
            class="font-weight-bold mr-2"
            :loading="downloadingPdf"
            @click="downloadProjectPDF"
          >
            Descargar PDF
          </v-btn>
        </v-toolbar>
        <v-card
          color="surface"
          :class="['elevation-2 border-golden d-flex flex-column overflow-hidden', embedded ? 'flex-grow-1' : 'h-desktop-100']"
          rounded="lg"
        >
          <v-card-title class="pa-4 bg-secondary border-b d-flex justify-space-between align-center flex-wrap gap-2">
            <span class="text-subtitle-1 font-weight-bold text-white d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-home-plus</v-icon>
              Fichas Técnicas ({{ project.formularios?.length || 0 }})
            </span>
            <v-btn
              size="small"
              color="primary"
              prepend-icon="mdi-plus"
              variant="flat"
              class="font-weight-bold"
              @click="openAddFormDialog"
            >
              Añadir Ficha
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-4 flex-grow-1 overflow-y-auto">
            <v-list bg-color="transparent" class="pa-0">
              <v-list-item
                v-for="form in project.formularios"
                :key="form.id"
                color="primary"
                variant="tonal"
                class="mb-3 rounded-lg py-3 project-form-card"
                @click="selectForm(form.id)"
                style="border: 1px solid rgba(226, 192, 96, 0.15); cursor: pointer;"
              >
                <template v-slot:prepend>
                  <v-icon :color="getFormIconColor(form.tipo)" size="large" class="mr-3">
                    {{ getFormIcon(form.tipo) }}
                  </v-icon>
                </template>
                <v-list-item-title class="font-weight-bold text-h6 text-white mb-1">
                  {{ form.nombre }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-subtitle-2 text-grey-lighten-1">
                  {{ getFormTypeName(form.tipo) }} | {{ form.archivos?.length || 0 }} adjuntos
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn
                    icon="mdi-trash-can-outline"
                    size="medium"
                    color="error"
                    variant="text"
                    @click.stop="deleteForm(form.id, form.nombre)"
                    title="Eliminar estancia"
                    class="ml-2"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="!project.formularios || project.formularios.length === 0" class="text-center py-12 text-grey">
              <v-icon size="64" color="grey-darken-2" class="mb-3">mdi-home-search-outline</v-icon>
              <div class="text-subtitle-1">No has añadido ninguna ficha técnica.</div>
              <p class="text-body-2 text-grey-lighten-1 mt-1">Haz clic en "Añadir Ficha" arriba para comenzar.</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- VISTA DE DETALLE: Pestañas de la Estancia Seleccionada (100% de la pantalla) -->
    <div v-else class="d-flex flex-column h-100 align-stretch" style="width: 100%;">
      <!-- Cabecera de Pestañas con Indicador de Autoguardado y Botón Volver -->
      <div class="d-flex align-center justify-space-between bg-secondary rounded-t-lg border-golden border-b-0 px-3 py-1 flex-wrap gap-2">
        <div class="d-flex align-center">
          <!-- Botón Volver al Proyecto (Premium) -->
          <v-btn
            prepend-icon="mdi-arrow-left"
            color="primary"
            variant="flat"
            size="small"
            class="font-weight-bold mr-3 text-uppercase"
            @click="goBackToProject"
          >
            Volver
          </v-btn>
          
          <v-tabs v-model="activeTab" slider-color="primary" bg-color="transparent">
            <v-tab v-if="selectedForm.tipo !== 'varios'" value="form" class="font-weight-bold text-white">
              <v-icon class="mr-1">mdi-file-document-edit</v-icon> Formulario
            </v-tab>
            <v-tab value="notes" class="font-weight-bold text-white">
              <v-icon class="mr-1">mdi-draw-pen</v-icon> Anotaciones
            </v-tab>
            <v-tab value="sketch" class="font-weight-bold text-white">
              <v-icon class="mr-1">mdi-floor-plan</v-icon> Boceto Plano
            </v-tab>
            <v-tab value="files" class="font-weight-bold text-white">
              <v-icon class="mr-1">mdi-paperclip</v-icon> Archivos
            </v-tab>
          </v-tabs>
        </div>

        <div class="d-flex align-center gap-2">
          <!-- Sutil indicador de guardado automático del formulario técnico -->
          <v-chip
            v-if="formSaveStatus === 'saved'"
            size="small"
            color="success"
            variant="text"
            prepend-icon="mdi-cloud-check"
            class="font-weight-bold"
          >
            Ficha al día
          </v-chip>
          <v-chip
            v-else-if="formSaveStatus === 'saving'"
            size="small"
            color="primary"
            variant="text"
            prepend-icon="mdi-sync"
            class="font-weight-bold rotate-icon"
          >
            Guardando...
          </v-chip>
          <v-chip
            v-else-if="formSaveStatus === 'dirty'"
            size="small"
            color="grey-lighten-1"
            variant="text"
            prepend-icon="mdi-cloud-upload-outline"
            class="font-weight-bold animate-pulse"
          >
            Cambios pendientes
          </v-chip>
        </div>
      </div>

      <!-- Ventanas de Contenido de Pestañas (touch=false desactiva el deslizamiento lateral) -->
      <v-window v-model="activeTab" :touch="false" class="flex-grow-1 d-flex flex-column overflow-hidden bg-surface border-golden rounded-b-lg pa-3">
        <!-- 1. PESTAÑA FORMULARIO (Se desplaza de forma independiente e interna si es muy largo) -->
        <v-window-item v-if="selectedForm.tipo !== 'varios'" value="form" class="fill-height overflow-y-auto pr-1">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold text-white">
              Ficha Técnica: {{ selectedForm.nombre }}
            </h2>
            <!-- Sutil nota informativa para el usuario -->
            <span class="text-caption text-grey-lighten-1 d-flex align-center">
              <v-icon size="small" class="mr-1" color="success">mdi-cloud-check</v-icon>
              Los cambios se guardan automáticamente
            </span>
          </div>

          <!-- Formularios según Tipo -->
          <!-- FORMULARIO COCINAS -->
          <div v-if="selectedForm.tipo === 'cocina'">
            <!-- Sección Electrodomésticos y Complementos -->
            <h3 class="text-subtitle-2 font-weight-bold text-primary mb-3 text-uppercase">Electrodomésticos y Complementos</h3>
            <v-expansion-panels variant="accordion" class="border-golden mb-4">
              <!-- 2. ENCIMERA -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">ENCIMERA</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-textarea v-model="selectedForm.datos.encimera" label="Detalle de Encimera" variant="outlined" density="compact" rows="2" hide-details></v-textarea>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 3. CAMPANA -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">CAMPANA EXTRACTORA</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.techo" label="En techo" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.pared" label="En pared" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.isla" label="En isla" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.integrada" label="Integrada" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.telescopica" label="Telescópica" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.filtroCarbon" label="Filtro carbón" density="compact" hide-details @update:model-value="!$event && (selectedForm.datos.campana.enPlaca = false)"></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.enPlaca" label="En placa" density="compact" hide-details :disabled="!selectedForm.datos.campana.filtroCarbon"></v-checkbox></v-col>
                  </v-row>
                  <v-row class="mt-2">
                    <v-col cols="4" sm="2" class="py-1"><v-text-field v-model="selectedForm.datos.campana.alto" label="Alto" variant="outlined" density="compact" hide-details></v-text-field></v-col>
                    <v-col cols="4" sm="2" class="py-1"><v-text-field v-model="selectedForm.datos.campana.ancho" label="Ancho" variant="outlined" density="compact" hide-details></v-text-field></v-col>
                    <v-col cols="4" sm="2" class="py-1"><v-text-field v-model="selectedForm.datos.campana.fondo" label="Fondo" variant="outlined" density="compact" hide-details></v-text-field></v-col>
                    <v-col cols="12" sm="3" class="py-1"><v-text-field v-model="selectedForm.datos.campana.diametroSalida" label="Diám. Salida (mm)" variant="outlined" density="compact" hide-details></v-text-field></v-col>
                    <v-col cols="12" sm="3" class="py-1"><v-text-field v-model="selectedForm.datos.campana.otras" label="Otras" variant="outlined" density="compact" hide-details></v-text-field></v-col>
                  </v-row>
                  
                  <!-- Cubretubo melamínico -->
                  <v-row class="mt-2 align-center">
                    <v-col cols="12" sm="3" class="py-1">
                      <span class="text-body-2 text-grey-lighten-1">Cubretubo melamínico:</span>
                    </v-col>
                    <v-col cols="4" sm="3" class="py-1">
                      <v-text-field v-model="selectedForm.datos.cubretuboMelaminico.ancho" label="Ancho" variant="outlined" density="compact" hide-details></v-text-field>
                    </v-col>
                    <v-col cols="4" sm="3" class="py-1">
                      <v-text-field v-model="selectedForm.datos.cubretuboMelaminico.alto" label="Alto" variant="outlined" density="compact" hide-details></v-text-field>
                    </v-col>
                    <v-col cols="4" sm="3" class="py-1">
                      <v-text-field v-model="selectedForm.datos.cubretuboMelaminico.fondo" label="Fondo" variant="outlined" density="compact" hide-details></v-text-field>
                    </v-col>
                  </v-row>

                  <v-textarea v-model="selectedForm.datos.campana.observaciones" label="Observaciones Campana" variant="outlined" density="compact" class="mt-3" rows="2" hide-details></v-textarea>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 2. LAVAVAJILLAS -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">LAVAVAJILLAS</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavavajillas.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavavajillas.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavavajillas.ancho60" label="Ancho 60" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavavajillas.ancho45" label="Ancho 45" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavavajillas.libre" label="Libre instalación" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavavajillas.integrado" label="Integrado" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-text-field v-model="selectedForm.datos.lavavajillas.observaciones" label="Observaciones Lavavajillas" variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 3. LAVADORA -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">LAVADORA</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavadora.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavadora.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavadora.ancho60" label="Ancho 60" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavadora.libre" label="Libre instalación" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavadora.integrado" label="Integrado" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-text-field v-model="selectedForm.datos.lavadora.observaciones" label="Observaciones Lavadora" variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 4. SECADORA -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">SECADORA</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.secadora.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.secadora.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.secadora.libre" label="Libre instalación" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.secadora.integrado" label="Integrado" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-text-field v-model="selectedForm.datos.secadora.observaciones" label="Observaciones Secadora" variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 5. FRIGORÍFICO -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">FRIGORÍFICO</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.frigorifico.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.frigorifico.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.frigorifico.libre" label="Libre instalación" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.frigorifico.integrado" label="Integrado" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-row class="mt-3">
                    <v-col cols="4" class="py-1"><v-text-field v-model="selectedForm.datos.frigorifico.alto" label="Alto" variant="outlined" density="compact" hide-details></v-text-field></v-col>
                    <v-col cols="4" class="py-1"><v-text-field v-model="selectedForm.datos.frigorifico.ancho" label="Ancho" variant="outlined" density="compact" hide-details></v-text-field></v-col>
                    <v-col cols="4" class="py-1"><v-text-field v-model="selectedForm.datos.frigorifico.fondo" label="Fondo" variant="outlined" density="compact" hide-details></v-text-field></v-col>
                  </v-row>
                  <v-text-field v-model="selectedForm.datos.frigorifico.observaciones" label="Observaciones Frigorífico" variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 6. HORNO -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">HORNO</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.horno.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.horno.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.horno.bajoPlaca" label="Bajo placa" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.horno.columna" label="En columna" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-text-field v-model="selectedForm.datos.horno.observaciones" label="Observaciones Horno" variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 7. MICROONDAS -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">MICROONDAS</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.microondas.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.microondas.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.microondas.libre" label="Libre" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.microondas.integrado" label="Integrado" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.microondas.superior" label="En mueble sup." density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.microondas.columna" label="En columna" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-text-field v-model="selectedForm.datos.microondas.observaciones" label="Observaciones Microondas" variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">PLACA</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.ancho30" label="Ancho 30" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.ancho60" label="Ancho 60" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.ancho90" label="Ancho 90" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.induccion" label="Inducción" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.radiante" label="Radiante" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.gas" label="Gas" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.libre" label="Libre" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.integrado" label="Integrado" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.otros" label="Otros" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-text-field v-model="selectedForm.datos.placa.observaciones" label="Observaciones Placa" variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 9. FREGADERO -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">FREGADERO</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.fregadero.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.fregadero.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.fregadero.bajoEncimera" label="Bajo encimera" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.fregadero.opticaEnrasada" label="Enrasado" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.fregadero.sobreEncimera" label="Sobre encimera" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.fregadero.unSeno" label="Un seno" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.fregadero.dosSenos" label="Dos senos" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-text-field v-model="selectedForm.datos.fregadero.observaciones" label="Observaciones Fregadero" variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 10. GRIFO -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">GRIFO</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.grifo.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.grifo.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.grifo.enEncimera" label="En encimera" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.grifo.enPared" label="En pared" density="compact" hide-details></v-checkbox></v-col>
                  </v-row>
                  <v-text-field v-model="selectedForm.datos.grifo.observaciones" label="Observaciones Grifo" variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Sección Preguntas Frecuentes Cocina -->
            <h3 class="text-subtitle-2 font-weight-bold text-primary mb-3 text-uppercase">Preguntas Frecuentes</h3>
            <v-card color="secondary" variant="flat" class="pa-4 mb-4" rounded="lg">
              <v-row>
                <!-- 1. Obra en cocina -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Van a realizar OBRA en la cocina actual?</span>
                  <v-checkbox v-model="selectedForm.datos.preguntas.obraCocina" density="compact" hide-details></v-checkbox>
                </v-col>

                <!-- 2. Demoler mobiliario -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Hay que demoler el mobiliario de cocina existente?</span>
                  <v-checkbox v-model="selectedForm.datos.preguntas.demolerMobiliario" density="compact" hide-details></v-checkbox>
                </v-col>

                <!-- 4. Desean comer en la cocina (con opciones inline) -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3 flex-wrap">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Desean comer en la cocina?</span>
                  <v-checkbox v-model="selectedForm.datos.preguntas.deseanComerCocina" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <div v-if="selectedForm.datos.preguntas.deseanComerCocina" class="d-flex align-center gap-4 ml-2 flex-wrap">
                    <v-checkbox v-model="selectedForm.datos.preguntas.comerDetalle.mesa" label="Mesa" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.preguntas.comerDetalle.barra" label="Barra" density="compact" hide-details></v-checkbox>
                    <v-text-field v-model="selectedForm.datos.preguntas.comerDetalle.personas" label="Nº de personas" variant="outlined" density="compact" hide-details style="max-width: 150px;"></v-text-field>
                  </div>
                </v-col>

                <!-- 5. Altura de la cocina -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Qué altura tiene la cocina?</span>
                  <v-text-field v-model="selectedForm.datos.preguntas.alturaCocina" label="Altura" variant="outlined" density="compact" hide-details style="max-width: 200px;"></v-text-field>
                </v-col>

                <!-- 10. Instalación de agua (con especificar inline) -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3 flex-wrap">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Qué instalación de agua/calefacción tiene?</span>
                  <v-select
                    v-model="selectedForm.datos.preguntas.instalacionAgua"
                    :items="['Termo', 'Caldera', 'Central', 'Otros']"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 200px; flex-grow: 1;"
                  ></v-select>
                  <v-text-field 
                    v-if="selectedForm.datos.preguntas.instalacionAgua === 'Otros'"
                    v-model="selectedForm.datos.preguntas.instalacionAguaOtros" 
                    label="Especificar otra instalación" 
                    variant="outlined" 
                    density="compact" 
                    hide-details 
                    style="max-width: 250px;"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card>
            
            <!-- Observaciones -->
            <v-textarea v-model="selectedForm.datos.observacionesGenerales" label="Observaciones Generales de la Cocina" variant="outlined" rows="3" color="primary"></v-textarea>
          </div>

          <!-- FORMULARIO PUERTAS -->
          <div v-else-if="selectedForm.tipo === 'puertas'">
            <!-- Configuración general en orden de PDF -->
            <v-card color="secondary" variant="flat" class="pa-4 mb-4" rounded="lg">
              
              <!-- 1. ACABADO -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">ACABADO</h3>
              <v-row class="mb-3 align-start">
                <v-col cols="6" sm="3" class="py-1">
                  <v-checkbox v-model="selectedForm.datos.acabado.barnizado" label="Barnizado" density="compact" hide-details></v-checkbox>
                </v-col>
                <v-col cols="6" sm="3" class="py-1">
                  <v-text-field v-model="selectedForm.datos.acabado.madera" label="Madera" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
                <v-col cols="6" sm="3" class="py-1">
                  <v-checkbox v-model="selectedForm.datos.acabado.lacado" label="Lacado" density="compact" hide-details></v-checkbox>
                </v-col>
                <v-col cols="6" sm="3" class="py-1">
                  <v-text-field v-model="selectedForm.datos.acabado.color" label="Color" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
              </v-row>
              <v-divider class="my-3 opacity-15"></v-divider>

              <!-- 2. HERRAJES -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">HERRAJES</h3>
              <v-row class="mb-3">
                <v-col cols="12" class="py-1">
                  <div class="d-flex flex-wrap gap-8 align-center">
                    <v-checkbox v-model="selectedForm.datos.herrajes.laton" label="Latón" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.herrajes.cromo" label="Cromo" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.herrajes.negro" label="Negro" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.herrajes.bronce" label="Bronce" density="compact" hide-details></v-checkbox>
                    <v-text-field v-model="selectedForm.datos.herrajes.otros" label="Otros herrajes" variant="outlined" density="compact" hide-details style="max-width: 250px;"></v-text-field>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-3 opacity-15"></v-divider>

              <!-- 3. JAMBAS -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">JAMBAS</h3>
              <v-row class="mb-3 align-center">
                <!-- Línea 1 -->
                <v-col cols="6" sm="3" class="py-1">
                  <v-checkbox v-model="selectedForm.datos.jambas.molduras" label="Molduras" density="compact" hide-details></v-checkbox>
                </v-col>
                <v-col cols="6" sm="3" class="py-1">
                  <v-checkbox v-model="selectedForm.datos.jambas.tapeta" label="Tapeta" density="compact" hide-details></v-checkbox>
                </v-col>
                <v-col cols="12" sm="6" class="py-1">
                  <v-text-field v-model="selectedForm.datos.jambas.otros" label="Otros" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
                
                <!-- Línea 2 -->
                <v-col cols="12" sm="6" class="py-1">
                  <div class="d-flex gap-8 border py-0 px-3 rounded labeled-checkbox-group" style="border-color: rgba(226, 192, 96, 0.15) !important;">
                    <span class="text-caption text-grey align-self-center">Medidas:</span>
                    <v-checkbox v-model="selectedForm.datos.jambas.tapeta7cm" label="7 cm" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.jambas.tapeta9cm" label="9 cm" density="compact" hide-details></v-checkbox>
                  </div>
                </v-col>
                
                <v-col cols="12" sm="6" class="py-1">
                  <v-text-field v-model="selectedForm.datos.jambas.cabecero" label="Cabecero" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
                
                <!-- Línea 3 -->
                <v-col cols="12" sm="6" class="py-1">
                  <div class="d-flex gap-8 border py-0 px-3 rounded labeled-checkbox-group" style="border-color: rgba(226, 192, 96, 0.15) !important;">
                    <span class="text-caption text-grey align-self-center">Corte:</span>
                    <v-checkbox v-model="selectedForm.datos.jambas.corteInglete" label="Inglete" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.jambas.corteRecto" label="Recto" density="compact" hide-details></v-checkbox>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-3 opacity-15"></v-divider>

              <!-- 4. BISAGRAS -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">BISAGRAS</h3>
              <v-row class="mb-3">
                <v-col cols="12" class="py-1">
                  <div class="d-flex gap-8">
                    <v-checkbox v-model="selectedForm.datos.bisagras.vista" label="Vista" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.bisagras.oculta" label="Oculta" density="compact" hide-details></v-checkbox>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-3 opacity-15"></v-divider>

              <!-- 5. PETACA -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">PETACA</h3>
              <v-row class="mb-3">
                <v-col cols="12" class="py-1">
                  <div class="d-flex gap-8">
                    <v-checkbox v-model="selectedForm.datos.petaca.resbalon" label="Resbalón" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.petaca.rodillo" label="Rodillo" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.petaca.iman" label="Imán" density="compact" hide-details></v-checkbox>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-3 opacity-15"></v-divider>

              <!-- 6. CERCO -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">CERCO</h3>
              <v-row class="mb-3">
                <v-col cols="12" class="py-1">
                  <div class="d-flex flex-wrap gap-8">
                    <v-checkbox v-model="selectedForm.datos.cerco.estandar" label="Estándar" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.cerco.hidrofugo" label="Hidrófugo" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.cerco.juntaGoma" label="Junta Goma" density="compact" hide-details></v-checkbox>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-3 opacity-15"></v-divider>

              <!-- 7. INSTALACIÓN -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">INSTALACIÓN</h3>
              <v-row class="mb-3">
                <v-col cols="12" class="py-1">
                  <div class="d-flex flex-wrap gap-8">
                    <v-checkbox v-model="selectedForm.datos.instalacion.nudillo" label="Nudillo" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.instalacion.desmontaje" label="Desmontaje" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.instalacion.descejado" label="Descejado" density="compact" hide-details></v-checkbox>
                    <v-checkbox v-model="selectedForm.datos.instalacion.albanileria" label="Albañilería" density="compact" hide-details></v-checkbox>
                  </div>
                </v-col>
              </v-row>
            </v-card>

            <!-- Tabla de Mediciones Dinámicas -->
            <div class="d-flex align-center justify-space-between mb-3 mt-4">
              <h3 class="text-subtitle-2 font-weight-bold text-primary text-uppercase">Medidas de Puertas (Líneas)</h3>
              <v-btn size="small" color="primary" prepend-icon="mdi-plus" variant="outlined" @click="addPuertaLinea">
                Añadir Línea
              </v-btn>
            </div>

            <!-- Listado de Puertas -->
            <v-card color="secondary" variant="flat" rounded="lg" class="pa-2 mb-4 overflow-x-auto">
              <table class="w-100 table-technical">
                <thead>
                  <tr>
                    <th style="width: 8.33%;">Cantidad</th>
                    <th style="width: 8.33%;">Apertura</th>
                    <th style="width: 8.33%;">Medida</th>
                    <th style="width: 8.33%;">Tipo</th>
                    <th style="width: 8.33%;">Zona</th>
                    <th style="width: 8.33%;">Cerco</th>
                    <th style="width: 41.67%;">Observaciones</th>
                    <th style="width: 8.33%;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(linea, idx) in selectedForm.datos.lineasPuertas" :key="linea.id || idx">
                    <td><v-text-field v-model="linea.cantidad" class="table-input" variant="plain" density="compact" hide-details></v-text-field></td>
                    <td><v-text-field v-model="linea.apertura" class="table-input" variant="plain" density="compact" hide-details></v-text-field></td>
                    <td><v-text-field v-model="linea.medida" class="table-input" variant="plain" density="compact" hide-details></v-text-field></td>
                    <td><v-text-field v-model="linea.tipo" class="table-input" variant="plain" density="compact" hide-details></v-text-field></td>
                    <td><v-text-field v-model="linea.zona" class="table-input" variant="plain" density="compact" hide-details></v-text-field></td>
                    <td><v-text-field v-model="linea.cerco" class="table-input" variant="plain" density="compact" hide-details></v-text-field></td>
                    <td><v-text-field v-model="linea.observaciones" class="table-input" variant="plain" density="compact" hide-details></v-text-field></td>
                    <td class="text-right">
                      <v-btn
                        v-if="idx < selectedForm.datos.lineasPuertas.length - 1"
                        icon="mdi-delete"
                        size="x-small"
                        color="error"
                        variant="text"
                        @click="deletePuertaLinea(idx)"
                      ></v-btn>
                    </td>
                  </tr>
                </tbody>
              </table>
            </v-card>

            <!-- Observaciones -->
            <v-textarea v-model="selectedForm.datos.observacionesGenerales" label="Observaciones" variant="outlined" rows="3" color="primary"></v-textarea>
          </div>

          <!-- FORMULARIO TARIMAS -->
          <div v-else-if="selectedForm.tipo === 'tarimas'">
            <!-- Configuración general en orden de PDF -->
            <v-card color="secondary" variant="flat" class="pa-4 mb-4" rounded="lg">
              
              <!-- 1. Mod. TARIMA -->
              <v-row class="mb-3 align-start">
                <v-col cols="12" sm="3" class="py-1">
                  <span class="text-subtitle-2 font-weight-bold text-primary">Mod. TARIMA:</span>
                </v-col>
                <v-col cols="12" sm="9" class="py-1">
                  <v-row>
                    <v-col cols="12" sm="6" class="py-1">
                      <v-combobox :key="`tarima-tipos-${tarimaTiposOptions.join('|')}`" v-model="selectedForm.datos.modeloTarima.tipo" label="Tipo" :items="tarimaTiposOptions" variant="outlined" density="compact" hide-details @keydown.enter.prevent="saveTarimaOption('tarimaTipos', selectedForm.datos.modeloTarima.tipo)" @blur="saveTarimaOption('tarimaTipos', selectedForm.datos.modeloTarima.tipo)">
                        <template #item="{ props, item }">
                          <v-list-item v-bind="props">
                            <template #append>
                              <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" title="Eliminar opción" @mousedown.stop.prevent="deleteTarimaOption('tarimaTipos', item.raw ?? item.value ?? item.title ?? item)" @click.stop></v-btn>
                            </template>
                          </v-list-item>
                        </template>
                      </v-combobox>
                    </v-col>
                    <v-col cols="12" sm="6" class="py-1">
                      <v-combobox :key="`tarima-acabados-${tarimaAcabadosOptions.join('|')}`" v-model="selectedForm.datos.modeloTarima.acabado" label="Acabado" :items="tarimaAcabadosOptions" variant="outlined" density="compact" hide-details @keydown.enter.prevent="saveTarimaOption('tarimaAcabados', selectedForm.datos.modeloTarima.acabado)" @blur="saveTarimaOption('tarimaAcabados', selectedForm.datos.modeloTarima.acabado)">
                        <template #item="{ props, item }">
                          <v-list-item v-bind="props">
                            <template #append>
                              <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" title="Eliminar opción" @mousedown.stop.prevent="deleteTarimaOption('tarimaAcabados', item.raw ?? item.value ?? item.title ?? item)" @click.stop></v-btn>
                            </template>
                          </v-list-item>
                        </template>
                      </v-combobox>
                    </v-col>
                    <v-col cols="12" sm="6" class="py-1">
                      <v-text-field v-model="selectedForm.datos.modeloTarima.grosor" label="Grosor" variant="outlined" density="compact" hide-details></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" class="py-1">
                      <v-text-field v-model="selectedForm.datos.modeloTarima.aislante" label="Aislante" variant="outlined" density="compact" hide-details></v-text-field>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>

              <v-divider class="my-3 opacity-15"></v-divider>

              <!-- 2. RODAPIE -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">RODAPIE</h3>
              <!-- Fila 1: Modelo y Color -->
              <v-row class="mb-3 align-center">
                <v-col cols="12" sm="3" class="py-1">
                  <span class="text-body-2 text-grey-lighten-1">Modelo / Color:</span>
                </v-col>
                <v-col cols="6" sm="4" class="py-1">
                  <v-text-field v-model="selectedForm.datos.rodapie.modelo" label="Modelo" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
                <v-col cols="6" sm="5" class="py-1">
                  <v-text-field v-model="selectedForm.datos.rodapie.color" label="Color" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
              </v-row>
              
              <!-- Fila 2: Medida: Alto, Grosor -->
              <v-row class="mb-3 align-center">
                <v-col cols="12" sm="3" class="py-1">
                  <span class="text-body-2 text-grey-lighten-1">Medida:</span>
                </v-col>
                <v-col cols="6" sm="4" class="py-1">
                  <v-text-field v-model="selectedForm.datos.rodapie.alto" label="Alto" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
                <v-col cols="6" sm="5" class="py-1">
                  <v-text-field v-model="selectedForm.datos.rodapie.grosor" label="Grosor" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
              </v-row>

              <!-- Fila 3: Quitar rodapie cerámico y rematar (C) -->
              <v-row class="mb-3">
                <v-col cols="12" class="py-1">
                  <v-checkbox v-model="selectedForm.datos.rodapie.quitarRodapie" label="Quitar rodapie cerámico y rematar" density="compact" hide-details></v-checkbox>
                </v-col>
              </v-row>

              <v-divider class="my-3 opacity-15"></v-divider>

              <!-- 3. JUNTAS -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">JUNTAS</h3>
              
              <!-- Fila 1: Transición y Dilatación -->
              <v-row class="mb-3 align-center">
                <!-- Transición -->
                <v-col cols="12" md="6" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Transición:</span>
                  <v-checkbox v-model="selectedForm.datos.juntas.transicion" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.juntas.transicionUds" label="Uds." variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.juntas.transicion"></v-text-field>
                </v-col>
                <!-- Dilatación -->
                <v-col cols="12" md="6" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Dilatación:</span>
                  <v-checkbox v-model="selectedForm.datos.juntas.dilatacion" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.juntas.dilatacionUds" label="Uds." variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.juntas.dilatacion"></v-text-field>
                </v-col>
              </v-row>

              <!-- Fila 2: Mamperlán Tira y Mamperlán Mecanizado -->
              <v-row class="mb-3 align-center">
                <!-- Mamperlán Tira -->
                <v-col cols="12" md="6" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Mamperlán Tira:</span>
                  <v-checkbox v-model="selectedForm.datos.juntas.mamperlanTira" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.juntas.mamperlanTiraUds" label="Uds." variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.juntas.mamperlanTira"></v-text-field>
                </v-col>
                <!-- Mamperlán Mecanizado -->
                <v-col cols="12" md="6" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Mamperlán Mecanizado:</span>
                  <v-checkbox v-model="selectedForm.datos.juntas.mamperlanMecanizado" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.juntas.mamperlanMecanizadoUds" label="Uds." variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.juntas.mamperlanMecanizado"></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-3 opacity-15"></v-divider>

              <!-- 4. EXTRAS (Floor Prep / Services) -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">EXTRAS</h3>
              
              <v-row class="mb-3">
                <!-- Desmontaje suelo existente -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Desmontaje suelo exist.:</span>
                  <v-checkbox v-model="selectedForm.datos.bisagras.desmontajeSuelo" label="Activar" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.bisagras.desmontajeSueloUds" label="Uds." variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.bisagras.desmontajeSuelo"></v-text-field>
                  <v-combobox :key="`tarima-desmontaje-tipos-${tarimaDesmontajeTiposOptions.join('|')}`" v-model="selectedForm.datos.bisagras.desmontajeSueloTipo" label="Tipo" :items="tarimaDesmontajeTiposOptions" variant="outlined" density="compact" hide-details class="ml-2" style="max-width: 240px;" :disabled="!selectedForm.datos.bisagras.desmontajeSuelo" @keydown.enter.prevent="saveTarimaOption('tarimaDesmontajeTipos', selectedForm.datos.bisagras.desmontajeSueloTipo)" @blur="saveTarimaOption('tarimaDesmontajeTipos', selectedForm.datos.bisagras.desmontajeSueloTipo)">
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template #append>
                          <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" title="Eliminar opción" @mousedown.stop.prevent="deleteTarimaOption('tarimaDesmontajeTipos', item.raw ?? item.value ?? item.title ?? item)" @click.stop></v-btn>
                        </template>
                      </v-list-item>
                    </template>
                  </v-combobox>
                </v-col>

                <!-- Picado suelo -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Picado suelo:</span>
                  <v-checkbox v-model="selectedForm.datos.bisagras.picadoSuelo" label="Activar" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.bisagras.picadoSueloM2" label="m²" variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.bisagras.picadoSuelo"></v-text-field>
                </v-col>

                <!-- Corte de puertas -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Corte de puertas:</span>
                  <v-checkbox v-model="selectedForm.datos.bisagras.cortePuertas" label="Activar" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.bisagras.cortePuertasUds" label="Uds." variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.bisagras.cortePuertas"></v-text-field>
                </v-col>

                <!-- Echar solera -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Echar solera:</span>
                  <v-checkbox v-model="selectedForm.datos.bisagras.echarSolera" label="Activar" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.bisagras.echarSoleraM2" label="m²" variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.bisagras.echarSolera"></v-text-field>
                </v-col>

                <!-- Corte de puertas blindadas -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Corte de puertas blindadas:</span>
                  <v-checkbox v-model="selectedForm.datos.bisagras.cortePuertasBlindadas" label="Activar" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.bisagras.cortePuertasBlindadasUds" label="Uds." variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.bisagras.cortePuertasBlindadas"></v-text-field>
                </v-col>

                <!-- Echar pasta niveladora -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Echar pasta niveladora:</span>
                  <v-checkbox v-model="selectedForm.datos.bisagras.echarPastaNiveladora" label="Activar" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.bisagras.echarPastaNiveladoraM2" label="m²" variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.bisagras.echarPastaNiveladora"></v-text-field>
                </v-col>

                <!-- Movimiento de muebles existentes -->
                <v-col cols="12" class="py-1">
                  <v-checkbox v-model="selectedForm.datos.bisagras.movimientoMuebles" label="Movimiento de muebles existentes" density="compact" hide-details></v-checkbox>
                </v-col>

                <!-- Observaciones -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Observaciones:</span>
                  <v-text-field
                    v-model="selectedForm.datos.bisagras.observaciones"
                    placeholder="Escribir aquí"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="flex-grow-1"
                    style="min-width: 0;"
                  ></v-text-field>
                </v-col>

                <!-- Colocación sobre -->
                <v-col cols="12" class="py-1 d-flex flex-wrap align-center gap-4">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 130px;">Colocación sobre:</span>
                  <v-radio-group v-model="selectedForm.datos.bisagras.colocacionSobre" inline hide-details color="primary">
                    <v-radio label="Parquet" value="Parquet"></v-radio>
                    <v-radio label="Solera" value="Solera"></v-radio>
                    <v-radio label="Plaqueta" value="Plaqueta"></v-radio>
                    <v-radio label="Otros" value="Otros"></v-radio>
                  </v-radio-group>
                  <v-text-field 
                    v-model="selectedForm.datos.bisagras.colocacionSobreOtros" 
                    label="Especificar otros" 
                    variant="outlined" 
                    density="compact" 
                    hide-details 
                    style="max-width: 250px;" 
                    :disabled="selectedForm.datos.bisagras.colocacionSobre !== 'Otros'"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card>

            <!-- Tabla de Suelos (Cálculo automático de M2 y ML) -->
            <div class="d-flex align-center justify-space-between mb-3 mt-4">
              <div class="d-flex align-center flex-wrap gap-2">
                <h3 class="text-subtitle-2 font-weight-bold text-primary text-uppercase">Medidas de Suelos</h3>
                <v-chip class="font-weight-bold mx-3" color="primary" size="small">Total: {{ totalM2Computed }} m²</v-chip>
                <v-chip class="font-weight-bold mx-3" color="primary" size="small">Total: {{ totalMLComputed }} ml</v-chip>
              </div>
              <v-btn size="small" color="primary" prepend-icon="mdi-plus" variant="outlined" @click="addTarimaLinea">
                Añadir Línea
              </v-btn>
            </div>

            <!-- Listado de Suelos -->
            <v-card color="secondary" variant="flat" rounded="lg" class="pa-2 mb-4 overflow-x-auto">
              <table class="w-100 table-technical table-tarima-measures">
                <colgroup>
                  <col style="width: 16.6667%;">
                  <col style="width: 16.6667%;">
                  <col style="width: 8.3333%;">
                  <col style="width: 8.3333%;">
                  <col style="width: 50%;">
                </colgroup>
                <thead>
                  <tr>
                    <th>Zona</th>
                    <th>Medidas</th>
                    <th class="text-center">ml</th>
                    <th class="text-center">m²</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(linea, idx) in selectedForm.datos.lineasTarima" :key="linea.id || idx">
                    <td>
                      <v-text-field
                        v-model="linea.zona"
                        :placeholder="idx === selectedForm.datos.lineasTarima.length - 1 ? '—' : undefined"
                        :class="['table-input', { 'tarima-new-row-input': idx === selectedForm.datos.lineasTarima.length - 1 }]"
                        variant="plain"
                        density="compact"
                        hide-details
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="linea.medida"
                        :placeholder="idx === selectedForm.datos.lineasTarima.length - 1 ? '—' : undefined"
                        :class="['table-input', { 'tarima-new-row-input': idx === selectedForm.datos.lineasTarima.length - 1 }]"
                        variant="plain"
                        density="compact"
                        hide-details
                        @input="onMedidaTarimaInput(linea)"
                        @blur="normalizeMedidaTarima(linea)"
                      ></v-text-field>
                    </td>
                    <td class="tarima-calculated-cell">
                      <span class="tarima-calculated-value">{{ linea.ml || '—' }}</span>
                    </td>
                    <td class="tarima-calculated-cell">
                      <span class="tarima-calculated-value">{{ linea.m2 || '—' }}</span>
                    </td>
                    <td>
                      <div class="tarima-observations-cell">
                        <v-text-field
                          v-model="linea.observaciones"
                          :placeholder="idx === selectedForm.datos.lineasTarima.length - 1 ? '—' : undefined"
                          :class="['table-input', { 'tarima-new-row-input': idx === selectedForm.datos.lineasTarima.length - 1 }]"
                          variant="plain"
                          density="compact"
                          hide-details
                        ></v-text-field>
                        <v-btn
                          v-if="idx < selectedForm.datos.lineasTarima.length - 1"
                          icon="mdi-delete"
                          size="x-small"
                          color="error"
                          variant="text"
                          class="tarima-delete-button"
                          title="Eliminar línea"
                          @click="deleteTarimaLinea(idx)"
                        ></v-btn>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </v-card>

            <!-- Observaciones -->
            <v-textarea v-model="selectedForm.datos.observacionesGenerales" label="Observaciones Generales de Suelos / Tarimas" variant="outlined" rows="3" color="primary"></v-textarea>
          </div>

          <reforma-cuestionario
            v-else-if="selectedForm.tipo === 'reforma'"
            v-model="selectedForm.datos"
            :tipo="selectedForm.subtipo"
          />
        </v-window-item>

        <!-- 2. PESTAÑA ANOTACIONES -->
        <v-window-item value="notes" class="fill-height pa-1">
          <div class="fill-height d-flex flex-column">
            <div class="d-flex align-center justify-space-between mb-4">
              <h2 class="text-h6 font-weight-bold text-white">Anotaciones</h2>
              <div class="d-flex align-center gap-2">
                <v-btn icon="mdi-chevron-left" size="small" variant="text" color="white" class="mr-2" :disabled="notesLeftPageIndex === 0" @click="prevNotesPage" title="Página anterior"></v-btn>
                <span class="text-body-2 font-weight-bold text-primary mr-2">{{ notesLeftPageIndex + 1 }}/{{ notesTotalPages }}</span>
                <v-btn icon="mdi-chevron-right" size="small" variant="text" color="white" class="mr-2" :disabled="notesRightPageIndex >= notesTotalPages" @click="nextNotesPage" title="Página siguiente"></v-btn>
                <v-btn icon="mdi-plus-box" size="small" color="primary" variant="flat" class="mr-2" @click="addNotesPage" title="Añadir página"></v-btn>
                <v-btn icon="mdi-minus-box" size="small" color="error" variant="outlined" :disabled="notesTotalPages <= 1" @click="deleteActiveNotesPage" title="Borrar página actual"></v-btn>
              </div>
            </div>
            <template v-if="notesLeftPage">
              <v-textarea
                :model-value="notesLeftPage.textoReconocido || ''"
                :label="`Anotaciones — Página ${notesLeftPageIndex + 1}`"
                placeholder="Escribe o dicta aquí las anotaciones de esta página…"
                variant="outlined"
                color="primary"
                rows="20"
                auto-grow
                hide-details
                class="notes-textarea w-100"
                @update:model-value="updateActiveNotesText"
              ></v-textarea>
              <span class="text-caption text-grey-lighten-1 mt-2 d-flex align-center">
                <v-icon size="small" class="mr-1" color="success">mdi-cloud-check</v-icon>
                Los cambios se guardan automáticamente
              </span>
            </template>
          </div>
        </v-window-item>

        <!-- Implementación anterior conservada temporalmente sin renderizar para no alterar datos históricos. -->
        <v-window-item v-if="false" value="notes" :eager="true" class="fill-height pa-1">
          <div class="d-flex flex-column h-100 fill-height">
            <!-- Barra de Dibujo y Navegación Unificada -->
            <div class="flex-grow-0 flex-shrink-0 drawing-toolbar rounded-lg mb-1">
              <!-- Grupo de Herramientas (Lápiz, Goma, Grosor, Colores) -->
              <div class="toolbar-group toolbar-group--drawing">
                <div class="toolbar-group__label" title="Herramientas de dibujo">
                  <v-icon size="17">mdi-draw</v-icon>
                </div>
                <v-btn
                  :variant="activeTool === 'draw' ? 'flat' : 'outlined'"
                  :color="activeTool === 'draw' ? 'primary' : 'white'"
                  icon="mdi-pencil"
                  size="small"
                  :class="{ 'border-golden': activeTool !== 'draw' }"
                  @click="activeTool = 'draw'"
                  title="Herramienta Lápiz"
                ></v-btn>
                <v-btn
                  :variant="activeTool === 'erase' ? 'flat' : 'outlined'"
                  :color="activeTool === 'erase' ? 'primary' : 'white'"
                  icon="mdi-eraser"
                  size="small"
                  :class="{ 'border-golden': activeTool !== 'erase' }"
                  @click="activeTool = 'erase'"
                  title="Herramienta Borrador"
                ></v-btn>

                <div class="toolbar-separator"></div>

                <div class="d-flex align-center">
                  <v-btn-toggle
                    v-model="brushSize"
                    mandatory
                    color="primary"
                    density="compact"
                    selected-class="bg-primary text-white"
                    class="border border-golden"
                    rounded="pill"
                  >
                    <v-btn :value="3" min-width="32" class="px-2" title="Fino" rounded="pill">
                      <div class="brush-size-dot" style="width: 4px; height: 4px;"></div>
                    </v-btn>
                    <v-btn :value="7" min-width="32" class="px-2" title="Medio" rounded="pill">
                      <div class="brush-size-dot" style="width: 8px; height: 8px;"></div>
                    </v-btn>
                    <v-btn :value="12" min-width="32" class="px-2" title="Grueso" rounded="pill">
                      <div class="brush-size-dot" style="width: 14px; height: 14px;"></div>
                    </v-btn>
                  </v-btn-toggle>
                </div>

                <div class="toolbar-separator"></div>

                <div class="colors-container">
                  <button
                    v-for="c in colors"
                    :key="c.value"
                    class="color-dot-small"
                    :style="{
                      backgroundColor: c.value,
                      border: brushColor === c.value && activeTool === 'draw' ? '2.5px solid var(--active-color-border)' : '1px solid var(--inactive-color-border)'
                    }"
                    @click="selectColor(c.value)"
                    :title="c.label"
                  ></button>
                </div>
              </div>

              <!-- Grupo de Acciones (Deshacer, Borrar) -->
              <div class="toolbar-group toolbar-group--actions">
                <div class="toolbar-group__label" title="Acciones del lienzo">
                  <v-icon size="17">mdi-tools</v-icon>
                </div>
                <v-btn
                  icon="mdi-undo"
                  size="small"
                  variant="outlined"
                  color="white"
                  class="border-golden"
                  @click="triggerNotesUndo"
                  title="Deshacer (Ctrl+Z)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete-sweep"
                  size="small"
                  variant="outlined"
                  color="error"
                  @click="triggerNotesClear"
                  title="Limpiar lienzo"
                ></v-btn>
                <v-btn
                  :icon="showGrid ? 'mdi-grid' : 'mdi-grid-off'"
                  size="small"
                  variant="outlined"
                  :color="showGrid ? 'primary' : 'white'"
                  class="border-golden"
                  @click="showGrid = !showGrid"
                  :title="showGrid ? 'Ocultar cuadrícula de fondo' : 'Mostrar cuadrícula de fondo'"
                ></v-btn>
                <div class="toolbar-separator"></div>
                <v-btn
                  size="small"
                  variant="flat"
                  color="primary"
                  class="toolbar-ai-action"
                  @click="transcribeActivePage"
                  :loading="transcribing"
                  title="Digitalizar anotaciones con IA (Gemini 3.1 Flash Lite)"
                >
                  <v-icon size="19">mdi-brain</v-icon>
                  <span class="toolbar-ai-action__text">Digitalizar</span>
                </v-btn>
                <span
                  v-if="transcribingStatus && activeTab === 'notes'"
                  class="toolbar-status text-caption text-primary font-weight-medium animate-pulse"
                >
                  {{ transcribingStatus }}
                </span>
              </div>

              <!-- Grupo de Navegación de Páginas -->
              <div class="toolbar-group toolbar-group--pages">
                <div class="toolbar-group__label" title="Navegación de páginas">
                  <v-icon size="17">mdi-file-multiple-outline</v-icon>
                </div>
                <v-btn
                  icon="mdi-chevron-left"
                  size="small"
                  variant="text"
                  color="white"
                  :disabled="notesLeftPageIndex === 0"
                  @click="prevNotesPage"
                  title="Página anterior"
                ></v-btn>

                <span class="text-body-2 font-weight-bold toolbar-text toolbar-page-indicator">
                  <template v-if="isNotesTwoPageLayout">
                    {{ notesLeftPageIndex + 1 }}-{{ Math.min(notesRightPageIndex + 1, notesTotalPages) }}/{{ notesTotalPages }}
                  </template>
                  <template v-else>
                    {{ notesLeftPageIndex + 1 }}/{{ notesTotalPages }}
                  </template>
                </span>

                <v-btn
                  icon="mdi-chevron-right"
                  size="small"
                  variant="text"
                  color="white"
                  :disabled="notesRightPageIndex >= notesTotalPages"
                  @click="nextNotesPage"
                  title="Página siguiente"
                ></v-btn>

                <div class="toolbar-separator"></div>

                <v-btn
                  icon="mdi-plus-box"
                  color="primary"
                  size="small"
                  variant="flat"
                  @click="addNotesPage"
                  title="Añadir página"
                ></v-btn>

                <v-btn
                  icon="mdi-minus-box"
                  color="error"
                  size="small"
                  variant="outlined"
                  :disabled="notesTotalPages <= 1"
                  @click="deleteActiveNotesPage"
                  title="Borrar página activa (borde dorado)"
                ></v-btn>
              </div>
            </div>

            <!-- Área de Canvases -->
            <div
              class="notes-canvas-scroll flex-grow-1 flex-shrink-1 d-flex gap-4"
              :class="{ 'notes-canvas-scroll--single': !isNotesTwoPageLayout }"
            >
              <!-- Canvas Izquierda -->
              <div
                v-if="notesLeftPage"
                class="notes-page-shell d-flex flex-column position-relative"
                :class="{ 'fill-height': isNotesTwoPageLayout, 'notes-page-shell--single': !isNotesTwoPageLayout }"
                style="flex: 1; min-width: 0; cursor: pointer;"
                @pointerdown="activeNotesPageId = notesLeftPage.id"
              >
                <div class="position-absolute text-caption font-weight-bold text-primary bg-secondary px-2 py-0.5 rounded-br-lg" style="z-index: 10; top: 0; left: 0; border: 1px solid rgba(226,192,96,0.15); border-top: none; border-left: none;">
                  Página {{ notesLeftPageIndex + 1 }}
                </div>
                <sketch-canvas
                  ref="notesCanvasLeftRef"
                  :key="notesLeftPage.id"
                  :page-id="notesLeftPage.id"
                  canvas-type="anotaciones"
                  :project-id="project.id"
                  :form-id="selectedForm.id"
                  :image-url="notesLeftPage.url"
                  :texto-reconocido="notesLeftPage.textoReconocido"
                  :is-active="activeTab === 'notes'"
                  :active-tool="activeTool"
                  :brush-size="brushSize"
                  :brush-color="brushColor"
                  :show-grid="showGrid"
                  :fit-width="!isNotesTwoPageLayout"
                  @save="onCanvasSave"
                  @focus="activeNotesPageId = $event"
                  :style="{
                    border: (activeNotesPageId === notesLeftPage.id || !activeNotesPageId) ? '2px solid #e2c060 !important' : '1px solid rgba(226,192,96,0.2) !important',
                    borderRadius: '8px'
                  }"
                />
              </div>

              <!-- Canvas Derecha (Solo en Two Page Layout) -->
              <div v-if="isNotesTwoPageLayout" class="fill-height d-flex flex-column position-relative" style="flex: 1; min-width: 0;">
                <template v-if="notesRightPage">
                  <div
                    class="fill-height d-flex flex-column position-relative"
                    style="flex: 1; min-width: 0; cursor: pointer;"
                    @pointerdown="activeNotesPageId = notesRightPage.id"
                  >
                    <div class="position-absolute text-caption font-weight-bold text-primary bg-secondary px-2 py-0.5 rounded-br-lg" style="z-index: 10; top: 0; left: 0; border: 1px solid rgba(226,192,96,0.15); border-top: none; border-left: none;">
                      Página {{ notesRightPageIndex + 1 }}
                    </div>
                    <sketch-canvas
                      ref="notesCanvasRightRef"
                      :key="notesRightPage.id"
                      :page-id="notesRightPage.id"
                      canvas-type="anotaciones"
                      :project-id="project.id"
                      :form-id="selectedForm.id"
                      :image-url="notesRightPage.url"
                      :texto-reconocido="notesRightPage.textoReconocido"
                      :is-active="activeTab === 'notes'"
                      :active-tool="activeTool"
                      :brush-size="brushSize"
                      :brush-color="brushColor"
                      :show-grid="showGrid"
                      @save="onCanvasSave"
                      @focus="activeNotesPageId = $event"
                      :style="{
                        border: activeNotesPageId === notesRightPage.id ? '2px solid #e2c060 !important' : '1px solid rgba(226,192,96,0.2) !important',
                        borderRadius: '8px'
                      }"
                    />
                  </div>
                </template>
                <v-card
                  v-else
                  color="surface"
                  class="border-golden fill-height d-flex flex-column align-center justify-center border-dashed text-center pa-6"
                  style="border-style: dashed !important; flex: 1;"
                  rounded="lg"
                >
                  <v-icon size="64" color="primary" class="mb-4">mdi-plus-circle-outline</v-icon>
                  <div class="text-h6 text-white font-weight-bold mb-2">Añadir otra página</div>
                  <p class="text-body-2 text-grey-lighten-1 mb-6 max-w-sm">
                    Optimiza el espacio en pantalla horizontal mostrando dos páginas a la vez. Añade una nueva hoja para continuar dibujando.
                  </p>
                  <v-btn
                    prepend-icon="mdi-plus"
                    color="primary"
                    variant="flat"
                    class="font-weight-bold text-uppercase px-6"
                    @click="addNotesPage"
                  >
                    Añadir Hoja
                  </v-btn>
                </v-card>
              </div>
            </div>
          </div>
        </v-window-item>

        <!-- 3. PESTAÑA CROQUIS / BOCETO PLANO -->
        <v-window-item value="sketch" :eager="true" class="fill-height pa-1">
          <div class="d-flex flex-column h-100 fill-height">
            <!-- Barra de Dibujo y Navegación Unificada -->
            <div class="flex-grow-0 flex-shrink-0 drawing-toolbar rounded-lg mb-1">
              <!-- Grupo de Herramientas (Lápiz, Goma, Grosor, Colores) -->
              <div class="toolbar-group toolbar-group--drawing">
                <div class="toolbar-group__label" title="Herramientas de dibujo">
                  <v-icon size="17">mdi-draw</v-icon>
                </div>
                <v-btn
                  :variant="activeTool === 'draw' ? 'flat' : 'outlined'"
                  :color="activeTool === 'draw' ? 'primary' : 'white'"
                  icon="mdi-pencil"
                  size="small"
                  :class="{ 'border-golden': activeTool !== 'draw' }"
                  @click="activeTool = 'draw'"
                  title="Herramienta Lápiz"
                ></v-btn>
                <v-btn
                  :variant="activeTool === 'erase' ? 'flat' : 'outlined'"
                  :color="activeTool === 'erase' ? 'primary' : 'white'"
                  icon="mdi-eraser"
                  size="small"
                  :class="{ 'border-golden': activeTool !== 'erase' }"
                  @click="activeTool = 'erase'"
                  title="Herramienta Borrador"
                ></v-btn>

                <div class="toolbar-separator"></div>

                <div class="d-flex align-center">
                  <v-btn-toggle
                    v-model="brushSize"
                    mandatory
                    color="primary"
                    density="compact"
                    selected-class="bg-primary text-white"
                    class="border border-golden"
                    rounded="pill"
                  >
                    <v-btn :value="3" min-width="32" class="px-2" title="Fino" rounded="pill">
                      <div class="brush-size-dot" style="width: 4px; height: 4px;"></div>
                    </v-btn>
                    <v-btn :value="7" min-width="32" class="px-2" title="Medio" rounded="pill">
                      <div class="brush-size-dot" style="width: 8px; height: 8px;"></div>
                    </v-btn>
                    <v-btn :value="12" min-width="32" class="px-2" title="Grueso" rounded="pill">
                      <div class="brush-size-dot" style="width: 14px; height: 14px;"></div>
                    </v-btn>
                  </v-btn-toggle>
                </div>

                <div class="toolbar-separator"></div>

                <div class="colors-container">
                  <button
                    v-for="c in colors"
                    :key="c.value"
                    class="color-dot-small"
                    :style="{
                      backgroundColor: c.value,
                      border: brushColor === c.value && activeTool === 'draw' ? '2.5px solid var(--active-color-border)' : '1px solid var(--inactive-color-border)'
                    }"
                    @click="selectColor(c.value)"
                    :title="c.label"
                  ></button>
                </div>
              </div>

              <!-- Grupo de Acciones (Deshacer, Borrar) -->
              <div class="toolbar-group toolbar-group--actions">
                <div class="toolbar-group__label" title="Acciones del lienzo">
                  <v-icon size="17">mdi-tools</v-icon>
                </div>
                <v-btn
                  icon="mdi-undo"
                  size="small"
                  variant="outlined"
                  color="white"
                  class="border-golden"
                  @click="triggerSketchUndo"
                  title="Deshacer (Ctrl+Z)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete-sweep"
                  size="small"
                  variant="outlined"
                  color="error"
                  @click="triggerSketchClear"
                  title="Limpiar lienzo"
                ></v-btn>
                <v-btn
                  :icon="activeSketchGridVisible ? 'mdi-grid' : 'mdi-grid-off'"
                  size="small"
                  variant="outlined"
                  :color="activeSketchGridVisible ? 'primary' : 'white'"
                  class="border-golden"
                  @click="toggleActiveSketchGrid"
                  :title="activeSketchGridVisible ? 'Ocultar cuadrícula de esta hoja' : 'Mostrar cuadrícula de esta hoja'"
                ></v-btn>
                <div class="toolbar-separator"></div>
                <v-btn
                  size="small"
                  variant="flat"
                  color="primary"
                  class="toolbar-ai-action"
                  @click="transcribeActivePage"
                  :loading="transcribing"
                  title="Generar plano SVG con IA (gemini-3.5-flash)"
                >
                  <v-icon size="19">mdi-brain</v-icon>
                  <span class="toolbar-ai-action__text">Generar plano</span>
                </v-btn>
                <span
                  v-if="transcribingStatus && activeTab === 'sketch'"
                  class="toolbar-status text-caption text-primary font-weight-medium animate-pulse"
                >
                  {{ transcribingStatus }}
                </span>
              </div>

              <!-- Grupo de Navegación de Páginas -->
              <div class="toolbar-group toolbar-group--pages">
                <div class="toolbar-group__label" title="Navegación de páginas">
                  <v-icon size="17">mdi-file-multiple-outline</v-icon>
                </div>
                <v-btn
                  icon="mdi-chevron-left"
                  size="small"
                  variant="text"
                  color="white"
                  :disabled="sketchLeftPageIndex === 0"
                  @click="prevSketchPage"
                  title="Página anterior"
                ></v-btn>

                <span class="text-body-2 font-weight-bold toolbar-text toolbar-page-indicator">
                  <template v-if="isTwoPageLayout">
                    {{ sketchLeftPageIndex + 1 }}-{{ Math.min(sketchRightPageIndex + 1, sketchTotalPages) }}/{{ sketchTotalPages }}
                  </template>
                  <template v-else>
                    {{ sketchLeftPageIndex + 1 }}/{{ sketchTotalPages }}
                  </template>
                </span>

                <v-btn
                  icon="mdi-chevron-right"
                  size="small"
                  variant="text"
                  color="white"
                  :disabled="sketchRightPageIndex >= sketchTotalPages"
                  @click="nextSketchPage"
                  title="Página siguiente"
                ></v-btn>

                <div class="toolbar-separator"></div>

                <v-btn
                  icon="mdi-plus-box"
                  color="primary"
                  size="small"
                  variant="flat"
                  @click="addSketchPage"
                  title="Añadir página"
                ></v-btn>

                <v-btn
                  icon="mdi-minus-box"
                  color="error"
                  size="small"
                  variant="outlined"
                  :disabled="sketchTotalPages <= 1"
                  @click="deleteActiveSketchPage"
                  title="Borrar página activa (borde dorado)"
                ></v-btn>
              </div>
            </div>

            <!-- Área de Canvases -->
            <div class="flex-grow-1 flex-shrink-1 d-flex gap-4 overflow-hidden" style="min-height: 0;">
              <!-- Canvas Izquierda -->
              <div
                v-if="sketchLeftPage"
                class="fill-height d-flex flex-column position-relative"
                style="flex: 1; min-width: 0; cursor: pointer;"
                @pointerdown="activeSketchPageId = sketchLeftPage.id"
              >
                <div class="position-absolute text-caption font-weight-bold text-primary bg-secondary px-2 py-0.5 rounded-br-lg" style="z-index: 10; top: 0; left: 0; border: 1px solid rgba(226,192,96,0.15); border-top: none; border-left: none;">
                  Página {{ sketchLeftPageIndex + 1 }}
                </div>
                <sketch-canvas
                  ref="sketchCanvasLeftRef"
                  :key="sketchLeftPage.id"
                  :page-id="sketchLeftPage.id"
                  canvas-type="boceto"
                  :project-id="project.id"
                  :form-id="selectedForm.id"
                  :image-url="sketchLeftPage.url"
                  :texto-reconocido="sketchLeftPage.textoReconocido"
                  :is-active="activeTab === 'sketch'"
                  :active-tool="activeTool"
                  :brush-size="brushSize"
                  :brush-color="brushColor"
                  :show-grid="isSketchGridVisible(sketchLeftPage.id)"
                  @save="onCanvasSave"
                  @focus="activeSketchPageId = $event"
                  :style="{
                    border: (activeSketchPageId === sketchLeftPage.id || !activeSketchPageId) ? '2px solid #e2c060 !important' : '1px solid rgba(226,192,96,0.2) !important',
                    borderRadius: '8px'
                  }"
                />
              </div>

              <!-- Canvas Derecha (Solo en Two Page Layout) -->
              <div v-if="isTwoPageLayout" class="fill-height d-flex flex-column position-relative" style="flex: 1; min-width: 0;">
                <template v-if="sketchRightPage">
                  <div
                    class="fill-height d-flex flex-column position-relative"
                    style="flex: 1; min-width: 0; cursor: pointer;"
                    @pointerdown="activeSketchPageId = sketchRightPage.id"
                  >
                    <div class="position-absolute text-caption font-weight-bold text-primary bg-secondary px-2 py-0.5 rounded-br-lg" style="z-index: 10; top: 0; left: 0; border: 1px solid rgba(226,192,96,0.15); border-top: none; border-left: none;">
                      Página {{ sketchRightPageIndex + 1 }}
                    </div>
                    <sketch-canvas
                      ref="sketchCanvasRightRef"
                      :key="sketchRightPage.id"
                      :page-id="sketchRightPage.id"
                      canvas-type="boceto"
                      :project-id="project.id"
                      :form-id="selectedForm.id"
                      :image-url="sketchRightPage.url"
                      :texto-reconocido="sketchRightPage.textoReconocido"
                      :is-active="activeTab === 'sketch'"
                      :active-tool="activeTool"
                      :brush-size="brushSize"
                      :brush-color="brushColor"
                      :show-grid="isSketchGridVisible(sketchRightPage.id)"
                      @save="onCanvasSave"
                      @focus="activeSketchPageId = $event"
                      :style="{
                        border: activeSketchPageId === sketchRightPage.id ? '2px solid #e2c060 !important' : '1px solid rgba(226,192,96,0.2) !important',
                        borderRadius: '8px'
                      }"
                    />
                  </div>
                </template>
                <v-card
                  v-else
                  color="surface"
                  class="border-golden fill-height d-flex flex-column align-center justify-center border-dashed text-center pa-6"
                  style="border-style: dashed !important; flex: 1;"
                  rounded="lg"
                >
                  <v-icon size="64" color="primary" class="mb-4">mdi-plus-circle-outline</v-icon>
                  <div class="text-h6 text-white font-weight-bold mb-2">Añadir otra página</div>
                  <p class="text-body-2 text-grey-lighten-1 mb-6 max-w-sm">
                    Optimiza el espacio en pantalla horizontal mostrando dos páginas a la vez. Añade una nueva hoja para continuar dibujando.
                  </p>
                  <v-btn
                    prepend-icon="mdi-plus"
                    color="primary"
                    variant="flat"
                    class="font-weight-bold text-uppercase px-6"
                    @click="addSketchPage"
                  >
                    Añadir Hoja
                  </v-btn>
                </v-card>
              </div>
            </div>
          </div>
        </v-window-item>

        <!-- 4. PESTAÑA ARCHIVOS (Fotos, videos y PDFs) -->
        <v-window-item value="files" class="fill-height overflow-y-auto pa-1">
          <file-uploader
            :archivos="selectedForm.archivos || []"
            :project-id="project.id"
            :form-id="selectedForm.id"
          />
        </v-window-item>
      </v-window>
    </div>

    <!-- DIÁLOGO: AÑADIR NUEVA FICHA -->
    <v-dialog v-model="addFormDialog" max-width="500px">
      <v-card color="surface" class="border-golden">
        <v-card-title class="text-h5 font-weight-bold text-white pa-4 bg-secondary border-b d-flex justify-space-between align-center">
          <span>Añadir Ficha / Reforma</span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="addFormDialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-form ref="addForm" v-model="addFormValid">
            <!-- Selección de Tipo de Ficha -->
            <v-select
              v-model="newFormType"
              label="Tipo de Ficha *"
              :items="[
                { title: 'Puertas', value: 'puertas' },
                { title: 'Tarima', value: 'tarimas' },
                { title: 'Cocina', value: 'cocina' },
                { title: 'Reforma', value: 'reforma' },
                { title: 'Otros', value: 'varios' }
              ]"
              variant="outlined"
              :rules="[v => !!v || 'Debes seleccionar un tipo']"
              color="primary"
              class="mb-4"
            ></v-select>

            <v-select
              v-if="newFormType === 'reforma'"
              v-model="newReformaType"
              label="Tipo de reforma *"
              :items="[
                { title: 'Vivienda completa', value: 'completa' },
                { title: 'Cocina', value: 'cocina' },
                { title: 'Baño', value: 'bano' }
              ]"
              variant="outlined"
              :rules="[v => newFormType !== 'reforma' || !!v || 'Debes seleccionar el tipo de reforma']"
              color="primary"
              class="mb-4"
            ></v-select>

            <!-- Nombre de la Ficha -->
            <v-text-field
              v-model="newFormName"
              label="Nombre personalizado (ej. Cocina Americana, Planta Principal) *"
              variant="outlined"
              :rules="[v => !!v || 'El nombre es obligatorio']"
              color="primary"
              placeholder="Ej. Planta Principal"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4 bg-surface-variant justify-end gap-2">
          <v-btn variant="text" color="white" @click="addFormDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold" :disabled="!addFormValid" @click="submitAddForm">
            Añadir Ficha
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO: ENVIAR RESUMEN POR EMAIL -->
    <v-dialog v-model="emailDialog" max-width="500px" persistent>
      <v-card color="surface" class="border-golden">
        <v-card-title class="text-h5 font-weight-bold text-white pa-4 bg-secondary border-b d-flex justify-space-between align-center">
          <span class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-email</v-icon>
            Enviar Medición por Email
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" :disabled="sendingEmail" @click="emailDialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-form ref="emailForm" v-model="emailFormValid">
            <p class="text-body-2 text-grey-lighten-1 mb-4">
              Se generará un documento PDF estructurado de esta medición y se enviará un correo con el enlace de descarga del PDF y de todos los planos/archivos adjuntos.
            </p>
            <v-text-field
              v-model="targetEmail"
              label="Correo Electrónico de Destino *"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'El correo es obligatorio', v => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(v) || 'Correo no válido']"
              color="primary"
              prepend-inner-icon="mdi-email"
              :disabled="sendingEmail"
              hide-details="auto"
              class="mb-1"
            ></v-text-field>
            
            <div v-if="emailStatusMessage" class="mt-4 text-center">
              <v-progress-circular v-if="sendingEmail" indeterminate color="primary" size="24" class="mr-2"></v-progress-circular>
              <span class="text-body-2 font-weight-bold" :class="emailStatusMessage.startsWith('Error') ? 'text-error' : 'text-primary'">
                {{ emailStatusMessage }}
              </span>
            </div>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4 bg-surface-variant justify-end gap-2">
          <v-btn variant="text" color="white" :disabled="sendingEmail" @click="emailDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold" :loading="sendingEmail" :disabled="!emailFormValid" @click="submitSendEmail">
            Enviar Informe
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import { useProjectStore } from '../store/projectStore';
import SketchCanvas from '../components/SketchCanvas.vue';
import FileUploader from '../components/FileUploader.vue';
import ReformaCuestionario from '../components/ReformaCuestionario.vue';
import { generateProjectPDF, uploadPDFToStorage, sendSummaryEmail } from '../services/emailService';
import { functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';

export default {
  name: 'EditorProyecto',
  props: {
    id: {
      type: String,
      required: true,
    },
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    SketchCanvas,
    FileUploader,
    ReformaCuestionario,
  },
  setup(props) {
    const route = useRoute();
    const projectStore = useProjectStore();

    // ID del proyecto cargado
    const projectId = props.id || route.params.id;

    // Estados de la vista
    const selectedFormId = ref(null);
    const activeTab = ref('form');

    // Referencias a los canvas (izquierda/derecha para dos páginas)
    const notesCanvasLeftRef = ref(null);
    const notesCanvasRightRef = ref(null);
    const sketchCanvasLeftRef = ref(null);
    const sketchCanvasRightRef = ref(null);

    // Estados para tamaño de ventana y cálculo de diseño a dos páginas
    const windowWidth = ref(window.innerWidth);
    const windowHeight = ref(window.innerHeight);

    const handleWindowResize = () => {
      windowWidth.value = window.innerWidth;
      windowHeight.value = window.innerHeight;
    };

    // Paginación de dibujos
    const currentNotesPageIndex = ref(0);
    const currentSketchPageIndex = ref(0);

    const isTwoPageLayout = computed(() => {
      const w = windowWidth.value;
      const h = windowHeight.value;
      // Dos páginas sólo si es landscape y el ancho es de tablet o superior (w >= 768)
      return w >= 768 && w > h;
    });
    const isTouchDevice = navigator.maxTouchPoints > 0;
    // En tablet, Anotaciones usa una sola hoja a ancho completo y desplazable.
    // El boceto mantiene su comportamiento existente de una/dos hojas.
    const isNotesTwoPageLayout = computed(() => isTwoPageLayout.value && !isTouchDevice);

    // Herramientas de Dibujo Compartidas
    const activeTool = ref('draw'); // 'draw' | 'erase'
    const brushSize = ref(7);
    const brushColor = ref('#101010');
    const colors = [
      { label: 'Negro', value: '#101010' },
      { label: 'Azul', value: '#1976D2' },
      { label: 'Verde', value: '#388E3C' },
      { label: 'Rojo', value: '#D32F2F' },
      { label: 'Gris claro', value: '#D0D0D0' },
      { label: 'Gris oscuro', value: '#808080' }
    ];
    const selectColor = (color) => {
      brushColor.value = color;
      activeTool.value = 'draw';
    };

    // Control de Foco de Página Activa
    const activeNotesPageId = ref(null);
    const activeSketchPageId = ref(null);


    
    // Control de Formularios y Modales
    const commonFormValid = ref(true);
    const addFormDialog = ref(false);
    const addFormValid = ref(false);
    const newFormType = ref('cocina');
    const newReformaType = ref('completa');
    const newFormName = ref('');

    // Diálogo de Email
    const emailDialog = ref(false);
    const emailForm = ref(null);
    const emailFormValid = ref(false);
    const targetEmail = ref('');
    const sendingEmail = ref(false);
    const emailStatusMessage = ref('');
    const downloadingPdf = ref(false);

    // Estado del panel lateral colapsable (se inicia según el ancho del viewport)
    const showSidebar = ref(true);

    // Cargar proyecto completo
    onMounted(async () => {
      if (props.embedded) {
        await projectStore.fetchOrCreateProjectById(projectId);
      } else {
        await projectStore.fetchProjectById(projectId);
      }
      await projectStore.fetchConfig();
      // Mantener selectedFormId en null al inicio para que se muestre el panel de control general (datos del cliente + estancias)
      selectedFormId.value = null;
      window.addEventListener('resize', handleWindowResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleWindowResize);
    });

    // Proyecto reactivo del store
    const project = computed(() => projectStore.currentProject);

    const configTiendas = computed(() => projectStore.config?.tiendas || []);
    const configVendedores = computed(() => projectStore.config?.vendedores || []);

    const tiendasOptions = computed(() => {
      const list = [...configTiendas.value];
      const current = project.value?.tienda;
      if (current && !list.includes(current)) {
        list.push(current);
      }
      return list;
    });

    const vendedoresOptions = computed(() => {
      const list = [...configVendedores.value];
      const current = project.value?.vendedor;
      if (current && !list.includes(current)) {
        list.push(current);
      }
      return list;
    });

    const tarimaOptions = (configKey) => {
      return [...(projectStore.config?.[configKey] || [])]
        .sort((a, b) => a.localeCompare(b, 'es'));
    };

    const tarimaTiposOptions = computed(() => tarimaOptions('tarimaTipos'));
    const tarimaAcabadosOptions = computed(() => tarimaOptions('tarimaAcabados'));
    const tarimaDesmontajeTiposOptions = computed(() => tarimaOptions('tarimaDesmontajeTipos'));

    const saveTarimaOption = async (configKey, value) => {
      const option = typeof value === 'string' ? value.trim() : '';
      if (!option) return;

      const currentOptions = projectStore.config?.[configKey] || [];
      if (currentOptions.some(existing => existing.toLocaleLowerCase() === option.toLocaleLowerCase())) return;

      try {
        await projectStore.saveConfig({ [configKey]: [...currentOptions, option] });
      } catch (err) {
        console.error('Error al guardar una opción de tarima:', err);
      }
    };

    const deleteTarimaOption = async (configKey, value) => {
      const option = typeof value === 'string'
        ? value
        : (value?.raw ?? value?.value ?? value?.title ?? '');
      if (!option) return;

      const currentOptions = projectStore.config?.[configKey] || [];
      const nextOptions = currentOptions.filter(existing => existing.toLocaleLowerCase() !== option.toLocaleLowerCase());
      if (nextOptions.length === currentOptions.length) return;

      const selectedValuePaths = {
        tarimaTipos: ['modeloTarima', 'tipo'],
        tarimaAcabados: ['modeloTarima', 'acabado'],
        tarimaDesmontajeTipos: ['bisagras', 'desmontajeSueloTipo']
      };
      const selectedValuePath = selectedValuePaths[configKey];
      const selectedSection = selectedValuePath && selectedForm.value?.datos?.[selectedValuePath[0]];
      const selectedValue = selectedSection?.[selectedValuePath?.[1]];
      const clearsSelectedValue = typeof selectedValue === 'string'
        && selectedValue.toLocaleLowerCase() === option.toLocaleLowerCase();
      const previousConfig = projectStore.config;

      projectStore.config = { ...previousConfig, [configKey]: nextOptions };
      if (clearsSelectedValue) {
        selectedSection[selectedValuePath[1]] = '';
      }

      try {
        await projectStore.saveConfig({ [configKey]: nextOptions });
      } catch (err) {
        projectStore.config = previousConfig;
        if (clearsSelectedValue) {
          selectedSection[selectedValuePath[1]] = selectedValue;
        }
        console.error('Error al eliminar una opción de tarima:', err);
      }
    };

    // Estancia seleccionada
    const selectedForm = computed(() => {
      if (!project.value || !selectedFormId.value) return null;
      return project.value.formularios.find(f => f.id === selectedFormId.value);
    });

    // Anotaciones
    const notesPages = computed(() => selectedForm.value?.dibujos?.anotacionesPages || []);
    const notesTotalPages = computed(() => notesPages.value.length);
    const notesLeftPageIndex = computed(() => {
      return isNotesTwoPageLayout.value ? Math.floor(currentNotesPageIndex.value / 2) * 2 : currentNotesPageIndex.value;
    });
    const notesRightPageIndex = computed(() => notesLeftPageIndex.value + 1);
    
    const notesLeftPage = computed(() => notesPages.value[notesLeftPageIndex.value] || null);
    const notesRightPage = computed(() => notesPages.value[notesRightPageIndex.value] || null);

    // Bocetos
    const sketchPages = computed(() => selectedForm.value?.dibujos?.bocetoPages || []);
    const sketchTotalPages = computed(() => sketchPages.value.length);
    const sketchLeftPageIndex = computed(() => {
      return isTwoPageLayout.value ? Math.floor(currentSketchPageIndex.value / 2) * 2 : currentSketchPageIndex.value;
    });
    const sketchRightPageIndex = computed(() => sketchLeftPageIndex.value + 1);

    const sketchLeftPage = computed(() => sketchPages.value[sketchLeftPageIndex.value] || null);
    const sketchRightPage = computed(() => sketchPages.value[sketchRightPageIndex.value] || null);

    // Controlar índices al borrar páginas
    watch(notesTotalPages, (newTotal) => {
      if (currentNotesPageIndex.value >= newTotal) {
        currentNotesPageIndex.value = Math.max(0, newTotal - 1);
      }
    });
    watch(sketchTotalPages, (newTotal) => {
      if (currentSketchPageIndex.value >= newTotal) {
        currentSketchPageIndex.value = Math.max(0, newTotal - 1);
      }
    });

    // Sincronizar foco de página activa según listado y visibilidad
    watch([notesLeftPage, notesRightPage, isNotesTwoPageLayout, notesPages], ([left, right, twoPage, pages]) => {
      if (!left) {
        activeNotesPageId.value = null;
        return;
      }
      if (!twoPage) {
        // En vista de página única, la activa es siempre la única visible (la izquierda)
        activeNotesPageId.value = left.id;
      } else {
        // En vista de dos páginas, si el foco actual no es ninguna de las dos visibles,
        // por defecto enfocamos la izquierda.
        const currentActiveIsValid = pages && pages.some(p => p.id === activeNotesPageId.value) &&
                                     ((left && activeNotesPageId.value === left.id) || 
                                      (right && activeNotesPageId.value === right.id));
        if (!currentActiveIsValid) {
          activeNotesPageId.value = left.id;
        }
      }
    }, { deep: true, immediate: true });

    watch([sketchLeftPage, sketchRightPage, isTwoPageLayout, sketchPages], ([left, right, twoPage, pages]) => {
      if (!left) {
        activeSketchPageId.value = null;
        return;
      }
      if (!twoPage) {
        // En vista de página única, la activa es siempre la única visible (la izquierda)
        activeSketchPageId.value = left.id;
      } else {
        // En vista de dos páginas, si el foco actual no es ninguna de las dos visibles,
        // por defecto enfocamos la izquierda.
        const currentActiveIsValid = pages && pages.some(p => p.id === activeSketchPageId.value) &&
                                     ((left && activeSketchPageId.value === left.id) || 
                                      (right && activeSketchPageId.value === right.id));
        if (!currentActiveIsValid) {
          activeSketchPageId.value = left.id;
        }
      }
    }, { deep: true, immediate: true });

    const selectForm = (formId) => {
      selectedFormId.value = formId;
      const form = project.value?.formularios?.find(f => f.id === formId);
      if (form && form.tipo === 'varios') {
        activeTab.value = 'notes';
      } else {
        activeTab.value = 'form';
      }
    };

    // Nombres e iconos según el tipo de ficha
    const getFormIcon = (type) => {
      switch (type) {
        case 'cocina': return 'mdi-chef-hat';
        case 'puertas': return 'mdi-door-closed';
        case 'tarimas': return 'mdi-layers-triple';
        case 'reforma': return 'mdi-hammer-wrench';
        case 'varios': return 'mdi-folder-text-outline';
        default: return 'mdi-file-document';
      }
    };

    const getFormIconColor = (type) => {
      switch (type) {
        case 'cocina': return 'orange';
        case 'puertas': return 'primary';
        case 'tarimas': return 'success';
        case 'reforma': return 'warning';
        case 'varios': return 'purple';
        default: return 'white';
      }
    };

    const getFormTypeName = (type) => {
      switch (type) {
        case 'cocina': return 'Cocina';
        case 'puertas': return 'Puertas';
        case 'tarimas': return 'Tarimas';
        case 'reforma': return 'Reforma';
        case 'varios': return 'Varios';
        default: return 'Ficha';
      }
    };

    // 1. Guardar Datos Comunes de Cliente (Autoguardado al cambiar con debounce)
    let autoSaveTimeout = null;
    const saveCommonData = () => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(async () => {
        if (project.value) {
          const common = {
            cliente: project.value.cliente || '',
            direccion: project.value.direccion || '',
            email: project.value.email || '',
            telefonoMovil: project.value.telefonoMovil || '',
            telefonoFijo: project.value.telefonoFijo || '',
            vendedor: project.value.vendedor || '',
            tienda: project.value.tienda || '',
            fechaVisita: project.value.fechaVisita || '',
            fechaEjecucion: project.value.fechaEjecucion || '',
            zonaParquimetro: project.value.zonaParquimetro || 'No',
          };
          try {
            await projectStore.updateProjectCommon(projectId, common);
          } catch (e) {
            console.error('Error al guardar datos comunes:', e);
          }
        }
      }, 600); // Debounce de 600ms
    };

    // 2. Diálogo Añadir Estancia
    const openAddFormDialog = () => {
      newFormType.value = 'cocina';
      newReformaType.value = 'completa';
      newFormName.value = '';
      addFormDialog.value = true;
    };

    const submitAddForm = async () => {
      if (newFormName.value && newFormType.value) {
        try {
          const newId = await projectStore.addFormToProject(
            projectId,
            newFormType.value,
            newFormName.value,
            newFormType.value === 'reforma' ? newReformaType.value : null
          );
          addFormDialog.value = false;
          // Seleccionar la estancia recién creada
          selectedFormId.value = newId;
        } catch (err) {
          alert('Error al añadir la estancia: ' + err.message);
        }
      }
    };

    // 3. Eliminar Estancia
    const deleteForm = async (formId, name) => {
      if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la estancia "${name}" con todos sus bocetos y fotos adjuntos?`)) {
        try {
          await projectStore.removeFormFromProject(projectId, formId);
          if (selectedFormId.value === formId) {
            selectedFormId.value = project.value.formularios?.length > 0 ? project.value.formularios[0].id : null;
          }
        } catch (err) {
          alert('Error al borrar la estancia: ' + err.message);
        }
      }
    };

    // 4. Lógica de Autoguardado para los Formularios Técnicos
    const formSaveStatus = ref('saved'); // 'saved' | 'saving' | 'dirty'
    let formSaveTimeout = null;
    let lastSavedDatosJson = '';

    const triggerFormAutoSave = () => {
      formSaveStatus.value = 'dirty';
      if (formSaveTimeout) clearTimeout(formSaveTimeout);
      formSaveTimeout = setTimeout(async () => {
        if (selectedForm.value) {
          formSaveStatus.value = 'saving';
          try {
            const cleanDatos = JSON.parse(JSON.stringify(selectedForm.value.datos));
            await projectStore.updateFormDatos(
              projectId,
              selectedFormId.value,
              cleanDatos
            );
            lastSavedDatosJson = JSON.stringify(cleanDatos);
            formSaveStatus.value = 'saved';
          } catch (err) {
            console.error('Error al guardar datos técnicos:', err);
            formSaveStatus.value = 'dirty';
          }
        }
      }, 1500); // 1.5s debounce para optimizar peticiones en iPad
    };

    // Escuchar cambios profundos en los datos de la estancia para autoguardado
    watch(
      () => selectedForm.value?.datos,
      (newVal) => {
        if (!newVal || !selectedFormId.value) return;
        const currentJson = JSON.stringify(newVal);
        if (currentJson !== lastSavedDatosJson) {
          triggerFormAutoSave();
        }
      },
      { deep: true }
    );

    // Cancelar cualquier guardado pendiente al cambiar de estancia activa e inicializar lastSavedDatosJson
    watch(selectedFormId, (newId) => {
      if (formSaveTimeout) clearTimeout(formSaveTimeout);
      formSaveStatus.value = 'saved';
      if (selectedForm.value) {
        lastSavedDatosJson = JSON.stringify(selectedForm.value.datos);
      } else {
        lastSavedDatosJson = '';
      }
      // Resetear índices de páginas al cambiar de ficha
      currentNotesPageIndex.value = 0;
      currentSketchPageIndex.value = 0;
    });

    // Auto-añadir fila vacía en puertas cuando la última fila deje de estar vacía
    watch(
      () => selectedForm.value?.datos?.lineasPuertas,
      (lineas) => {
        if (!lineas) return;
        
        // Si no hay ninguna línea, añadir una inicial
        if (lineas.length === 0) {
          addPuertaLinea();
          return;
        }

        // Comprobación si una línea de puerta está completamente vacía
        const isLineEmpty = (linea) => {
          return !linea.cantidad && 
                 !linea.apertura && 
                 !linea.medida && 
                 !linea.tipo && 
                 !linea.zona && 
                 !linea.cerco && 
                 !linea.observaciones;
        };

        // Si la penúltima y la última línea están vacías, eliminamos las líneas sobrantes de forma síncrona
        let changed = false;
        while (lineas.length >= 2 && isLineEmpty(lineas[lineas.length - 2]) && isLineEmpty(lineas[lineas.length - 1])) {
          lineas.pop();
          changed = true;
        }
        if (changed) return;

        const lastLinea = lineas[lineas.length - 1];
        if (!isLineEmpty(lastLinea)) {
          addPuertaLinea();
        }
      },
      { deep: true }
    );

    // Auto-añadir fila vacía en tarimas cuando la última fila deje de estar vacía
    watch(
      () => selectedForm.value?.datos?.lineasTarima,
      (lineas) => {
        if (!lineas) return;
        
        // Si no hay ninguna línea, añadir una inicial
        if (lineas.length === 0) {
          addTarimaLinea();
          return;
        }

        // Comprobación si una línea de tarima está completamente vacía
        const isLineEmpty = (linea) => {
          return !linea.zona && 
                 !linea.medida && 
                 (linea.m2 === '' || linea.m2 === undefined || linea.m2 === null || linea.m2 === 0 || linea.m2 === '0') && 
                 !linea.observaciones;
        };

        // Si la penúltima y la última línea están vacías, eliminamos las líneas sobrantes de forma síncrona
        let changed = false;
        while (lineas.length >= 2 && isLineEmpty(lineas[lineas.length - 2]) && isLineEmpty(lineas[lineas.length - 1])) {
          lineas.pop();
          changed = true;
        }
        if (changed) return;

        const lastLinea = lineas[lineas.length - 1];
        if (!isLineEmpty(lastLinea)) {
          addTarimaLinea();
        }
      },
      { deep: true }
    );

    // 5. Tabla Dinámica: Añadir / Quitar líneas de Puertas
    const addPuertaLinea = () => {
      if (selectedForm.value && selectedForm.value.tipo === 'puertas') {
        const lineas = selectedForm.value.datos.lineasPuertas || [];
        lineas.push({
          id: 'l-p-' + (lineas.length + 1) + '-' + Math.random().toString(36).substring(7),
          cantidad: '',
          apertura: '',
          medida: '',
          tipo: '',
          zona: '',
          cerco: '',
          observaciones: ''
        });
      }
    };

    const deletePuertaLinea = (idx) => {
      if (selectedForm.value && selectedForm.value.tipo === 'puertas') {
        selectedForm.value.datos.lineasPuertas.splice(idx, 1);
      }
    };

    // 6. Tabla Dinámica: Añadir / Quitar líneas de Tarimas y Autocálculo de M2
    const addTarimaLinea = () => {
      if (selectedForm.value && selectedForm.value.tipo === 'tarimas') {
        const lineas = selectedForm.value.datos.lineasTarima || [];
        selectedForm.value.datos.lineasTarima.push({
          id: 'l-t-' + (lineas.length + 1) + '-' + Math.random().toString(36).substring(7),
          zona: '',
          medida: '',
          m2: '',
          ml: '',
          observaciones: ''
        });
      }
    };

    const deleteTarimaLinea = (idx) => {
      if (selectedForm.value && selectedForm.value.tipo === 'tarimas') {
        selectedForm.value.datos.lineasTarima.splice(idx, 1);
      }
    };

    const tarimaRectanglePattern = /^\s*([0-9]+(?:[\.,][0-9]+)?)\s*[xX*×]\s*([0-9]+(?:[\.,][0-9]+)?)\s*$/;

    const normalizeMedidaTarima = (linea) => {
      if (!linea.medida) return;
      const match = linea.medida.match(tarimaRectanglePattern);
      if (!match) return;

      const formatDimension = (rawValue) => {
        const numericValue = Number(rawValue.replace(',', '.'));
        return Number.isFinite(numericValue)
          ? numericValue.toString().replace('.', ',')
          : rawValue.replace('.', ',');
      };

      linea.medida = `${formatDimension(match[1])} x ${formatDimension(match[2])}`;
      onMedidaTarimaInput(linea);
    };

    // Función segura para analizar y calcular la expresión matemática escrita de medidas
    const onMedidaTarimaInput = (linea) => {
      if (!linea.medida) {
        linea.m2 = '';
        linea.ml = '';
        return;
      }
      try {
        // Intentar detectar formato rectángulo: "3.5*4.7", "3,5*4.7", "3.5x4.7", "3,5x4,7"
        const match = linea.medida.match(tarimaRectanglePattern);
        if (match) {
          const a = parseFloat(match[1].replace(',', '.'));
          const b = parseFloat(match[2].replace(',', '.'));
          if (!isNaN(a) && !isNaN(b)) {
            const m2Val = a * b;
            const mlVal = 2 * (a + b);
            // Mostrar con 3 cifras significativas
            linea.m2 = parseFloat(m2Val.toPrecision(3));
            linea.ml = parseFloat(mlVal.toPrecision(3));
            return;
          }
        }

        // Si no es un rectángulo exacto, calcular m2 como expresión general y limpiar ml
        let expr = linea.medida.toLowerCase().replace(/,/g, '.').replace(/[x×]/g, '*');
        expr = expr.replace(/[^0-9+\-*\/.\(\) ]/g, ''); // Permitir números y operadores básicos
        const result = new Function(`return ${expr}`)();
        if (typeof result === 'number' && !isNaN(result)) {
          linea.m2 = Number(result.toFixed(2));
        } else {
          linea.m2 = '';
        }
        linea.ml = '';
      } catch (err) {
        linea.m2 = '';
        linea.ml = '';
      }
    };

    // Calcular la sumatoria total de M2 de las líneas de Tarima de la estancia seleccionada
    const totalM2Computed = computed(() => {
      if (!selectedForm.value || selectedForm.value.tipo !== 'tarimas') return 0;
      const total = selectedForm.value.datos.lineasTarima?.reduce((acc, curr) => acc + (Number(curr.m2) || 0), 0);
      return Number(total.toFixed(2));
    });

    // Calcular la sumatoria total de ML de las líneas de Tarima de la estancia seleccionada
    const totalMLComputed = computed(() => {
      if (!selectedForm.value || selectedForm.value.tipo !== 'tarimas') return 0;
      const total = selectedForm.value.datos.lineasTarima?.reduce((acc, curr) => acc + (Number(curr.ml) || 0), 0);
      return Number(total.toFixed(2));
    });

    // Transcripción con IA de la página activa (Texto o Plano SVG)
    const transcribing = ref(false);
    const transcribingStatus = ref(''); // Mensaje descriptivo del estado actual
    const showGrid = ref(true); // Toggle para mostrar/ocultar cuadrícula de fondo
    const sketchGridVisibility = ref({});
    // La rejilla del boceto parte desactivada: mejora notablemente la fluidez
    // en tablet y puede activarse individualmente en cualquier hoja.
    const isSketchGridVisible = (pageId) => pageId ? sketchGridVisibility.value[pageId] === true : false;
    const activeSketchGridVisible = computed(() => isSketchGridVisible(activeSketchPageId.value || sketchLeftPage.value?.id));
    const toggleActiveSketchGrid = () => {
      const pageId = activeSketchPageId.value || sketchLeftPage.value?.id;
      if (!pageId) return;
      sketchGridVisibility.value = {
        ...sketchGridVisibility.value,
        [pageId]: !isSketchGridVisible(pageId)
      };
    };

    const extractAndSanitizeSvg = (rawResponse) => {
      if (typeof rawResponse !== 'string') {
        throw new Error('La IA no devolvió texto SVG.');
      }

      const svgStart = rawResponse.indexOf('<svg');
      const svgEnd = rawResponse.lastIndexOf('</svg>');
      if (svgStart < 0 || svgEnd < svgStart) {
        throw new Error('La respuesta de la IA está incompleta y no contiene un SVG cerrado. El boceto original se ha conservado.');
      }

      const svgSource = rawResponse.slice(svgStart, svgEnd + 6);
      if (svgSource.length > 250000) {
        throw new Error('El SVG generado es demasiado grande para mostrarse de forma segura.');
      }

      const parsed = new DOMParser().parseFromString(svgSource, 'image/svg+xml');
      if (parsed.querySelector('parsererror') || parsed.documentElement.localName.toLowerCase() !== 'svg') {
        throw new Error('La IA devolvió un SVG mal formado. El boceto original se ha conservado.');
      }

      const allowedElements = new Set([
        'svg', 'g', 'defs', 'marker', 'path', 'rect', 'line', 'polyline',
        'polygon', 'circle', 'ellipse', 'text', 'tspan', 'title', 'desc'
      ]);

      [...parsed.querySelectorAll('*')].forEach((element) => {
        const tagName = element.localName.toLowerCase();
        if (!allowedElements.has(tagName)) {
          element.remove();
          return;
        }

        [...element.attributes].forEach((attribute) => {
          const name = attribute.name.toLowerCase();
          const value = attribute.value.trim().toLowerCase();
          const isUnsafeLink = (name === 'href' || name.endsWith(':href')) && !value.startsWith('#');
          const isUnsafeStyle = name === 'style' && (value.includes('javascript:') || /url\((?!['"]?#)/i.test(value));
          const isUnsafeUrl = value.includes('url(') && /url\((?!['"]?#)/i.test(value);
          if (name.startsWith('on') || isUnsafeLink || isUnsafeStyle || isUnsafeUrl) {
            element.removeAttribute(attribute.name);
          }
        });
      });

      const root = parsed.documentElement;
      root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      root.setAttribute('width', '100%');
      root.setAttribute('height', '100%');
      root.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      if (!root.hasAttribute('viewBox')) {
        root.setAttribute('viewBox', '0 0 1200 900');
      }

      const geometryCount = root.querySelectorAll('path, rect, line, polyline, polygon, circle, ellipse').length;
      if (!geometryCount) {
        throw new Error('La IA no ha generado geometría de plano utilizable. El boceto original se ha conservado.');
      }

      return new XMLSerializer().serializeToString(root);
    };

    const transcribeActivePage = async () => {
      if (!project.value || !selectedForm.value) return;

      let activePage = null;
      let canvasRef = null;

      if (activeTab.value === 'notes') {
        // Prioridad: página con foco dorado. Si ninguna tiene foco, usar la izquierda.
        const isLeft = !activeNotesPageId.value || activeNotesPageId.value === notesLeftPage.value?.id;
        activePage = isLeft ? notesLeftPage.value : notesRightPage.value;
        canvasRef = isLeft ? notesCanvasLeftRef.value : notesCanvasRightRef.value;
      } else if (activeTab.value === 'sketch') {
        const isLeft = !activeSketchPageId.value || activeSketchPageId.value === sketchLeftPage.value?.id;
        activePage = isLeft ? sketchLeftPage.value : sketchRightPage.value;
        canvasRef = isLeft ? sketchCanvasLeftRef.value : sketchCanvasRightRef.value;
      }

      if (!activePage || !canvasRef) {
        alert(`Por favor, selecciona una página de ${activeTab.value === 'notes' ? 'anotaciones' : 'bocetos'} haciendo clic sobre ella.`);
        return;
      }

      // Comprobar si el canvas tiene trazos antes de llamar a la IA
      if (canvasRef.isCanvasBlank()) {
        alert('El lienzo está en blanco. Dibuja algunas anotaciones antes de digitalizar.');
        return;
      }

      transcribing.value = true;
      transcribingStatus.value = activeTab.value === 'notes' ? 'Capturando anotaciones...' : 'Capturando boceto plano...';

      try {
        // ─── Captura directa del canvas (rápida, con soporte asíncrono) ───
        const imageBase64 = await canvasRef.captureCanvasOnly();
        if (!imageBase64) {
          throw new Error("No se pudo capturar el contenido del lienzo.");
        }

        // Texto o SVG previamente reconocido para esta página (contexto previo)
        const textoAnterior = activePage.textoReconocido || '';

        const askAICallable = httpsCallable(functions, 'askAI', { timeout: 300000 });
        let result;

        // ════════════════════════════════════════════════════════════
        // MODO ANOTACIONES
        // Modelo: Gemini 3.1 Flash Lite con respaldo multimodelo.
        // ════════════════════════════════════════════════════════════
        if (activeTab.value === 'notes') {
          transcribingStatus.value = 'Reconociendo texto manuscrito...';

          const hasContexto = textoAnterior.trim().length > 0;

          const systemPrompt = `Eres un asistente experto en reformas y carpintería. Tu tarea es transcribir, corregir y mantener actualizadas las anotaciones de una hoja de medición.

La imagen que recibes muestra:
- De fondo: el texto digitalizado que ya estaba reconocido anteriormente (en tipografía limpia de ordenador).
- En primer plano: los trazos del técnico dibujados a mano con lápiz negro/oscuro.

REGLAS DE ACTUALIZACIÓN (ESTRICTAS):
1. PRESERVAR EL TEXTO PREVIO: Debes conservar el texto digitalizado original EXACTAMENTE como está en la referencia textual proporcionada, respetando cada palabra, número, orden, líneas y formato. No modifiques ni resumas ninguna línea preexistente que no haya sido tachada.
2. TACHADURAS (DEFINICIÓN ESTRICTA): Para que algo se considere tachado/borrado, debe haber una línea manuscrita trazada FÍSICAMENTE POR ENCIMA de las letras del texto de fondo (es decir, tachándolo directamente encima de los caracteres). Los signos dibujados antes, después o alrededor del texto (como guiones "-", asteriscos "*", flechas o barras "/ ") NO son tachaduras; son anotaciones o guiones de lista que deben respetarse o añadirse.
3. NUEVAS ANOTACIONES (ENMIENDAS): Transcribe los nuevos textos manuscritos escritos por el técnico en zonas libres y añádelos como nuevas líneas al final del texto actual (o insértalos donde corresponda si indican un lugar específico), sin alterar el texto original.
4. CERO ALUCINACIÓN / NO INVENTAR (CRÍTICO): Solo transcribe palabras y números que sean 100% legibles en la imagen. Si ves un trazo manuscrito ambiguo, una línea, una flecha de cota, un garabato o una marca de dibujo que no forme palabras o cifras claras, IGNÓRALO por completo. No intentes adivinar, asumir o inventar textos que no existan en la imagen.
5. Devuelve ÚNICAMENTE el texto consolidado resultant. Sin preámbulos, explicaciones de cambios o comentarios.`;

          let prompt;
          if (hasContexto) {
            prompt = `TEXTO DIGITALIZADO ACTUAL (DEBE PRESERVARSE EXACTAMENTE IGUAL EXCEPTO SI TIENE TACHADURAS FÍSICAS EN LA IMAGEN):
---
${textoAnterior}
---

Compara este texto de referencia con la imagen.
Conserva el texto original palabra por palabra. Únicamente:
- Si alguna línea o palabra del texto digitalizado está tachada físicamente por una línea manuscrita que pasa por encima de las letras en la imagen, elimínala.
- Los guiones "-" o símbolos añadidos delante/detrás del texto NO son tachaduras. Mantén la anotación.
- Transcribe las nuevas anotaciones manuscritas que aparezcan en la imagen y agrégalas como nuevas líneas al final del texto.
- ATENCIÓN: No inventes nada. Si hay marcas, flechas o trazos manuscritos que no sean texto claro y legible, no escribas nada para ellos.
Genera la lista final consolidada siguiendo estas reglas estrictas.`;
          } else {
            prompt = `Transcribe todas las anotaciones manuscritas visibles en esta hoja de medición. No inventes nada si los trazos no son texto legible y ten en cuenta que los guiones "-" son caracteres normales y no tachaduras.`;
          }

          result = await askAICallable({
            prompt,
            systemPrompt,
            imageBase64,
            model: 'google/gemini-3.1-flash-lite',
            fallbackModels: ['google/gemini-3.5-flash', 'google/gemini-2.5-flash'],
            maxTokens: 2200,
            temperature: 0.1,
            reasoningEffort: 'minimal',
            optimizeForSpeed: true,
            requestTimeoutMs: 120000
          });

        } else if (activeTab.value === 'sketch') {
          transcribingStatus.value = 'Generando plano técnico SVG...';

          const hasSvgAnterior = textoAnterior.trim().startsWith('<svg');

          const systemPrompt = `Eres un delineante CAD especializado en convertir croquis de obra en planos de planta SVG claros y editables.

SALIDA OBLIGATORIA:
1. Devuelve solamente un SVG completo: empieza por <svg y termina por </svg>. No uses Markdown ni añadas explicaciones.
2. Usa exactamente una raíz con width="100%", height="100%", viewBox="0 0 1200 900", preserveAspectRatio="xMidYMid meet" y xmlns="http://www.w3.org/2000/svg".
3. Fondo transparente. No incluyas scripts, estilos CSS, foreignObject, imágenes, enlaces, recursos externos, animaciones ni elementos SVG anidados.
4. Usa solo: g, defs, marker, path, rect, line, polyline, polygon, circle, ellipse, text y tspan.

INTERPRETACIÓN DEL CROQUIS:
- La imagen recortada es la fuente principal. Conserva la topología: número de estancias, uniones, huecos y orientación relativa.
- Regulariza como horizontales/verticales solo los trazos cuya intención sea clara. Mantén diagonales reales.
- Muros: stroke="#1a1a1a", fill="none", stroke-width entre 10 y 14, linecap="square" y linejoin="miter".
- Puertas: hueco, hoja abierta y arco de giro fino. Ventanas: dos líneas finas paralelas dentro del muro.
- Organiza el resultado en grupos con id="walls", id="openings", id="dimensions" e id="labels".

COTAS Y TEXTO:
- Copia literalmente todas las cifras y unidades que sean legibles. No cambies comas por puntos ni inventes unidades.
- Nunca inventes una medida. Solo puedes calcular una cifra ausente si se deduce aritméticamente de otras cotas visibles sin ambigüedad; en ese caso antepón el símbolo ≈.
- Las líneas de cota deben ser finas, separadas de los muros y con marcas en los extremos.
- Texto horizontal para paredes horizontales; rotate(-90 x y) para verticales; paralelo al segmento para diagonales. Usa font-family="Arial, sans-serif" y font-size entre 18 y 24.

COMPOSICIÓN:
- Coloca toda la geometría, cotas y textos dentro de x=70..1130 e y=70..830, centrados y con margen uniforme.
- Nada debe quedar cortado ni fuera del viewBox.
- Si existe un SVG anterior, conserva sus elementos correctos y aplica solamente los cambios nuevos que sean inequívocos en la imagen.`;

          let prompt;
          if (hasSvgAnterior) {
            const previousSvgContext = textoAnterior.length <= 18000
              ? textoAnterior
              : `${textoAnterior.slice(0, 12000)}\n<!-- PARTE CENTRAL OMITIDA -->\n${textoAnterior.slice(-6000)}`;
            prompt = `El técnico ha añadido nuevos trazos a lápiz sobre el plano SVG anterior.
A continuación tienes el SVG anterior como referencia estructural:
---
${previousSvgContext}
---

La imagen contiene ese plano y los trazos nuevos encima. Conserva la geometría previa salvo donde los nuevos trazos indiquen claramente una modificación. Incorpora cotas legibles sin inventar valores y devuelve solo el SVG actualizado.`;
          } else {
            prompt = `Convierte el croquis de la imagen en un plano de planta SVG profesional. Respeta su forma y conexiones, regulariza los trazos claros, reproduce literalmente las cotas legibles y no inventes medidas. Devuelve solamente el SVG completo.`;
          }

          result = await askAICallable({
            prompt,
            systemPrompt,
            imageBase64,
            model: 'google/gemini-3.5-flash',
            fallbackModels: ['google/gemini-3-pro-preview', 'google/gemini-2.5-pro'],
            maxTokens: 9000,
            temperature: 0.1,
            reasoningEffort: 'medium',
            optimizeForSpeed: true,
            requestTimeoutMs: 180000
          });
        }

        if (!result) return;

        transcribingStatus.value = 'Procesando respuesta...';

        let newText = result.data?.text || '';
        console.log('[IA] Modelo usado:', result.data?.modelUsed);
        console.log('[IA] Motivo de finalización:', result.data?.finishReason);
        console.log('[IA] Respuesta (primeros 500 chars):', newText.substring(0, 500));

        if (activeTab.value === 'sketch') {
          if (['length', 'max_tokens'].includes(result.data?.finishReason)) {
            throw new Error('La respuesta SVG quedó truncada por el modelo. El boceto original se ha conservado; vuelve a intentarlo.');
          }
          newText = extractAndSanitizeSvg(newText);
        } else {
          newText = newText
            .replace(/^```(?:text|txt|markdown)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
          if (!newText) {
            throw new Error('La IA no devolvió ninguna anotación utilizable.');
          }
        }

        console.log('[IA] Texto final procesado (primeros 300 chars):', newText.substring(0, 300));

        // ─── Guardar en Firestore ───
        await projectStore.updatePageText(project.value.id, selectedForm.value.id, activePage.id, newText);

        // ─── Limpiar el canvas de dibujos manuscritos ───
        // El resultado ya está digitalizado y en la capa inferior de fondo.
        canvasRef.clearCanvas();

        transcribingStatus.value = '¡Listo!';
        setTimeout(() => { transcribingStatus.value = ''; }, 2000);

      } catch (err) {
        console.error('[IA] Error al transcribir:', err);
        transcribingStatus.value = '';
        const msg = err?.message || 'Error desconocido';
        alert(`Error al procesar con IA:\n${msg}\n\nNo se ha borrado el dibujo original.`);
      } finally {
        transcribing.value = false;
      }
    };


    // 7. Recibir el evento para guardar canvas de Anotación o Croquis (Silencioso, sin alert)
    const onCanvasSave = async ({ blob, canvasType, formId, pageId, callback }) => {
      try {
        await projectStore.saveCanvasDrawing(projectId, formId, canvasType, pageId, blob);
        if (callback) callback(null);
      } catch (err) {
        console.error('Error al guardar dibujo de canvas:', err);
        if (callback) callback(err);
      }
    };

    // Navegación y gestión de páginas
    const prevNotesPage = async () => {
      await forceSaveFormImmediately();
      const step = isNotesTwoPageLayout.value ? 2 : 1;
      currentNotesPageIndex.value = Math.max(0, currentNotesPageIndex.value - step);
    };

    const nextNotesPage = async () => {
      await forceSaveFormImmediately();
      const step = isNotesTwoPageLayout.value ? 2 : 1;
      currentNotesPageIndex.value = Math.min(notesTotalPages.value - 1, currentNotesPageIndex.value + step);
    };

    const addNotesPage = async () => {
      await forceSaveFormImmediately();
      await projectStore.addCanvasPage(projectId, selectedFormId.value, 'anotaciones');
      currentNotesPageIndex.value = notesTotalPages.value - 1;
    };

    const deleteNotesPage = async (pageId) => {
      if (confirm('¿Estás seguro de que deseas eliminar permanentemente esta página de anotaciones?')) {
        await forceSaveFormImmediately();
        await projectStore.removeCanvasPage(projectId, selectedFormId.value, 'anotaciones', pageId);
      }
    };

    const deleteActiveNotesPage = async () => {
      if (activeNotesPageId.value) {
        await deleteNotesPage(activeNotesPageId.value);
      }
    };

    let notesTextSaveTimeout = null;
    const saveNotesTextImmediately = async () => {
      if (notesTextSaveTimeout) {
        clearTimeout(notesTextSaveTimeout);
        notesTextSaveTimeout = null;
      }
      const page = notesLeftPage.value;
      if (!page || !selectedForm.value) return;
      await projectStore.updatePageText(projectId, selectedForm.value.id, page.id, page.textoReconocido || '');
    };

    const updateActiveNotesText = (value) => {
      const page = notesLeftPage.value;
      if (!page) return;
      page.textoReconocido = value || '';
      activeNotesPageId.value = page.id;
      if (notesTextSaveTimeout) clearTimeout(notesTextSaveTimeout);
      notesTextSaveTimeout = setTimeout(() => {
        saveNotesTextImmediately().catch((err) => {
          console.error('Error al guardar las anotaciones:', err);
        });
      }, 800);
    };

    const triggerNotesUndo = () => {
      if (activeNotesPageId.value === notesRightPage.value?.id && notesCanvasRightRef.value) {
        notesCanvasRightRef.value.undo();
      } else if (notesCanvasLeftRef.value) {
        notesCanvasLeftRef.value.undo();
      }
    };

    const triggerNotesClear = () => {
      if (activeNotesPageId.value === notesRightPage.value?.id && notesCanvasRightRef.value) {
        notesCanvasRightRef.value.confirmClear();
      } else if (notesCanvasLeftRef.value) {
        notesCanvasLeftRef.value.confirmClear();
      }
    };

    const prevSketchPage = async () => {
      await forceSaveFormImmediately();
      const step = isTwoPageLayout.value ? 2 : 1;
      currentSketchPageIndex.value = Math.max(0, currentSketchPageIndex.value - step);
    };

    const nextSketchPage = async () => {
      await forceSaveFormImmediately();
      const step = isTwoPageLayout.value ? 2 : 1;
      currentSketchPageIndex.value = Math.min(sketchTotalPages.value - 1, currentSketchPageIndex.value + step);
    };

    const addSketchPage = async () => {
      await forceSaveFormImmediately();
      await projectStore.addCanvasPage(projectId, selectedFormId.value, 'boceto');
      currentSketchPageIndex.value = sketchTotalPages.value - 1;
    };

    const deleteSketchPage = async (pageId) => {
      if (confirm('¿Estás seguro de que deseas eliminar permanentemente esta página de boceto?')) {
        await forceSaveFormImmediately();
        await projectStore.removeCanvasPage(projectId, selectedFormId.value, 'boceto', pageId);
      }
    };

    const deleteActiveSketchPage = async () => {
      if (activeSketchPageId.value) {
        await deleteSketchPage(activeSketchPageId.value);
      }
    };

    const triggerSketchUndo = () => {
      if (activeSketchPageId.value === sketchRightPage.value?.id && sketchCanvasRightRef.value) {
        sketchCanvasRightRef.value.undo();
      } else if (sketchCanvasLeftRef.value) {
        sketchCanvasLeftRef.value.undo();
      }
    };

    const triggerSketchClear = () => {
      if (activeSketchPageId.value === sketchRightPage.value?.id && sketchCanvasRightRef.value) {
        sketchCanvasRightRef.value.confirmClear();
      } else if (sketchCanvasLeftRef.value) {
        sketchCanvasLeftRef.value.confirmClear();
      }
    };

    // Forzar el guardado inmediato de datos pendientes
    const forceSaveFormImmediately = async () => {
      // A. Guardar datos comunes si están pendientes
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
        if (project.value) {
          const common = {
            cliente: project.value.cliente || '',
            direccion: project.value.direccion || '',
            email: project.value.email || '',
            telefonoMovil: project.value.telefonoMovil || '',
            telefonoFijo: project.value.telefonoFijo || '',
            vendedor: project.value.vendedor || '',
            tienda: project.value.tienda || '',
            fechaVisita: project.value.fechaVisita || '',
            fechaEjecucion: project.value.fechaEjecucion || '',
            zonaParquimetro: project.value.zonaParquimetro || 'No',
          };
          try {
            await projectStore.updateProjectCommon(projectId, common);
          } catch (e) {
            console.error('Error al guardar datos comunes inmediatamente:', e);
          }
        }
      }

      // B. Guardar datos del formulario técnico si están pendientes (dirty)
      if (formSaveTimeout || formSaveStatus.value === 'dirty') {
        if (formSaveTimeout) clearTimeout(formSaveTimeout);
        formSaveTimeout = null;
        if (selectedForm.value) {
          formSaveStatus.value = 'saving';
          try {
            const cleanDatos = JSON.parse(JSON.stringify(selectedForm.value.datos));
            await projectStore.updateFormDatos(
              projectId,
              selectedFormId.value,
              cleanDatos
            );
            lastSavedDatosJson = JSON.stringify(cleanDatos);
            formSaveStatus.value = 'saved';
          } catch (err) {
            console.error('Error al guardar datos técnicos inmediatamente:', err);
            formSaveStatus.value = 'dirty';
          }
        }
      }

      // C. Guardar el texto de anotaciones de la página activa si está pendiente.
      await saveNotesTextImmediately();

      // D. Guardar dibujos del canvas de bocetos si están pendientes (dirty)
      const promises = [];
      if (sketchCanvasLeftRef.value) {
        promises.push(sketchCanvasLeftRef.value.saveDrawing());
      }
      if (sketchCanvasRightRef.value) {
        promises.push(sketchCanvasRightRef.value.saveDrawing());
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    // Guardado al volver a nivel de ficha técnica
    const goBackToProject = async () => {
      await forceSaveFormImmediately();
      selectedFormId.value = null;
    };

    // Guardado al cambiar de ruta (volver a nivel de proyecto / app)
    onBeforeRouteLeave(async (to, from) => {
      await forceSaveFormImmediately();
      return true;
    });

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

    const toggleProjectStatus = async () => {
      if (!project.value) return;
      const newEstado = project.value.estado === 'borrador' ? 'completado' : 'borrador';
      try {
        await projectStore.updateProjectCommon(projectId, { estado: newEstado });
      } catch (err) {
        alert('Error al cambiar el estado del proyecto: ' + err.message);
      }
    };

    const openSendEmailDialog = () => {
      if (project.value) {
        targetEmail.value = project.value.email || '';
        emailDialog.value = true;
        emailStatusMessage.value = '';
        if (emailForm.value) {
          emailForm.value.resetValidation();
        }
      }
    };

    const submitSendEmail = async () => {
      if (emailForm.value && project.value) {
        const { valid } = await emailForm.value.validate();
        if (valid) {
          sendingEmail.value = true;
          emailStatusMessage.value = 'Generando PDF del resumen...';
          try {
            // A. Forzar el guardado de cualquier cambio pendiente local antes de generar el PDF
            await forceSaveFormImmediately();

            // B. Generar el blob del PDF
            const pdfBlob = await generateProjectPDF(project.value, {
              includeGeneralData: !props.embedded
            });
            
            // C. Subir a storage
            emailStatusMessage.value = 'Subiendo PDF a Firebase Storage...';
            const pdfUrl = await uploadPDFToStorage(projectId, project.value.cliente, pdfBlob);
            
            // D. Enviar correo
            emailStatusMessage.value = 'Enviando email de resumen...';
            await sendSummaryEmail(targetEmail.value, project.value, pdfUrl);
            
            emailStatusMessage.value = '¡Email enviado correctamente!';
            setTimeout(() => {
              emailDialog.value = false;
              sendingEmail.value = false;
              emailStatusMessage.value = '';
            }, 1500);
          } catch (err) {
            console.error('Error al enviar email:', err);
            emailStatusMessage.value = 'Error al enviar: ' + err.message;
            sendingEmail.value = false;
          }
        }
      }
    };

    const downloadProjectPDF = async () => {
      if (!project.value || downloadingPdf.value) return;

      downloadingPdf.value = true;
      try {
        await forceSaveFormImmediately();
        const pdfBlob = await generateProjectPDF(project.value, {
          includeGeneralData: !props.embedded
        });
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `medicion-${projectId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error al generar el PDF local:', err);
        alert('No se pudo generar el PDF: ' + err.message);
      } finally {
        downloadingPdf.value = false;
      }
    };

    return {
      project,
      embedded: props.embedded,
      selectedFormId,
      selectedForm,
      activeTab,
      commonFormValid,
      addFormDialog,
      addFormValid,
      newFormType,
      newReformaType,
      newFormName,
      showSidebar,
      formSaveStatus,
      selectForm,
      getFormIcon,
      getFormIconColor,
      getFormTypeName,
      saveCommonData,
      openAddFormDialog,
      submitAddForm,
      deleteForm,
      addPuertaLinea,
      deletePuertaLinea,
      addTarimaLinea,
      deleteTarimaLinea,
      onMedidaTarimaInput,
      normalizeMedidaTarima,
      totalM2Computed,
      totalMLComputed,
      tiendasOptions,
      vendedoresOptions,
      tarimaTiposOptions,
      tarimaAcabadosOptions,
      tarimaDesmontajeTiposOptions,
      saveTarimaOption,
      deleteTarimaOption,
      transcribing,
      transcribingStatus,
      transcribeActivePage,
      onCanvasSave,
      notesCanvasLeftRef,
      notesCanvasRightRef,
      sketchCanvasLeftRef,
      sketchCanvasRightRef,
      isTwoPageLayout,
      isNotesTwoPageLayout,
      currentNotesPageIndex,
      notesPages,
      notesTotalPages,
      notesLeftPageIndex,
      notesRightPageIndex,
      notesLeftPage,
      notesRightPage,
      currentSketchPageIndex,
      sketchPages,
      sketchTotalPages,
      sketchLeftPageIndex,
      sketchRightPageIndex,
      sketchLeftPage,
      sketchRightPage,
      prevNotesPage,
      nextNotesPage,
      addNotesPage,
      deleteNotesPage,
      deleteActiveNotesPage,
      updateActiveNotesText,
      triggerNotesUndo,
      triggerNotesClear,
      prevSketchPage,
      nextSketchPage,
      addSketchPage,
      deleteSketchPage,
      deleteActiveSketchPage,
      triggerSketchUndo,
      triggerSketchClear,
      activeTool,
      brushSize,
      brushColor,
      showGrid,
      activeSketchGridVisible,
      isSketchGridVisible,
      toggleActiveSketchGrid,
      colors,
      selectColor,
      activeNotesPageId,
      activeSketchPageId,
      goBackToProject,
      getStatusColor,
      getStatusText,
      toggleProjectStatus,
      emailDialog,
      emailForm,
      emailFormValid,
      targetEmail,
      sendingEmail,
      emailStatusMessage,
      downloadingPdf,
      openSendEmailDialog,
      submitSendEmail,
      downloadProjectPDF,
    };
  },
};
</script>

<style scoped>
/* Viewport bloqueado para evitar que el iPad desplace el scroll de la página principal */
.editor-viewport {
  height: calc(100vh - var(--v-layout-top, 64px) - 32px); /* Altura adaptada a iPad vertical/horizontal */
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.notes-textarea :deep(textarea) {
  min-height: 30em;
}

@media (min-width: 600px) {
  .editor-viewport {
    height: calc(100vh - var(--v-layout-top, 64px) - 48px); /* Altura adaptada a laptop */
  }
}

/* Permitir flujo vertical y scroll de la página principal en iPad/Tablets (ancho < 1280px) */
@media (max-width: 1279px) {
  .editor-viewport.dashboard-flow {
    height: auto !important;
    overflow-y: auto !important;
    padding-bottom: 24px;
  }
}

/* Forzar altura completa en pantallas de escritorio (>= 1280px) */
@media (min-width: 1280px) {
  .h-desktop-100 {
    height: 100% !important;
  }
}

.sidebar-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.border-r-golden {
  border-right: 1px solid rgba(226, 192, 96, 0.2) !important;
}

@media (max-width: 960px) {
  .border-r-golden {
    border-right: none !important;
    border-bottom: 1px solid rgba(226, 192, 96, 0.2) !important;
  }
}

.border-golden {
  border: 1px solid rgba(226, 192, 96, 0.2) !important;
}

.border-b-0 {
  border-bottom: none !important;
}

.opacity-15 {
  opacity: 0.15 !important;
}

.bg-surface-variant {
  background-color: rgba(30, 30, 27, 0.4) !important;
}

/* Estilos de tablas técnicas */
.table-technical {
  border-collapse: collapse;
  margin-top: 8px;
}

.table-technical th, .table-technical td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid rgba(226, 192, 96, 0.1);
}

.table-technical th {
  color: #e0c060;
  font-weight: bold;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.table-technical tr:hover {
  background-color: rgba(226, 192, 96, 0.03);
}

.table-tarima-measures {
  table-layout: fixed;
  min-width: 680px;
}

.table-tarima-measures th,
.table-tarima-measures td {
  vertical-align: middle;
}

.table-tarima-measures th:nth-child(-n + 4),
.table-tarima-measures td:nth-child(-n + 4) {
  text-align: center;
}

:deep(.table-tarima-measures td:nth-child(-n + 4) input) {
  text-align: center;
}

.tarima-calculated-value {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.78);
  font-family: inherit;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tarima-observations-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.tarima-observations-cell .table-input {
  min-width: 0;
  flex: 1 1 auto;
}

.tarima-delete-button {
  flex: 0 0 auto;
}

:deep(.tarima-new-row-input input:placeholder-shown) {
  text-align: center;
}

:deep(.tarima-new-row-input input::placeholder) {
  color: currentColor;
  opacity: 0.62;
  text-align: center;
}

.v-theme--light .tarima-calculated-value {
  color: rgba(40, 36, 25, 0.8);
}

@media (max-width: 960px) {
  .table-tarima-measures th {
    padding-inline: 5px !important;
    font-size: 0.76rem;
  }

  .table-tarima-measures td {
    padding-inline: 4px !important;
  }
}

.max-w-sm {
  max-width: 450px;
}

/* Animaciones premium para indicadores de autoguardado */
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

/* Forzar altura de v-window y contenedores para que funcione el scroll interno de los formularios */
:deep(.v-window) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.v-window__container) {
  height: 100% !important;
  width: 100% !important;
  flex-grow: 1;
}

:deep(.v-window-item) {
  height: 100% !important;
}

/* Espaciado de seguridad táctil para checkboxes en todo el editor */
:deep(.v-checkbox) {
  margin-right: 24px !important;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
}

/* Grupo de checkbox con etiqueta y borde (Medidas/Corte) alineado en altura con los inputs compactos (40px) */
.labeled-checkbox-group {
  height: 40px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

:deep(.labeled-checkbox-group .v-checkbox) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* Zebra striping for technical tables (alternate row backgrounds) */
.table-technical tbody tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.01) !important;
}
.table-technical tbody tr:nth-child(odd) {
  background-color: rgba(226, 192, 96, 0.03) !important;
}

.v-theme--light .table-technical tbody tr:nth-child(even) {
  background-color: #ffffff !important;
}
.v-theme--light .table-technical tbody tr:nth-child(odd) {
  background-color: #f7f5ef !important; /* Elegant off-white/cream */
}

/* Compact padding for inputs inside technical tables */
.table-technical td {
  padding: 4px 6px !important;
}

/* Text fields inside the dynamic table without borders and margin 0 */
:deep(.table-input) {
  margin: 0 !important;
}

:deep(.table-input .v-field) {
  --v-field-padding-start: 4px !important;
  --v-field-padding-end: 4px !important;
  --v-field-input-padding-top: 4px !important;
  --v-field-input-padding-bottom: 4px !important;
  font-size: 13px !important; /* ~120% of previous 11px font-size */
  margin: 0 !important;
  border: none !important;
}

:deep(.table-input .v-field__outline) {
  display: none !important; /* Completely hides the borders/outlines */
}

.color-dot-small {
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  max-width: 26px;
  max-height: 26px;
  padding: 0;
  aspect-ratio: 1 / 1;
  box-sizing: border-box;
  display: block;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  flex: 0 0 26px;
}

.colors-container {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: max-content;
  padding: 0;
  flex: 0 0 auto;
}

.drawing-toolbar {
  display: grid !important;
  grid-template-columns: minmax(480px, 1fr) auto auto;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0 !important;
  background: linear-gradient(135deg, rgba(35, 35, 31, 0.92), rgba(24, 24, 21, 0.78)) !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(10px);
  --active-color-border: #ffffff;
  --inactive-color-border: rgba(255, 255, 255, 0.3);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  min-height: 42px;
  padding: 1px 4px;
  border: 1px solid rgba(226, 192, 96, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.toolbar-group--drawing {
  justify-self: stretch;
}

.toolbar-group--actions,
.toolbar-group--pages {
  justify-self: end;
}

.toolbar-group__label {
  display: inline-flex;
  align-items: center;
  gap: 0;
  margin-right: 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.toolbar-separator {
  width: 1px;
  height: 24px;
  margin: 0;
  flex: 0 0 1px;
  background: rgba(226, 192, 96, 0.24);
}

.toolbar-group > .v-btn {
  min-width: 40px;
  height: 40px;
  border-radius: 8px;
}

.toolbar-group .v-btn-toggle .v-btn {
  min-width: 36px !important;
  height: 36px;
}

.toolbar-ai-action {
  min-width: 108px !important;
  padding-inline: 8px !important;
}

.toolbar-ai-action__text {
  margin-left: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.015em;
  white-space: nowrap;
}

.toolbar-status {
  max-width: 155px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-page-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 30px;
  padding: 0 6px;
  border: 1px solid rgba(226, 192, 96, 0.18);
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.16);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.v-theme--light .drawing-toolbar {
  background: linear-gradient(135deg, #fffefa, #f8f5ed) !important;
  border: 0 !important;
  box-shadow: 0 7px 20px rgba(78, 63, 26, 0.09) !important;
  --active-color-border: #4a3e1d;
  --inactive-color-border: rgba(74, 62, 29, 0.2);
}

.v-theme--light .toolbar-group {
  border-color: rgba(139, 109, 36, 0.16);
  background: rgba(255, 255, 255, 0.66);
}

.v-theme--light .toolbar-group__label {
  color: rgba(74, 62, 29, 0.68);
}

.v-theme--light .toolbar-separator {
  background: rgba(139, 109, 36, 0.22);
}

.v-theme--light .toolbar-page-indicator {
  border-color: rgba(139, 109, 36, 0.18);
  background: rgba(226, 192, 96, 0.1);
}

/* Inactive outlined buttons inside toolbar in light mode */
.v-theme--light .drawing-toolbar .border-golden {
  color: #4a3e1d !important;
  border-color: rgba(226, 192, 96, 0.4) !important;
}

/* Inactive text buttons (chevrons) in light mode */
.v-theme--light .drawing-toolbar .v-btn--variant-text {
  color: #4a3e1d !important;
}

/* Page text info in light mode */
.toolbar-text {
  color: #ffffff !important;
}
.v-theme--light .toolbar-text {
  color: #4a3e1d !important;
}
.color-dot-small:hover {
  transform: scale(1.14);
  box-shadow: 0 0 0 3px rgba(226, 192, 96, 0.16);
}

.notes-canvas-scroll {
  min-height: 0;
  overflow: hidden;
}

.notes-canvas-scroll--single {
  align-items: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}

.notes-page-shell {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.notes-page-shell--single {
  width: 100%;
  height: auto;
  min-height: 100%;
  flex: 0 0 100%;
}

@media (max-width: 1399px) {
  .drawing-toolbar {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .toolbar-group--drawing {
    grid-column: 1 / -1;
    width: 100%;
  }

  .toolbar-group--actions {
    justify-self: start;
  }

  .toolbar-status {
    flex-basis: 100%;
    max-width: none;
    padding: 2px 4px 0;
    text-align: center;
  }
}

@media (min-width: 701px) and (max-width: 900px) {
  .toolbar-group--actions .toolbar-group__label span,
  .toolbar-group--pages .toolbar-group__label span {
    display: none;
  }

  .toolbar-group--actions .toolbar-group__label,
  .toolbar-group--pages .toolbar-group__label {
    margin-right: 0;
  }

  .toolbar-ai-action {
    min-width: 112px !important;
    padding-inline: 10px !important;
  }
}

@media (max-width: 700px) {
  .drawing-toolbar {
    grid-template-columns: 1fr;
    gap: 5px;
    padding: 0;
  }

  .toolbar-group--drawing,
  .toolbar-group--actions,
  .toolbar-group--pages {
    grid-column: 1;
    width: 100%;
    justify-self: stretch;
  }

  .toolbar-group--drawing,
  .toolbar-group--actions {
    flex-wrap: wrap;
  }

  .toolbar-group--pages {
    justify-content: center;
  }

  .toolbar-group__label span {
    display: none;
  }

  .toolbar-ai-action {
    min-width: 108px !important;
  }
}

.brush-size-dot {
  background-color: currentColor;
  border-radius: 50%;
  display: inline-block;
  transition: background-color 0.15s ease;
}
</style>
