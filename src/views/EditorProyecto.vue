<template>
  <div class="editor-viewport" :class="{ 'dashboard-flow': !selectedForm }" v-if="project">
    <!-- VISTA PRINCIPAL: Panel de Control del Proyecto (Datos y Fichas en 50/50 split) -->
    <v-row class="w-100 h-desktop-100 ma-0 align-stretch" v-if="!selectedForm">
      <!-- Ficha de Datos Comunes del Cliente (50% de ancho en Desktop/Tablet) -->
      <v-col cols="12" lg="6" class="pa-2 h-desktop-100 d-flex flex-column">
        <v-card color="surface" class="elevation-2 border-golden h-desktop-100 d-flex flex-column" rounded="lg">
          <v-card-title class="pa-4 bg-secondary border-b d-flex justify-space-between align-center">
            <span class="text-subtitle-1 font-weight-bold text-white d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-account-box</v-icon>
              Datos Comunes del Proyecto
            </span>
            <v-chip
              size="small"
              :color="getStatusColor(project.estado)"
              class="font-weight-bold cursor-pointer"
              @click="toggleProjectStatus"
              title="Haz clic para cambiar de estado"
            >
              {{ getStatusText(project.estado) }}
            </v-chip>
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
                  <v-text-field
                    v-model="project.vendedor"
                    label="Vendedor"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    class="mb-3"
                    @input="saveCommonData"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" class="pa-0 pl-1">
                  <v-text-field
                    v-model="project.tienda"
                    label="Tienda"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    class="mb-3"
                    @input="saveCommonData"
                  ></v-text-field>
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
      <v-col cols="12" lg="6" class="pa-2 h-desktop-100 d-flex flex-column">
        <v-card color="surface" class="elevation-2 border-golden h-desktop-100 d-flex flex-column overflow-hidden" rounded="lg">
          <v-card-title class="pa-4 bg-secondary border-b d-flex justify-space-between align-center">
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
            <v-tab value="form" class="font-weight-bold text-white">
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
          <!-- Botón Enviar Ficha por Email -->
          <v-btn
            prepend-icon="mdi-email-send"
            color="primary"
            variant="flat"
            size="small"
            class="font-weight-bold mr-2 text-uppercase"
            @click="openSendEmailDialog"
          >
            Enviar por Email
          </v-btn>
          
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
        <v-window-item value="form" class="fill-height overflow-y-auto pr-1">
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
              <!-- 1. ILUMINACIÓN -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">ILUMINACIÓN</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-textarea v-model="selectedForm.datos.iluminacion" label="Detalle de Iluminación" variant="outlined" density="compact" rows="2" hide-details></v-textarea>
                </v-expansion-panel-text>
              </v-expansion-panel>

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
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.campana.filtroCarbon" label="Filtro carbón" density="compact" hide-details></v-checkbox></v-col>
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
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.lavadora.ancho45" label="Ancho 45" density="compact" hide-details></v-checkbox></v-col>
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
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.horno.vapor" label="Vapor" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.horno.pirolitico" label="Piro" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.horno.multifuncion" label="Multi" density="compact" hide-details></v-checkbox></v-col>
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

              <!-- 8. PLACA -->
              <v-expansion-panel bg-color="surface">
                <v-expansion-panel-title class="font-weight-bold">PLACA DE COCCIÓN</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.presupuestar" label="Presupuestar" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.placa.propiedadCliente" label="Propiedad cliente" density="compact" hide-details></v-checkbox></v-col>
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
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.fregadero.opticaEnrasada" label="Óptica enrasada" density="compact" hide-details></v-checkbox></v-col>
                    <v-col cols="12" md="4" class="py-1"><v-checkbox v-model="selectedForm.datos.fregadero.sobreEncimera" label="Sobre encimera" density="compact" hide-details></v-checkbox></v-col>
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

                <!-- 3. Horno y microondas en columna -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Quieren el horno y microondas en columna?</span>
                  <v-checkbox v-model="selectedForm.datos.preguntas.hornoMicroColumna" density="compact" hide-details></v-checkbox>
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

                <!-- 6. Muebles al techo -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Quiere los muebles al techo?</span>
                  <v-checkbox v-model="selectedForm.datos.preguntas.mueblesTecho" density="compact" hide-details></v-checkbox>
                </v-col>

                <!-- 7. Cierre a techo -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Quiere un cierre a techo?</span>
                  <v-checkbox v-model="selectedForm.datos.preguntas.cierreTecho" density="compact" hide-details></v-checkbox>
                </v-col>

                <!-- 8. Altura de muebles superiores (con especificar inline) -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3 flex-wrap">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Qué altura de muebles superiores desea?</span>
                  <v-select
                    v-model="selectedForm.datos.preguntas.alturaMueblesSuperiores"
                    :items="['70', '80', '90', '96', 'Otros']"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 200px; flex-grow: 1;"
                  ></v-select>
                  <v-text-field 
                    v-if="selectedForm.datos.preguntas.alturaMueblesSuperiores === 'Otros'"
                    v-model="selectedForm.datos.preguntas.alturaMueblesOtros" 
                    label="Especificar otra altura" 
                    variant="outlined" 
                    density="compact" 
                    hide-details 
                    style="max-width: 250px;"
                  ></v-text-field>
                </v-col>

                <!-- 9. Montaje y transporte -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 380px; flex-shrink: 0;">¿Montaje y transporte a domicilio?</span>
                  <v-checkbox v-model="selectedForm.datos.preguntas.montajeTransporte" density="compact" hide-details></v-checkbox>
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
              <v-row class="mb-3 align-center">
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
              <v-row class="mb-3 align-center">
                <v-col cols="12" sm="3" class="py-1">
                  <span class="text-subtitle-2 font-weight-bold text-primary">Mod. TARIMA:</span>
                </v-col>
                <v-col cols="6" sm="4" class="py-1">
                  <v-text-field v-model="selectedForm.datos.modeloTarima.grosor" label="Grosor" variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
                <v-col cols="6" sm="5" class="py-1">
                  <v-text-field v-model="selectedForm.datos.modeloTarima.aislante" label="Aislante" variant="outlined" density="compact" hide-details></v-text-field>
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

              <!-- 4. BISAGRAS (Floor Prep / Services - named BISAGRAS per PDF) -->
              <h3 class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">BISAGRAS</h3>
              
              <v-row class="mb-3">
                <!-- Desmontaje suelo existente -->
                <v-col cols="12" class="py-1 d-flex align-center gap-3">
                  <span class="text-body-2 text-grey-lighten-1" style="min-width: 180px; flex-shrink: 0;">Desmontaje suelo exist.:</span>
                  <v-checkbox v-model="selectedForm.datos.bisagras.desmontajeSuelo" label="Activar" density="compact" hide-details class="flex-shrink-0"></v-checkbox>
                  <v-text-field v-model="selectedForm.datos.bisagras.desmontajeSueloUds" label="Uds." variant="outlined" density="compact" hide-details style="max-width: 120px;" :disabled="!selectedForm.datos.bisagras.desmontajeSuelo"></v-text-field>
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
                  <v-text-field v-model="selectedForm.datos.bisagras.observaciones" label="Observaciones sección" variant="outlined" density="compact" hide-details style="max-width: 120px;"></v-text-field>
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

            <!-- Tabla de Suelos (Cálculo automático de M2) -->
            <div class="d-flex align-center justify-space-between mb-3 mt-4">
              <div>
                <h3 class="text-subtitle-2 font-weight-bold text-primary text-uppercase d-inline">Medidas de Suelos</h3>
                <v-chip class="ml-2 font-weight-bold" color="primary" size="small">Total: {{ totalM2Computed }} M²</v-chip>
              </div>
              <v-btn size="small" color="primary" prepend-icon="mdi-plus" variant="outlined" @click="addTarimaLinea">
                Añadir Línea
              </v-btn>
            </div>

            <!-- Listado de Suelos -->
            <v-card color="secondary" variant="flat" rounded="lg" class="pa-2 mb-4 overflow-x-auto">
              <table class="w-100 table-technical">
                <thead>
                  <tr>
                    <th style="width: 8.33%;">Zona</th>
                    <th style="width: 16.67%;">Medidas suelos</th>
                    <th style="width: 8.33%;">m²</th>
                    <th style="width: 58.33%;">Observaciones</th>
                    <th style="width: 8.33%;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(linea, idx) in selectedForm.datos.lineasTarima" :key="linea.id || idx">
                    <td><v-text-field v-model="linea.zona" class="table-input" variant="plain" density="compact" hide-details></v-text-field></td>
                    <td>
                      <v-text-field 
                        v-model="linea.medida" 
                        placeholder="4.20 * 3.50" 
                        class="table-input"
                        variant="plain" 
                        density="compact" 
                        hide-details
                        @input="onMedidaTarimaInput(linea)"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field 
                        v-model="linea.m2" 
                        class="table-input"
                        variant="plain" 
                        density="compact" 
                        hide-details
                      ></v-text-field>
                    </td>
                    <td><v-text-field v-model="linea.observaciones" class="table-input" variant="plain" density="compact" hide-details></v-text-field></td>
                    <td class="text-right">
                      <v-btn
                        v-if="idx < selectedForm.datos.lineasTarima.length - 1"
                        icon="mdi-delete"
                        size="x-small"
                        color="error"
                        variant="text"
                        @click="deleteTarimaLinea(idx)"
                      ></v-btn>
                    </td>
                  </tr>
                </tbody>
              </table>
            </v-card>

            <!-- Observaciones -->
            <v-textarea v-model="selectedForm.datos.observacionesGenerales" label="Observaciones Generales de Suelos / Tarimas" variant="outlined" rows="3" color="primary"></v-textarea>
          </div>
        </v-window-item>

        <!-- 2. PESTAÑA ANOTACIONES TÁCTILES (Lienzo al 100% de alto y ancho) -->
        <v-window-item value="notes" :eager="true" class="fill-height pa-1">
          <sketch-canvas
            ref="notesCanvasRef"
            canvas-type="anotaciones"
            :project-id="project.id"
            :form-id="selectedForm.id"
            :image-url="selectedForm.dibujos.anotacionesUrl"
            :is-active="activeTab === 'notes'"
            @save="onCanvasSave"
          />
        </v-window-item>

        <!-- 3. PESTAÑA CROQUIS / BOCETO PLANO (Lienzo al 100% de alto y ancho con rejilla) -->
        <v-window-item value="sketch" :eager="true" class="fill-height pa-1">
          <sketch-canvas
            ref="sketchCanvasRef"
            canvas-type="boceto"
            :project-id="project.id"
            :form-id="selectedForm.id"
            :image-url="selectedForm.dibujos.bocetoUrl"
            :is-active="activeTab === 'sketch'"
            @save="onCanvasSave"
          />
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
                { title: 'Cocinas', value: 'cocina' },
                { title: 'Puertas de paso', value: 'puertas' },
                { title: 'Tarimas y Suelos', value: 'tarimas' }
              ]"
              variant="outlined"
              :rules="[v => !!v || 'Debes seleccionar un tipo']"
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
            <v-icon color="primary" class="mr-2">mdi-email-send</v-icon>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import { useProjectStore } from '../store/projectStore';
