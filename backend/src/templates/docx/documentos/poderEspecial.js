import {
  bold, normal, italic, parrafo, centrado, tablaSimple, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha } from '../../../utils/generadorPDF.js';
import { Paragraph } from 'docx';

export async function docxPoderEspecial({ sociedad, directores, apoderado, propositoEspecifico, notario }) {
  const presidente = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = directores.find(d => d.cargo === 'SECRETARIO');

  const children = [
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([bold('PODER ESPECIAL', 26)]),
    centrado([italic('Special Power of Attorney', 24)]),
    new Paragraph({ spacing: { after: 300 } }),
    parrafo([
      normal('Nosotros, '), bold(presidente?.nombre || '___________'),
      normal(', en su calidad de Presidente, y '), bold(secretario?.nombre || '___________'),
      normal(`, en su calidad de Secretario, de la sociedad anónima denominada `),
      bold(sociedad.nombre),
      normal(`, debidamente inscrita en el Registro Público, Ficha `),
      bold(sociedad.ficha || '___________'),
      normal(`;`),
    ]),
    parrafo([bold('OTORGAMOS'), normal(' por medio del presente instrumento '), bold('PODER ESPECIAL'), normal(' a favor de:')]),
    tablaSimple(
      ['Campo', 'Datos del Apoderado'],
      [
        ['Nombre', apoderado?.nombre || '___________'],
        [apoderado?.tipoDocumento || 'Documento', apoderado?.numeroDocumento || '___________'],
        ['Nacionalidad', apoderado?.nacionalidad || '___________'],
      ]
    ),
    new Paragraph({ spacing: { after: 160 } }),
    parrafo([normal('Para que en nombre y representación de '), bold(sociedad.nombre), normal(', lleve a cabo '), bold('exclusivamente'), normal(' el siguiente acto específico:')]),
    parrafo([italic(propositoEspecifico || '___________________________________________')]),
    new Paragraph({ spacing: { after: 160 } }),
    parrafo([normal('Las facultades conferidas en el presente poder se limitan estrictamente al acto descrito y quedarán extinguidas de pleno derecho una vez consumado el mismo o al vencimiento del plazo establecido, lo que ocurra primero.')]),
    parrafo([
      normal('En fe de lo cual, firmamos en la Ciudad de Panamá, República de Panamá, el '),
      bold(formatearFecha(new Date())), normal('.'),
    ]),
    new Paragraph({ spacing: { after: 400 } }),
    ...lineaFirma(presidente?.nombre || '___________', `Presidente — ${sociedad.nombre}`),
    new Paragraph({ spacing: { after: 200 } }),
    ...lineaFirma(secretario?.nombre || '___________', `Secretario — ${sociedad.nombre}`),
    ...(notario ? [
      new Paragraph({ spacing: { after: 400 } }),
      parrafo([bold('AUTENTICACIÓN NOTARIAL')]),
      parrafo([normal(`Ante mí, `), bold(notario.nombre), normal(`, Notario Público de la República de Panamá, comparecieron los señores arriba indicados, a quienes identifico y quienes firmaron este instrumento en mi presencia.`)]),
      new Paragraph({ spacing: { after: 400 } }),
      ...lineaFirma(notario.nombre, 'Notario Público'),
    ] : []),
  ];

  return generarDocxBuffer({ children });
}
