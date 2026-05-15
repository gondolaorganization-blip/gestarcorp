import {
  bold, normal, italic, parrafo, centrado, tablaSimple, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha, formatearMoneda } from '../../../utils/generadorPDF.js';
import { Paragraph, AlignmentType, HeadingLevel } from 'docx';

function seccion(titulo) {
  return new Paragraph({
    text: titulo,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
  });
}

export async function docxFichaSociedad({ sociedad, directores, accionistas, beneficiarios, obligaciones, actas, agenteNombre }) {
  const children = [
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([bold('FICHA CORPORATIVA COMPLETA', 24)]),
    centrado([normal(`Agente Residente: ${agenteNombre || '—'} · ${formatearFecha(new Date())}`, 22)]),
    new Paragraph({ spacing: { after: 300 } }),

    seccion('DATOS DE INSCRIPCIÓN'),
    tablaSimple(
      ['Campo', 'Valor'],
      [
        ['Ficha', sociedad.ficha || '—'],
        ['Tomo', sociedad.tomo || '—'],
        ['Folio', sociedad.folio || '—'],
        ['Constitución', formatearFecha(sociedad.fechaConstitucion)],
        ['Domicilio', sociedad.domicilio || 'República de Panamá'],
        ['Estado', sociedad.estado],
        ['Plan', sociedad.planCliente],
        ['Capital', formatearMoneda(sociedad.capital)],
        ['Acciones', `${sociedad.cantidadAcciones?.toLocaleString('es-PA') || '—'} ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'} de ${formatearMoneda(sociedad.valorNominal)} c/u`],
      ]
    ),

    seccion('JUNTA DIRECTIVA'),
    directores.length
      ? tablaSimple(
          ['Cargo', 'Nombre', 'Documento', 'Nacionalidad', 'Desde'],
          directores.map(d => [d.cargo, d.nombre, `${d.tipoDocumento || ''} ${d.numeroDocumento || ''}`, d.nacionalidad || '—', formatearFecha(d.fechaNombramiento)])
        )
      : parrafo([italic('Sin directores registrados')]),

    seccion('ACCIONISTAS'),
    accionistas.length
      ? tablaSimple(
          ['Nombre', 'Acciones', '%', 'Nacionalidad'],
          accionistas.map(a => [a.nombre, a.cantidadAcciones?.toLocaleString('es-PA') || '—', a.porcentaje != null ? `${Number(a.porcentaje).toFixed(2)}%` : '—', a.nacionalidad || '—'])
        )
      : parrafo([italic('Sin accionistas registrados')]),

    seccion('BENEFICIARIOS FINALES — LEY 52 DE 2016'),
    beneficiarios.length
      ? tablaSimple(
          ['Nombre', '% Control', 'PEP', 'Verificado', 'Actualizado'],
          beneficiarios.map(b => [b.nombre, `${Number(b.porcentajeControl).toFixed(2)}%`, b.esPEP ? 'Sí' : 'No', b.verificado ? 'Sí' : 'No', b.fechaActualizacion ? formatearFecha(b.fechaActualizacion) : '—'])
        )
      : parrafo([italic('Sin beneficiarios registrados')]),

    seccion('OBLIGACIONES FISCALES'),
    obligaciones.length
      ? tablaSimple(
          ['Tipo', 'Año', 'Entidad', 'Vence', 'Estado'],
          obligaciones.map(o => [o.tipo.replace(/_/g,' '), String(o.anio), o.entidad || '—', formatearFecha(o.fechaVence), o.estado])
        )
      : parrafo([italic('Sin obligaciones registradas')]),

    seccion('ACTAS (ÚLTIMAS 10)'),
    actas.length
      ? tablaSimple(
          ['#', 'Tipo', 'Fecha', 'Estado'],
          actas.map(a => [String(a.numero), a.tipo.replace(/_/g,' '), formatearFecha(a.fecha), a.estado])
        )
      : parrafo([italic('Sin actas registradas')]),

    new Paragraph({ spacing: { after: 400 } }),
    ...lineaFirma(agenteNombre || 'Agente Residente', 'Agente Residente'),
  ];

  return generarDocxBuffer({ children });
}
