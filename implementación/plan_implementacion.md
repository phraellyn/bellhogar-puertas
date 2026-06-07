# Plan de Implementación: App de Reformas (Puertas, Cocinas y Tarimas)

Aplicación web móvil/tablet-first construida con **Vue 3 (Vite + JavaScript)**, **Vuetify 3** (Material Design) y **Firebase (Firestore & Storage)** para optimizar la toma de datos en visitas de reformas residenciales. La aplicación permite recopilar datos de clientes de forma centralizada y añadir múltiples fichas de mediciones técnicas (Cocinas, Puertas, Tarimas) con formularios interactivos de Vuetify, lienzos de dibujo libre para anotaciones y planos, y subida directa de archivos adjuntos clasificados por proyecto en Firebase Storage.

---

## Guía de Configuración del Proyecto

**La carpeta `implementación` se reservará exclusivamente para almacenar guías y documentación de este desarrollo**. Todo el código fuente, la configuración y la estructura de la aplicación web se inicializarán y alojarán en la **carpeta raíz del repositorio (`d:\DESARROLLO\firebase\puertas`)**.

### 1. Inicialización de Vue 3 + Vite (JavaScript)
```bash
# Navegar a la carpeta raíz del proyecto (donde se ubican recursos/ e implementación/)
cd d:\DESARROLLO\firebase\puertas

# Crear proyecto Vue 3 con Vite y JavaScript (sin TypeScript) en la misma raíz
npx -y create-vite@latest . --template vue

# Instalar dependencias esenciales
npm install
npm install firebase pinia vue-router vuetify @mdi/font
```

### 2. Estructura de Carpetas Propuesta en la Raíz
```
puertas/ (Raíz)
├── recursos/              # PDFs originales y textos extraídos (existente)
├── implementación/        # Documentación y guías de desarrollo (existente)
│   └── plan_implementacion.md # Este archivo de planificación
├── public/                # Vite: Recursos públicos estáticos
├── src/                   # Vite: Código fuente de la app
│   ├── assets/            # Estilos globales y variables de diseño CSS
│   ├── plugins/           # Configuración de Vuetify 3
│   │   └── vuetify.js     # Inicializador y tema personalizado de Vuetify
│   ├── components/        # Componentes reutilizables (Canvas, Uploader, etc.)
│   ├── views/             # Páginas principales (Dashboard, EditorProyecto)
│   ├── store/             # Gestión de estado con Pinia (projectStore.js)
│   ├── services/          # Conectores Firebase (firebase.js, firestore.js, storage.js)
│   ├── App.vue
│   └── main.js            # Punto de entrada de la aplicación
├── firebase.json          # Archivos de configuración de Firebase CLI
├── firestore.rules
├── storage.rules
├── package.json
├── vite.config.js
└── index.html
```

### 3. Configuración de Firebase (`src/services/firebase.js`)
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 4. Configuración de Vuetify 3 y Estética BellHogar (`src/plugins/vuetify.js`)
Para recrear una estética sumamente premium e integrada con la identidad corporativa de **BellHogar** mostrada en los PDFs y en su marca original, aplicaremos una paleta basada en **Oro Cálido (representando maderas nobles y alta decoración) y Carbón Oscuro (elegancia y contraste premium)**:

- **Oro Primario (`#e0c060` / `#c8a010`)**: El color del logotipo y de los acabados de madera, usado para botones principales, pestañas activas y elementos destacados.
- **Carbón Profundo (`#101008` / `#1e1e1b`)**: Un negro sumamente cálido y elegante que evita la frialdad del gris estándar y proporciona una visualización premium en el modo oscuro.
- **Blanco Hueso / Arena (`#fcfbf7`)**: Para el fondo en el modo claro, dando una textura orgánica que emula el papel técnico de los planos y carpetas de reformas.

```javascript
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
          primary: '#e0c060',      // Oro Cálido Corporativo BellHogar
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
          primary: '#c8a010',      // Oro Profundo
          secondary: '#e0d088',    // Oro Claro
          accent: '#101008',       // Carbón como contraste
          background: '#fcfbf7',   // Blanco Hueso / Papel Cálido
          surface: '#ffffff',      // Blanco Puro para tarjetas
          error: '#D32F2F',
          info: '#1976D2',
          success: '#388E3C',
          warning: '#F57C00',
        }
      }
    },
  },
});
```

