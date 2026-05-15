import {
  bold, normal, italic, parrafo, centrado, tablaSimple, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha } from '../../../utils/generadorPDF.js';
import { Paragraph, TextRun, AlignmentType } from 'docx';

export async function docxPoderGeneral({ sociedad, directores, apoderado, facultades, notario }) {
  const presidente = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = directores.find(d => d.cargo === 'SECRETARIO');

  const facultadesDefault = [
    'Representar a la sociedad ante toda clase de personas naturales y jurídicas, públicas y privadas.',
    'Abrir, cerrar y manejar cuentas bancarias; girar, endosar, cobrar y depositar cheques.',
    'Suscribir contratos, convenios y demás actos jurídicos en nombre de la sociedad.',
    'Gestionar y tramitar permisos, licencias y registros ante cualquier autoridad.',
    'Ejercer cualquier otro acto de administración ordinaria necesario para el cumplimiento del objeto social.',
  ];
  const listaFacultades = (facultades && facultades.length > 0) ? facultades : facultadesDefault;

  const children = [
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([bold('PODER GENERAL', 26)]),
    centrado([italic('General Power of Attorney', 24)]),
    new Paragraph({ spacing: { after: 300 } }),
    parrafo([
      normal('Nosotros, '), bold(presidente?.nombre || '___________'),
      normal(', en su calidad de Presidente, y '), bold(secretario?.nombre || '___________'),
      normal(`, en su calidad de Secretario, de la sociedad anónima denominada `),
      bold(sociedad.nombre),
      normal(`, debidamente inscrita en el Registro Público, Ficha `),
      bold(sociedad.ficha || '___________'),
      normal(`, Tomo `), bold(sociedad.tomo || '___________'),
      normal(`, Folio `), bold(sociedad.folio || '___________'), normal(';'),
    ]),
    parrafo([bold('OTORGAMOS'), normal(' por medio del presente instrumento '), bold('PODER GENERAL AMPLIO Y SUFICIENTE'), normal(' a favor de:')]),
    tablaSimple(
      ['Campo', 'Datos del Apoderado'],
      [
        ['Nombre', apoderado?.nombre || '___________'],
        [apoderado?.tipoDocumento || 'Documento', apoderado?.numeroDocumento || '___________'],
        ['Nacionalidad', apoderado?.nacionalidad || '___________'],
      ]
    ),
    new Paragraph({ spacing: { after: 160 } }),
    parrafo([normal('Para que en nombre y representación de '), bold(sociedad.nombre), normal(', pueda realizar los siguientes actos y gestiones, sin limitación alguna:')]),
    ...listaFacultades.map((f, i) => new Paragraph({
      children: [bold(`${i + 1}. `, 24), normal(f)],
      spacing: { after: 120 },
      alignment: AlignmentType.JUSTIFIED,
    })),
    new Paragraph({ spacing: { after: 160 } }),
    parrafo([normal('El presente poder tendrá vigencia indefinida a partir de la fecha de su otorgamiento, salvo que sea revocado expresamente por la Junta Directiva de la sociedad.')]),
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
