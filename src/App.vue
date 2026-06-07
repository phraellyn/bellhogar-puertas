<template>
  <v-app :theme="currentTheme">
    <!-- Barra de Navegación Premium -->
    <v-app-bar color="secondary" elevation="3" class="px-3 border-b-golden">
      <!-- Logotipo Corporativo de BellHogar (Dinámico según el tema) -->
      <v-img
        :src="currentTheme === 'dark' ? '/src/assets/BellHogar Oscuro.png' : '/src/assets/BellHogar Claro.png'"
        max-height="40"
        max-width="160"
        class="mr-3"
        contain
        alt="Logo BellHogar"
      ></v-img>
      <v-spacer></v-spacer>

      <!-- Botón de Navegación al Dashboard -->
      <v-btn
        v-if="$route.path !== '/'"
        prepend-icon="mdi-arrow-left"
        color="primary"
        variant="text"
        class="mr-2 font-weight-bold"
        @click="$router.push('/')"
      >
        Volver
      </v-btn>

      <!-- Selector de Tema (Sol / Luna) -->
      <v-btn
        :icon="currentTheme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        color="primary"
        @click="toggleTheme"
        title="Cambiar tema de la aplicación"
      ></v-btn>
    </v-app-bar>

    <!-- Área de Contenido Principal -->
    <v-main class="bg-background">
      <v-container fluid class="pa-4 pa-sm-6 fill-height align-start">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'App',
  setup() {
    const currentTheme = ref('dark');

    const toggleTheme = () => {
      currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark';
      localStorage.setItem('bellhogar-theme', currentTheme.value);
    };

    onMounted(() => {
      const savedTheme = localStorage.getItem('bellhogar-theme');
      if (savedTheme) {
        currentTheme.value = savedTheme;
      }
    });

    return {
      currentTheme,
      toggleTheme,
    };
  },
};
</script>

<style>
/* Estilos globales y micro-animaciones premium */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;900&display=swap');

html, body {
  font-family: 'Inter', sans-serif !important;
}

.font-weight-bold {
  font-weight: 700 !important;
}

.tracking-wide {
  letter-spacing: 1px !important;
}

/* Borde dorado fino corporativo para separar la cabecera en el modo oscuro */
.border-b-golden {
  border-bottom: 2px solid #e0c060 !important;
}

/* Transiciones fluidas en la navegación */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Clases útiles globales */
.glass-panel {
  background: rgba(30, 30, 27, 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 192, 96, 0.15) !important;
}

.text-primary {
  color: #e0c060 !important;
}

/* Ajustes de scrollbar global */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #121210;
}

::-webkit-scrollbar-thumb {
  background: #424240;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #e0c060;
}

/* ==========================================================
   Light Mode Theme Custom Overrides (BellHogar Style System)
   ========================================================== */
.v-theme--light.v-application {
  background-color: #ffffff !important;
  color: #101008 !important;
}

/* Force light-mode text contrast on hardcoded text-white elements */
.v-theme--light .text-white {
  color: #101008 !important;
}

/* Force dark text on table calculations and labels */
.v-theme--light .v-card-text,
.v-theme--light .v-card-title,
.v-theme--light .v-list-item-title,
.v-theme--light .v-tab {
  color: #101008 !important;
}

/* Make gray helper texts dark enough to be readable on white/light backgrounds */
.v-theme--light .text-grey-lighten-1,
.v-theme--light .text-grey-lighten-2,
.v-theme--light .text-caption.text-grey-lighten-1,
.v-theme--light .text-caption.text-grey-lighten-2 {
  color: #55524b !important;
}

.v-theme--light .text-grey {
  color: #55524b !important;
}

.v-theme--light .text-grey-darken-2,
.v-theme--light .text-grey-darken-3 {
  color: #101008 !important;
}

/* In light mode, primary colored text labels/titles display in charcoal/black for readability */
.v-theme--light .text-primary:not(.v-icon) {
  color: #101008 !important;
}

/* Icons in general should have a somewhat darker tone in light mode */
.v-theme--light .v-icon {
  color: #55524b !important; /* General icons default to dark warm grey */
}

/* Primary icons (gold brand color) should use a darker, richer gold for readability */
.v-theme--light .v-icon.text-primary,
.v-theme--light .v-icon[color="primary"],
.v-theme--light .text-primary .v-icon {
  color: #b08b23 !important; /* Richer dark gold brand color */
}

/* Success, error, warning, orange and other semantic icons should remain readable and dark enough */
.v-theme--light .v-icon.text-success {
  color: #388e3c !important; /* Elegant dark warm green */
}
.v-theme--light .v-icon.text-orange {
  color: #c77c1e !important; /* Elegant warm orange/copper */
}
.v-theme--light .v-icon.text-error {
  color: #c62828 !important;
}
.v-theme--light .v-icon.text-info {
  color: #1565c0 !important;
}
.v-theme--light .v-icon.text-warning {
  color: #ef6c00 !important;
}

