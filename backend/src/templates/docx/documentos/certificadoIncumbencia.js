import {
  bold, normal, italic, parrafo, centrado, tablaSimple, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha, formatearMoneda } from '../../../utils/generadorPDF.js';
import { Paragraph, TextRun, AlignmentType } from 'docx';

export async function docxCertificadoIncumbencia({ sociedad, directores, agenteNombre }) {
  const presidente = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = directores.find(d => d.cargo === 'SECRETARIO');
  const tesorero   = directores.find(d => d.cargo === 'TESORERO');
  const otrosDir   = directores.filter(d => !['PRESIDENTE','SECRETARIO','TESORERO'].includes(d.cargo));

  const cargoBloque = (titulo, director) => {
    if (!director) return [parrafo([bold(titulo), normal(' No designado')])];
    return [
      parrafo([bold(titulo)]),
      parrafo([bold(director.nombre, 26)]),
      parrafo([normal(`${director.tipoDocumento}: ${director.numeroDocumento}${director.nacionalidad ? ' · ' + director.nacionalidad : ''}`, 22)]),
      parrafo([normal(`Desde: ${formatearFecha(director.fechaNombramiento)}`, 22)]),
    ];
  };

  const children = [
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([bold('CERTIFICADO DE INCUMBENCIA', 26)]),
    centrado([italic('Certificate of Incumbency', 24)]),
    centrado([normal('Expedido conforme a la Ley 32 de 1927 de la República de Panamá', 22)]),
    new Paragraph({ spacing: { after: 200 } }),
    centrado([normal(`Número de certificado: INC-${sociedad.ficha || '000000'}-${new Date().getFullYear()}`, 22)]),
    new Paragraph({ spacing: { after: 200 } }),
    parrafo([
      normal('Yo, '), bold(agenteNombre || 'El Agente Residente'),
      normal(', en mi calidad de Agente Residente de '), bold(sociedad.nombre),
      normal(', sociedad anónima debidamente constituida bajo las leyes de la República de Panamá, con los siguientes datos de inscripción:'),
    ]),
    tablaSimple(
      ['Campo', 'Valor'],
      [
        ['Ficha', sociedad.ficha || '___________'],
        ['Tomo', sociedad.tomo || '___________'],
        ['Folio', sociedad.folio || '___________'],
        ['Constitución', formatearFecha(sociedad.fechaConstitucion)],
        ['Domicilio', sociedad.domicilio || 'República de Panamá'],
        ['Capital', `${formatearMoneda(sociedad.capital)} — ${sociedad.cantidadAcciones?.toLocaleString('es-PA') || '___'} acciones de ${formatearMoneda(sociedad.valorNominal)}`],
        ['Estado', sociedad.estado],
      ]
    ),
    new Paragraph({ spacing: { after: 200 } }),
    parrafo([bold('CERTIFICO'), normal(' que los actuales dignatarios y directores de la sociedad son los siguientes:')]),

    ...cargoBloque('PRESIDENTE / PRESIDENT', presidente),
    ...cargoBloque('SECRETARIO / SECRETARY', secretario),
    ...cargoBloque('TESORERO / TREASURER', tesorero),
    ...otrosDir.flatMap(d => cargoBloque(d.cargo, d)),

    new Paragraph({ spacing: { after: 200 } }),
    parrafo([
      normal('El presente certificado se expide en la Ciudad de Panamá, República de Panamá, el '),
      bold(formatearFecha(new Date())), normal(', a solicitud de parte interesada.'),
    ]),
    parrafo([
      italic('This certificate is issued in the City of Panama, Republic of Panama, on '),
      bold(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 24),
      italic(', at the request of the interested party.'),
    ]),
    new Paragraph({ spacing: { after: 400 } }),
    ...lineaFirma(agenteNombre || 'Agente Residente', `Agente Residente · Resident Agent — ${sociedad.nombre}`),
  ];

  return generarDocxBuffer({ children });
}
