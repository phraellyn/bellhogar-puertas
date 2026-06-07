# Resumen de Cierre de Proyecto: App de Reformas BellHogar

¡La aplicación web móvil/tablet-first para la gestión de mediciones de reformas de **BellHogar** ha sido completamente desarrollada e implementada con éxito en la raíz del proyecto (`d:\DESARROLLO\firebase\puertas`)!

---

## 🏗️ Resumen de la Arquitectura Implementada

Se ha construido un desarrollo moderno e interactivo utilizando la última versión estable de **Vue 3 (Vite + JavaScript)** y **Vuetify 3** (basado en Material Design 3). La aplicación conecta directamente con tu proyecto Firebase (`puertas-bellhogar`).

### 📂 Estructura del Código Creado

1. **`src/plugins/vuetify.js` (Diseño Premium Corporativo)**:
   - Configuración del tema personalizado de Vuetify con la paleta de colores corporativa extraída de BellHogar: **Oro Cálido (`#e0c060` / `#c8a010`)** para maderas e interactivos, y **Carbón Profundo (`#101008` / `#1e1e1b`)** para un modo oscuro elegante y de bajo impacto ocular en visitas de obras.
   - Registro de tipografías e iconos de alta definición (Material Design Icons).

2. **`src/services/firebase.js` (Conexión SDK)**:
   - Inicialización del SDK de Firebase con las credenciales que provistas para tu base de datos Firestore y tu espacio de almacenamiento Firebase Storage.

3. **`src/store/projectStore.js` (Tienda de Estado Pinia)**:
   - Toda la lógica CRUD de base de datos.
   - Sincronización en tiempo real con **Firestore** (colección `proyectos`) y **Storage** (carpeta `projects/{id_proyecto}/`).
   - Lógica de **eliminación recursiva en cascada** para limpiar automáticamente Storage (croquis, firmas, fotos y videos de la estancia) cuando se borra un proyecto.

4. **`src/router/index.js` (Navegación Dinámica)**:
   - Mapeo de rutas dinámicas de la SPA (Single Page Application) para el Dashboard y el Editor Técnico.

5. **`src/App.vue` (Contenedor Base)**:
   - Cabecera premium con **logotipo de BellHogar dinámico** (carga automáticamente `BellHogar Oscuro.png` para el tema oscuro y `BellHogar Claro.png` para el tema claro) e interruptor de tema Claro/Oscuro que persiste en `localStorage`.

6. **`src/views/Dashboard.vue` (Buscador y Fórmulas Base)**:
   - Listado de proyectos interactivo con tarjetas táctiles (tablet) y tabla de datos (laptop).
   - Buscador rápido y filtros por estado.
   - Diálogo modal con formulario de validación estricta para crear nuevos clientes (cabecera común de los PDFs).

7. **`src/views/EditorProyecto.vue` (El Core del Sistema)**:
   - Interfaz de doble columna: a la izquierda, los datos del cliente siempre a la vista y el selector de estancias; a la derecha, el área de pestañas de la estancia seleccionada.
   - **Desactivación de gestos laterales**: Se ha configurado `:touch="false"` en el `v-window` para evitar que deslizamientos accidentales cambien de panel.
   - **Formulario Cocinas**: Todos los electrodomésticos y preguntas frecuentes del PDF con paneles colapsables táctiles.
   - **Formulario Puertas**: Tabla de mediciones de líneas dinámicas (`Apertura`, `Medidas`, `Cercos`).
   - **Formulario Tarimas**: Tabla dinámica de suelos con **lógica de autocalculadora integrada** (evalúa expresiones matemáticas como `4.2*3.5 + 1.2*0.9` convirtiéndolo a M² y sumando los totales en tiempo real de forma segura).

8. **`src/components/SketchCanvas.vue` (Lienzo Digital Táctil)**:
   - Lienzo responsivo `<canvas>` optimizado para eventos de puntero (`pointerevents`), reconociendo con precisión el dibujo a mano alzada con dedos o lápiz digital (Stylus).
   - **Intercepción total de eventos táctiles**: Se han enlazado modificadores `@touchstart.prevent.stop`, `@touchmove.prevent.stop` y `@touchend.prevent.stop` directamente en el elemento de lienzo, deteniendo la propagación y anulando gestos del navegador (como zoom, scroll e interacciones laterales en iPad) durante el trazado.
   - **ResizeObserver integrado**: Redimensionamiento automático al pasar de pestaña oculta a visible y al rotar el dispositivo, evitando el bloqueo de lienzo de `0px` sin perder trazos no guardados.
   - Selector de grosor de pincel, goma de borrar, limpiar lienzo y **historial de deshacer trazos (Undo) de 20 niveles**.
   - Rejilla guía integrada (cuadrícula) para croquis a escala en la pestaña "Boceto Plano".
   - Exporta el dibujo a Blob PNG en alta resolución y lo asocia en la carpeta de Firebase Storage correspondiente.

9. **`src/components/FileUploader.vue` (Gestor de Adjuntos)**:
   - Permite adjuntar múltiples archivos (fotos tomadas con la tablet en el sitio, videos del estado de la obra y planos en PDF).
   - Muestra barras de progreso de subida en tiempo real y gestiona una galería con lightbox de previsualización para imágenes, enlaces directos para PDFs y reproductor de video ligero.

10. **Archivos de Configuración de Firebase (`firebase.json`, `firestore.rules`, `storage.rules`)**:
    - Reglas de seguridad preparadas en tu local para permitir el tráfico e inicio del proyecto con rapidez.

---

## 🛠️ Cómo Ejecutar el Proyecto en Local

Dado que todo el código fuente está alojado en la raíz de tu proyecto `d:\DESARROLLO\firebase\puertas`, para abrir y ejecutar la aplicación sigue estos pasos:

1. Abre tu terminal de comandos en la carpeta del proyecto (o utiliza la terminal integrada de VS Code):
   ```bash
   cd d:\DESARROLLO\firebase\puertas
   ```

2. Ejecuta el servidor local de desarrollo de Vite:
   ```bash
   npm run dev
   ```

3. Abre el navegador web en la dirección local que te indique la terminal (por lo general, `http://localhost:5173`).

---

## 💡 Resoluciones Técnicas Realizadas en tu Entorno

* ** npm Cache en Disco D**: Durante la instalación, detectamos que tu unidad de disco principal `C:` tiene `0.00 GB` de espacio libre (completamente lleno), lo cual hacía colapsar el instalador de npm. Para solucionarlo sin borrar ningún archivo tuyo, **configuramos la caché de npm de forma local en tu disco D (`d:\DESARROLLO\firebase\puertas\.npm-cache`)**, que cuenta con `379 GB` de espacio libre. Esto permitió una instalación limpia y exitosa de todas las dependencias.
* **Preservación de tus Archivos**: Las carpetas `recursos/` (con los PDFs y textos extraídos) e `implementación/` (donde tienes una copia del plan en local) permanecen totalmente intactas en la raíz al lado del código de Vue.
