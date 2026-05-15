import { estilosLegales, formatearFecha, formatearMoneda } from '../../../utils/generadorPDF.js';

const estilosReporte = `
  ${estilosLegales}
  .seccion-header {
    background: #1e40af; color: #fff; padding: 8px 14px;
    font-size: 11pt; font-weight: bold; text-transform: uppercase;
    letter-spacing: 0.5px; margin: 20px 0 0 0;
  }
  .seccion-body { padding: 10px 4px; }
  .dato-grid {
    display: grid; grid-template-columns: 160px 1fr; gap: 6px 16px;
    margin: 8px 0; font-size: 11pt;
  }
  .dato-label { color: #555; font-weight: bold; }
  .badge {
    display: inline-block; padding: 2px 10px; border-radius: 12px;
    font-size: 9pt; font-weight: bold;
  }
  .badge-activa   { background: #dcfce7; color: #166534; }
  .badge-inactiva { background: #fee2e2; color: #991b1b; }
  .badge-pendiente { background: #fef9c3; color: #854d0e; }
  .badge-vencido   { background: #fee2e2; color: #991b1b; }
  .badge-pagado    { background: #dcfce7; color: #166534; }
  .mini-table { width:100%; border-collapse:collapse; font-size:10pt; margin:8px 0; }
  .mini-table th { background:#e0e7ff; color:#1e3a8a; padding:5px 8px; text-align:left; border:1px solid #c7d2fe; }
  .mini-table td { padding:5px 8px; border:1px solid #e5e7eb; }
  .mini-table tr:nth-child(even) td { background:#f8fafc; }
  .alerta-bar { background:#fef3c7; border-left:4px solid #f59e0b; padding:8px 12px; margin:8px 0; font-size:10pt; }
  .page-break { page-break-after: always; }
  .stats-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin:12px 0; }
  .stat-box { border:1px solid #e5e7eb; border-radius:6px; padding:10px; text-align:center; }
  .stat-num { font-size:20pt; font-weight:bold; color:#1e40af; }
  .stat-lbl { font-size:9pt; color:#6b7280; margin-top:2px; }
`;