---

## Diseño de Esquema de Base de Datos (Firestore)

Para garantizar un alto rendimiento, soporte offline nativo de Firestore y evitar la saturación de los documentos (límite de 1MB), aplicaremos una arquitectura de **documentos híbridos**:
- Los datos de texto, listas de puertas/suelos y metadatos de archivos se almacenan en un único documento de la colección `proyectos`.
- Los bocetos y anotaciones hechos en el lienzo se guardan como imágenes `.png` en **Firebase Storage**, guardando únicamente la URL pública de descarga en Firestore.

### Estructura de Objeto Proyecto en la Colección `proyectos`
```javascript
const proyectoSchema = {
  id: "id-del-documento",       // Generado por Firestore
  fechaCreacion: null,          // Timestamp de Firestore
  fechaModificacion: null,      // Timestamp de Firestore
  estado: "borrador",           // "borrador" | "completado" | "archivado"
  
  // 1. Datos Comunes (Cabecera de los PDF)
  cliente: "",
  direccion: "",
  email: "",
  telefonoMovil: "",
  telefonoFijo: "",
  vendedor: "",
  tienda: "",
  fechaVisita: "",              // YYYY-MM-DD
  fechaEjecucion: "",           // YYYY-MM-DD
  zonaParquimetro: "No",        // "Zona Verde" | "Zona Azul" | "No"
  
  // 2. Formularios Específicos Añadidos (Array de objetos)
  formularios: [
    {
      id: "uuid-generado-localmente",
      tipo: "cocina",           // "cocina" | "puertas" | "tarimas"
      nombre: "Cocina Principal", // Nombre asignado por el usuario
      fechaCreacion: "ISOString",
      
      // Lógica de canvas (Storage)
      dibujos: {
        anotacionesUrl: null,   // URL pública del canvas de anotaciones
        bocetoUrl: null         // URL pública del canvas de boceto/plano
      },
      
      // Metadatos de archivos adjuntos almacenados en Storage
      archivos: [
        {
          id: "uuid-archivo",
          nombre: "foto_campana.jpg",
          tipo: "imagen",       // "imagen" | "pdf" | "video"
          url: "https://firebasestorage...",
          storagePath: "projects/id-proyecto/files/uuid-archivo_foto_campana.jpg",
          fechaSubida: "ISOString",
          sizeBytes: 204857
        }
      ],
      
      // Datos específicos de este tipo de formulario
      datos: { /* Depende de si es cocina, puertas o tarimas */ }
    }
  ]
};
```

#### Estructura `datos` para Cocinas (Basado en PDF Cocinas)
```javascript
const cocinaDatosSchema = {
  iluminacion: "",
  encimera: "",
  cubretuboMelaminico: "",
  observacionesGenerales: "",
  
  // Electrodomésticos y Complementos
  campana: {
    presupuestar: false, propiedadCliente: false, pared: false, isla: false,
    integrada: false, telescopica: false, filtroCarbon: false,
    alto: "", ancho: "", fondo: "", diametroSalida: "", observaciones: "", otras: ""
  },
  lavavajillas: {
    presupuestar: false, propiedadCliente: false, ancho60: false, ancho45: false,
    libre: false, integrado: false, observaciones: ""
  },
  lavadora: {
    presupuestar: false, propiedadCliente: false, libre: false, integrado: false, observaciones: ""
  },
  secadora: {
    presupuestar: false, propiedadCliente: false, libre: false, integrado: false, observaciones: ""
  },
  frigorifico: {
    presupuestar: false, propiedadCliente: false, libre: false, integrado: false,
    alto: "", ancho: "", fondo: "", observaciones: ""
  },
  horno: {
    presupuestar: false, propiedadCliente: false, vapor: false, pirolitico: false,
    multifuncion: false, bajoPlaca: false, columna: false, observaciones: ""
  },
  microondas: {
    presupuestar: false, propiedadCliente: false, libre: false, integrado: false,
    superior: false, columna: false, observaciones: ""
  },
  placa: {
    presupuestar: false, propiedadCliente: false, induccion: false, radiante: false,
    gas: false, otros: false, observaciones: ""
  },
  fregadero: {
    presupuestar: false, propiedadCliente: false, bajoEncimera: false,
    opticaEnrasada: false, sobreEncimera: false, observaciones: ""
  },
  grifo: {
    presupuestar: false, propiedadCliente: false, observaciones: ""
  },
  
  // Preguntas Frecuentes
  preguntas: {
    obraCocina: false,
    demolerMobiliario: false,
    hornoMicroColumna: false,
    deseanComerCocina: false,
    comerDetalle: { mesa: false, barra: false, personas: "" },
    alturaCocina: "",
    mueblesTecho: false,
    cierreTecho: false,
    alturaMueblesSuperiores: "70", // "70" | "80" | "90" | "96" | "Otros"
    alturaMueblesOtros: "",
    montajeTransporte: false,
    instalacionAgua: "Termo",      // "Termo" | "Caldera" | "Central" | "Otros"
    instalacionAguaOtros: ""
  }
};
```

