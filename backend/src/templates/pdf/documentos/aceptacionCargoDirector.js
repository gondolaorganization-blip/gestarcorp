import { estilosLegales, formatearFecha } from '../../../utils/generadorPDF.js';

export function htmlAceptacionCargoDirector({ sociedad, director, agenteNombre }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .carta-fecha { text-align:right; margin-bottom:24px; font-size:11pt; }
  </style></head><body>

  <div style="margin-bottom:30px">
    <div class="carta-fecha">Ciudad de Panamá, ${formatearFecha(new Date())}</div>

    <div style="margin-bottom:20px">
      <p><strong>Señores</strong><br>
      Junta Directiva<br>
      <strong>${sociedad.nombre}</strong><br>
      República de Panamá</p>
    </div>
  </div>

  <div class="cuerpo">
    <p>Estimados señores:</p>

    <p>Por medio de la presente, yo, <strong>${director?.nombre || '___________'}</strong>,
    portador de ${director?.tipoDocumento || 'cédula/pasaporte'} No.
    <strong>${director?.numeroDocumento || '___________'}</strong>${director?.nacionalidad ? `, de nacionalidad ${director.nacionalidad}` : ''},
    me dirijo a ustedes con el objeto de manifestar formalmente mi
    <strong>ACEPTACIÓN</strong> del nombramiento como
    <strong>${director?.cargo || '___________'}</strong> de la sociedad
    <strong>${sociedad.nombre}</strong>, inscrita en el Registro Público de Panamá bajo la
    Ficha <strong>${sociedad.ficha || '___________'}</strong>.</p>

    <p>Declaro que:</p>
    <ol style="margin:12px 0 12px 24px">
      <li style="margin-bottom:8px">Acepto el cargo para el que he sido designado y me comprometo
      a desempeñarlo con diligencia, lealtad y en el mejor interés de la sociedad y sus accionistas.</li>
      <li style="margin-bottom:8px">Conozco y acepto las obligaciones y responsabilidades inherentes
      al cargo conforme a la Ley 32 de 1927 y los estatutos sociales de la empresa.</li>
      <li style="margin-bottom:8px">Los datos de identidad que suministro son exactos y verídicos.</li>
      <li style="margin-bottom:8px">Me comprometo a mantener informado al Agente Residente sobre
      cualquier cambio en mis datos o circunstancias relevantes para el ejercicio del cargo.</li>
    </ol>

    <p>La presente aceptación rige a partir del
    <strong>${formatearFecha(director?.fechaNombramiento || new Date())}</strong>.</p>

    <p>Solicito al Agente Residente, <strong>${agenteNombre || '___________'}</strong>,
    tomar nota de la presente aceptación y proceder con los registros correspondientes.</p>

    <p>Atentamente,</p>
  </div>

  <div class="firmas" style="margin-top:60px">
    <div class="firma-bloque" style="max-width:300px">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${director?.nombre || '___________'}</div>
      <div class="firma-cargo">${director?.cargo || 'Director'}</div>
      ${director?.tipoDocumento ? `<div class="firma-cargo">${director.tipoDocumento}: ${director.numeroDocumento}</div>` : ''}
    </div>
  </div>

  <div class="pie-pagina">
    GESTARCORP · Aceptación de Cargo de Director · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
