<template>
  <div class="reforma-cuestionario">
    <div class="d-flex align-center mb-4">
      <v-icon color="primary" class="mr-2">mdi-clipboard-list-outline</v-icon>
      <h2 class="text-h6 font-weight-bold text-white mb-0">Cuestionario de reforma: {{ title }}</h2>
    </div>

    <v-card v-for="section in sections" :key="section.title" color="secondary" variant="flat" class="pa-4 mb-4" rounded="lg">
      <h3 class="text-subtitle-1 font-weight-bold text-primary mb-3">{{ section.title }}</h3>
      <v-row>
        <template v-for="field in section.fields" :key="field.key">
          <v-col v-if="visible(field)" :cols="field.cols || 12" :md="field.md || 6" class="py-1">
            <v-text-field v-if="['text', 'number', 'date'].includes(field.type)" v-model="answers[field.key]" :label="field.label" :type="field.type" variant="outlined" density="compact" hide-details />
            <v-textarea v-else-if="field.type === 'textarea'" v-model="answers[field.key]" :label="field.label" variant="outlined" density="compact" rows="2" hide-details />
            <v-checkbox v-else-if="field.type === 'boolean'" v-model="answers[field.key]" :label="field.label" density="compact" hide-details />
            <div v-else-if="field.type === 'radio'">
              <div class="text-body-2 text-grey-lighten-1 mb-1">{{ field.label }}</div>
              <v-radio-group v-model="answers[field.key]" inline density="compact" hide-details class="mt-0 flex-wrap">
                <v-radio v-for="option in field.options" :key="option" :label="option" :value="option" density="compact" />
              </v-radio-group>
            </div>
            <div v-else-if="field.type === 'checks'">
              <div class="text-body-2 text-grey-lighten-1 mb-1">{{ field.label }}</div>
              <v-checkbox v-for="option in field.options" :key="option" v-model="checkValues(field.key)[option]" :label="option" density="compact" hide-details class="d-inline-flex mr-4" />
            </div>
          </v-col>
        </template>
      </v-row>
    </v-card>
    <v-textarea v-model="modelValue.observacionesGenerales" label="Comentarios generales" variant="outlined" rows="3" />
  </div>
</template>

<script>
import { computed } from 'vue';

const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
const r = (key, label, options, extra = {}) => f(key, label, 'radio', { options, ...extra });
const b = (key, label, extra = {}) => f(key, label, 'boolean', extra);
const c = (key, label, options, extra = {}) => f(key, label, 'checks', { options, ...extra });
const ta = (key, label, extra = {}) => f(key, label, 'textarea', extra);
const when = (key, value) => ({ when: { key, value } });
const material = (prefix) => [b(`${prefix}_material`, 'Material a valorar'), ta(`${prefix}_observaciones`, 'Observaciones', when(`${prefix}_material`, true))];

