const admin = require("firebase-admin");

// Inicializar admin SDK si no se ha hecho
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

async function readLastProject() {
  console.log("Consultando el último proyecto modificado...");
  try {
    const snapshot = await db.collection("proyectos")
      .orderBy("fechaModificacion", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log("No se encontraron proyectos.");
      return;
    }

    const doc = snapshot.docs[0];
    const project = doc.data();
    console.log(`Proyecto encontrado: ${project.nombre} (ID: ${doc.id})`);

    project.formularios.forEach(f => {
      console.log(`\nFormulario: ${f.nombre} (Tipo: ${f.tipo})`);
      if (f.dibujos) {
        if (f.dibujos.anotacionesPages) {
          console.log("  Anotaciones Pages:");
          f.dibujos.anotacionesPages.forEach(p => {
            console.log(`    Page ID: ${p.id}`);
            console.log(`    Texto Reconocido (primeros 150 chars): "${p.textoReconocido ? p.textoReconocido.substring(0, 150) : ''}"`);
          });
        }
        if (f.dibujos.bocetoPages) {
          console.log("  Boceto Pages:");
          f.dibujos.bocetoPages.forEach(p => {
            console.log(`    Page ID: ${p.id}`);
            console.log(`    Texto Reconocido (longitud: ${p.textoReconocido ? p.textoReconocido.length : 0} chars)`);
            if (p.textoReconocido) {
              console.log("    --- INICIO CONTENIDO ---");
              console.log(p.textoReconocido);
              console.log("    --- FIN CONTENIDO ---");
            }
          });
        }
      }
    });

  } catch (error) {
    console.error("Error al leer el proyecto:", error);
  }
}

readLastProject();
