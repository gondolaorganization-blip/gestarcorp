import {
  bold, normal, italic, parrafo, centrado, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha } from '../../../utils/generadorPDF.js';
import { Paragraph, TextRun, AlignmentType } from 'docx';

export async function docxCartaRenunciaDirector({ sociedad, director, agenteNombre, fechaEfectiva }) {
  const children = [
    new Paragraph({
      children: [normal(`Ciudad de Panamá, ${formatearFecha(new Date())}`)],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        bold('Señores'), new TextRun({ break: 1 }),
        new TextRun({ text: 'Junta Directiva', bold: true, size: 24, break: 0 }), new TextRun({ break: 1 }),
        new TextRun({ text: sociedad.nombre, bold: true, size: 24 }), new TextRun({ break: 1 }),
        new TextRun({ text: 'República de Panamá', size: 24 }),
      ],
      spacing: { after: 240 },
    }),
    parrafo([normal('Estimados señores:')]),
    parrafo([
      normal('Por medio de la presente, yo, '), bold(director?.nombre || '___________'),
      normal(`, portador de ${director?.tipoDocumento || 'cédula/pasaporte'} No. `),
      bold(director?.numeroDocumento || '___________'),
      normal(`${director?.nacionalidad ? `, de nacionalidad ${director.nacionalidad}` : ''}, me dirijo a ustedes a fin de presentar formal `),
      bold('RENUNCIA'), normal(' al cargo de '), bold(director?.cargo || '___________'),
      normal(' que venía desempeñando en la sociedad '), bold(sociedad.nombre),
      normal(`, inscrita en el Registro Público de Panamá bajo la Ficha `),
      bold(sociedad.ficha || '___________'), normal('.'),
    ]),
    parrafo([
      normal('La presente renuncia tendrá efectividad a partir del día '),
      bold(fechaEfectiva ? formatearFecha(fechaEfectiva) : formatearFecha(new Date())),
      normal(', salvo que la Junta Directiva acuerde una fecha distinta.'),
    ]),
    parrafo([normal('Agradezco la oportunidad de haber formado parte de la estructura directiva de esta sociedad y me comprometo a facilitar cualquier proceso de transición que resulte necesario.')]),
    parrafo([
      normal('Asimismo, solicito al Agente Residente, '),
      bold(agenteNombre || '___________'),
      normal(', proceder con los trámites correspondientes ante el Registro Público de Panamá para hacer constar la presente renuncia.'),
    ]),
    parrafo([normal('Atentamente,')]),
    new Paragraph({ spacing: { after: 400 } }),
    ...lineaFirma(
      director?.nombre || '___________',
      `${director?.cargo || 'Director Renunciante'} — ${director?.tipoDocumento || ''} ${director?.numeroDocumento || ''}`
    ),
  ];

  return generarDocxBuffer({ children });
}