const commonRooms = (scope) => [
  { title: '1. Suelos', fields: [r(`${scope}_suelo_actual`, 'Estado actual', ['Cerámico', 'Parquet', 'Sintasol', 'Tarima', 'Moqueta']), r(`${scope}_suelo_final`, 'Estado final', ['Cerámico', 'Parquet', 'T. Vinílica', 'T. Laminada', 'T. Madera']), ...material(`${scope}_suelo`), ta(`${scope}_suelo_comentarios`, 'Comentarios')] },
  { title: '2. Rodapié', fields: [r(`${scope}_rodapie_actual`, 'Estado actual', ['Cerámico', 'Madera']), r(`${scope}_rodapie_final`, 'Estado final', ['Cerámico', 'Madera', 'Otros']), f(`${scope}_rodapie_otros`, 'Otros', 'text', when(`${scope}_rodapie_final`, 'Otros')), ...material(`${scope}_rodapie`), ta(`${scope}_rodapie_comentarios`, 'Comentarios')] },
  { title: '3. Paredes', fields: [r(`${scope}_pared_base`, 'Base actual', ['Ladrillo', 'Pladur', 'Otros']), f(`${scope}_pared_base_otros`, 'Base actual: otros', 'text', when(`${scope}_pared_base`, 'Otros')), r(`${scope}_pared_acabado_actual`, 'Acabado actual', ['Cerámico', 'Gota', 'Liso', 'Papel pintado', 'Otros']), f(`${scope}_pared_acabado_actual_otros`, 'Acabado actual: otros', 'text', when(`${scope}_pared_acabado_actual`, 'Otros')), r(`${scope}_pared_tarea`, 'Tarea', ['Tender yeso', 'Trasdosar pladur', 'Enfoscado', 'Otros']), r(`${scope}_pared_trasdosar_tipo`, 'Tipo de trasdosado', ['Estándar', 'Pladur hidrófugo', 'Pladur acústico'], when(`${scope}_pared_tarea`, 'Trasdosar pladur')), f(`${scope}_pared_tarea_otros`, 'Tarea: otros', 'text', when(`${scope}_pared_tarea`, 'Otros')), r(`${scope}_pared_acabado_final`, 'Acabado final', ['Cerámico', 'Gota', 'Liso', 'Microcemento', 'Papel pintado', 'Otros']), f(`${scope}_pared_acabado_final_otros`, 'Acabado final: otros', 'text', when(`${scope}_pared_acabado_final`, 'Otros')), b(`${scope}_pared_material`, 'Material a valorar'), ta(`${scope}_pared_m2_obs`, 'm² / observaciones', when(`${scope}_pared_material`, true))] },
  { title: '4. Techos y molduras', fields: [r(`${scope}_techo_base`, 'Techo: base actual', ['Escayola o Pladur', 'Yeso', 'Otros']), f(`${scope}_techo_base_otros`, 'Base: otros', 'text', when(`${scope}_techo_base`, 'Otros')), r(`${scope}_techo_acabado_actual`, 'Techo: acabado actual', ['Gota', 'Liso', 'Otros']), c(`${scope}_techo_tareas`, 'Techo: tareas', ['Tender yeso', 'Pladur', 'Otros']), r(`${scope}_techo_pladur_tipo`, 'Tipo de Pladur', ['Estándar', 'Pladur hidrófugo', 'Pladur acústico', 'Otros']), r(`${scope}_techo_acabado_final`, 'Techo: acabado final', ['Gota', 'Liso', 'Microcemento', 'Otros']), ta(`${scope}_techo_observaciones`, 'Observaciones de techos'), b(`${scope}_moldura_demoler`, 'Molduras: a demoler'), c(`${scope}_moldura_final`, 'Molduras: estado final', ['Moldura', 'Cortinero', 'Sin moldura ni cornisa']), ...material(`${scope}_moldura`)] },
  { title: '5. Puerta de paso', fields: [r(`${scope}_puerta_cerco`, 'Cerco', ['Precerco', 'Directo', 'Hierro', 'Sin puerta']), r(`${scope}_puerta_sistema`, 'Sistema', ['Abatible', 'Casoneto', 'Corredera vista', 'Sin puerta', 'Otros']), f(`${scope}_puerta_sistema_otros`, 'Sistema: otros', 'text', when(`${scope}_puerta_sistema`, 'Otros')), r(`${scope}_puerta_alto`, 'Alto', ['2.03', '2.11', '2.20', 'Techo']), ...material(`${scope}_puerta`)] },
  { title: '6. Armario', fields: [r(`${scope}_armario_demolicion`, 'Demolición', ['Desmontaje', 'Con obra']), r(`${scope}_armario_sistema`, 'Sistema', ['Abatible', 'Corredera']), c(`${scope}_armario_partes`, 'Partes a reformar', ['Frente', 'Interior']), ...material(`${scope}_armario`), ta(`${scope}_armario_detalle`, 'Características / medidas / observaciones')] },
  { title: '7. Ventanas y cerramientos', fields: [r(`${scope}_ventana_acabado`, 'Acabado', ['Aluminio', 'PVC']), r(`${scope}_ventana_sustitucion`, 'Sustitución', ['Ventana', 'Cerramiento', 'Puerta']), r(`${scope}_ventana_sistema`, 'Sistema', ['Corredera', 'Abatible', 'Osciloparalela']), r(`${scope}_ventana_persiana`, 'Persiana', ['Manual', 'Motor', 'Sin persiana', 'Seguridad']), r(`${scope}_ventana_color`, 'Color', ['Blanco', 'Bicolor', 'Color']), f(`${scope}_ventana_color_otro`, 'Especificar color', 'text', { when: { key: `${scope}_ventana_color`, value: ['Bicolor', 'Color'] } }), r(`${scope}_ventana_cristal`, 'Cristal', ['Climalit', 'Planitherm', 'Cristal acústico', 'Butilar seguridad']), ...material(`${scope}_ventana`), ta(`${scope}_ventana_medidas`, 'Medidas / observaciones')] },
  { title: '8. Aislamiento', fields: [c(`${scope}_aislamiento`, 'Paredes y techos', ['Copopren', 'Fibra vidrio', 'Lana roca', 'Fonodán', 'Poliestileno extruido'])] },
  { title: '9. Radiador', fields: [r(`${scope}_radiador_accion`, 'Acción', ['Aprovechar radiador', 'Cambiar radiador']), r(`${scope}_radiador_tipo`, 'Tipo', ['Radiador aluminio', 'Radiador hierro', 'Toallero'], when(`${scope}_radiador_accion`, 'Cambiar radiador')), r(`${scope}_radiador_orientacion`, 'Orientación', ['Horizontal', 'Vertical'], when(`${scope}_radiador_accion`, 'Cambiar radiador')), r(`${scope}_radiador_tomas`, 'Tomas', ['Aprovechar', 'Modificación', 'Cambiar']), ...material(`${scope}_radiador`)] }
];

