import {
  bold, normal, italic, parrafo, centrado, tablaSimple, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha, formatearMoneda } from '../../../utils/generadorPDF.js';
import { Paragraph, AlignmentType } from 'docx';

export async function docxPactoSocial({ sociedad, directores, accionistas }) {
  const presidente = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = directores.find(d => d.cargo === 'SECRETARIO');
  const tesorero   = directores.find(d => d.cargo === 'TESORERO');

  const articuloCapital = sociedad.cantidadAcciones
    ? `${sociedad.cantidadAcciones?.toLocaleString('es-PA')} acciones ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'} de ${formatearMoneda(sociedad.valorNominal)} cada una`
    : '___________';

  const articulo = (num, titulo, texto) => [
    new Paragraph({
      children: [bold(`${num} – ${titulo}: `, 24), normal(texto)],
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
    }),
  ];

  const children = [
    centrado([bold('PACTO SOCIAL', 28)]),
    centrado([bold(sociedad.nombre.toUpperCase(), 26)]),
    centrado([normal('Sociedad Anónima · República de Panamá', 22)]),
    centrado([normal('Ley 32 de 1927', 22)]),
    new Paragraph({ spacing: { after: 300 } }),
    parrafo([normal('Los suscritos, mayores de edad, capaces civilmente, de las generales que se dirán, han convenido en constituir una sociedad anónima, de conformidad con la Ley 32 de 1927 de la República de Panamá, bajo las cláusulas y disposiciones que a continuación se expresan:')]),
    new Paragraph({ spacing: { after: 160 } }),
    ...articulo('ARTÍCULO PRIMERO', 'NOMBRE', `La sociedad se denominará ${sociedad.nombre}.`),
    ...articulo('ARTÍCULO SEGUNDO', 'DOMICILIO', `El domicilio principal de la sociedad será en la ${sociedad.domicilio || 'República de Panamá'}, sin perjuicio de que pueda establecer agencias, sucursales u oficinas en cualquier lugar de la República de Panamá o en el extranjero.`),
    ...articulo('ARTÍCULO TERCERO', 'OBJETO', 'La sociedad podrá dedicarse a toda clase de negocios lícitos, actos de comercio y actividades industriales, financieras o de servicios, tanto en la República de Panamá como en el extranjero, incluyendo sin limitación la adquisición y disposición de bienes muebles e inmuebles, participaciones en otras entidades, y cualesquiera otras actividades permitidas por la ley.'),
    ...articulo('ARTÍCULO CUARTO', 'DURACIÓN', 'La sociedad tendrá una duración indefinida a partir de la fecha de su inscripción en el Registro Público.'),
    ...articulo('ARTÍCULO QUINTO', 'CAPITAL AUTORIZADO', `El capital autorizado de la sociedad es de ${formatearMoneda(sociedad.capital)}, dividido en ${articuloCapital}.`),
    ...articulo('ARTÍCULO SEXTO', 'JUNTA DIRECTIVA', 'La sociedad será administrada por una Junta Directiva compuesta por un mínimo de tres (3) directores, quienes podrán ser personas naturales o jurídicas, nacionales o extranjeras. Los directores serán elegidos por la Junta de Accionistas y durarán en sus cargos por el período que ésta determine. La Junta Directiva estará integrada por los cargos de Presidente, Secretario y Tesorero, como mínimo.'),
    ...articulo('ARTÍCULO SÉPTIMO', 'REPRESENTACIÓN', 'La representación legal de la sociedad corresponde al Presidente de la Junta Directiva, quien tendrá las más amplias facultades de administración y disposición, con o sin la firma conjunta de otro dignatario, según lo determine la Junta Directiva mediante resolución.'),
    ...articulo('ARTÍCULO OCTAVO', 'AGENTE RESIDENTE', 'La sociedad tendrá un Agente Residente en la República de Panamá conforme a lo establecido en el Artículo 2 de la Ley 32 de 1927. El Agente Residente tendrá las obligaciones señaladas en la Ley 52 de 2016 y demás normas aplicables.'),
    ...articulo('ARTÍCULO NOVENO', 'LIBROS', 'La sociedad llevará los libros requeridos por la ley, incluyendo el Libro de Registro de Acciones, Libro de Actas y demás que sean necesarios para el correcto funcionamiento corporativo.'),
    ...articulo('ARTÍCULO DÉCIMO', 'DISOLUCIÓN', 'La sociedad podrá disolverse por las causas establecidas en la Ley 32 de 1927 y mediante acuerdo de la Junta de Accionistas convocada para tal efecto.'),
    new Paragraph({ spacing: { after: 160 } }),
    parrafo([normal('Los directores fundadores de la sociedad son:')]),
    tablaSimple(
      ['Cargo', 'Nombre', 'Documento'],
      [presidente, secretario, tesorero].filter(Boolean).map(d => [d.cargo, d.nombre, `${d.tipoDocumento} ${d.numeroDocumento}`])
    ),
    new Paragraph({ spacing: { after: 160 } }),
    parrafo([
      normal('El presente Pacto Social fue firmado en la Ciudad de Panamá, República de Panamá, el '),
      bold(formatearFecha(sociedad.fechaConstitucion || new Date())), normal('.'),
    ]),
    new Paragraph({ spacing: { after: 400 } }),
    ...[presidente, secretario, tesorero].filter(Boolean).flatMap((d, i) => [
      ...(i > 0 ? [new Paragraph({ spacing: { after: 200 } })] : []),
      ...lineaFirma(d.nombre, `${d.cargo} — ${sociedad.nombre}`),
    ]),
  ];

  return generarDocxBuffer({ children });
}
