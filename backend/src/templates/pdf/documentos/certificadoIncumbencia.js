import { estilosLegales, formatearFecha, formatearMoneda } from '../../../utils/generadorPDF.js';

export function htmlCertificadoIncumbencia({ sociedad, directores, agenteNombre }) {
  const presidente  = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario  = directores.find(d => d.cargo === 'SECRETARIO');
  const tesorero    = directores.find(d => d.cargo === 'TESORERO');
  const otrosDir    = directores.filter(d => !['PRESIDENTE','SECRETARIO','TESORERO'].includes(d.cargo));

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .sello { text-align:center; margin:20px 0; }
    .sello-circulo {
      display:inline-block; border:3px double #000;
      border-radius:50%; width:100px; height:100px;
      line-height:100px; font-size:10pt; font-weight:bold;
      color:#000; vertical-align:middle;
    }
    .cargo-bloque { margin-bottom:14px; padding:10px 14px; border-left:3px solid #1e40af; }
    .cargo-titulo { font-weight:bold; text-transform:uppercase; font-size:10pt; color:#1e40af; }
    .cargo-nombre { font-size:12pt; font-weight:bold; margin:4px 0; }
    .cargo-doc    { font-size:10pt; color:#555; }
    .no-director  { color:#888; font-style:italic; }
  </style></head><body>

  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <h2>CERTIFICADO DE INCUMBENCIA</h2>
    <p>Certificate of Incumbency</p>
    <p>Expedido conforme a la Ley 32 de 1927 de la República de Panamá</p>
  </div>

  <div class="sello" style="margin:16px 0">
    <div style="font-size:10pt;color:#555;margin-bottom:8px">Número de certificado</div>
    <div class="numero-certificado">INC-${sociedad.ficha || '000000'}-${new Date().getFullYear()}</div>
  </div>

  <div class="cuerpo">
    <p>Yo, <strong>${agenteNombre || 'El Agente Residente'}</strong>, en mi calidad de
    Agente Residente de <strong>${sociedad.nombre}</strong>, sociedad anónima
    debidamente constituida bajo las leyes de la República de Panamá,
    con los siguientes datos de inscripción en el Registro Público de Panamá:</p>

    <table style="margin:12px 0">
      <tr><td style="width:160px"><strong>Ficha:</strong></td><td>${sociedad.ficha || '___________'}</td></tr>
      <tr><td><strong>Tomo:</strong></td><td>${sociedad.tomo || '___________'}</td></tr>
      <tr><td><strong>Folio:</strong></td><td>${sociedad.folio || '___________'}</td></tr>
      <tr><td><strong>Constitución:</strong></td><td>${formatearFecha(sociedad.fechaConstitucion)}</td></tr>
      <tr><td><strong>Domicilio:</strong></td><td>${sociedad.domicilio || 'República de Panamá'}</td></tr>
      <tr><td><strong>Capital:</strong></td><td>${formatearMoneda(sociedad.capital)} — ${sociedad.cantidadAcciones?.toLocaleString('es-PA') || '___'} acciones ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'} de ${formatearMoneda(sociedad.valorNominal)} cada una</td></tr>
      <tr><td><strong>Estado:</strong></td><td><strong>${sociedad.estado}</strong></td></tr>
    </table>

    <p><strong>CERTIFICO</strong> que, de conformidad con los registros que obran en mi poder y
    conforme a lo declarado por los representantes de dicha sociedad, los actuales
    <strong>dignatarios y directores</strong> de la misma son los siguientes:</p>

    <div style="margin:16px 0">
      <div class="cargo-bloque">
        <div class="cargo-titulo">Presidente / President</div>
        ${presidente
          ? `<div class="cargo-nombre">${presidente.nombre}</div>
             <div class="cargo-doc">${presidente.tipoDocumento}: ${presidente.numeroDocumento}
             ${presidente.nacionalidad ? ` · ${presidente.nacionalidad}` : ''}</div>
             <div class="cargo-doc">Desde: ${formatearFecha(presidente.fechaNombramiento)}</div>`
          : '<div class="no-director">No designado</div>'
        }
      </div>

      <div class="cargo-bloque">
        <div class="cargo-titulo">Secretario / Secretary</div>
        ${secretario
          ? `<div class="cargo-nombre">${secretario.nombre}</div>
             <div class="cargo-doc">${secretario.tipoDocumento}: ${secretario.numeroDocumento}
             ${secretario.nacionalidad ? ` · ${secretario.nacionalidad}` : ''}</div>
             <div class="cargo-doc">Desde: ${formatearFecha(secretario.fechaNombramiento)}</div>`
          : '<div class="no-director">No designado</div>'
        }
      </div>

      <div class="cargo-bloque">
        <div class="cargo-titulo">Tesorero / Treasurer</div>
        ${tesorero
          ? `<div class="cargo-nombre">${tesorero.nombre}</div>
             <div class="cargo-doc">${tesorero.tipoDocumento}: ${tesorero.numeroDocumento}
             ${tesorero.nacionalidad ? ` · ${tesorero.nacionalidad}` : ''}</div>
             <div class="cargo-doc">Desde: ${formatearFecha(tesorero.fechaNombramiento)}</div>`
          : '<div class="no-director">No designado</div>'
        }
      </div>

      ${otrosDir.map(d => `
      <div class="cargo-bloque">
        <div class="cargo-titulo">${d.cargo}</div>
        <div class="cargo-nombre">${d.nombre}</div>
        <div class="cargo-doc">${d.tipoDocumento}: ${d.numeroDocumento}
        ${d.nacionalidad ? ` · ${d.nacionalidad}` : ''}</div>
      </div>`).join('')}
    </div>

    <p>El presente certificado se expide en la Ciudad de Panamá, República de Panamá,
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
    GESTARCORP · Certificado de Incumbencia · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