const kitchenSections = () => [
  ...commonRooms('cocina'),
  { title: '10. Mobiliario de cocina', fields: [b('cocina_mobiliario_demolicion', 'Demolición de mobiliario'), ...material('cocina_mobiliario'), ta('cocina_mobiliario_detalle', 'Características / medidas / observaciones')] },
  { title: '11. Elementos de cocina', fields: [r('cocina_fontaneria', 'Fontanería', ['Completa', 'Por partes']), r('cocina_fregadero_tipo', 'Fregadero: tipo', ['Sobre encimera', 'Bajo encimera']), r('cocina_fregadero_tomas', 'Fregadero: tomas', ['Se aprovechan', 'Se cambian'], when('cocina_fontaneria', 'Por partes')), r('cocina_lavavajillas_tipo', 'Lavavajillas: tipo', ['Libre instalación', 'Integrado']), r('cocina_lavavajillas_medida', 'Lavavajillas: medida', ['45 cm', '60 cm']), r('cocina_lavadora_tipo', 'Lavadora / lava-secadora: tipo', ['Libre instalación', 'Integrado']), r('cocina_secadora_tipo', 'Secadora: tipo', ['Libre instalación', 'Integrado']), r('cocina_horno_alto', 'Horno: alto', ['60 cm', '45 cm']), r('cocina_horno_limpieza', 'Horno: limpieza', ['Pirolítico', 'Aqua clean']), r('cocina_horno_coccion', 'Horno: cocción', ['Multifunción', 'Vapor']), r('cocina_microondas_alto', 'Microondas: alto', ['40 cm', '45 cm']), r('cocina_placa_tipo', 'Placa', ['Inducción', 'Gas']), r('cocina_placa_ancho', 'Placa: ancho', ['32 cm', '60 cm', '80 cm', '90 cm']), r('cocina_campana_tipo', 'Campana: tipo', ['Techo', 'Decorativa', 'Integrada']), r('cocina_campana_salida', 'Campana: salida', ['12 cm', '15 cm']), r('cocina_campana_ancho', 'Campana: ancho', ['60 cm', '90 cm', '120 cm', 'Otros']), f('cocina_campana_ancho_otro', 'Campana: otro ancho', 'text', when('cocina_campana_ancho', 'Otros')), r('cocina_frigorifico_tipo', 'Frigorífico: tipo', ['Libre instalación', 'Integrado']), r('cocina_frigorifico_ancho', 'Frigorífico: ancho', ['60 cm', '70 cm', '80 cm', '90 cm']), r('cocina_frigorifico_alto', 'Frigorífico: alto', ['187 cm', '203 cm']), b('cocina_calientaplatos_material', 'Calienta platos: material a valorar'), ta('cocina_elementos_obs', 'Observaciones de elementos')] },
  electricity('cocina', true)
];