/* Ensure clean gold borders for cards, dividers, and lists */
.v-theme--light .border-golden,
.v-theme--light .border-r-golden,
.v-theme--light .border-b-golden,
.v-theme--light .border-b,
.v-theme--light .v-divider {
  border-color: #e0c060 !important;
  opacity: 1 !important;
}

.v-theme--light .border-golden {
  border: 1.5px solid #e0c060 !important;
}

.v-theme--light .border-b {
  border-bottom: 1.5px solid #e0c060 !important;
}

.v-theme--light .border-b-golden {
  border-bottom: 2px solid #e0c060 !important;
}

.v-theme--light .border-r-golden {
  border-right: 1.5px solid #e0c060 !important;
}

@media (max-width: 960px) {
  .v-theme--light .border-r-golden {
    border-bottom: 1.5px solid #e0c060 !important;
    border-right: none !important;
  }
}

/* Table separation lines and headers */
.v-theme--light .table-technical th,
.v-theme--light .table-technical td {
  border-bottom: 1.5px solid #e0c060 !important;
  color: #101008 !important;
}

.v-theme--light .table-technical th {
  color: #a38220 !important;
  font-weight: 700 !important;
}

.v-theme--light .table-technical tr:hover {
  background-color: rgba(224, 192, 96, 0.08) !important;
}

/* App Bar white background in Light Mode */
.v-theme--light .v-app-bar {
  background-color: #ffffff !important;
  color: #101008 !important;
  border-bottom: 2px solid #e0c060 !important;
}

/* Card titles, headers, and tabs toolbars get light off-white background with gold border */
.v-theme--light .bg-secondary {
  background-color: #fdfcfb !important;
  color: #101008 !important;
  border-bottom: 1.5px solid #e0c060 !important;
}

.v-theme--light .v-card.bg-secondary {
  background-color: #fdfcfb !important;
  border: 1.5px solid #e0c060 !important;
  color: #101008 !important;
}

/* Actions block, canvas toolbars, and file upload lists */
.v-theme--light .bg-secondary-darken-1 {
  background-color: #fdfcfb !important;
  color: #101008 !important;
}

.v-theme--light .bg-surface-variant,
.v-theme--light .v-card .bg-surface-variant,
.v-theme--light .v-dialog .bg-surface-variant,
.v-theme--light .v-card-actions.bg-surface-variant,
.v-theme--light .v-card-text.bg-surface-variant {
  background-color: #fbf8e8 !important;
  border-top: 1.5px solid #e0c060 !important;
  color: #101008 !important;
}

.v-theme--light .bg-surface-variant .text-grey,
.v-theme--light .v-card .bg-surface-variant .text-grey,
.v-theme--light .v-card-actions.bg-surface-variant .text-grey {
  color: #101008 !important;
}

/* Filters card (glass-panel) */
.v-theme--light .glass-panel {
  background: #ffffff !important;
  border: 1.5px solid #e0c060 !important;
}

/* Estancias lists border */
.v-theme--light .v-list-item[style*="border"] {
  border: 1.5px solid #e0c060 !important;
}

.v-theme--light .project-form-card {
  background-color: #fdfcf7 !important;
  border: 1.5px solid #e0c060 !important;
  color: #101008 !important;
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease !important;
  position: relative;
}

/* Complete removal of Vuetify's default grey overlay/underlay tint in tonal variant */
.v-theme--light .project-form-card .v-list-item__overlay,
.v-theme--light .project-form-card .v-list-item__underlay {
  background-color: transparent !important;
  opacity: 0 !important;
  display: none !important;
}

.v-theme--light .project-form-card:hover {
  background-color: #fbf8e8 !important;
  box-shadow: 0 4px 12px rgba(224, 192, 96, 0.2) !important;
  transform: translateY(-2px);
}

.v-theme--light .project-form-card .v-list-item-title,
.v-theme--light .project-form-card .v-list-item__title {
  color: #101008 !important;
  font-weight: 700 !important;
}

.v-theme--light .project-form-card .v-list-item-subtitle,
.v-theme--light .project-form-card .v-list-item__subtitle {
  color: #5d594f !important;
}

/* Dashed border for file uploader drag area */
.v-theme--light .border-dashed {
  border: 2px dashed #e0c060 !important;
}

/* Labeled checkbox groups (Medidas / Corte) border color */
.v-theme--light .labeled-checkbox-group {
  border-color: #e0c060 !important;
}

/* Disabled input fields text opacity */
.v-theme--light .v-field--disabled {
  opacity: 0.65 !important;
}

/* White colored buttons override to remain charcoal colored */
.v-theme--light .v-btn.text-white,
.v-theme--light .v-btn[color="white"] {
  color: #101008 !important;
}

/* Scrollbar adjustment in Light Mode */
.v-theme--light ::-webkit-scrollbar-track {
  background: #ffffff;
}

.v-theme--light ::-webkit-scrollbar-thumb {
  background: #e0dcd3;
}

.v-theme--light ::-webkit-scrollbar-thumb:hover {
  background: #e0c060;
}
</style>