export function htmlFichaSociedad({ sociedad, directores, accionistas, beneficiarios, obligaciones, actas, documentos, agenteNombre }) {
  const hoy = new Date();

  // Helper badge
  const badge = (val, mapa) => {
    const cls = mapa[val] || 'badge-pendiente';
    return `<span class="badge ${cls}">${val}</span>`;
  };

  // ── Sección directores ──
  const filasDirectores = directores.length
    ? directores.map(d => `
      <tr>
        <td>${d.cargo}</td>
        <td>${d.nombre}</td>
        <td>${d.tipoDocumento || ''} ${d.numeroDocumento || ''}</td>
        <td>${d.nacionalidad || '—'}</td>
        <td>${formatearFecha(d.fechaNombramiento)}</td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:#888">Sin directores registrados</td></tr>';

  // ── Sección accionistas ──
  const filasAccionistas = accionistas.length
    ? accionistas.map(a => `
      <tr>
        <td>${a.nombre}</td>
        <td style="text-align:right">${a.cantidadAcciones?.toLocaleString('es-PA') || '—'}</td>
        <td style="text-align:right">${a.porcentaje != null ? Number(a.porcentaje).toFixed(2) + '%' : '—'}</td>
        <td>${a.nacionalidad || '—'}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:#888">Sin accionistas registrados</td></tr>';

  // ── Sección beneficiarios ──
  const benefVencidos = beneficiarios.filter(b => !b.fechaActualizacion || (new Date() - new Date(b.fechaActualizacion)) > 365 * 86400000);
  const fBenef = beneficiarios.length
    ? beneficiarios.map(b => {
        const vencido = !b.fechaActualizacion || (new Date() - new Date(b.fechaActualizacion)) > 365 * 86400000;
        return `<tr${vencido ? ' style="background:#fff7ed"' : ''}>
          <td>${b.nombre}</td>
          <td style="text-align:right">${Number(b.porcentajeControl).toFixed(2)}%</td>
          <td>${b.esPEP ? '⚠️ PEP' : 'No'}</td>
          <td>${b.verificado ? '✓' : '✗'}</td>
          <td>${b.fechaActualizacion ? formatearFecha(b.fechaActualizacion) : '—'}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5" style="text-align:center;color:#888">Sin beneficiarios registrados</td></tr>';

  // ── Sección obligaciones ──
  const fOblig = obligaciones.length
    ? obligaciones.map(o => {
        const dias = Math.ceil((new Date(o.fechaVence) - hoy) / 86400000);
        const estadoBadge = badge(o.estado, { PENDIENTE: 'badge-pendiente', VENCIDO: 'badge-vencido', PAGADO: 'badge-pagado' });
        return `<tr>
          <td>${o.tipo.replace(/_/g,' ')}</td>
          <td>${o.anio}</td>
          <td>${o.entidad || '—'}</td>
          <td>${formatearFecha(o.fechaVence)}</td>
          <td style="text-align:center">${estadoBadge}</td>
          <td style="text-align:right">${dias < 0 ? `<span style="color:#991b1b">vencida ${Math.abs(dias)}d</span>` : `${dias}d`}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6" style="text-align:center;color:#888">Sin obligaciones registradas</td></tr>';

  // ── Sección actas ──
  const fActas = actas.slice(0, 10).map(a => `
    <tr>
      <td>${a.numero}</td>
      <td>${a.tipo.replace(/_/g,' ')}</td>
      <td>${formatearFecha(a.fecha)}</td>
      <td>${badge(a.estado, { BORRADOR:'badge-pendiente', FIRMADA:'badge-activa', PROTOCOLIZADA:'badge-activa' })}</td>
    </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#888">Sin actas</td></tr>';

  // ── Alertas al tope ──
  const alertas = [];
  if (benefVencidos.length > 0) alertas.push(`⚠️ ${benefVencidos.length} beneficiario(s) con información desactualizada (>1 año)`);
  const oblVencidas = obligaciones.filter(o => o.estado === 'VENCIDO');
  if (oblVencidas.length > 0) alertas.push(`🚨 ${oblVencidas.length} obligación(es) fiscal(es) vencida(s) sin pagar`);
  const pepNoVerif = beneficiarios.filter(b => b.esPEP && !b.verificado);
  if (pepNoVerif.length > 0) alertas.push(`⚠️ ${pepNoVerif.length} PEP(s) sin verificar — revisión requerida`);

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>${estilosReporte}</style></head><body>

  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <h2>FICHA CORPORATIVA COMPLETA</h2>
    <p>Agente Residente: ${agenteNombre || '—'} · Generado: ${formatearFecha(new Date())}</p>
  </div>

  ${alertas.length ? `<div style="margin:12px 0">${alertas.map(a => `<div class="alerta-bar">${a}</div>`).join('')}</div>` : ''}

  <div class="stats-grid">
    <div class="stat-box"><div class="stat-num">${directores.length}</div><div class="stat-lbl">Directores</div></div>
    <div class="stat-box"><div class="stat-num">${accionistas.length}</div><div class="stat-lbl">Accionistas</div></div>
    <div class="stat-box"><div class="stat-num">${beneficiarios.length}</div><div class="stat-lbl">Beneficiarios</div></div>
    <div class="stat-box"><div class="stat-num">${actas.length}</div><div class="stat-lbl">Actas</div></div>
  </div>

  <div class="seccion-header">Datos de Inscripción</div>
  <div class="seccion-body">
    <div class="dato-grid">
      <span class="dato-label">Ficha:</span><span>${sociedad.ficha || '—'}</span>
      <span class="dato-label">Tomo:</span><span>${sociedad.tomo || '—'}</span>
      <span class="dato-label">Folio:</span><span>${sociedad.folio || '—'}</span>
      <span class="dato-label">Constitución:</span><span>${formatearFecha(sociedad.fechaConstitucion)}</span>
      <span class="dato-label">Domicilio:</span><span>${sociedad.domicilio || 'República de Panamá'}</span>
      <span class="dato-label">Estado:</span><span>${badge(sociedad.estado, { ACTIVA:'badge-activa', INACTIVA:'badge-inactiva', DISUELTA:'badge-inactiva' })}</span>
      <span class="dato-label">Plan:</span><span>${sociedad.planCliente}</span>
      <span class="dato-label">Capital:</span><span>${formatearMoneda(sociedad.capital)}</span>
      <span class="dato-label">Acciones:</span><span>${sociedad.cantidadAcciones?.toLocaleString('es-PA') || '—'} ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'} de ${formatearMoneda(sociedad.valorNominal)} c/u</span>
    </div>
  </div>

  <div class="seccion-header">Junta Directiva</div>
  <div class="seccion-body">
    <table class="mini-table">
      <tr><th>Cargo</th><th>Nombre</th><th>Documento</th><th>Nacionalidad</th><th>Desde</th></tr>
      ${filasDirectores}
    </table>
  </div>

  <div class="seccion-header">Accionistas</div>
  <div class="seccion-body">
    <table class="mini-table">
      <tr><th>Nombre</th><th style="text-align:right">Acciones</th><th style="text-align:right">%</th><th>Nacionalidad</th></tr>
      ${filasAccionistas}
    </table>
  </div>

  <div class="seccion-header">Beneficiarios Finales — Ley 52 de 2016</div>
  <div class="seccion-body">
    <table class="mini-table">
      <tr><th>Nombre</th><th style="text-align:right">% Control</th><th>PEP</th><th>Verificado</th><th>Actualizado</th></tr>
      ${fBenef}
    </table>
  </div>

  <div class="seccion-header">Obligaciones Fiscales</div>
  <div class="seccion-body">
    <table class="mini-table">
      <tr><th>Tipo</th><th>Año</th><th>Entidad</th><th>Vencimiento</th><th>Estado</th><th>Días</th></tr>
      ${fOblig}
    </table>
  </div>

  <div class="seccion-header">Actas (últimas 10)</div>
  <div class="seccion-body">
    <table class="mini-table">
      <tr><th>#</th><th>Tipo</th><th>Fecha</th><th>Estado</th></tr>
      ${fActas}
    </table>
  </div>

  <div class="firmas" style="margin-top:50px">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${agenteNombre || 'Agente Residente'}</div>
      <div class="firma-cargo">Agente Residente</div>
    </div>
  </div>

  <div class="pie-pagina">
    GESTARGOV · Ficha Corporativa · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
