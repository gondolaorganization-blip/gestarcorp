import { estilosLegales, formatearFecha } from '../../../utils/generadorPDF.js';

export function htmlCertificadoBuenaStanding({ sociedad, agenteNombre }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .sello-estado { text-align:center; margin:24px 0; }
    .badge-activa {
      display:inline-block; background:#166534; color:#fff;
      font-size:13pt; font-weight:bold; letter-spacing:2px;
      padding:8px 28px; border-radius:4px; text-transform:uppercase;
    }
    .badge-inactiva {
      display:inline-block; background:#991b1b; color:#fff;
      font-size:13pt; font-weight:bold; letter-spacing:2px;
      padding:8px 28px; border-radius:4px; text-transform:uppercase;
    }
  </style></head><body>

  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <h2>CERTIFICADO DE BUENA POSICIÓN</h2>
    <p>Certificate of Good Standing</p>
    <p>Expedido conforme a la Ley 32 de 1927 de la República de Panamá</p>
  </div>

  <div class="sello" style="margin:16px 0">
    <div style="font-size:10pt;color:#555;margin-bottom:8px">Número de certificado</div>
    <div class="numero-certificado">BGS-${sociedad.ficha || '000000'}-${new Date().getFullYear()}</div>
  </div>

  <div class="cuerpo">
    <p>Yo, <strong>${agenteNombre || 'El Agente Residente'}</strong>, en mi calidad de
    Agente Residente de <strong>${sociedad.nombre}</strong>, sociedad anónima
    debidamente constituida bajo las leyes de la República de Panamá,
    <em>I, <strong>${agenteNombre || 'The Resident Agent'}</strong>, acting as Resident
    Agent of <strong>${sociedad.nombre}</strong>, a corporation duly incorporated under
    the laws of the Republic of Panama,</em></p>

    <table style="margin:12px 0">
      <tr><td style="width:160px"><strong>Ficha / File:</strong></td><td>${sociedad.ficha || '___________'}</td></tr>
      <tr><td><strong>Tomo / Volume:</strong></td><td>${sociedad.tomo || '___________'}</td></tr>
      <tr><td><strong>Folio / Page:</strong></td><td>${sociedad.folio || '___________'}</td></tr>
      <tr><td><strong>Constitución / Incorporated:</strong></td><td>${formatearFecha(sociedad.fechaConstitucion)}</td></tr>
      <tr><td><strong>Domicilio / Domicile:</strong></td><td>${sociedad.domicilio || 'República de Panamá'}</td></tr>
    </table>

    <div class="sello-estado">
      <div class="${sociedad.estado === 'ACTIVA' ? 'badge-activa' : 'badge-inactiva'}">
        ${sociedad.estado === 'ACTIVA' ? 'ACTIVA / ACTIVE' : sociedad.estado}
      </div>
    </div>

    <p><strong>CERTIFICO</strong> que la referida sociedad se encuentra en buena posición
    ante el Registro Público de Panamá y que, a la fecha de expedición de este certificado,
    no consta en nuestros registros ningún impedimento legal para el ejercicio normal de sus
    actividades corporativas.</p>

    <p><em><strong>I HEREBY CERTIFY</strong> that the above-mentioned corporation is in
    good standing with the Public Registry of Panama and that, as of the date of issuance
    of this certificate, there is no known legal impediment for the normal exercise of its
    corporate activities.</em></p>

    <p style="margin-top:16px">Este certificado se expide en la Ciudad de Panamá, República de Panamá,
    el <strong>${formatearFecha(new Date())}</strong>, a solicitud de parte interesada.</p>

    <p><em>This certificate is issued in the City of Panama, Republic of Panama, on
    <strong>${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</strong>,
    at the request of the interested party.</em></p>
  </div>

  <div class="firmas" style="margin-top:50px">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${agenteNombre || 'Agente Residente'}</div>
      <div class="firma-cargo">Agente Residente · Resident Agent</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
  </div>

  <div class="pie-pagina">
    GESTARCORP · Certificado de Buena Posición · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
