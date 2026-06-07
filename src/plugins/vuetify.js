import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css';

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'dark', // Predeterminado para tabletas en campo (reduce fatiga visual)
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#e0c060',      // Oro Cálido Corporativo BellHogar (maderas nobles)
          secondary: '#101008',    // Carbón Profundo Corporativo
          accent: '#e0d088',       // Oro Claro
          background: '#121210',   // Negro Cálido
          surface: '#1e1e1b',      // Gris Cálido de Tarjetas
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
        },
      },
      light: {
        dark: false,
        colors: {
          primary: '#e0c060',      // Oro Corporativo BellHogar
          secondary: '#f5f2eb',    // Gris Cálido Suave
          accent: '#101008',       // Carbón como contraste
          background: '#ffffff',   // Fondo Blanco Puro
          surface: '#ffffff',      // Tarjetas Blanco Puro
          error: '#D32F2F',
          info: '#1976D2',
          success: '#388E3C',
          warning: '#F57C00',
        }
      }
    },
  },
});