const electricity = (scope, special = false) => ({ title: `${special ? '12' : '11'}. Electricidad`, fields: [r(`${scope}_electricidad_alcance`, 'Alcance', ['Completa', 'Por partes']), c(`${scope}_puntos_luz`, 'Puntos de luz', ['Focos', 'Lámparas', 'Tira LED empotrada', 'Tira LED de superficie']), f(`${scope}_puntos_luz_numero`, 'Nº de puntos / metros lineales', 'number'), c(`${scope}_mecanismos`, 'Interruptores y enchufes', ['Interruptor sencillo', 'Conmutado', 'Cruzado', 'Enchufe sencillo', 'Doble', 'Triple', 'Cuádruple']), f(`${scope}_mecanismos_numero`, 'Nº de mecanismos', 'number'), ...(special ? [c(`${scope}_tomas_especiales`, 'Tomas especiales', ['Televisión', 'Teléfono', 'RJ45']), r(`${scope}_telefonillo`, 'Telefonillo', ['Desplazar', 'Cambiar', 'Desmontar y montar']), c(`${scope}_sonido`, 'Sonido', ['Timbre', 'Zumbador'])] : []), b(`${scope}_electricidad_material`, 'Material a valorar'), ta(`${scope}_electricidad_obs`, 'Características / observaciones')] });

const bathroomSections = () => [
  ...commonRooms('bano'),
  { title: '10. Elementos de baño', fields: [r('bano_fontaneria', 'Fontanería', ['Completa', 'Por partes']), r('bano_mueble_accion', 'Mueble de baño', ['Demolición', 'Aprovechar actual', 'Nuevo']), r('bano_espejo_luz', 'Espejo: luz', ['Luz interruptor', 'Luz directa', 'Sin luz']), r('bano_grifo_lavabo_accion', 'Grifo de lavabo', ['Aprovechar actual', 'Nuevo']), r('bano_banera_accion', 'Bañera', ['Demolición', 'Aprovechar actual', 'Nuevo']), r('bano_plato_ducha_accion', 'Plato de ducha', ['Demolición', 'Aprovechar actual', 'Nuevo']), r('bano_mampara_accion', 'Mampara', ['Aprovechar actual', 'Nuevo']), r('bano_bide_inodoro_accion', 'Bidé e inodoro', ['Demolición', 'Desmontaje y montaje', 'Nuevo']), r('bano_extractor_ubicacion', 'Extractor: ubicación', ['Techo', 'Pared']), r('bano_extractor_alimentacion', 'Extractor: alimentación', ['Luz directa', 'Luz interruptor']), b('bano_elementos_material', 'Material a valorar'), ta('bano_elementos_obs', 'Observaciones / comentarios')] },
  electricity('bano')
];

