import {
  bold, normal, italic, parrafo, centrado, tablaSimple, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha } from '../../../utils/generadorPDF.js';
import { Paragraph } from 'docx';

export async function docxCertificadoBuenaStanding({ sociedad, agenteNombre }) {
  const children = [
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([bold('CERTIFICADO DE BUENA POSICIÓN', 26)]),
    centrado([italic('Certificate of Good Standing', 24)]),
    centrado([normal('Expedido conforme a la Ley 32 de 1927 de la República de Panamá', 22)]),
    new Paragraph({ spacing: { after: 200 } }),
    centrado([normal(`Número de certificado: BGS-${sociedad.ficha || '000000'}-${new Date().getFullYear()}`, 22)]),
    new Paragraph({ spacing: { after: 200 } }),
    tablaSimple(
      ['Campo / Field', 'Valor / Value'],
      [
        ['Ficha / File', sociedad.ficha || '___________'],
        ['Tomo / Volume', sociedad.tomo || '___________'],
        ['Folio / Page', sociedad.folio || '___________'],
        ['Constitución / Incorporated', formatearFecha(sociedad.fechaConstitucion)],
        ['Domicilio / Domicile', sociedad.domicilio || 'República de Panamá'],
        ['Estado / Status', sociedad.estado === 'ACTIVA' ? 'ACTIVA / ACTIVE' : sociedad.estado],
      ]
    ),
    new Paragraph({ spacing: { after: 200 } }),
    parrafo([
      bold('CERTIFICO'), normal(' que la referida sociedad se encuentra en buena posición ante el Registro Público de Panamá y que, a la fecha de expedición de este certificado, no consta en nuestros registros ningún impedimento legal para el ejercicio normal de sus actividades corporativas.'),
    ]),
    parrafo([
      bold('I HEREBY CERTIFY'), italic(' that the above-mentioned corporation is in good standing with the Public Registry of Panama and that, as of the date of issuance of this certificate, there is no known legal impediment for the normal exercise of its corporate activities.'),
    ]),
    new Paragraph({ spacing: { after: 200 } }),
    parrafo([
      normal('Este certificado se expide en la Ciudad de Panamá, República de Panamá, el '),
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
