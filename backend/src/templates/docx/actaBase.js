import { Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import {
  bold, normal, italic, parrafo, centrado, tablaSimple, generarDocxBuffer,
} from '../../utils/generadorWord.js';
import { formatearFecha } from '../../utils/generadorPDF.js';
import { contenidosPorTipo } from '../pdf/actaBase.js';

function seccion(titulo, contenido) {
  return [
    new Paragraph({
      children: [bold(titulo.toUpperCase(), 24)],
      spacing: { before: 280, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '333333' } },
    }),
    ...contenido,
  ];
}

function parrafoTexto(texto) {
  return parrafo([normal(texto)]);
}

export async function docxActa({ sociedad, acta, directores = [] }) {
  const plantilla = contenidosPorTipo[acta.tipo] || contenidosPorTipo.OTRO;
  const numeroFormateado = String(acta.numero).padStart(3, '0');

  const agendaLineas = acta.agenda
    ? acta.agenda.split('\n').filter(Boolean)
    : plantilla.agendaSugerida;

  const acuerdosLineas = acta.acuerdos
    ? acta.acuerdos.split('\n').filter(Boolean)
    : ['(Registre aquí los acuerdos adoptados en la reunión)'];

  // Strip HTML tags from textoApertura (it has <strong> tags)
  const textoApertura = plantilla.textoApertura(sociedad, acta)
    .replace(/<strong>/g, '').replace(/<\/strong>/g, '');

  const children = [
    // Encabezado
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([normal('Sociedad Anónima · República de Panamá', 22)]),
    ...(sociedad.ficha ? [centrado([
      normal(`Ficha: ${sociedad.ficha}  ·  Tomo: ${sociedad.tomo || '—'}  ·  Folio: ${sociedad.folio || '—'}`, 20)
    ])] : []),

    new Paragraph({ text: '', spacing: { after: 120 } }),

    centrado([bold(`ACTA N° ${numeroFormateado}`, 28)]),
    centrado([bold(plantilla.titulo, 24)]),
    centrado([italic(`Estado: ${acta.estado || 'BORRADOR'}`, 20)]),

    new Paragraph({ text: '', spacing: { after: 160 } }),

    // Datos de la reunión
    tablaSimple(
      ['Campo', 'Detalle'],
      [
        ['Tipo de reunión', plantilla.titulo],
        ['Número de acta',  numeroFormateado],
        ['Fecha',           formatearFecha(acta.fecha)],
        ['Lugar',           acta.lugar || '___________'],
        ['Quórum',          acta.quorum || '___________'],
      ]
    ),

    new Paragraph({ text: '', spacing: { after: 200 } }),

    // I. Apertura
    ...seccion('I. APERTURA', [parrafoTexto(textoApertura)]),

    // II. Asistentes (si hay directores)
    ...(directores.length ? seccion('II. ASISTENTES', [
      tablaSimple(
        ['Nombre', 'Cargo'],
        directores.map(d => [d.nombre, d.cargo])
      )
    ]) : []),

    // III. Agenda
    ...seccion(`${directores.length ? 'III' : 'II'}. AGENDA`, [
      ...agendaLineas.map(l => parrafoTexto(l))
    ]),

    // IV. Acuerdos
    ...seccion(`${directores.length ? 'IV' : 'III'}. ACUERDOS ADOPTADOS`, [
      ...acuerdosLineas.map(l => parrafoTexto(l))
    ]),

    // Cierre
    ...seccion('CIERRE', [
      parrafoTexto(
        `No habiendo más asuntos que tratar, se da por terminada la reunión siendo las ` +
        `${acta.horaFin || '___'} horas del día ${formatearFecha(acta.fecha)}, en fe de lo cual ` +
        `se levanta la presente acta que firma el Secretario de la reunión.`
      )
    ]),

    new Paragraph({ text: '', spacing: { after: 600 } }),

    // Firmas
    new Paragraph({
      children: [bold('_________________________________          _________________________________', 22)],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 80 },
    }),
    new Paragraph({
      children: [normal('    Presidente de la Reunión                      Secretario de la Reunión', 22)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [italic(`    ${sociedad.nombre}`, 20)],
      alignment: AlignmentType.CENTER,
    }),

    new Paragraph({ text: '', spacing: { after: 300 } }),
    new Paragraph({
      children: [italic(
        `GESTARGOV · Acta N° ${numeroFormateado} · ${sociedad.nombre} · Generado el ${formatearFecha(new Date())}`, 18
      )],
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: '888888' } },
    }),
  ];

  return generarDocxBuffer({ children });
}