#### Estructura `datos` para Puertas (Basado en PDF Puertas)
```javascript
const puertasDatosSchema = {
  acabado: { barnizadoMadera: false, colorLacado: "" },
  herrajes: { laton: false, cromo: false, negro: false, bronce: false, otros: "" },
  jambas: { molduras: "", corteInglete: false, corteRecto: false, cabecero: "", tapeta7cm: false, tapeta9cm: false },
  bisagras: { vista: false, oculta: false },
  petaca: { resbalon: false, rodillo: false, iman: false },
  cerco: { estandar: false, nudillo: false, hidrofugo: false, juntaGoma: false, descejado: false },
  instalacion: { desmontaje: false, albanileria: false, cerco: false },
  observacionesGenerales: "",
  
  // Tabla dinámica de puertas
  lineasPuertas: [
    {
      id: "uuid-linea-puerta-1",
      zona: "",            // Ej. Baño principal, Salón comedor
      tipo: "",            // Ej. Vidriera, Ciega, Corredera
      apertura: "Izquierda", // "Izquierda" | "Derecha" | "Corredera" | "Fija"
      medida: "",          // Ej. 203x72.5x9
      cerco: "",
      observaciones: ""
    }
  ]
};
```

#### Estructura `datos` para Tarimas (Basado en PDF Tarimas)
```javascript
const tarimasDatosSchema = {
  modeloTarima: { modelo: "", grosor: "", aislante: "" },
  rodapie: { modelo: "", color: "", alto: "", grosor: "" },
  juntas: { transicion: false, dilatacion: false, mamperlan: false, tira: false, mecanizado: false },
  preparacionSuelo: {
    desmontajeSueloExistente: false, picadoSuelo: false, echarSolera: false,
    echarPastaNiveladora: false, quitarRodapieCeramicoYRematar: false,
    colocacionSobre: "Parquet", // "Parquet" | "Solera" | "Plaqueta" | "Otros"
    colocacionSobreOtros: ""
  },
  cortesServicios: { cortePuertas: false, cortePuertasBlindadas: false, movimientoMuebles: false },
  observacionesGenerales: "",
  
  // Tabla dinámica con cálculo automático de M2
  lineasTarima: [
    {
      id: "uuid-linea-tarima-1",
      zona: "",            // Ej. Salón, Pasillo
      medida: "",          // Ej. 4.20 * 3.50 + 1.20 * 0.90
      m2: 0,               // Autocalculado por fórmula o escrito manual
      observaciones: ""
    }
  ]
};
```

---

## Estructura de Almacenamiento (Firebase Storage)

Los archivos se organizarán de forma estricta por el identificador del proyecto (`projectId`). Esto garantiza que **eliminar un proyecto sea extremadamente simple**: basta con listar los archivos con el prefijo `projects/{projectId}/` y eliminarlos.

