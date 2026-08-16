import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storage } from './firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateFilteredProjectPDF } from './pdfReportGenerator';

// EmailJS Keys provided by the user
const EMAILJS_PUBLIC_KEY = 'ePuq7ToVavxXwByF2';
const EMAILJS_SERVICE_ID = 'service_0dq6cik';
const EMAILJS_TEMPLATE_ID = 'template_1asqc2u';

/**
 * Loads an image from a URL and converts it to a Base64 string.
 * Supports compressing via JPEG format and quality parameters.
 * Uses CORS-anonymous requests to prevent canvas tainting with Firebase Storage URLs.
 */
const loadImageElement = url => new Promise(resolve => {
  if (!url) return resolve(null);
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => resolve(null);
  image.src = url;
});

const canvasAsBase64 = (sourceCanvas, format = 'png', quality = 1, cropToContent = false, requireContent = false) => {
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = sourceCanvas.width;
  let sourceHeight = sourceCanvas.height;

  if (cropToContent || requireContent) {
    const pixels = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
    let minX = sourceCanvas.width;
    let minY = sourceCanvas.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < sourceCanvas.height; y += 1) {
      for (let x = 0; x < sourceCanvas.width; x += 1) {
        const offset = (y * sourceCanvas.width + x) * 4;
        const alpha = pixels[offset + 3];
        const isWhite = pixels[offset] > 248 && pixels[offset + 1] > 248 && pixels[offset + 2] > 248;
        if (alpha > 8 && !isWhite) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX < 0) return null;
    if (cropToContent) {
      const contentWidth = maxX - minX + 1;
      const contentHeight = maxY - minY + 1;
      const padding = Math.max(24, Math.round(Math.max(contentWidth, contentHeight) * 0.04));
      sourceX = Math.max(0, minX - padding);
      sourceY = Math.max(0, minY - padding);
      sourceWidth = Math.min(sourceCanvas.width - sourceX, maxX - minX + 1 + padding * 2);
      sourceHeight = Math.min(sourceCanvas.height - sourceY, maxY - minY + 1 + padding * 2);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d');
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(sourceCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
  return canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', quality);
};

const loadImageAsBase64 = async (url, format = 'png', quality = 1.0, cropToContent = false, requireContent = false) => {
  try {
    const image = await loadImageElement(url);
    if (!image) return null;
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = image.naturalWidth || image.width;
    sourceCanvas.height = image.naturalHeight || image.height;
    sourceCanvas.getContext('2d').drawImage(image, 0, 0);
    return canvasAsBase64(sourceCanvas, format, quality, cropToContent, requireContent);
  } catch (err) {
    console.error('CORS / Security error loading image for PDF:', err);
    return null;
  }
};

export const renderDrawingForPDF = async drawing => {
  if (!drawing?.svg) {
    return loadImageAsBase64(drawing?.url, 'jpeg', 0.82, drawing?.cropToContent, true);
  }

  let objectUrl = null;
  try {
    const viewBox = drawing.svg.match(/viewBox\s*=\s*["']\s*([\-\d.]+)\s+([\-\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/i);
    const viewBoxWidth = Number(viewBox?.[3]) || 1200;
    const viewBoxHeight = Number(viewBox?.[4]) || 900;
    // Los SVG de la interfaz usan width/height al 100%. Para rasterizarlos sin
    // deformación les damos primero un tamaño intrínseco con la relación del viewBox.
    const rasterSvg = drawing.svg.replace(/<svg([^>]*)>/i, (match, attributes) => {
      const cleanAttributes = attributes.replace(/\s(?:width|height)\s*=\s*["'][^"']*["']/gi, '');
      return `<svg${cleanAttributes} width="${viewBoxWidth}" height="${viewBoxHeight}">`;
    });
    const svgBlob = new Blob([rasterSvg], { type: 'image/svg+xml;charset=utf-8' });
    objectUrl = URL.createObjectURL(svgBlob);
    const [svgImage, strokesImage] = await Promise.all([
      loadImageElement(objectUrl),
      drawing.url ? loadImageElement(drawing.url) : Promise.resolve(null)
    ]);
    if (!svgImage && !strokesImage) return null;

    const width = strokesImage?.naturalWidth || Math.min(1800, Math.max(900, svgImage?.naturalWidth || 1600));
    const height = strokesImage?.naturalHeight || Math.round(width * (viewBoxHeight / viewBoxWidth));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (svgImage) {
      // Equivale a preserveAspectRatio="xMidYMid meet", que es exactamente la
      // forma en que el plano se ve en el lienzo y durante el autoescalado.
      const scale = Math.min(canvas.width / viewBoxWidth, canvas.height / viewBoxHeight);
      const drawWidth = viewBoxWidth * scale;
      const drawHeight = viewBoxHeight * scale;
      const drawX = (canvas.width - drawWidth) / 2;
      const drawY = (canvas.height - drawHeight) / 2;
      ctx.drawImage(svgImage, drawX, drawY, drawWidth, drawHeight);
    }
    if (strokesImage) ctx.drawImage(strokesImage, 0, 0, canvas.width, canvas.height);
    return canvasAsBase64(canvas, 'jpeg', 0.86, true, true);
  } catch (err) {
    console.error('Error rendering drawing for PDF:', err);
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
};

/**
 * Generates a structured PDF document from a project object.
 */
// Conservamos temporalmente el generador anterior como referencia de compatibilidad.
// Rollup lo elimina del bundle al no estar exportado ni utilizarse.
const generateLegacyProjectPDF = async (project) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Load corporate logo
  const logoBase64 = await loadImageAsBase64('/BellHogar Claro.png');

  // Document Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(16, 16, 8); // Charcoal accent
  doc.text('INFORME DE MEDICIÓN', 15, 35);

  // General Metadata Section
  autoTable(doc, {
    startY: 42,
    head: [[{ content: 'DATOS GENERALES DEL CLIENTE Y PROYECTO', colSpan: 4, styles: { halign: 'left', fillColor: [16, 16, 8], textColor: [255, 255, 255] } }]],
    body: [
      [{ content: 'Cliente:', styles: { fontStyle: 'bold' } }, project.cliente || '', { content: 'Vendedor:', styles: { fontStyle: 'bold' } }, project.vendedor || ''],
      [{ content: 'Dirección:', styles: { fontStyle: 'bold' } }, project.direccion || '', { content: 'Tienda:', styles: { fontStyle: 'bold' } }, project.tienda || ''],
      [{ content: 'Móvil:', styles: { fontStyle: 'bold' } }, project.telefonoMovil || '', { content: 'Fecha Visita:', styles: { fontStyle: 'bold' } }, project.fechaVisita || ''],
      [{ content: 'Fijo:', styles: { fontStyle: 'bold' } }, project.telefonoFijo || '', { content: 'Fecha Ejecución:', styles: { fontStyle: 'bold' } }, project.fechaEjecucion || ''],
      [{ content: 'Email:', styles: { fontStyle: 'bold' } }, project.email || '', { content: 'Parquímetro:', styles: { fontStyle: 'bold' } }, project.zonaParquimetro || '']
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 25, fillColor: [247, 245, 239] },
      2: { cellWidth: 25, fillColor: [247, 245, 239] }
    }
  });

  // Loop through forms
  if (project.formularios && project.formularios.length > 0) {
    for (const form of project.formularios) {
      let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 100;

      // Force page split if too close to bottom
      if (currentY > 230) {
        doc.addPage();
        currentY = 30;
      }

      // Render gold header banner for the form
      doc.setFillColor(224, 192, 96); // BellHogar primary brand color
      doc.rect(15, currentY, 180, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 16, 8);
      doc.text(`FICHA: ${form.nombre.toUpperCase()} (${form.tipo.toUpperCase()})`, 18, currentY + 6);
      currentY += 12;

      // Render content based on type
      if (form.tipo === 'cocina') {
        const datos = form.datos;
        const appRows = [];

        // Formatting helpers
        const fmtOpt = (obj) => {
          if (!obj) return '';
          const opts = [];
          if (obj.presupuestar) opts.push('Presupuestar');
          if (obj.propiedadCliente) opts.push('Propiedad cliente');
          if (obj.techo) opts.push('En techo');
          if (obj.pared) opts.push('En pared');
          if (obj.isla) opts.push('En isla');
          if (obj.integrada) opts.push('Integrada');
          if (obj.telescopica) opts.push('Telescópica');
          if (obj.filtroCarbon) opts.push('Filtro carbón');
          if (obj.enPlaca) opts.push('En placa');
          if (obj.ancho30) opts.push('Ancho 30');
          if (obj.ancho60) opts.push('Ancho 60');
          if (obj.ancho90) opts.push('Ancho 90');
          if (obj.ancho45) opts.push('Ancho 45');
          if (obj.libre) opts.push('Libre');
          if (obj.integrado) opts.push('Integrado');
          if (obj.bajoPlaca) opts.push('Bajo placa');
          if (obj.columna) opts.push('Columna');
          if (obj.superior) opts.push('Sup.');
          if (obj.induccion) opts.push('Inducción');
          if (obj.radiante) opts.push('Radiante');
          if (obj.gas) opts.push('Gas');
          if (obj.otros) opts.push('Otros');
          if (obj.bajoEncimera) opts.push('Bajo encimera');
          if (obj.opticaEnrasada) opts.push('Enrasado');
          if (obj.sobreEncimera) opts.push('Sobre encimera');
          if (obj.unSeno) opts.push('Un seno');
          if (obj.dosSenos) opts.push('Dos senos');
          if (obj.enEncimera) opts.push('En encimera');
          if (obj.enPared) opts.push('En pared');
          return opts.join(', ');
        };

        const fmtMed = (obj) => {
          if (!obj) return '';
          const meds = [];
          if (obj.alto) meds.push(`H: ${obj.alto}`);
          if (obj.ancho) meds.push(`W: ${obj.ancho}`);
          if (obj.fondo) meds.push(`F: ${obj.fondo}`);
          if (obj.diametroSalida) meds.push(`Ø: ${obj.diametroSalida}mm`);
          if (obj.otras) meds.push(`Otras: ${obj.otras}`);
          return meds.join(', ');
        };

        if (datos.encimera) appRows.push(['ENCIMERA', '', datos.encimera, '']);
        if (datos.campana) {
          let medStr = fmtMed(datos.campana);
          if (datos.cubretuboMelaminico && (datos.cubretuboMelaminico.ancho || datos.cubretuboMelaminico.alto || datos.cubretuboMelaminico.fondo)) {
            medStr += `\nCubretubo melamínico: A:${datos.cubretuboMelaminico.ancho || '-'} H:${datos.cubretuboMelaminico.alto || '-'} F:${datos.cubretuboMelaminico.fondo || '-'}`;
          }
          appRows.push(['CAMPANA EXTRACTORA', fmtOpt(datos.campana), medStr, datos.campana.observaciones || '']);
        }
        if (datos.lavavajillas) appRows.push(['LAVAVAJILLAS', fmtOpt(datos.lavavajillas), '', datos.lavavajillas.observaciones || '']);
        if (datos.lavadora) appRows.push(['LAVADORA', fmtOpt(datos.lavadora), '', datos.lavadora.observaciones || '']);
        if (datos.secadora) appRows.push(['SECADORA', fmtOpt(datos.secadora), '', datos.secadora.observaciones || '']);
        if (datos.frigorifico) appRows.push(['FRIGORÍFICO', fmtOpt(datos.frigorifico), fmtMed(datos.frigorifico), datos.frigorifico.observaciones || '']);
        if (datos.horno) appRows.push(['HORNO', fmtOpt(datos.horno), '', datos.horno.observaciones || '']);
        if (datos.microondas) appRows.push(['MICROONDAS', fmtOpt(datos.microondas), '', datos.microondas.observaciones || '']);
        if (datos.placa) appRows.push(['PLACA', fmtOpt(datos.placa), '', datos.placa.observaciones || '']);
        if (datos.fregadero) appRows.push(['FREGADERO', fmtOpt(datos.fregadero), '', datos.fregadero.observaciones || '']);
        if (datos.grifo) appRows.push(['GRIFO', fmtOpt(datos.grifo), '', datos.grifo.observaciones || '']);

        autoTable(doc, {
          startY: currentY,
          head: [['Elemento', 'Opciones', 'Medidas / Detalles', 'Observaciones']],
          body: appRows,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [85, 82, 75] }
        });

        // FAQs Section
        currentY = doc.lastAutoTable.finalY + 8;
        if (currentY > 230) {
          doc.addPage();
          currentY = 30;
        }

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Preguntas Frecuentes Cocina:', 15, currentY);
        currentY += 4;

        const fmtBool = (val) => val ? 'SÍ' : 'NO';
        const faqBody = [
          ['¿Obra en la cocina?', fmtBool(datos.preguntas?.obraCocina), '¿Demoler mobiliario?', fmtBool(datos.preguntas?.demolerMobiliario)],
          ['Altura de la cocina:', datos.preguntas?.alturaCocina || '', '', ''],
          ['¿Desean comer en cocina?', fmtBool(datos.preguntas?.deseanComerCocina) + (datos.preguntas?.deseanComerCocina ? ` (${datos.preguntas.comerDetalle?.mesa ? 'Mesa' : ''}${datos.preguntas.comerDetalle?.barra ? 'Barra' : ''} - Personas: ${datos.preguntas.comerDetalle?.personas})` : ''), '', ''],
          ['Instalación agua/calefacc.:', (datos.preguntas?.instalacionAgua || '') + (datos.preguntas?.instalacionAgua === 'Otros' ? `: ${datos.preguntas.instalacionAguaOtros}` : ''), '', '']
        ];

        autoTable(doc, {
          startY: currentY,
          body: faqBody,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 50, fillColor: [247, 245, 239], fontStyle: 'bold' },
            2: { cellWidth: 50, fillColor: [247, 245, 239], fontStyle: 'bold' }
          }
        });

      } else if (form.tipo === 'puertas') {
        const datos = form.datos;

        // Details Grid
        const techBody = [
          ['Acabado:', `${datos.acabado.barnizado ? 'Barnizado' : ''} ${datos.acabado.madera ? `(${datos.acabado.madera})` : ''} ${datos.acabado.lacado ? 'Lacado' : ''} ${datos.acabado.color ? `(${datos.acabado.color})` : ''}`.trim(), 'Herrajes:', `${datos.herrajes.laton ? 'Latón' : ''} ${datos.herrajes.cromo ? 'Cromo' : ''} ${datos.herrajes.negro ? 'Negro' : ''} ${datos.herrajes.bronce ? 'Bronce' : ''} ${datos.herrajes.otros ? `Otros: ${datos.herrajes.otros}` : ''}`.trim()],
          ['Jambas:', `Molduras: ${datos.jambas.molduras || 'No'} | Tapeta: ${datos.jambas.tapeta || 'No'} | Cabecero: ${datos.jambas.cabecero || 'No'} | Corte: ${datos.jambas.corteInglete ? 'Inglete' : ''} ${datos.jambas.corteRecto ? 'Recto' : ''} | Medida: ${datos.jambas.tapeta7cm ? '7cm' : ''} ${datos.jambas.tapeta9cm ? '9cm' : ''} | Otros: ${datos.jambas.otros || 'No'}`.trim(), 'Bisagras:', `${datos.bisagras.vista ? 'Vista' : ''} ${datos.bisagras.oculta ? 'Oculta' : ''}`.trim()],
          ['Instalación:', `Desmontaje: ${datos.instalacion.desmontaje ? 'SÍ' : 'NO'} | Cerco: ${datos.instalacion.cerco ? 'SÍ' : 'NO'} | Albañilería: ${datos.instalacion.albanileria ? 'SÍ' : 'NO'}`.trim(), 'Petaca/Cierre:', `Resbalón: ${datos.petaca.resbalon ? 'SÍ' : 'NO'} | Imán: ${datos.petaca.iman ? 'SÍ' : 'NO'} | Rodillo: ${datos.petaca.rodillo ? 'SÍ' : 'NO'}`.trim()],
          ['Cerco premarcos:', `Estándar: ${datos.cerco.estandar ? 'SÍ' : 'NO'} | Hidrófugo: ${datos.cerco.hidrofugo ? 'SÍ' : 'NO'} | Nudillo: ${datos.cerco.nudillo ? 'SÍ' : 'NO'} | Junta Goma: ${datos.cerco.juntaGoma ? 'SÍ' : 'NO'} | Descejado: ${datos.cerco.descejado ? 'SÍ' : 'NO'}`.trim(), '', '']
        ];

        autoTable(doc, {
          startY: currentY,
          body: techBody,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 25, fillColor: [247, 245, 239], fontStyle: 'bold' },
            2: { cellWidth: 25, fillColor: [247, 245, 239], fontStyle: 'bold' }
          }
        });

        // Lines Table
        currentY = doc.lastAutoTable.finalY + 8;
        if (currentY > 230) {
          doc.addPage();
          currentY = 30;
        }

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Medidas de Puertas:', 15, currentY);
        currentY += 4;

        const lineasBody = datos.lineasPuertas.map(l => [
          l.cantidad || '', l.apertura || '', l.medida || '', l.tipo || '', l.zona || '', l.cerco || '', l.observaciones || ''
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Cant.', 'Apertura', 'Medida', 'Tipo', 'Zona', 'Cerco', 'Observaciones']],
          body: lineasBody,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [85, 82, 75] }
        });

      } else if (form.tipo === 'reforma') {
        const respuestas = form.datos?.respuestas || {};
        const formatValue = (value) => {
          if (value === true) return 'SÍ';
          if (value === false) return 'NO';
          if (value && typeof value === 'object') {
            return Object.entries(value).filter(([, active]) => active).map(([key]) => key).join(', ');
          }
          return value || '';
        };
        const label = (key) => key.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
        const rows = Object.entries(respuestas)
          .filter(([, value]) => formatValue(value) !== '')
          .map(([key, value]) => [label(key), formatValue(value)]);

        autoTable(doc, {
          startY: currentY,
          head: [[`Cuestionario de reforma: ${(form.subtipo || 'completa').toUpperCase()}`, 'Respuesta']],
          body: rows.length ? rows : [['Sin respuestas todavía', '']],
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [85, 82, 75] },
          columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' } }
        });

      } else if (form.tipo === 'tarimas') {
        const datos = form.datos;

        // Details Grid
        const techBody = [
          ['Modelo Tarima:', `Tipo: ${datos.modeloTarima.tipo || ''} | Acabado: ${datos.modeloTarima.acabado || ''} | Grosor: ${datos.modeloTarima.grosor || ''} | Aislante: ${datos.modeloTarima.aislante || ''}`.trim(), 'Rodapié:', `Modelo: ${datos.rodapie.modelo || ''} | Alto: ${datos.rodapie.alto || ''} | Grosor: ${datos.rodapie.grosor || ''} | Color: ${datos.rodapie.color || ''} | Quitar rodapié: ${datos.preparacionSuelo?.quitarRodapieCeramicoYRematar ? 'SÍ' : 'NO'}`.trim()],
          ['Juntas:', `Transición: ${datos.juntas.transicion ? 'SÍ' : 'NO'} | Dilatación: ${datos.juntas.dilatacion ? 'SÍ' : 'NO'} | Mamperlán Tira: ${datos.juntas.tira ? 'SÍ' : 'NO'} | Mamperlán Mecanizado: ${datos.juntas.mecanizado ? 'SÍ' : 'NO'}`.trim(), 'Cortes/Servicios:', `Picado Suelo: ${datos.preparacionSuelo?.picadoSuelo ? 'SÍ' : 'NO'} | Corte Puertas: ${datos.cortesServicios?.cortePuertas ? 'SÍ' : 'NO'} | Echar Solera: ${datos.preparacionSuelo?.echarSolera ? 'SÍ' : 'NO'} | Corte Puertas Blindadas: ${datos.cortesServicios?.cortePuertasBlindadas ? 'SÍ' : 'NO'} | Echar Pasta Niveladora: ${datos.preparacionSuelo?.echarPastaNiveladora ? 'SÍ' : 'NO'} | Movimiento Muebles: ${datos.cortesServicios?.movimientoMuebles ? 'SÍ' : 'NO'}`.trim()],
          ['Desmontaje suelo:', `${datos.bisagras?.desmontajeSuelo ? 'SÍ' : 'NO'}${datos.bisagras?.desmontajeSueloTipo ? ` | Tipo: ${datos.bisagras.desmontajeSueloTipo}` : ''}`, 'Colocación sobre:', `${datos.preparacionSuelo?.colocacionSobre || ''} ${datos.preparacionSuelo?.colocacionSobreOtros ? `(${datos.preparacionSuelo.colocacionSobreOtros})` : ''}`.trim()]
        ];

        autoTable(doc, {
          startY: currentY,
          body: techBody,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 25, fillColor: [247, 245, 239], fontStyle: 'bold' },
            2: { cellWidth: 25, fillColor: [247, 245, 239], fontStyle: 'bold' }
          }
        });

        // Lines Table
        currentY = doc.lastAutoTable.finalY + 8;
        if (currentY > 230) {
          doc.addPage();
          currentY = 30;
        }

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Medidas de Suelos (Tarima):', 15, currentY);
        currentY += 4;

        const lineasBody = datos.lineasTarima.map(l => {
          let medidaStr = l.medida || '';
          if (l.ml) {
            medidaStr += ` (${l.ml} ml / ${l.m2} m²)`;
          }
          return [
            l.zona || '', medidaStr, l.observaciones || ''
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [['Zona', 'Medidas suelos', 'Observaciones']],
          body: lineasBody,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [85, 82, 75] }
        });
      }

      // General observations for the form if any
      if (form.datos?.observacionesGenerales) {
        currentY = doc.lastAutoTable.finalY + 6;
        if (currentY > 250) {
          doc.addPage();
          currentY = 30;
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Observaciones:', 15, currentY);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        const splitText = doc.splitTextToSize(form.datos.observacionesGenerales, 180);
        doc.text(splitText, 15, currentY + 4);
        doc.lastAutoTable.finalY = currentY + 4 + (splitText.length * 4.5);
      }

      // Render drawings (Sketches & Annotations) directly inside the PDF if they exist!
      if (form.dibujos) {
        const dUrls = [];
        
        // Bocetos
        if (form.dibujos.bocetoPages && form.dibujos.bocetoPages.length > 0) {
          form.dibujos.bocetoPages.forEach((page, idx) => {
            if (page.url) {
              const pageTitle = form.dibujos.bocetoPages.length > 1 ? `Boceto de Plano (Pág. ${idx + 1})` : 'Boceto de Plano';
              dUrls.push({ title: pageTitle, url: page.url, cropToContent: true });
            }
          });
        } else if (form.dibujos.bocetoUrl) {
          dUrls.push({ title: 'Boceto de Plano', url: form.dibujos.bocetoUrl, cropToContent: true });
        }

        // Anotaciones
        if (form.dibujos.anotacionesPages && form.dibujos.anotacionesPages.length > 0) {
          form.dibujos.anotacionesPages.forEach((page, idx) => {
            if (page.url) {
              const pageTitle = form.dibujos.anotacionesPages.length > 1 ? `Anotaciones / Croquis (Pág. ${idx + 1})` : 'Anotaciones / Croquis';
              dUrls.push({ title: pageTitle, url: page.url });
            }
          });
        } else if (form.dibujos.anotacionesUrl) {
          dUrls.push({ title: 'Anotaciones / Croquis', url: form.dibujos.anotacionesUrl });
        }

        for (const item of dUrls) {
          const base64Img = await loadImageAsBase64(item.url, 'jpeg', 0.75, item.cropToContent);
          if (base64Img) {
            currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 8;
            if (currentY > 185) {
              doc.addPage();
              currentY = 30;
            }
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(`${item.title}:`, 15, currentY);
            // Size: 100mm width, 75mm height fits perfectly on A4
            doc.addImage(base64Img, 'JPEG', 15, currentY + 3, 100, 75);
            doc.lastAutoTable = { finalY: currentY + 3 + 75 };
          }
        }
      }
    }
  }

  // Draw headers & footers dynamically across all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Gold primary divider line under header
    doc.setDrawColor(224, 192, 96);
    doc.setLineWidth(0.4);
    doc.line(15, 22, 195, 22);

    // Header Metadata
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(85, 82, 75);
    doc.text('BELLHOGAR - INFORME TÉCNICO DE MEDICIÓN', 15, 17);

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 155, 8, 40, 11);
    }

    // Footer Divider
    doc.line(15, 280, 195, 280);

    // Footer Text
    doc.text(`Página ${i} de ${totalPages}`, 15, 285);
    doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 145, 285);
  }

  return doc.output('blob');
};

