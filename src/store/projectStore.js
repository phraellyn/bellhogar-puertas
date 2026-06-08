import { defineStore } from 'pinia';
import { db, storage } from '../services/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll 
} from 'firebase/storage';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
  }),

  actions: {
    // 1. Obtener todos los proyectos de Firestore
    async fetchProjects() {
      this.loading = true;
      this.error = null;
      try {
        const q = query(collection(db, 'proyectos'), orderBy('fechaModificacion', 'desc'));
        const querySnapshot = await getDocs(q);
        const projectsList = [];
        querySnapshot.forEach((doc) => {
          projectsList.push(normalizeProject({ id: doc.id, ...doc.data() }));
        });
        this.projects = projectsList;
      } catch (err) {
        console.error('Error al obtener proyectos:', err);
        this.error = err.message || 'Error al cargar los proyectos.';
      } finally {
        this.loading = false;
      }
    },

    // 2. Obtener un proyecto específico por ID
    async fetchProjectById(projectId) {
      this.loading = true;
      this.error = null;
      try {
        const docRef = doc(db, 'proyectos', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          this.currentProject = normalizeProject({ id: docSnap.id, ...docSnap.data() });
          return this.currentProject;
        } else {
          throw new Error('El proyecto no existe.');
        }
      } catch (err) {
        console.error('Error al obtener proyecto:', err);
        this.error = err.message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    // 3. Crear un nuevo proyecto (Datos comunes del cliente)
    async createProject(commonData) {
      this.loading = true;
      this.error = null;
      try {
        const newProject = {
          ...commonData,
          estado: 'borrador',
          fechaCreacion: serverTimestamp(),
          fechaModificacion: serverTimestamp(),
          formularios: []
        };
        const docRef = await addDoc(collection(db, 'proyectos'), newProject);
        await this.fetchProjects(); // Recargar listado
        return docRef.id;
      } catch (err) {
        console.error('Error al crear proyecto:', err);
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 4. Actualizar metadatos/datos comunes de un proyecto
    async updateProjectCommon(projectId, commonData) {
      this.error = null;
      try {
        const docRef = doc(db, 'proyectos', projectId);
        await updateDoc(docRef, {
          ...commonData,
          fechaModificacion: serverTimestamp()
        });
        if (this.currentProject && this.currentProject.id === projectId) {
          this.currentProject = { ...this.currentProject, ...commonData };
        }
        await this.fetchProjects();
      } catch (err) {
        console.error('Error al actualizar datos del proyecto:', err);
        this.error = err.message;
        throw err;
      }
    },

    // 5. Eliminar un proyecto en cascada (Firestore + Storage)
    async deleteProject(projectId) {
      this.loading = true;
      this.error = null;
      try {
        // A. Eliminar archivos del Storage en la carpeta projects/{projectId}
        const storageFolderRef = ref(storage, `projects/${projectId}`);
        await this.deleteFolderRecursive(storageFolderRef);

        // B. Eliminar el documento de Firestore
        const docRef = doc(db, 'proyectos', projectId);
        await deleteDoc(docRef);

        // C. Actualizar estado local
        this.projects = this.projects.filter(p => p.id !== projectId);
        if (this.currentProject && this.currentProject.id === projectId) {
          this.currentProject = null;
        }
      } catch (err) {
        console.error('Error al eliminar proyecto:', err);
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Auxiliar: Borrar carpeta recursiva de Firebase Storage (lista y borra archivos)
    async deleteFolderRecursive(folderRef) {
      try {
        // En Storage no hay 'directorios' reales, listamos todos los archivos con ese prefijo
        const listResult = await listAll(folderRef);
        
        // Eliminar archivos directos
        const fileDeletes = listResult.items.map(itemRef => deleteObject(itemRef));
        await Promise.all(fileDeletes);
        
        // Eliminar subcarpetas recursivamente
        const folderDeletes = listResult.prefixes.map(subFolderRef => this.deleteFolderRecursive(subFolderRef));
        await Promise.all(folderDeletes);
      } catch (err) {
        console.warn('Advertencia o error al limpiar Storage para el proyecto:', err);
      }
    },

    // 6. Añadir un formulario específico (Cocina, Puertas, Tarimas) al proyecto actual
    async addFormToProject(projectId, formType, formName) {
      if (!this.currentProject) return;
      
      const newFormId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      
      let baseDatos = {};
      if (formType === 'cocina') {
        baseDatos = {
          iluminacion: "", encimera: "", cubretuboMelaminico: { ancho: "", alto: "", fondo: "" }, observacionesGenerales: "",
          campana: {
            presupuestar: false, propiedadCliente: false, techo: false, pared: false, isla: false,
            integrada: false, telescopica: false, filtroCarbon: false,
            alto: "", ancho: "", fondo: "", diametroSalida: "", observaciones: "", otras: ""
          },
          lavavajillas: {
            presupuestar: false, propiedadCliente: false, ancho60: false, ancho45: false,
            libre: false, integrado: false, observaciones: ""
          },
          lavadora: { presupuestar: false, propiedadCliente: false, ancho60: false, ancho45: false, libre: false, integrado: false, observaciones: "" },
          secadora: { presupuestar: false, propiedadCliente: false, libre: false, integrado: false, observaciones: "" },
          frigorifico: { presupuestar: false, propiedadCliente: false, libre: false, integrado: false, alto: "", ancho: "", fondo: "", observaciones: "" },
          horno: { presupuestar: false, propiedadCliente: false, vapor: false, pirolitico: false, multifuncion: false, bajoPlaca: false, columna: false, observaciones: "" },
          microondas: { presupuestar: false, propiedadCliente: false, libre: false, integrado: false, superior: false, columna: false, observaciones: "" },
          placa: { presupuestar: false, propiedadCliente: false, induccion: false, radiante: false, gas: false, otros: false, libre: false, integrado: false, observaciones: "" },
          fregadero: { presupuestar: false, propiedadCliente: false, bajoEncimera: false, opticaEnrasada: false, sobreEncimera: false, observaciones: "" },
          grifo: { presupuestar: false, propiedadCliente: false, observaciones: "" },
          preguntas: {
            obraCocina: false, demolerMobiliario: false, hornoMicroColumna: false, deseanComerCocina: false,
            comerDetalle: { mesa: false, barra: false, personas: "" }, alturaCocina: "", mueblesTecho: false, cierreTecho: false,
            alturaMueblesSuperiores: "70", alturaMueblesOtros: "", montajeTransporte: false, instalacionAgua: "Termo", instalacionAguaOtros: ""
          }
        };
      } else if (formType === 'puertas') {
        baseDatos = {
          acabado: { barnizado: false, madera: "", lacado: false, color: "" },
          herrajes: { laton: false, cromo: false, negro: false, bronce: false, otros: "" },
          jambas: { molduras: false, tapeta: false, otros: "", tapeta7cm: false, tapeta9cm: false, cabecero: "", corteInglete: false, corteRecto: false },
          bisagras: { vista: false, oculta: false },
          petaca: { resbalon: false, rodillo: false, iman: false },
          cerco: { estandar: false, hidrofugo: false, juntaGoma: false },
          instalacion: { nudillo: false, desmontaje: false, descejado: false, albanileria: false },
          observacionesGenerales: "",
          lineasPuertas: [
            { id: 'l-p-1', cantidad: '', apertura: '', medida: '', tipo: '', zona: '', cerco: '', observaciones: '' }
          ]
        };
      } else if (formType === 'tarimas') {
        baseDatos = {
          modeloTarima: { grosor: "", aislante: "" },
          rodapie: { modelo: "", color: "", alto: "", grosor: "", quitarRodapie: false },
          juntas: {
            transicion: false,
            transicionUds: "",
            dilatacion: false,
            dilatacionUds: "",
            mamperlanTira: false,
            mamperlanTiraUds: "",
            mamperlanMecanizado: false,
            mamperlanMecanizadoUds: ""
          },
          bisagras: {
            desmontajeSuelo: false,
            desmontajeSueloUds: "",
            picadoSuelo: false,
            picadoSueloM2: "",
            cortePuertas: false,
            cortePuertasUds: "",
            echarSolera: false,
            echarSoleraM2: "",
            cortePuertasBlindadas: false,
            cortePuertasBlindadasUds: "",
            echarPastaNiveladora: false,
            echarPastaNiveladoraM2: "",
            movimientoMuebles: false,
            observaciones: "",
            colocacionSobre: "Parquet",
            colocacionSobreOtros: ""
          },
          observacionesGenerales: "",
          lineasTarima: [
            { id: 'l-t-1', zona: '', medida: '', m2: '', observaciones: '' }
          ]
        };
      }

      const newForm = {
        id: newFormId,
        tipo: formType,
        nombre: formName || `Nueva ficha de ${formType}`,
        fechaCreacion: new Date().toISOString(),
        dibujos: {
          anotacionesUrl: null,
          bocetoUrl: null
        },
        archivos: [],
        datos: baseDatos
      };

      const updatedFormularios = [...this.currentProject.formularios, newForm];
      
      const docRef = doc(db, 'proyectos', projectId);
      await updateDoc(docRef, {
        formularios: updatedFormularios,
        fechaModificacion: serverTimestamp()
      });

      this.currentProject.formularios = updatedFormularios;
      await this.fetchProjects();
      return newFormId;
    },

    // 7. Actualizar los datos de un formulario específico
    async updateFormDatos(projectId, formId, formDatos) {
      if (!this.currentProject) return;

      const updatedFormularios = this.currentProject.formularios.map(form => {
        if (form.id === formId) {
          return { ...form, datos: formDatos };
        }
        return form;
      });

      const docRef = doc(db, 'proyectos', projectId);
      await updateDoc(docRef, {
        formularios: updatedFormularios,
        fechaModificacion: serverTimestamp()
      });

      this.currentProject.formularios = updatedFormularios;
    },

    // 8. Eliminar un formulario específico del proyecto
    async removeFormFromProject(projectId, formId) {
      if (!this.currentProject) return;

      // A. Borrar posibles archivos del Storage ligados a esta ficha
      const form = this.currentProject.formularios.find(f => f.id === formId);
      if (form) {
        // Borrar boceto y notas
        if (form.dibujos.anotacionesUrl) {
          try { await deleteObject(ref(storage, `projects/${projectId}/sketches/${formId}_anotaciones.png`)); } catch (e) {}
        }
        if (form.dibujos.bocetoUrl) {
          try { await deleteObject(ref(storage, `projects/${projectId}/sketches/${formId}_boceto.png`)); } catch (e) {}
        }
        // Borrar archivos adjuntos subidos
        for (const file of form.archivos) {
          try { await deleteObject(ref(storage, file.storagePath)); } catch (e) {}
        }
      }

      // B. Eliminar de la lista de Firestore
      const updatedFormularios = this.currentProject.formularios.filter(f => f.id !== formId);
      const docRef = doc(db, 'proyectos', projectId);
      await updateDoc(docRef, {
        formularios: updatedFormularios,
        fechaModificacion: serverTimestamp()
      });

      this.currentProject.formularios = updatedFormularios;
      await this.fetchProjects();
    },

    // 9. Subir dibujo del Canvas a Storage
    async saveCanvasDrawing(projectId, formId, canvasType, imageBlob) {
      if (!this.currentProject) return null;

      const path = `projects/${projectId}/sketches/${formId}_${canvasType}.png`;
      const storageRef = ref(storage, path);
      
      // Subir archivo PNG a Storage
      const snapshot = await uploadBytes(storageRef, imageBlob);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Actualizar Firestore con la URL
      const updatedFormularios = this.currentProject.formularios.map(form => {
        if (form.id === formId) {
          const dibujos = { ...form.dibujos };
          if (canvasType === 'anotaciones') dibujos.anotacionesUrl = downloadUrl;
          if (canvasType === 'boceto') dibujos.bocetoUrl = downloadUrl;
          return { ...form, dibujos };
        }
        return form;
      });

      const docRef = doc(db, 'proyectos', projectId);
      await updateDoc(docRef, {
        formularios: updatedFormularios,
        fechaModificacion: serverTimestamp()
      });

      this.currentProject.formularios = updatedFormularios;
      return downloadUrl;
    },

    // 10. Subir archivo adjunto a Storage
    async uploadFileToForm(projectId, formId, fileBlob, fileName, fileType) {
      if (!this.currentProject) return null;

      const fileId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const storagePath = `projects/${projectId}/files/${formId}_${fileId}_${fileName}`;
      const storageRef = ref(storage, storagePath);

      // Subir archivo a Storage
      const snapshot = await uploadBytes(storageRef, fileBlob);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      const newFile = {
        id: fileId,
        nombre: fileName,
        tipo: fileType || 'imagen', // 'imagen' | 'pdf' | 'video'
        url: downloadUrl,
        storagePath: storagePath,
        fechaSubida: new Date().toISOString(),
        sizeBytes: fileBlob.size
      };

      // Actualizar la lista en Firestore
      const updatedFormularios = this.currentProject.formularios.map(form => {
        if (form.id === formId) {
          return {
            ...form,
            archivos: [...form.archivos, newFile]
          };
        }
        return form;
      });

      const docRef = doc(db, 'proyectos', projectId);
      await updateDoc(docRef, {
        formularios: updatedFormularios,
        fechaModificacion: serverTimestamp()
      });

      this.currentProject.formularios = updatedFormularios;
      return newFile;
    },

    // 11. Eliminar archivo adjunto de un formulario
    async deleteFileFromForm(projectId, formId, fileId) {
      if (!this.currentProject) return;

      const form = this.currentProject.formularios.find(f => f.id === formId);
      if (!form) return;

      const file = form.archivos.find(a => a.id === fileId);
      if (!file) return;

      // A. Borrar archivo del Storage
      try {
        const fileRef = ref(storage, file.storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn('Archivo no encontrado en Storage o error al borrarlo:', err);
      }

      // B. Eliminar de la metadata en Firestore
      const updatedFormularios = this.currentProject.formularios.map(f => {
        if (f.id === formId) {
          return {
            ...f,
            archivos: f.archivos.filter(a => a.id !== fileId)
          };
        }
        return f;
      });

      const docRef = doc(db, 'proyectos', projectId);
      await updateDoc(docRef, {
        formularios: updatedFormularios,
        fechaModificacion: serverTimestamp()
      });

      this.currentProject.formularios = updatedFormularios;
    }
  }
});

// Normalización de esquemas antiguos y prevención de tipos inválidos al cargar datos de Firestore
function normalizeProject(proj) {
  if (!proj) return proj;
  if (!proj.formularios || !Array.isArray(proj.formularios)) {
    proj.formularios = [];
  }
  proj.formularios = proj.formularios.map(form => {
    if (!form.datos) form.datos = {};
    if (form.tipo === 'tarimas') {
      form.datos.modeloTarima = { grosor: "", aislante: "", ...form.datos.modeloTarima };
      form.datos.rodapie = { modelo: "", color: "", alto: "", grosor: "", quitarRodapie: false, ...form.datos.rodapie };
      form.datos.juntas = {
        transicion: false, transicionUds: "",
        dilatacion: false, dilatacionUds: "",
        mamperlanTira: false, mamperlanTiraUds: "",
        mamperlanMecanizado: false, mamperlanMecanizadoUds: "",
        ...form.datos.juntas
      };
      form.datos.bisagras = {
        desmontajeSuelo: false, desmontajeSueloUds: "",
        picadoSuelo: false, picadoSueloM2: "",
        cortePuertas: false, cortePuertasUds: "",
        echarSolera: false, echarSoleraM2: "",
        cortePuertasBlindadas: false, cortePuertasBlindadasUds: "",
        echarPastaNiveladora: false, echarPastaNiveladoraM2: "",
        movimientoMuebles: false, observaciones: "",
        colocacionSobre: "Parquet", colocacionSobreOtros: "",
        ...form.datos.bisagras
      };
      
      // Corregir si colocacionSobreOtros viene de la BD como un booleano (bug de migración)
      if (typeof form.datos.bisagras.colocacionSobreOtros === 'boolean') {
        form.datos.bisagras.colocacionSobreOtros = '';
      }
      
      if (!form.datos.lineasTarima || !Array.isArray(form.datos.lineasTarima)) {
        form.datos.lineasTarima = [
          { id: 'l-t-1', zona: '', medida: '', m2: '', observaciones: '' }
        ];
      }
    } else if (form.tipo === 'puertas') {
      form.datos.acabado = { barnizado: false, madera: "", lacado: false, color: "", ...form.datos.acabado };
      form.datos.herrajes = { laton: false, cromo: false, negro: false, bronce: false, otros: "", ...form.datos.herrajes };
      form.datos.jambas = { molduras: false, tapeta: false, otros: "", tapeta7cm: false, tapeta9cm: false, cabecero: "", corteInglete: false, corteRecto: false, ...form.datos.jambas };
      form.datos.bisagras = { vista: false, oculta: false, ...form.datos.bisagras };
      form.datos.petaca = { resbalon: false, rodillo: false, iman: false, ...form.datos.petaca };
      form.datos.cerco = { estandar: false, hidrofugo: false, juntaGoma: false, ...form.datos.cerco };
      form.datos.instalacion = { nudillo: false, desmontaje: false, descejado: false, albanileria: false, ...form.datos.instalacion };
      if (!form.datos.lineasPuertas || !Array.isArray(form.datos.lineasPuertas)) {
        form.datos.lineasPuertas = [
          { id: 'l-p-1', cantidad: '', apertura: '', medida: '', tipo: '', zona: '', cerco: '', observaciones: '' }
        ];
      }
    } else if (form.tipo === 'cocina') {
      if (typeof form.datos.cubretuboMelaminico !== 'object' || form.datos.cubretuboMelaminico === null) {
        form.datos.cubretuboMelaminico = { ancho: "", alto: "", fondo: "" };
      } else {
        form.datos.cubretuboMelaminico = {
          ancho: "", alto: "", fondo: "",
          ...form.datos.cubretuboMelaminico
        };
      }
    }
    return form;
  });
  return proj;
}
