import {
  bold, normal, italic, parrafo, centrado, tablaSimple, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha } from '../../../utils/generadorPDF.js';
import { Paragraph, AlignmentType } from 'docx';

export async function docxDeclaracionJuradaDirector({ sociedad, director }) {
  const declaraciones = [
    `Que ostento el cargo de ${director?.cargo || '___________'} de la sociedad y estoy facultado para actuar en dicha calidad conforme a los estatutos sociales y la Ley 32 de 1927.`,
    'Que los datos de identidad suministrados son exactos y corresponden a los documentos oficiales de identificación personal que tengo en mi poder.',
    'Que no existen condenas penales firmes en mi contra relacionadas con delitos de blanqueo de capitales, financiamiento del terrorismo, o delitos conexos, conforme a la legislación panameña e internacional aplicable.',
    'Que me comprometo a mantener actualizados mis datos ante el agente residente de la sociedad y a notificar cualquier cambio relevante en un plazo no mayor de treinta (30) días calendario.',
    'Que comprendo que la falsedad en las declaraciones aquí vertidas acarrea las responsabilidades penales y civiles previstas en la legislación panameña.',
  ];

  const children = [
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([bold('DECLARACIÓN JURADA DE DIRECTOR', 26)]),
    centrado([normal('Ley 52 de 2016 · Registro Público de Panamá', 22)]),
    new Paragraph({ spacing: { after: 300 } }),
    parrafo([normal('Yo, el suscrito, declaro bajo juramento que los datos que suministro a continuación son verídicos y exactos, en cumplimiento con lo establecido por la Ley 52 de 2016 y demás normas concordantes de la República de Panamá:')]),
    tablaSimple(
      ['Campo', 'Valor'],
      [
        ['Nombre completo', director?.nombre || '___________'],
        ['Tipo de documento', director?.tipoDocumento || '___________'],
        ['Número de documento', director?.numeroDocumento || '___________'],
        ['Nacionalidad', director?.nacionalidad || '___________'],
        ['Cargo en la sociedad', director?.cargo || '___________'],
        ['Fecha de nombramiento', formatearFecha(director?.fechaNombramiento)],
      ]
    ),
    new Paragraph({ spacing: { after: 160 } }),
    parrafo([normal('En relación con la sociedad '), bold(sociedad.nombre), normal(`, Ficha ${sociedad.ficha || '___________'} del Registro Público de Panamá, `), bold('DECLARO BAJO JURAMENTO:')]),
    ...declaraciones.map((d, i) => new Paragraph({
      children: [bold(`${i + 1}. `), normal(d)],
      spacing: { after: 120 },
      alignment: AlignmentType.JUSTIFIED,
    })),
    new Paragraph({ spacing: { after: 160 } }),
    parrafo([
      normal('Firmo la presente declaración en la Ciudad de Panamá, República de Panamá, el '),
      bold(formatearFecha(new Date())), normal('.'),
    ]),
    new Paragraph({ spacing: { after: 400 } }),
    ...lineaFirma(
      director?.nombre || '___________',
      `${director?.cargo || 'Director'} — ${sociedad.nombre}`
    ),
  ];

  return generarDocxBuffer({ children });
}