export const generateProjectPDF = async (project, options = {}) => generateFilteredProjectPDF(project, {
  loadImage: loadImageAsBase64,
  loadDrawing: renderDrawingForPDF
}, options);

/**
 * Uploads a PDF blob to Firebase Storage and returns the public download URL.
 */
export const uploadPDFToStorage = async (projectId, clientName, pdfBlob) => {
  const sanitizedClient = (clientName || 'Cliente').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filePath = `projects/${projectId}/summaries/Resumen_Medicion_${sanitizedClient}_${Date.now()}.pdf`;
  const fileRef = storageRef(storage, filePath);
  
  await uploadBytes(fileRef, pdfBlob);
  const downloadUrl = await getDownloadURL(fileRef);
  return downloadUrl;
};

/**
 * Triggers the EmailJS REST API to send the notification with the links.
 */
export const sendSummaryEmail = async (toEmail, project, pdfUrl) => {
  // Format attachment links for the body as HTML list
  let linksHtml = '<ul style="margin: 0; padding-left: 20px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333;">';
  let hasAttachments = false;
  if (project.formularios && project.formularios.length > 0) {
    project.formularios.forEach(f => {
      let formLinks = '';
      
      // Bocetos
      if (f.dibujos?.bocetoPages && f.dibujos.bocetoPages.length > 0) {
        f.dibujos.bocetoPages.forEach((page, idx) => {
          if (page.url) {
            const pageTitle = f.dibujos.bocetoPages.length > 1 ? `Ver Boceto de Plano (Pág. ${idx + 1})` : 'Ver Boceto de Plano';
            formLinks += `<li><a href="${page.url}" target="_blank" style="color: #e0c060; font-weight: bold; text-decoration: none;">${pageTitle}</a></li>`;
          }
        });
      } else if (f.dibujos?.bocetoUrl) {
        formLinks += `<li><a href="${f.dibujos.bocetoUrl}" target="_blank" style="color: #e0c060; font-weight: bold; text-decoration: none;">Ver Boceto de Plano</a></li>`;
      }

      // Anotaciones
      if (f.dibujos?.anotacionesPages && f.dibujos.anotacionesPages.length > 0) {
        f.dibujos.anotacionesPages.forEach((page, idx) => {
          if (page.url) {
            const pageTitle = f.dibujos.anotacionesPages.length > 1 ? `Ver Anotaciones / Croquis (Pág. ${idx + 1})` : 'Ver Anotaciones / Croquis';
            formLinks += `<li><a href="${page.url}" target="_blank" style="color: #e0c060; font-weight: bold; text-decoration: none;">${pageTitle}</a></li>`;
          }
        });
      } else if (f.dibujos?.anotacionesUrl) {
        formLinks += `<li><a href="${f.dibujos.anotacionesUrl}" target="_blank" style="color: #e0c060; font-weight: bold; text-decoration: none;">Ver Anotaciones / Croquis</a></li>`;
      }

      if (f.archivos && f.archivos.length > 0) {
        formLinks += `<li style="margin-top: 5px;"><strong>Archivos adjuntos:</strong><ul style="padding-left: 15px; margin-top: 5px; list-style-type: circle;">`;
        f.archivos.forEach(a => {
          formLinks += `<li><a href="${a.url}" target="_blank" style="color: #666666; text-decoration: underline;">${a.nombre}</a></li>`;
        });
        formLinks += `</ul></li>`;
      }
      if (formLinks) {
        linksHtml += `<li style="margin-bottom: 12px;"><strong>Ficha: ${f.nombre}</strong> (${f.tipo.toUpperCase()})<ul style="padding-left: 15px; margin-top: 5px; list-style-type: square;">${formLinks}</ul></li>`;
        hasAttachments = true;
      }
    });
  }
  linksHtml += '</ul>';
  if (!hasAttachments) {
    linksHtml = '<p style="font-family: Arial, sans-serif; font-size: 14px; color: #777777; margin: 0;">No se encontraron planos ni archivos adjuntos en esta medición.</p>';
  }

  // Setup template params
  const templateParams = {
    to_email: toEmail,
    cliente_name: project.cliente || 'Cliente',
    cliente_direccion: project.direccion || 'Dirección no especificada',
    vendedor: project.vendedor || 'Técnico BellHogar',
    vendedor_email: project.email || 'carlosanchezcatala@gmail.com',
    pdf_link: pdfUrl,
    adjuntos_links: linksHtml
  };

  const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: templateParams
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/pdf', // EmailJS requires standard POST body
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de EmailJS: ${response.statusText} (${errorText})`);
  }
};