```
projects/
└── {projectId}/
    ├── sketches/
    │   ├── {formId}_anotaciones.png    # Lienzo de notas a mano alzada
    │   └── {formId}_boceto.png         # Lienzo del plano/boceto
    └── files/
        ├── {formId}_foto_cocina.jpg    # Imágenes subidas por el usuario
        ├── {formId}_plano_tecnico.pdf  # Documentos PDF de arquitectura
        └── {formId}_video_estado.mp4   # Videos tomados in-situ
```

---

## Diseño Interactivo y UX Premium con Vuetify 3 (Tablet & Laptop)

Vuetify 3 nos proporciona de manera nativa directrices de Material Design 3, facilitando un acabado pulido y profesional:

1. **Optimización Táctil (Tablet)**:
   - Uso de componentes `v-btn-toggle` o `v-chip-group` para selecciones binarias o de múltiples opciones (más fácil de pulsar con el dedo en campo que los pequeños checkboxes tradicionales).
   - Componentes `v-text-field` con propiedades `type="number"` o `inputmode="decimal"` para disparar los teclados numéricos correctos en tablets.
   - Lienzos de dibujo (`<canvas>`) con soporte completo de eventos `pointerevents` para diferenciar trazo de dedo vs lápiz digital (Stylus), con rechazo de palma básico.

2. **Organización por Pestañas (Las 4 Pestañas Requeridas)**:
   Para cada estancia/ficha añadida, crearemos un contenedor con componentes `v-tabs` y `v-window` que organizará el espacio de trabajo en:
   - **Formulario**: Formulario técnico detallado (Cocina, Puertas o Tarimas) organizado en secciones expandibles (`v-expansion-panels`).
   - **Anotaciones**: Canvas limpio optimizado para apuntes rápidos y texto libre a mano.
   - **Boceto de Plano**: Canvas con cuadrícula translúcida de fondo ideal para croquis rápidos de paredes, pilares o tomas de agua.
   - **Archivos**: Un `v-file-input` moderno con área drag-and-drop para subir imágenes, videos y PDFs de la estancia, mostrando el progreso de subida por cada archivo en un `v-progress-linear`.

3. **Estética Visual Premium**:
   - Paleta en HSL oro cálido y carbón profundo con **modo oscuro** predeterminado para condiciones de baja y alta iluminación en obras.
   - Componentes `v-card` con bordes redondeados y ligeras elevaciones, y tarjetas de vidrio translúcido (`glassmorphism` con estilos personalizados de CSS).
   - Efectos de carga visuales y micro-transiciones nativas de Vuetify en las pestañas y diálogos.

### Refinamiento de Diseño para iPad (Lienzo a pantalla completa, viewport bloqueado y guardado 100% automático)

Para satisfacer la solicitud del usuario de que el lienzo de dibujo y boceto se ajusten perfectamente a la anchura y altura del iPad, dejando un pequeño margen y reservando espacio superior para herramientas de dibujo y pestañas de navegación, junto con un **sistema de guardado 100% automático y transparente (sin botones "Guardar")**, realizaremos los siguientes cambios:

#### 1. Bloqueo de Altura del Viewport (`.editor-viewport`)
Evitaremos que toda la página web se desplace verticalmente (scroll) en el editor. De esta forma, el usuario podrá dibujar con el dedo o Apple Pencil sin preocuparse de que la pantalla rebote, haga zoom o se desplace hacia arriba y abajo.
* Crearemos una clase CSS `.editor-viewport` que envolverá todo el contenido de `EditorProyecto.vue`.
* Calcularemos la altura disponible = `calc(100vh - var(--v-layout-top, 64px) - 32px)` en móvil/tablet y `- 48px` en desktop.
* Agregaremos `overflow: hidden` en este contenedor para bloquear el desplazamiento del body.

#### 2. Barra Lateral Colapsable (`showSidebar`)
En el iPad, el espacio horizontal es valioso. Si la barra lateral de datos del cliente está visible todo el tiempo, el canvas queda reducido.
* Introduciremos un estado reactivo `showSidebar` (por defecto `true` en >= 960px y `false` en móviles/iPad vertical).
* Colocaremos un botón de alternancia premium (`v-btn` con iconos `mdi-menu` / `mdi-menu-open`) en el extremo derecho de la barra de pestañas.
* Si el panel lateral está oculto, la columna del editor se expandirá a `cols="12" md="12"`, tomando el **100% de la anchura de la pantalla**.
* Al expandirse, el `ResizeObserver` interno de `SketchCanvas.vue` recalculará y escalará el lienzo automáticamente.

