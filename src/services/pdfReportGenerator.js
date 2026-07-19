import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildProjectReportModel } from './reportContent.js';

const PAGE_BOTTOM = 274;

export const generateFilteredProjectPDF = async (project, loaders = {}) => {
  const loadImage = typeof loaders === 'function' ? loaders : loaders.loadImage;
  const loadDrawing = typeof loaders === 'object' ? loaders.loadDrawing : null;
  const model = buildProjectReportModel(project);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logoBase64 = loadImage ? await loadImage('/BellHogar Claro.png') : null;
  let cursorY = 35;

  const ensureSpace = (height = 16) => {
    if (cursorY + height <= PAGE_BOTTOM) return;
    doc.addPage();
    cursorY = 30;
  };

  const renderSectionTitle = title => {
    ensureSpace(10);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 16, 8);
    doc.text(title, 15, cursorY);
    cursorY += 4;
  };

  const renderTable = section => {
    renderSectionTitle(section.title);
    autoTable(doc, {
      startY: cursorY,
      head: section.head ? [section.head] : undefined,
      body: section.body,
      theme: 'grid',
      margin: { left: 15, right: 15, top: 28, bottom: 23 },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: [85, 82, 75], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [247, 245, 239] }
    });
    cursorY = doc.lastAutoTable.finalY + 8;
  };

  const renderText = section => {
    renderSectionTitle(section.title);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(section.text, 180);
    lines.forEach(line => {
      ensureSpace(5);
      doc.text(line, 15, cursorY + 1);
      cursorY += 4.5;
    });
    cursorY += 4;
  };

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(16, 16, 8);
  doc.text('INFORME DE MEDICIÓN', 15, cursorY);
  cursorY += 7;

  if (model.general.length) {
    const generalRows = [];
    for (let index = 0; index < model.general.length; index += 2) {
      const first = model.general[index];
      const second = model.general[index + 1];
      generalRows.push([
        { content: `${first[0]}:`, styles: { fontStyle: 'bold' } }, first[1],
        second ? { content: `${second[0]}:`, styles: { fontStyle: 'bold' } } : '', second?.[1] || ''
      ]);
    }
    autoTable(doc, {
      startY: cursorY,
      head: [[{
        content: 'DATOS GENERALES DEL CLIENTE Y PROYECTO',
        colSpan: 4,
        styles: { halign: 'left', fillColor: [16, 16, 8], textColor: [255, 255, 255] }
      }]],
      body: generalRows,
      theme: 'grid',
      margin: { left: 15, right: 15, top: 28, bottom: 23 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 28, fillColor: [247, 245, 239] },
        2: { cellWidth: 28, fillColor: [247, 245, 239] }
      }
    });
    cursorY = doc.lastAutoTable.finalY + 12;
  } else {
    cursorY += 6;
  }

  for (const form of model.forms) {
    const renderedDrawings = [];
    for (const drawing of form.drawings) {
      const image = loadDrawing
        ? await loadDrawing(drawing)
        : (loadImage ? await loadImage(drawing.url, 'jpeg', 0.82, drawing.cropToContent, true) : null);
      if (image) renderedDrawings.push({ ...drawing, image });
    }
    if (!form.sections.length && !renderedDrawings.length) continue;

    ensureSpace(18);
    doc.setFillColor(224, 192, 96);
    doc.rect(15, cursorY, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(16, 16, 8);
    doc.text(`FICHA: ${form.name.toUpperCase()} (${form.type.toUpperCase()})`, 18, cursorY + 6);
    cursorY += 14;

    form.sections.forEach(section => {
      if (section.text) renderText(section);
      else renderTable(section);
    });

    for (const drawing of renderedDrawings) {
      const properties = doc.getImageProperties(drawing.image);
      const ratio = properties.width / properties.height || 4 / 3;
      let imageWidth = 180;
      let imageHeight = imageWidth / ratio;
      if (imageHeight > 120) {
        imageHeight = 120;
        imageWidth = imageHeight * ratio;
      }
      ensureSpace(imageHeight + 12);
      renderSectionTitle(drawing.title);
      doc.addImage(drawing.image, 'JPEG', 15, cursorY, imageWidth, imageHeight);
      cursorY += imageHeight + 8;
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(224, 192, 96);
    doc.setLineWidth(0.4);
    doc.line(15, 22, 195, 22);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(85, 82, 75);
    doc.text('BELLHOGAR - INFORME TÉCNICO DE MEDICIÓN', 15, 17);
    if (logoBase64) doc.addImage(logoBase64, 'PNG', 155, 8, 40, 11);
    doc.line(15, 280, 195, 280);
    doc.text(`Página ${page} de ${totalPages}`, 15, 285);
    doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 145, 285);
  }

  return doc.output('blob');
};
