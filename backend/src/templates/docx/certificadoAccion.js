import {
  Paragraph, TextRun, AlignmentType, BorderStyle,
  HeadingLevel, convertInchesToTwip,
} from 'docx';
import {
  bold, normal, italic, parrafo, centrado, tablaSimple,
  lineaFirma, generarDocxBuffer,
} from '../../utils/generadorWord.js';
import { formatearFecha, formatearMoneda } from '../../utils/generadorPDF.js';

export async function docxCertificadoAccion({ sociedad, accion }) {
  const numeroFormateado = String(accion.numero).padStart(4, '0');
  const claseTexto = accion.clase === 'COMUN' ? 'Común' : accion.clase;

  const children = [
    // Encabezado
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([normal('Sociedad Anónima', 22)]),
    centrado([normal('Constituida bajo las leyes de la República de Panamá', 22)]),
    ...(sociedad.ficha ? [centrado([
      normal(`Ficha: ${sociedad.ficha}  ·  Tomo: ${sociedad.tomo || '—'}  ·  Folio: ${sociedad.folio || '—'}`, 20)
    ])] : []),

    new Paragraph({ text: '', spacing: { after: 200 } }),

    centrado([bold(`CERTIFICADO N° ${numeroFormateado}`, 28)]),
    centrado([bold('CERTIFICADO DE ACCIONES', 26)]),
    centrado([italic(`Clase: Acción ${claseTexto}`, 22)]),

    new Paragraph({ text: '', spacing: { after: 200 } }),

    // Tabla de datos principales
    tablaSimple(
      ['Campo', 'Detalle'],
      [
        ['Titular',          accion.titular],
        ['Número de Acción', accion.numero],
        ['Clase',            claseTexto],
        ['Valor Nominal',    formatearMoneda(accion.valorNominal ?? sociedad.valorNominal)],
        ['Fecha de Emisión', formatearFecha(accion.fechaEmision)],
        ['Estado',           accion.estado ?? 'VIGENTE'],
      ],
      [30, 70]
    ),

    new Paragraph({ text: '', spacing: { after: 200 } }),

    // Texto de declaración
    parrafo([
      normal('Este certificado acredita que '),
      bold(accion.titular),
      normal(' es titular de '),
      bold('UNA (1)'),
      normal(` acción ${claseTexto.toLowerCase()} con valor nominal de `),
      bold(formatearMoneda(accion.valorNominal ?? sociedad.valorNominal)),
      normal(`, registrada bajo el número `),
      bold(String(accion.numero)),
      normal(` en el Libro de Acciones de `),
      bold(sociedad.nombre),
      normal(`, sociedad debidamente constituida bajo las leyes de la República de Panamá, con capital autorizado de `),
      bold(formatearMoneda(sociedad.capital)),
      normal(`, dividido en `),
      bold(String(sociedad.cantidadAcciones?.toLocaleString('es-PA') || '___')),
      normal(` acciones ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'}.`),
    ]),

    parrafo([
      normal(`Emitido en la Ciudad de Panamá, República de Panamá, el ${formatearFecha(accion.fechaEmision || new Date())}.`)
    ]),

    new Paragraph({ text: '', spacing: { after: 400 } }),

    // Firmas en columnas
    new Paragraph({
      children: [
        bold('_________________________________          _________________________________', 22),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 80 },
    }),
    new Paragraph({
      children: [bold('         Presidente                                     Secretario', 22)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [italic(`         ${sociedad.nombre}`, 20)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),

    new Paragraph({ text: '', spacing: { after: 400 } }),

    // Pie
    new Paragraph({
      children: [italic(`GESTARGOV · Gestión Societaria Panameña · Documento generado el ${formatearFecha(new Date())}`, 18)],
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: '888888' } },
    }),
  ];

  return generarDocxBuffer({ children });
}
