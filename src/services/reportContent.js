const clean = (value) => {
  if (value === null || value === undefined || value === false) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  return '';
};

const join = (values, separator = ', ') => values.map(clean).filter(Boolean).join(separator);

const selected = (source, options) => join(
  options.filter(([key]) => source?.[key]).map(([, label]) => label)
);

const measurement = (label, value, suffix = '') => {
  const normalized = clean(value);
  return normalized ? `${label}: ${normalized}${suffix}` : '';
};

const populatedRow = (values) => values.some(value => clean(value));

const parseNumber = value => {
  const normalized = clean(value).replace(',', '.');
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

const formatTotal = value => Number(value.toFixed(2)).toString().replace('.', ',');

const section = (title, body, head = null) => {
  const rows = (body || []).filter(row => populatedRow(row));
  return rows.length ? { title, body: rows, head } : null;
};

const cocinaSections = (datos = {}) => {
  const applianceOptions = [
    ['presupuestar', 'Presupuestar'], ['propiedadCliente', 'Propiedad cliente'],
    ['techo', 'En techo'], ['pared', 'En pared'], ['isla', 'En isla'],
    ['integrada', 'Integrada'], ['telescopica', 'Telescópica'],
    ['filtroCarbon', 'Filtro carbón'], ['enPlaca', 'En placa'],
    ['ancho30', 'Ancho 30'], ['ancho45', 'Ancho 45'], ['ancho60', 'Ancho 60'],
    ['ancho90', 'Ancho 90'], ['libre', 'Libre instalación'], ['integrado', 'Integrado'],
    ['bajoPlaca', 'Bajo placa'], ['columna', 'En columna'], ['superior', 'En mueble superior'],
    ['induccion', 'Inducción'], ['radiante', 'Radiante'], ['gas', 'Gas'], ['otros', 'Otros'],
    ['bajoEncimera', 'Bajo encimera'], ['opticaEnrasada', 'Enrasado'],
    ['sobreEncimera', 'Sobre encimera'], ['unSeno', 'Un seno'], ['dosSenos', 'Dos senos'],
    ['enEncimera', 'En encimera'], ['enPared', 'En pared']
  ];
  const measures = item => join([
    measurement('Alto', item?.alto), measurement('Ancho', item?.ancho),
    measurement('Fondo', item?.fondo), measurement('Diám. salida', item?.diametroSalida, ' mm'),
    measurement('Otras', item?.otras)
  ]);
  const applianceRows = [];
  if (clean(datos.encimera)) applianceRows.push(['ENCIMERA', '', clean(datos.encimera), '']);

  const appliances = [
    ['CAMPANA EXTRACTORA', 'campana'], ['LAVAVAJILLAS', 'lavavajillas'],
    ['LAVADORA', 'lavadora'], ['SECADORA', 'secadora'], ['FRIGORÍFICO', 'frigorifico'],
    ['HORNO', 'horno'], ['MICROONDAS', 'microondas'], ['PLACA', 'placa'],
    ['FREGADERO', 'fregadero'], ['GRIFO', 'grifo']
  ];
  appliances.forEach(([label, key]) => {
    const item = datos[key] || {};
    let details = measures(item);
    if (key === 'campana') {
      const cover = datos.cubretuboMelaminico || {};
      const coverMeasures = join([
        measurement('Ancho', cover.ancho), measurement('Alto', cover.alto),
        measurement('Fondo', cover.fondo)
      ]);
      if (coverMeasures) details = join([details, `Cubretubo melamínico: ${coverMeasures}`], ' · ');
    }
    const row = [label, selected(item, applianceOptions), details, clean(item.observaciones)];
    if (populatedRow(row.slice(1))) applianceRows.push(row);
  });

  const preguntas = datos.preguntas || {};
  const faqRows = [];
  if (preguntas.obraCocina) faqRows.push(['¿Van a realizar obra en la cocina actual?', 'SÍ']);
  if (preguntas.demolerMobiliario) faqRows.push(['¿Hay que demoler el mobiliario existente?', 'SÍ']);
  if (preguntas.deseanComerCocina) {
    const detalle = join([
      preguntas.comerDetalle?.mesa ? 'Mesa' : '',
      preguntas.comerDetalle?.barra ? 'Barra' : '',
      measurement('Personas', preguntas.comerDetalle?.personas)
    ]);
    faqRows.push(['¿Desean comer en la cocina?', join(['SÍ', detalle], ' · ')]);
  }
  if (clean(preguntas.alturaCocina)) faqRows.push(['Altura de la cocina', clean(preguntas.alturaCocina)]);
  const installation = clean(preguntas.instalacionAgua);
  if (installation && installation !== 'Termo') {
    faqRows.push([
      'Instalación de agua/calefacción',
      installation === 'Otros'
        ? join([installation, clean(preguntas.instalacionAguaOtros)], ': ')
        : installation
    ]);
  }

  return [
    section('Electrodomésticos y complementos', applianceRows, ['Elemento', 'Opciones', 'Medidas / detalles', 'Observaciones']),
    section('Preguntas frecuentes de cocina', faqRows, ['Pregunta', 'Respuesta'])
  ].filter(Boolean);
};

const puertasSections = (datos = {}) => {
  const detailRows = [];
  const add = (label, values) => {
    const value = join(values);
    if (value) detailRows.push([label, value]);
  };
  add('Acabado', [
    datos.acabado?.barnizado ? 'Barnizado' : '', measurement('Madera', datos.acabado?.madera),
    datos.acabado?.lacado ? 'Lacado' : '', measurement('Color', datos.acabado?.color)
  ]);
  add('Herrajes', [
    selected(datos.herrajes, [['laton', 'Latón'], ['cromo', 'Cromo'], ['negro', 'Negro'], ['bronce', 'Bronce']]),
    measurement('Otros', datos.herrajes?.otros)
  ]);
  add('Jambas', [
    selected(datos.jambas, [
      ['molduras', 'Molduras'], ['tapeta', 'Tapeta'], ['tapeta7cm', 'Tapeta 7 cm'],
      ['tapeta9cm', 'Tapeta 9 cm'], ['corteInglete', 'Corte a inglete'], ['corteRecto', 'Corte recto']
    ]),
    measurement('Cabecero', datos.jambas?.cabecero), measurement('Otros', datos.jambas?.otros)
  ]);
  add('Bisagras', [selected(datos.bisagras, [['vista', 'Vista'], ['oculta', 'Oculta']])]);
  add('Petaca', [selected(datos.petaca, [['resbalon', 'Resbalón'], ['rodillo', 'Rodillo'], ['iman', 'Imán']])]);
  add('Cerco', [selected(datos.cerco, [['estandar', 'Estándar'], ['hidrofugo', 'Hidrófugo'], ['juntaGoma', 'Junta de goma']])]);
  add('Instalación', [selected(datos.instalacion, [
    ['nudillo', 'Nudillo'], ['desmontaje', 'Desmontaje'], ['descejado', 'Descejado'], ['albanileria', 'Albañilería']
  ])]);

  const lineRows = (datos.lineasPuertas || [])
    .map(line => [
      clean(line.cantidad), clean(line.apertura), clean(line.medida), clean(line.tipo),
      clean(line.zona), clean(line.cerco), clean(line.observaciones)
    ])
    .filter(populatedRow);

  return [
    section('Características', detailRows, ['Concepto', 'Datos seleccionados']),
    section('Medidas de puertas', lineRows, ['Cant.', 'Apertura', 'Medida', 'Tipo', 'Zona', 'Cerco', 'Observaciones'])
  ].filter(Boolean);
};

const reformaSections = (form) => {
  const formatValue = value => {
    if (value === true) return 'SÍ';
    if (value === false || value === null || value === undefined) return '';
    if (Array.isArray(value)) return join(value);
    if (typeof value === 'object') {
      return join(Object.entries(value).filter(([, active]) => active).map(([key]) => label(key)));
    }
    return clean(value);
  };
  const label = key => key.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  const rows = Object.entries(form.datos?.respuestas || {})
    .map(([key, value]) => [label(key), formatValue(value)])
    .filter(([, value]) => Boolean(clean(value)));
  const subtype = clean(form.subtipo) || 'completa';
  const result = section(`Cuestionario de reforma: ${subtype.toUpperCase()}`, rows, ['Pregunta', 'Respuesta']);
  return result ? [result] : [];
};

const tarimasSections = (datos = {}) => {
  const detailRows = [];
  const add = (label, values) => {
    const value = join(values);
    if (value) detailRows.push([label, value]);
  };
  add('Modelo de tarima', [
    measurement('Tipo', datos.modeloTarima?.tipo), measurement('Acabado', datos.modeloTarima?.acabado),
    measurement('Grosor', datos.modeloTarima?.grosor), measurement('Aislante', datos.modeloTarima?.aislante)
  ]);
  add('Rodapié', [
    measurement('Modelo', datos.rodapie?.modelo), measurement('Color', datos.rodapie?.color),
    measurement('Alto', datos.rodapie?.alto), measurement('Grosor', datos.rodapie?.grosor),
    datos.rodapie?.quitarRodapie ? 'Quitar rodapié cerámico y rematar' : ''
  ]);
  add('Juntas', [
    datos.juntas?.transicion ? join(['Transición', measurement('Uds.', datos.juntas.transicionUds)], ' · ') : '',
    datos.juntas?.dilatacion ? join(['Dilatación', measurement('Uds.', datos.juntas.dilatacionUds)], ' · ') : '',
    datos.juntas?.mamperlanTira ? join(['Mamperlán tira', measurement('Uds.', datos.juntas.mamperlanTiraUds)], ' · ') : '',
    datos.juntas?.mamperlanMecanizado ? join(['Mamperlán mecanizado', measurement('Uds.', datos.juntas.mamperlanMecanizadoUds)], ' · ') : ''
  ]);

  const extras = datos.bisagras || {};
  add('Extras', [
    extras.desmontajeSuelo ? join(['Desmontaje de suelo', measurement('Uds.', extras.desmontajeSueloUds), measurement('Tipo', extras.desmontajeSueloTipo)], ' · ') : '',
    extras.picadoSuelo ? join(['Picado de suelo', measurement('m²', extras.picadoSueloM2)], ' · ') : '',
    extras.cortePuertas ? join(['Corte de puertas', measurement('Uds.', extras.cortePuertasUds)], ' · ') : '',
    extras.echarSolera ? join(['Echar solera', measurement('m²', extras.echarSoleraM2)], ' · ') : '',
    extras.cortePuertasBlindadas ? join(['Corte de puertas blindadas', measurement('Uds.', extras.cortePuertasBlindadasUds)], ' · ') : '',
    extras.echarPastaNiveladora ? join(['Pasta niveladora', measurement('m²', extras.echarPastaNiveladoraM2)], ' · ') : '',
    extras.movimientoMuebles ? 'Movimiento de muebles existentes' : '',
    clean(extras.observaciones) ? `Observaciones: ${clean(extras.observaciones)}` : ''
  ]);
  if (clean(extras.colocacionSobre) && extras.colocacionSobre !== 'Parquet') {
    add('Colocación sobre', [
      extras.colocacionSobre,
      extras.colocacionSobre === 'Otros' ? clean(extras.colocacionSobreOtros) : ''
    ]);
  }

  const lineRows = (datos.lineasTarima || [])
    .map(line => [clean(line.zona), clean(line.medida), clean(line.ml), clean(line.m2), clean(line.observaciones)])
    .filter(populatedRow);

  const numericLines = (datos.lineasTarima || []).map(line => ({
    ml: parseNumber(line.ml),
    m2: parseNumber(line.m2)
  }));
  const hasMl = numericLines.some(line => line.ml !== null);
  const hasM2 = numericLines.some(line => line.m2 !== null);
  if (lineRows.length && (hasMl || hasM2)) {
    const totalMl = numericLines.reduce((sum, line) => sum + (line.ml ?? 0), 0);
    const totalM2 = numericLines.reduce((sum, line) => sum + (line.m2 ?? 0), 0);
    lineRows.push(['TOTAL', '', hasMl ? formatTotal(totalMl) : '', hasM2 ? formatTotal(totalM2) : '', '']);
  }

  return [
    section('Características', detailRows, ['Concepto', 'Datos seleccionados']),
    section('Medidas de suelos', lineRows, ['Zona', 'Medidas', 'ml', 'm²', 'Observaciones'])
  ].filter(Boolean);
};

const drawingItems = (drawings = {}) => {
  const items = [];
  const svgFromPage = page => {
    const value = clean(page?.textoReconocido);
    return value.startsWith('<svg') ? value : '';
  };
  const appendPages = (pages, legacyUrl, title, cropToContent, includeSvg = false) => {
    const validPages = (pages || []).filter(page => clean(page?.url) || (includeSvg && svgFromPage(page)));
    if (validPages.length) {
      validPages.forEach((page, index) => items.push({
        title: validPages.length > 1 ? `${title} (Pág. ${index + 1})` : title,
        url: clean(page.url),
        svg: includeSvg ? svgFromPage(page) : '',
        cropToContent
      }));
    } else if (clean(legacyUrl)) {
      items.push({ title, url: clean(legacyUrl), cropToContent });
    }
  };
  appendPages(drawings.bocetoPages, drawings.bocetoUrl, 'Boceto de plano', true, true);
  appendPages(drawings.anotacionesPages, drawings.anotacionesUrl, 'Anotaciones / croquis', false);
  return items;
};

const recognizedTextRows = (drawings = {}) => {
  const rows = [];
  const append = (pages, prefix) => (pages || []).forEach((page, index) => {
    const value = clean(page?.textoReconocido);
    if (value) rows.push([`${prefix} ${index + 1}`, value]);
  });
  append(drawings.anotacionesPages, 'Anotaciones pág.');
  return rows;
};

const formSections = form => {
  const datos = form.datos || {};
  let sections = [];
  if (form.tipo === 'cocina') sections = cocinaSections(datos);
  else if (form.tipo === 'puertas') sections = puertasSections(datos);
  else if (form.tipo === 'tarimas') sections = tarimasSections(datos);
  else if (form.tipo === 'reforma') sections = reformaSections(form);

  const observations = clean(datos.observacionesGenerales);
  if (observations) sections.push({ title: 'Observaciones', text: observations });

  const recognized = recognizedTextRows(form.dibujos);
  const recognizedSection = section('Texto reconocido', recognized, ['Página', 'Contenido']);
  if (recognizedSection) sections.push(recognizedSection);

  const attachments = (form.archivos || [])
    .filter(file => clean(file?.nombre) || clean(file?.url))
    .map(file => [clean(file.nombre) || 'Archivo adjunto']);
  const attachmentSection = section('Archivos adjuntos', attachments, ['Archivo']);
  if (attachmentSection) sections.push(attachmentSection);
  return sections;
};

export const buildProjectReportModel = (project = {}) => {
  const general = [
    ['Cliente', project.cliente], ['Vendedor', project.vendedor], ['Dirección', project.direccion],
    ['Tienda', project.tienda], ['Móvil', project.telefonoMovil], ['Fecha de visita', project.fechaVisita],
    ['Fijo', project.telefonoFijo], ['Fecha de ejecución', project.fechaEjecucion],
    ['Email', project.email], ['Parquímetro', project.zonaParquimetro]
  ].map(([label, value]) => [label, clean(value)]).filter(([, value]) => Boolean(value));

  const forms = (project.formularios || []).map(form => {
    const sections = formSections(form);
    const drawings = drawingItems(form.dibujos);
    if (!sections.length && !drawings.length) return null;
    return {
      name: clean(form.nombre) || 'Ficha sin nombre',
      type: clean(form.tipo) || 'varios',
      sections,
      drawings
    };
  }).filter(Boolean);

  return { general, forms };
};

export const formHasReportContent = form => Boolean(buildProjectReportModel({ formularios: [form] }).forms.length);
