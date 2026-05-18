import { estilosLegales, formatearFecha, formatearMoneda } from '../../utils/generadorPDF.js';

export function htmlCertificadoAccion({ sociedad, accion }) {
  const numeroFormateado = String(accion.numero).padStart(4, '0');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .certificado {
      border: 3px double #000;
      padding: 30px 40px;
      min-height: 650px;
      position: relative;
    }
    .marca-agua {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 72pt;
      color: rgba(0,0,0,0.04);
      white-space: nowrap;
      pointer-events: none;
      font-weight: bold;
      letter-spacing: 8px;
    }
    .numero-certificado {
      font-size: 13pt;
      border: 2px solid #000;
      display: inline-block;
      padding: 6px 18px;
      margin-bottom: 16px;
      font-weight: bold;
    }
    .campo { margin-bottom: 14px; }
    .campo-etiqueta {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #555;
      margin-bottom: 2px;
    }
    .campo-valor {
      font-size: 12pt;
      font-weight: bold;
      border-bottom: 1px solid #333;
      padding-bottom: 3px;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .declaracion {
      margin: 20px 0;
      padding: 14px;
      border: 1px solid #ccc;
      background: #fafafa;
      font-size: 11pt;
      text-align: justify;
    }
  </style>
</head>
<body>
  <div class="certificado">
    <div class="marca-agua">GESTARCORP</div>

    <div class="encabezado">
      <h1>${sociedad.nombre}</h1>
      <p>Sociedad Anónima constituida bajo las leyes de la República de Panamá</p>
      ${sociedad.ficha ? `<p>Ficha: ${sociedad.ficha} · Tomo: ${sociedad.tomo || '—'} · Folio: ${sociedad.folio || '—'}</p>` : ''}
    </div>

    <div style="text-align:center; margin-bottom: 20px;">
      <div class="numero-certificado">CERTIFICADO N° ${numeroFormateado}</div>
      <div style="font-size:13pt; font-weight:bold; text-transform:uppercase; letter-spacing:2px;">
        Certificado de Acciones
      </div>
      <div style="font-size:11pt; color:#555; margin-top:4px;">
        Clase: ${accion.clase === 'COMUN' ? 'Acción Común' : accion.clase}
      </div>
    </div>

    <div class="grid-2">
      <div class="campo">
        <div class="campo-etiqueta">Titular</div>
        <div class="campo-valor">${accion.titular}</div>
      </div>
      <div class="campo">
        <div class="campo-etiqueta">Número de Acciones</div>
        <div class="campo-valor" style="font-size:16pt; color:#1a1a6e;">1</div>
      </div>
    </div>

    <div class="grid-3">
      <div class="campo">
        <div class="campo-etiqueta">Número de Acción</div>
        <div class="campo-valor">${accion.numero}</div>
      </div>
      <div class="campo">
        <div class="campo-etiqueta">Valor Nominal</div>
        <div class="campo-valor">${formatearMoneda(accion.valorNominal ?? sociedad.valorNominal)}</div>
      </div>
      <div class="campo">
        <div class="campo-etiqueta">Fecha de Emisión</div>
        <div class="campo-valor">${formatearFecha(accion.fechaEmision)}</div>
      </div>
    </div>

    <div class="declaracion">
      <p>Este certificado acredita que <strong>${accion.titular}</strong> es titular de
      <strong>UNA (1)</strong> acción ${accion.clase === 'COMUN' ? 'común' : accion.clase.toLowerCase()}
      con valor nominal de <strong>${formatearMoneda(accion.valorNominal ?? sociedad.valorNominal)}</strong>,
      registrada bajo el número <strong>${accion.numero}</strong>
      en el Libro de Acciones de <strong>${sociedad.nombre}</strong>,
      sociedad debidamente constituida bajo las leyes de la República de Panamá,
      con capital autorizado de <strong>${formatearMoneda(sociedad.capital)}</strong>,
      dividido en <strong>${sociedad.cantidadAcciones?.toLocaleString('es-PA') || '___'}</strong>
      acciones ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'}.</p>
    </div>

    <p style="font-size:10pt; color:#555; margin-bottom: 8px;">
      Emitido en la Ciudad de Panamá, República de Panamá,
      el ${formatearFecha(accion.fechaEmision || new Date())}.
    </p>

    <div class="firmas">
      <div class="firma-bloque">
        <div class="firma-linea"></div>
        <div class="firma-nombre">Presidente</div>
        <div class="firma-cargo">${sociedad.nombre}</div>
      </div>
      <div class="firma-bloque">
        <div class="firma-linea"></div>
        <div class="firma-nombre">Secretario</div>
        <div class="firma-cargo">${sociedad.nombre}</div>
      </div>
    </div>

    <div class="pie-pagina">
      GESTARCORP · Gestión Societaria Panameña · Certificado generado el ${formatearFecha(new Date())}
    </div>
  </div>
</body>
</html>`;
}
