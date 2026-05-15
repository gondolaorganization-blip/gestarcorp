import { estilosLegales, formatearFecha } from '../../../utils/generadorPDF.js';

export function htmlResolucionAperturaCuenta({ sociedad, directores, banco, firmantes }) {
  const presidente = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = directores.find(d => d.cargo === 'SECRETARIO');
  const tesorero   = directores.find(d => d.cargo === 'TESORERO');

  const firmantesDefault = [presidente, tesorero, secretario].filter(Boolean);
  const listaFirmantes   = (firmantes && firmantes.length > 0) ? firmantes : firmantesDefault;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .resolucion-num { text-align:center; font-size:11pt; color:#555; margin-bottom:16px; }
    .considerando { margin-left:24px; margin-bottom:8px; }
    .resuelve-item { margin-left:24px; margin-bottom:10px; }
  </style></head><body>

  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <h2>RESOLUCIÓN DE JUNTA DIRECTIVA</h2>
    <p>Apertura de Cuenta Bancaria</p>
  </div>

  <div class="resolucion-num">
    Resolución No. ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2,'0')}-001
  </div>

  <div class="cuerpo">
    <p>Los suscritos, Presidente y Secretario de la Junta Directiva de la sociedad
    <strong>${sociedad.nombre}</strong>, sociedad anónima inscrita en el Registro
    Público de Panamá, Ficha <strong>${sociedad.ficha || '___________'}</strong>,
    Tomo <strong>${sociedad.tomo || '___________'}</strong>,
    Folio <strong>${sociedad.folio || '___________'}</strong>,</p>

    <div class="seccion">
      <div class="seccion-titulo">Considerando:</div>
      <p class="considerando"><strong>PRIMERO:</strong> Que la sociedad requiere apertura de cuenta
      bancaria para el manejo de sus fondos y operaciones comerciales.</p>
      <p class="considerando"><strong>SEGUNDO:</strong> Que el banco
      <strong>${banco || '___________'}</strong> ofrece los servicios adecuados para
      las necesidades de la sociedad.</p>
      <p class="considerando"><strong>TERCERO:</strong> Que la Junta Directiva,
      debidamente convocada y constituida, ha deliberado y acordado lo siguiente.</p>
    </div>

    <div class="seccion">
      <div class="seccion-titulo">Resuelve:</div>
      <p class="resuelve-item"><strong>PRIMERO:</strong> Autorizar la apertura de una o varias
      cuentas bancarias a nombre de <strong>${sociedad.nombre}</strong> en
      <strong>${banco || '___________'}</strong>.</p>

      <p class="resuelve-item"><strong>SEGUNDO:</strong> Designar como firmantes autorizados de
      dichas cuentas, con firma mancomunada o individual según lo establezca el banco, a las
      siguientes personas:</p>

      <table style="margin:12px 0 16px 24px; width:calc(100% - 24px)">
        <tr>
          <th>Nombre</th>
          <th>Cargo</th>
          <th>Documento</th>
        </tr>
        ${listaFirmantes.map(f => `
        <tr>
          <td>${f?.nombre || '___________'}</td>
          <td>${f?.cargo || '___________'}</td>
          <td>${f?.tipoDocumento || ''} ${f?.numeroDocumento || '___________'}</td>
        </tr>`).join('')}
      </table>

      <p class="resuelve-item"><strong>TERCERO:</strong> Autorizar a los firmantes designados
      para girar, endosar, depositar y retirar fondos, así como para suscribir todos los
      documentos bancarios que sean necesarios.</p>

      <p class="resuelve-item"><strong>CUARTO:</strong> La presente resolución tendrá plena
      vigencia desde la fecha de su adopción y hasta que sea revocada expresamente por la
      Junta Directiva.</p>
    </div>

    <p>Adoptada en la Ciudad de Panamá, República de Panamá, el
    <strong>${formatearFecha(new Date())}</strong>.</p>
  </div>

  <div class="firmas">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${presidente?.nombre || '___________'}</div>
      <div class="firma-cargo">Presidente</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${secretario?.nombre || '___________'}</div>
      <div class="firma-cargo">Secretario</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
  </div>

  <div class="pie-pagina">
    GESTARGOV · Resolución Apertura de Cuenta · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