const completeSections = [
  { title: '1. Datos de contacto y vivienda', fields: [f('contacto_nombre', 'Nombre y apellidos *'), f('contacto_telefono', 'Teléfono *'), f('contacto_email', 'Email *'), r('origen', '¿Cómo nos has conocido?', ['Google', 'Redes sociales', 'Recomendación', 'Otro']), f('origen_otro', 'Otro (especificar)', 'text', when('origen', 'Otro')), f('vivienda_direccion', 'Dirección (ciudad y barrio)'), r('vivienda_tipo', 'Tipo de vivienda', ['Piso', 'Chalet', 'Local', 'Oficina']), f('vivienda_ano', 'Año aproximado del edificio', 'number'), b('vivienda_habitada', 'Vivienda habitada durante la obra'), b('vivienda_ascensor', 'Tiene ascensor')] },
  { title: '2. Albañilería y nivel de reforma', fields: [r('nivel_reforma', 'Nivel', ['Básica (funcional)', 'Media (mejoras de calidad)', 'Alta (acabados premium)']), r('tabiques_tipo', 'Tabiques interiores', ['Pladur', 'Ladrillo']), b('demolicion_tabiques_interiores', 'Demolición de tabiques interiores'), ta('demolicion_tabiques_interiores_detalle', 'Especificar situación', when('demolicion_tabiques_interiores', true)), b('demolicion_tabiques_exteriores', 'Demolición de tabiques exteriores'), ta('demolicion_tabiques_exteriores_detalle', 'Especificar situación', when('demolicion_tabiques_exteriores', true)), b('construccion_tabiques_interiores', 'Construcción de tabiques interiores'), ta('construccion_tabiques_interiores_detalle', 'Especificar situación', when('construccion_tabiques_interiores', true)), b('construccion_tabiques_interiores_aislamiento', 'Aislamiento interior', when('construccion_tabiques_interiores', true)), b('construccion_tabiques_exteriores', 'Construcción de tabiques exteriores'), ta('construccion_tabiques_exteriores_detalle', 'Especificar situación', when('construccion_tabiques_exteriores', true)), b('construccion_tabiques_exteriores_aislamiento', 'Aislamiento exterior', when('construccion_tabiques_exteriores', true))] },
  { title: '3. Presupuesto y plazos', fields: [f('presupuesto', 'Presupuesto aproximado (€)', 'number'), r('inicio_deseado', 'Inicio deseado', ['Lo antes posible', 'En 1-3 meses', 'Más adelante']), f('fecha_aproximada', 'Fecha aproximada', 'date', when('inicio_deseado', 'Más adelante')), f('fecha_limite', 'Fecha límite', 'date', when('inicio_deseado', 'Más adelante'))] },
  { title: '4. Licencias y documentación', fields: [c('documentacion', 'Datos adjuntos disponibles', ['Planos', 'Medidas', 'Video', 'Fotos']), r('licencia_ocupacion', 'Licencia de ocupación de vía pública', ['Sí', 'No', 'No lo sé']), r('proyecto_tecnico', 'Proyecto técnico', ['Sí', 'No', 'No lo sé'])] },
  { title: '5. Elementos generales', fields: [c('aire_actuaciones', 'Aire acondicionado: actuaciones', ['Nuevo', 'Desmontaje y montaje', 'Material a valorar']), r('aire_tipo_nuevo', 'Aire nuevo: tipo', ['Pre-instalación', 'Split', 'Conducto']), f('aire_estancias', 'Especificar estancias'), b('aire_airzone', 'Airzone'), ta('aire_observaciones', 'Observaciones'), r('cuadro_electrico', 'Cuadro eléctrico: actuación', ['Nuevo', 'Aprovechar actual', 'Cambio de diferenciales']), ta('cuadro_electrico_obs', 'Cuadro eléctrico: observaciones'), b('contador_agua_cambio', 'Contador de agua: cambio de ubicación'), f('contador_agua_numero', 'Nº de contadores', 'number', when('contador_agua_cambio', true)), b('contador_gas_cambio', 'Contador de gas: cambio de ubicación'), c('contador_gas_ubicacion', 'Contador de gas: ubicación', ['Interior', 'Exterior'], when('contador_gas_cambio', true)), r('agua_calefaccion_actual', 'Agua y calefacción: estado actual', ['Caldera', 'Calentador', 'Termo', 'Aerotermia', 'Central']), f('agua_calefaccion_estancia', 'Estancia en la que se encuentra'), c('agua_calefaccion_final', 'Estado final', ['Caldera', 'Calentador', 'Termo', 'Aerotermia']), r('caldera_accion', 'Caldera / calentador: acción', ['Aprovechar', 'Cambiar']), r('termo_accion', 'Termo: acción', ['Aprovechar Termo', 'Cambiar Termo']), b('aerotermia_desmontar', 'Aerotermia: desmontar'), c('aerotermia_servicios', 'Aerotermia: servicios', ['Agua sanitaria', 'Climatización', 'Material a valorar']), r('aerotermia_climatizacion', 'Aerotermia: tipo de climatización', ['Suelo radiante/refrigerado', 'Radiadores', 'Conductos']), ta('agua_calefaccion_detalle', 'Detalle importante para conocer')] }
];

export default {
  name: 'ReformaCuestionario',
  props: { modelValue: { type: Object, required: true }, tipo: { type: String, required: true } },
  emits: ['update:modelValue'],
  setup(props) {
    const answers = computed(() => props.modelValue.respuestas);
    const title = computed(() => ({ completa: 'Vivienda completa', cocina: 'Cocina', bano: 'Baño' }[props.tipo] || 'Vivienda completa'));
    const sections = computed(() => props.tipo === 'completa' ? completeSections : props.tipo === 'cocina' ? kitchenSections() : bathroomSections());
    const checkValues = (key) => {
      if (!answers.value[key] || typeof answers.value[key] !== 'object') answers.value[key] = {};
      return answers.value[key];
    };
    const visible = (field) => {
      if (!field.when) return true;
      const current = answers.value[field.when.key];
      return Array.isArray(field.when.value) ? field.when.value.includes(current) : current === field.when.value;
    };
    return { answers, title, sections, checkValues, visible };
  }
};
</script>
