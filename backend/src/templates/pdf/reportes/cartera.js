import { estilosLegales, formatearFecha, formatearMoneda } from '../../../utils/generadorPDF.js';

export function htmlReporteCartera({ sociedades, agenteNombre, fechaCorte }) {
  const hoy = fechaCorte ? new Date(fechaCorte) : new Date();

  const estadisticas = {
    total:     sociedades.length,
    activas:   sociedades.filter(s => s.estado === 'ACTIVA').length,
    inactivas: sociedades.filter(s => s.estado === 'INACTIVA').length,
    mensual:   sociedades.filter(s => s.planCliente === 'MENSUAL').length,
    anual:     sociedades.filter(s => s.planCliente === 'ANUAL').length,
    fundador:  sociedades.filter(s => s.planCliente === 'FUNDADOR').length,
    oblVencidas: sociedades.reduce((n, s) => n + (s._oblVencidas || 0), 0),
    benSinVerif: sociedades.reduce((n, s) => n + (s._benefSinVerif || 0), 0),
  };

  const filas = sociedades.map(s => {
    const diasVenc = s.fechaVencimiento
      ? Math.ceil((new Date(s.fechaVencimiento) - hoy) / 86400000)
      : null;
    const vencTag = diasVenc == null
      ? '<span style="color:#888">—</span>'
      : diasVenc < 0
        ? `<span style="color:#991b1b;font-weight:bold">VENCIDO</span>`
        : diasVenc <= 30
          ? `<span style="color:#c2410c;font-weight:bold">${diasVenc}d</span>`
          : `<span style="color:#166534">${diasVenc}d</span>`;

    const estadoColor = s.estado === 'ACTIVA' ? '#166534' : '#991b1b';
    const scoreColor  = s.healthScore >= 80 ? '#166534' : s.healthScore >= 50 ? '#92400e' : '#991b1b';
    const alertas = [];
    if (s._oblVencidas > 0) alertas.push(`${s._oblVencidas} oblig.`);
    if (s._benefSinVerif > 0) alertas.push(`${s._benefSinVerif} benef.`);

    return `<tr>
      <td>${s.ficha || '—'}</td>
      <td><strong>${s.nombre}</strong></td>
      <td style="color:${estadoColor};font-weight:bold">${s.estado}</td>
      <td>${s.planCliente}</td>
      <td>${vencTag}</td>
      <td style="text-align:center;font-weight:bold;color:${scoreColor}">${s.healthScore ?? '—'}%</td>
      <td style="font-size:9pt;color:#991b1b">${alertas.join(' · ') || '—'}</td>
      <td>${formatearFecha(s.fechaConstitucion)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .stat-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:16px 0; }
    .stat-card { border:1px solid #e5e7eb; border-radius:6px; padding:10px 14px; }
    .stat-num { font-size:22pt; font-weight:bold; color:#1e40af; }
    .stat-lbl { font-size:9pt; color:#6b7280; }
    .mini-table { width:100%; border-collapse:collapse; font-size:9.5pt; }
    .mini-table th { background:#1e40af; color:#fff; padding:6px 8px; text-align:left; }
    .mini-table td { padding:5px 8px; border-bottom:1px solid #e5e7eb; }
    .mini-table tr:nth-child(even) td { background:#f8fafc; }
  </style></head><body>

  <div class="encabezado">
    <h1>${agenteNombre || 'Agente Residente'}</h1>
    <h2>REPORTE DE CARTERA CORPORATIVA</h2>
    <p>Corte al ${formatearFecha(hoy)} — ${estadisticas.total} sociedades</p>
  </div>

  <div class="stat-cards">
    <div class="stat-card"><div class="stat-num">${estadisticas.total}</div><div class="stat-lbl">Total sociedades</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#166534">${estadisticas.activas}</div><div class="stat-lbl">Activas</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#1e40af">${estadisticas.anual + estadisticas.fundador}</div><div class="stat-lbl">Plan Anual / Fundador</div></div>
    <div class="stat-card"><div class="stat-num" style="color:${estadisticas.oblVencidas > 0 ? '#991b1b' : '#166534'}">${estadisticas.oblVencidas}</div><div class="stat-lbl">Oblig. vencidas</div></div>
  </div>

  <table class="mini-table">
    <tr>
      <th>Ficha</th><th>Sociedad</th><th>Estado</th><th>Plan</th>
      <th>Plan vence</th><th>Health</th><th>Alertas</th><th>Constitución</th>
    </tr>
    ${filas}
  </table>

  <div class="pie-pagina">
    GESTARGOV · Reporte de Cartera · ${agenteNombre || 'Agente Residente'} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
