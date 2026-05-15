import { estilosLegales, formatearFecha } from '../../../utils/generadorPDF.js';

export function htmlCartaRenunciaDirector({ sociedad, director, agenteNombre, fechaEfectiva }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .carta-fecha { text-align:right; margin-bottom:24px; font-size:11pt; }
    .destinatario { margin-bottom:20px; }
  </style></head><body>

  <div style="margin-bottom:30px">
    <div class="carta-fecha">Ciudad de Panamá, ${formatearFecha(new Date())}</div>

    <div class="destinatario">
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
    me dirijo a ustedes a fin de presentar formal <strong>RENUNCIA</strong> al cargo de
    <strong>${director?.cargo || '___________'}</strong> que venía desempeñando en la sociedad
    <strong>${sociedad.nombre}</strong>, inscrita en el Registro Público de Panamá bajo la
    Ficha <strong>${sociedad.ficha || '___________'}</strong>.</p>

    <p>La presente renuncia tendrá efectividad a partir del día
    <strong>${fechaEfectiva ? formatearFecha(fechaEfectiva) : formatearFecha(new Date())}</strong>,
    salvo que la Junta Directiva acuerde una fecha distinta.</p>

    <p>Agradezco la oportunidad de haber formado parte de la estructura directiva de
    esta sociedad y me comprometo a facilitar cualquier proceso de transición que
    resulte necesario.</p>

    <p>Asimismo, solicito al Agente Residente, <strong>${agenteNombre || '___________'}</strong>,
    proceder con los trámites correspondientes ante el Registro Público de Panamá para
    hacer constar la presente renuncia.</p>

    <p>Atentamente,</p>
  </div>

  <div class="firmas" style="margin-top:60px">
    <div class="firma-bloque" style="max-width:300px">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${director?.nombre || '___________'}</div>
      <div class="firma-cargo">${director?.cargo || 'Director Renunciante'}</div>
      ${director?.tipoDocumento ? `<div class="firma-cargo">${director.tipoDocumento}: ${director.numeroDocumento}</div>` : ''}
    </div>
  </div>

  <div class="pie-pagina">
    GESTARGOV · Carta de Renuncia de Director · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
