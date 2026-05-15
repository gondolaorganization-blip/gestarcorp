import {
  bold, normal, italic, parrafo, centrado, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha } from '../../../utils/generadorPDF.js';
import { Paragraph, TextRun, AlignmentType } from 'docx';

export async function docxAceptacionCargoDirector({ sociedad, director, agenteNombre }) {
  const children = [
    new Paragraph({
      children: [normal(`Ciudad de Panamá, ${formatearFecha(new Date())}`)],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        bold('Señores'), new TextRun({ break: 1 }),
        new TextRun({ text: 'Junta Directiva', bold: true, size: 24 }), new TextRun({ break: 1 }),
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
      normal(`${director?.nacionalidad ? `, de nacionalidad ${director.nacionalidad}` : ''}, me dirijo a ustedes con el objeto de manifestar formalmente mi `),
      bold('ACEPTACIÓN'), normal(' del nombramiento como '), bold(director?.cargo || '___________'),
      normal(' de la sociedad '), bold(sociedad.nombre),
      normal(`, inscrita en el Registro Público de Panamá bajo la Ficha `),
      bold(sociedad.ficha || '___________'), normal('.'),
    ]),
    parrafo([bold('Declaro que:')]),
    ...[
      `Acepto el cargo para el que he sido designado y me comprometo a desempeñarlo con diligencia, lealtad y en el mejor interés de la sociedad y sus accionistas.`,
      `Conozco y acepto las obligaciones y responsabilidades inherentes al cargo conforme a la Ley 32 de 1927 y los estatutos sociales de la empresa.`,
      `Los datos de identidad que suministro son exactos y verídicos.`,
      `Me comprometo a mantener informado al Agente Residente sobre cualquier cambio en mis datos o circunstancias relevantes para el ejercicio del cargo.`,
    ].map((texto, i) => new Paragraph({
      children: [bold(`${i + 1}. `), normal(texto)],
      spacing: { after: 120 },
      alignment: AlignmentType.JUSTIFIED,
    })),
    new Paragraph({ spacing: { after: 160 } }),
    parrafo([
      normal('La presente aceptación rige a partir del '),
      bold(formatearFecha(director?.fechaNombramiento || new Date())), normal('.'),
    ]),
    parrafo([
      normal('Solicito al Agente Residente, '),
      bold(agenteNombre || '___________'),
      normal(', tomar nota de la presente aceptación y proceder con los registros correspondientes.'),
    ]),
    parrafo([normal('Atentamente,')]),
    new Paragraph({ spacing: { after: 400 } }),
    ...lineaFirma(
      director?.nombre || '___________',
      `${director?.cargo || 'Director'} — ${director?.tipoDocumento || ''} ${director?.numeroDocumento || ''}`
    ),
  ];

  return generarDocxBuffer({ children });
}
