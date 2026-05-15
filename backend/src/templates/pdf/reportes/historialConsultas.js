import { estilosLegales, formatearFecha } from '../../../utils/generadorPDF.js';

export function htmlHistorialConsultas({ consultas, sociedad, agenteNombre, periodo }) {
  const total    = consultas.length;
  const resueltas = consultas.filter(c => c.estado === 'RESUELTA').length;
  const abiertas  = consultas.filter(c => ['ABIERTA','EN_PROCESO'].includes(c.estado)).length;

  const tiempoResp = consultas
    .filter(c => c.fechaRespuesta && c.fecha)
    .map(c => (new Date(c.fechaRespuesta) - new Date(c.fecha)) / 3600000);
  const promedioHoras = tiempoResp.length
    ? (tiempoResp.reduce((a,b) => a+b, 0) / tiempoResp.length).toFixed(1)
    : null;

  const estadoColor = { ABIERTA:'#92400e', EN_PROCESO:'#1e40af', RESUELTA:'#166534', CERRADA:'#6b7280' };
  const tipoColor   = { LEGAL:'#7c3aed', FISCAL:'#c2410c', DOCUMENTAL:'#0369a1', GENERAL:'#6b7280', OTRO:'#6b7280' };

  const seccionConsultas = consultas.map((c, i) => `
    <div style="border:1px solid #e5e7eb;border-radius:6px;margin-bottom:12px;overflow:hidden">
      <div style="background:#f8fafc;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb">
        <div>
          <span style="background:${tipoColor[c.tipo] || '#6b7280'};color:#fff;
            padding:2px 8px;border-radius:4px;font-size:9pt;font-weight:bold;margin-right:8px">${c.tipo}</span>
          <strong style="font-size:11pt">${c.sociedad?.nombre || sociedad?.nombre || '—'}</strong>
          <span style="color:#888;font-size:9pt;margin-left:8px">${formatearFecha(c.fecha)}</span>
        </div>
        <span style="color:${estadoColor[c.estado] || '#888'};font-weight:bold;font-size:10pt">${c.estado}</span>
      </div>
      <div style="padding:10px 12px">
        <div style="font-size:10pt;color:#374151;margin-bottom:${c.respuesta ? '8px' : '0'}">
          <strong>Consulta:</strong> ${c.descripcion}
        </div>
        ${c.respuesta ? `
        <div style="background:#f0fdf4;border-left:3px solid #22c55e;padding:8px 10px;font-size:10pt;color:#374151">
          <strong>Respuesta</strong> <span style="color:#888;font-size:9pt">(${c.fechaRespuesta ? formatearFecha(c.fechaRespuesta) : '—'}):</span><br>
          ${c.respuesta}
        </div>` : '<div style="color:#888;font-size:9pt;font-style:italic">Sin respuesta registrada</div>'}
      </div>
    </div>`).join('');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .kpi-row { display:flex; gap:12px; margin:16px 0; }
    .kpi { flex:1; border:1px solid #e5e7eb; border-radius:6px; padding:10px 14px; text-align:center; }
    .kpi-num { font-size:20pt; font-weight:bold; color:#1e40af; }
    .kpi-lbl { font-size:9pt; color:#6b7280; }
  </style></head><body>

  <div class="encabezado">
    <h1>${sociedad ? sociedad.nombre : (agenteNombre || 'Agente Residente')}</h1>
    <h2>HISTORIAL DE CONSULTAS</h2>
    <p>${periodo || 'Período completo'} · Generado: ${formatearFecha(new Date())}</p>
  </div>

  <div class="kpi-row">
    <div class="kpi"><div class="kpi-num">${total}</div><div class="kpi-lbl">Total consultas</div></div>
    <div class="kpi"><div class="kpi-num" style="color:#166534">${resueltas}</div><div class="kpi-lbl">Resueltas</div></div>
    <div class="kpi"><div class="kpi-num" style="color:#92400e">${abiertas}</div><div class="kpi-lbl">Pendientes</div></div>
    ${promedioHoras ? `<div class="kpi"><div class="kpi-num" style="color:#7c3aed">${promedioHoras}h</div><div class="kpi-lbl">Tiempo prom. respuesta</div></div>` : ''}
  </div>

  ${total === 0
    ? '<div style="text-align:center;color:#888;padding:40px;font-style:italic">No hay consultas en el período seleccionado</div>'
    : seccionConsultas}

  <div class="pie-pagina">
    GESTARGOV · Historial de Consultas · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
