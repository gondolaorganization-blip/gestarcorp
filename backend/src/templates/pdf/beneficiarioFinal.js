import { estilosLegales, formatearFecha } from '../../utils/generadorPDF.js';

export function htmlDeclaracionBeneficiarios({ sociedad, beneficiarios }) {
  const fechaHoy = formatearFecha(new Date());
  const pepCount  = beneficiarios.filter(b => b.esPEP).length;

  const filas = beneficiarios.map((b, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td><strong>${b.nombre}</strong></td>
      <td>${b.tipoDocumento}: ${b.numeroDocumento}</td>
      <td>${b.nacionalidad || '—'}</td>
      <td>${b.fechaNacimiento ? formatearFecha(b.fechaNacimiento, 'dd/MM/yyyy') : '—'}</td>
      <td>${b.porcentajeControl != null ? Number(b.porcentajeControl).toFixed(2) + '%' : '—'}</td>
      <td>${b.tipoControl}</td>
      <td style="text-align:center">
        <span style="font-weight:bold; color:${b.esPEP ? '#dc2626' : '#16a34a'}">
          ${b.esPEP ? 'SÍ' : 'NO'}
        </span>
      </td>
      <td>${b.verificado ? '✓ Verificado' : 'Pendiente'}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .alerta-legal {
      background: #fefce8; border: 1px solid #ca8a04;
      padding: 12px 16px; margin: 16px 0; font-size: 10.5pt;
    }
    .badge-pep {
      background: #fee2e2; color: #991b1b;
      padding: 2px 8px; border-radius: 3px; font-size: 10pt;
      font-weight: bold;
    }
    .resumen {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 12px; margin: 16px 0;
    }
    .resumen-item {
      border: 1px solid #ddd; padding: 12px;
      text-align: center; border-radius: 4px;
    }
    .resumen-numero { font-size: 24pt; font-weight: bold; color: #1e40af; }
    .resumen-label  { font-size: 9pt; color: #555; text-transform: uppercase; }
    th { font-size: 9.5pt; }
    td { font-size: 10pt; vertical-align: top; }
  </style></head><body>

  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <h2>Registro de Beneficiarios Finales</h2>
    <p>Conforme a la Ley 52 de 22 de octubre de 2016</p>
    <p>Ficha: ${sociedad.ficha || '—'} · Tomo: ${sociedad.tomo || '—'} · Folio: ${sociedad.folio || '—'}</p>
    <p><strong>Fecha de generación:</strong> ${fechaHoy}</p>
  </div>

  <div class="alerta-legal">
    <strong>CONFIDENCIAL — USO OFICIAL.</strong> La presente declaración se emite de conformidad con
    la Ley 52 de 2016 de la República de Panamá, que establece la obligación del Agente Residente
    de conocer y mantener información actualizada sobre los beneficiarios finales de sus clientes.
    Se entiende por beneficiario final toda persona natural que, directa o indirectamente, sea
    propietaria o ejerza control sobre el 25% o más de las acciones o derechos de voto.
  </div>

  <div class="resumen">
    <div class="resumen-item">
      <div class="resumen-numero">${beneficiarios.length}</div>
      <div class="resumen-label">Beneficiarios declarados</div>
    </div>
    <div class="resumen-item">
      <div class="resumen-numero" style="color:${pepCount > 0 ? '#dc2626' : '#16a34a'}">${pepCount}</div>
      <div class="resumen-label">PEP identificados</div>
    </div>
    <div class="resumen-item">
      <div class="resumen-numero">${beneficiarios.filter(b => b.verificado).length}</div>
      <div class="resumen-label">Verificados</div>
    </div>
  </div>

  ${beneficiarios.length === 0
    ? '<p style="text-align:center;color:#888;padding:24px"><em>No se han registrado beneficiarios finales.</em></p>'
    : `<table>
      <thead><tr>
        <th>#</th><th>Nombre completo</th><th>Documento</th>
        <th>Nacionalidad</th><th>Nacimiento</th>
        <th>% Control</th><th>Tipo</th><th>PEP</th><th>Estado</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`
  }

  ${beneficiarios.filter(b => b.esPEP).length > 0 ? `
  <div class="seccion" style="margin-top:20px">
    <div class="seccion-titulo">Personas Expuestas Políticamente (PEP)</div>
    ${beneficiarios.filter(b => b.esPEP).map(b => `
      <div style="border:1px solid #fca5a5; background:#fff5f5; padding:10px 14px; margin-bottom:8px; border-radius:4px">
        <strong>${b.nombre}</strong> <span class="badge-pep">PEP</span><br>
        <span style="font-size:10pt">Cargo público: ${b.cargoPublico || 'No especificado'}</span>
      </div>
    `).join('')}
  </div>` : ''}

  <div class="seccion" style="margin-top:24px">
    <div class="seccion-titulo">Declaración del Agente Residente</div>
    <p>El Agente Residente de <strong>${sociedad.nombre}</strong> declara que la información
    contenida en el presente registro es completa, veraz y actualizada al día de hoy,
    ${fechaHoy}, de conformidad con la Ley 52 de 2016 y sus reglamentaciones.</p>
    <p>Asimismo, declara conocer las identidades de los beneficiarios finales
    identificados y haber verificado sus documentos de identidad.</p>
  </div>

  <div class="firmas" style="margin-top:40px">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Agente Residente</div>
      <div class="firma-cargo">Registro N° ___________</div>
    </div>
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Representante Legal</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
  </div>

  <div class="pie-pagina">
    GESTARGOV · Registro de Beneficiarios Finales — Ley 52 de 2016 · ${fechaHoy}
  </div>
  </body></html>`;
}