import SketchCanvas from '../components/SketchCanvas.vue';
import FileUploader from '../components/FileUploader.vue';
import { generateProjectPDF, uploadPDFToStorage, sendSummaryEmail } from '../services/emailService';

export default {
  name: 'EditorProyecto',
  components: {
    SketchCanvas,
    FileUploader,
  },
  setup() {
    const route = useRoute();
    const projectStore = useProjectStore();

    // ID del proyecto cargado
    const projectId = route.params.id;

    // Estados de la vista
    const selectedFormId = ref(null);
    const activeTab = ref('form');

    // Referencias a los canvas
    const notesCanvasRef = ref(null);
    const sketchCanvasRef = ref(null);
    
    // Control de Formularios y Modales
    const commonFormValid = ref(true);
    const addFormDialog = ref(false);
    const addFormValid = ref(false);
    const newFormType = ref('cocina');
    const newFormName = ref('');

    // Diálogo de Email
    const emailDialog = ref(false);
    const emailForm = ref(null);
    const emailFormValid = ref(false);
    const targetEmail = ref('');
    const sendingEmail = ref(false);
    const emailStatusMessage = ref('');

    // Estado del panel lateral colapsable (se inicia según el ancho del viewport)
    const showSidebar = ref(true);

    // Cargar proyecto completo
    onMounted(async () => {
      await projectStore.fetchProjectById(projectId);
      // Mantener selectedFormId en null al inicio para que se muestre el panel de control general (datos del cliente + estancias)
      selectedFormId.value = null;
    });

    // Proyecto reactivo del store
    const project = computed(() => projectStore.currentProject);

    // Estancia seleccionada
    const selectedForm = computed(() => {
      if (!project.value || !selectedFormId.value) return null;
      return project.value.formularios.find(f => f.id === selectedFormId.value);
    });

    const selectForm = (formId) => {
      selectedFormId.value = formId;
      activeTab.value = 'form'; // Volver a la pestaña de formulario al cambiar
    };

    // Nombres e iconos según el tipo de ficha
    const getFormIcon = (type) => {
      switch (type) {
        case 'cocina': return 'mdi-chef-hat';
        case 'puertas': return 'mdi-door-closed';
        case 'tarimas': return 'mdi-layers-triple';
        default: return 'mdi-file-document';
      }
    };

    const getFormIconColor = (type) => {
      switch (type) {
        case 'cocina': return 'orange';
        case 'puertas': return 'primary';
        case 'tarimas': return 'success';
        default: return 'white';
      }
    };

    const getFormTypeName = (type) => {
      switch (type) {
        case 'cocina': return 'Cocina';
        case 'puertas': return 'Puertas';
        case 'tarimas': return 'Tarimas';
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
      newFormName.value = '';
      addFormDialog.value = true;
    };

    const submitAddForm = async () => {
      if (newFormName.value && newFormType.value) {
        try {
          const newId = await projectStore.addFormToProject(
            projectId,
            newFormType.value,
            newFormName.value
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
        lineas.push({
          id: 'l-t-' + (lineas.length + 1) + '-' + Math.random().toString(36).substring(7),
          zona: '',
          medida: '',
          m2: '',
          observaciones: ''
        });
      }
    };

    const deleteTarimaLinea = (idx) => {
      if (selectedForm.value && selectedForm.value.tipo === 'tarimas') {
        selectedForm.value.datos.lineasTarima.splice(idx, 1);
      }
    };

    // Función segura para analizar y calcular la expresión matemática escrita de medidas
    const onMedidaTarimaInput = (linea) => {
      if (!linea.medida) {
        linea.m2 = '';
        return;
      }
      try {
        let expr = linea.medida.toLowerCase().replace(/x/g, '*');
        expr = expr.replace(/[^0-9+\-*\/.\(\) ]/g, ''); // Permitir números, operadores y paréntesis básicos
        
        const result = new Function(`return ${expr}`)();
        if (typeof result === 'number' && !isNaN(result)) {
          linea.m2 = Number(result.toFixed(2));
        } else {
          linea.m2 = '';
        }
      } catch (err) {
        linea.m2 = ''; // Expresión matemática incompleta
      }
    };
    // Calcular la sumatoria total de M2 de las líneas de Tarima de la estancia seleccionada
    const totalM2Computed = computed(() => {
      if (!selectedForm.value || selectedForm.value.tipo !== 'tarimas') return 0;
      const total = selectedForm.value.datos.lineasTarima?.reduce((acc, curr) => acc + (Number(curr.m2) || 0), 0);
      return Number(total.toFixed(2));
    });

    // 7. Recibir el evento para guardar canvas de Anotación o Croquis (Silencioso, sin alert)
    const onCanvasSave = async ({ blob, canvasType, formId, callback }) => {
      try {
        await projectStore.saveCanvasDrawing(projectId, formId, canvasType, blob);
        if (callback) callback(null);
      } catch (err) {
        console.error('Error al guardar dibujo de canvas:', err);
        if (callback) callback(err);
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

      // C. Guardar dibujos del canvas si están pendientes (dirty)
      const promises = [];
      if (notesCanvasRef.value) {
        promises.push(notesCanvasRef.value.saveDrawing());
      }
      if (sketchCanvasRef.value) {
        promises.push(sketchCanvasRef.value.saveDrawing());
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
            const pdfBlob = await generateProjectPDF(project.value);
            
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

    return {
      project,
      selectedFormId,
      selectedForm,
      activeTab,
      commonFormValid,
      addFormDialog,
      addFormValid,
      newFormType,
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
      totalM2Computed,
      onCanvasSave,
      notesCanvasRef,
      sketchCanvasRef,
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
      openSendEmailDialog,
      submitSendEmail,
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
</style>