#### 3. Guardado Automático Inteligente (Auto-Save sin Botón Guardar)
Eliminaremos todos los botones de "Guardar" de la interfaz para ofrecer una experiencia fluida tipo Figma o Google Docs. Implementaremos las siguientes lógicas de autoguardado en segundo plano con indicadores de estado discretos (sin popups de alerta invasivos):

##### A. Autoguardado de Formularios Técnicos (Cocinas, Puertas, Tarimas)
* Implementaremos un `watch` profundo en Vue 3 sobre el objeto `selectedForm.datos`.
* Cuando ocurra cualquier cambio (escribir texto, marcar casilla, añadir/quitar líneas de tabla), se disparará un autoguardado a Firestore en segundo plano con un **debounce de 1.5 segundos**. Esto evita guardar con cada pulsación de tecla y optimiza el consumo de red.
* Mostraremos un sutil indicador de estado a la derecha de las pestañas:
  * 🔄 `Guardando...` (Icono giratorio cuando está enviando a Firestore).
  * ☁️ `Guardado en la nube` (Icono de nube con check cuando está sincronizado).

##### B. Autoguardado de Lienzos de Dibujo y Croquis
* Se eliminará el botón "Guardar" del lienzo.
* **Auto-save por trazo (Debounced)**: Cada vez que el usuario finalice un trazo de dibujo (`pointerup` / `touchend` o al salir del lienzo `pointerleave`), iniciaremos un temporizador de **2.5 segundos**. Si el usuario dibuja otro trazo antes de que expire, reiniciamos el temporizador. Al pasar 2.5 segundos de inactividad, exportamos el lienzo a Blob y lo subimos automáticamente a Firebase Storage en segundo plano.
* **Auto-save por cambio de pestaña**: Si el usuario cambia de pestaña mientras tiene trazos pendientes de guardar, salvaremos el dibujo de forma **instantánea** e inmediata antes de la transición para asegurar que jamás se pierda nada.
* Mostraremos el mismo indicador discreto de guardado en la barra de herramientas del lienzo (`Guardando dibujo...` / `Dibujo guardado`).

#### 4. Limpieza de Plantilla y Scroll Interno de Formularios
* **Eliminación de Duplicados**: Eliminaremos el bloque duplicado de `v-window-item value="form"` (líneas 200 a 576), manteniendo únicamente el que posee `overflow-y-auto pr-1` (líneas 578 a 953) para garantizar el scroll interno correcto del formulario.
* **Margen Limpio**: Aseguraremos un margen muy elegante alrededor de las tarjetas y el lienzo.

---

## Plan de Verificación y Pruebas Refinado

### Pruebas de Comportamiento en Tablet (iPad)
1. **Verificación de Bloqueo de Pantalla**: Cargar el editor de proyectos en un simulador de iPad y verificar que la página principal no se desplace en absoluto al intentar arrastrar el lienzo.
2. **Alternancia de Panel Lateral**: Tocar el nuevo botón del menú y validar que el panel lateral de datos se oculte y muestre suavemente, y que el lienzo se extienda y recalcule a la resolución completa de forma instantánea.
3. **Autoguardado de Dibujo por Inactividad**: Dibujar varios trazos en el lienzo, levantar el lápiz/dedo, esperar 2.5 segundos y verificar que el indicador cambie de "Cambios sin guardar" a "Guardando..." y finalmente a "Dibujo guardado" de manera discreta.
4. **Autoguardado por Cambio de Pestaña**: Dibujar algo e inmediatamente cambiar de pestaña. Volver a la pestaña de dibujo y verificar que el dibujo se haya guardado y persista correctamente.
5. **Autoguardado de Formularios**: Escribir en cualquier campo técnico o añadir una línea de puerta. Esperar 1.5 segundos de inactividad y confirmar en la esquina superior que el estado de sincronización pasa a "Guardado en la nube" automáticamente.


