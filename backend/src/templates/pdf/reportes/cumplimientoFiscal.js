import { estilosLegales, formatearFecha, formatearMoneda } from '../../../utils/generadorPDF.js';

export function htmlReporteCumplimiento({ obligaciones, anio, agenteNombre }) {
  const hoy = new Date();

  // Agrupar por sociedad
  const porSociedad = {};
  for (const o of obligaciones) {
    const key = o.sociedad.id;
    if (!porSociedad[key]) porSociedad[key] = { sociedad: o.sociedad, items: [] };
    porSociedad[key].items.push(o);
  }

  // Estadísticas globales
  const total    = obligaciones.length;
  const pagadas  = obligaciones.filter(o => o.estado === 'PAGADO').length;
  const vencidas = obligaciones.filter(o => o.estado === 'VENCIDO').length;
  const pendientes = obligaciones.filter(o => o.estado === 'PENDIENTE').length;

  const seccionesSociedad = Object.values(porSociedad).map(({ sociedad, items }) => {
    const filas = items.map(o => {
      const dias = Math.ceil((new Date(o.fechaVence) - hoy) / 86400000);
      const estadoStyle = {
        PAGADO:   'color:#166534;font-weight:bold',
        VENCIDO:  'color:#991b1b;font-weight:bold',
        PENDIENTE:'color:#92400e',
        EXENTO:   'color:#6b7280',
      }[o.estado] || '';

      return `<tr>
        <td>${o.tipo.replace(/_/g,' ')}</td>
        <td>${o.entidad || '—'}</td>
        <td>${formatearFecha(o.fechaVence)}</td>
        <td style="${estadoStyle}">${o.estado}</td>
        <td style="text-align:right">${formatearMoneda(o.monto)}</td>
        <td>${o.fechaPago ? formatearFecha(o.fechaPago) : '—'}</td>
        <td style="text-align:right;font-size:9pt">
          ${o.estado === 'PENDIENTE'
            ? (dias <= 0
                ? `<span style="color:#991b1b">vencida</span>`
                : `<span style="color:${dias <= 7 ? '#991b1b' : dias <= 30 ? '#c2410c' : '#166534'}">${dias}d</span>`)
            : '—'}
        </td>
      </tr>`;
    }).join('');

    const tieneVencidas = items.some(o => o.estado === 'VENCIDO');
    return `
      <div style="margin-bottom:20px">
        <div style="background:${tieneVencidas ? '#fef2f2' : '#eff6ff'};
          border-left:4px solid ${tieneVencidas ? '#991b1b' : '#1e40af'};
          padding:8px 12px; font-weight:bold; font-size:11pt; margin-bottom:6px">
          ${sociedad.nombre}
          ${sociedad.ficha ? `<span style="font-weight:normal;color:#555;font-size:10pt"> · Ficha ${sociedad.ficha}</span>` : ''}
          ${tieneVencidas ? '<span style="float:right;color:#991b1b;font-size:9pt">⚠ CON VENCIDAS</span>' : ''}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:9.5pt">
          <tr style="background:#e0e7ff">
            <th style="padding:5px 8px;text-align:left">Tipo</th>
            <th style="padding:5px 8px;text-align:left">Entidad</th>
            <th style="padding:5px 8px;text-align:left">Vence</th>
            <th style="padding:5px 8px;text-align:left">Estado</th>
            <th style="padding:5px 8px;text-align:right">Monto</th>
            <th style="padding:5px 8px;text-align:left">F. Pago</th>
            <th style="padding:5px 8px;text-align:right">Días</th>
          </tr>
          ${filas}
        </table>
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .resumen-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:16px 0; }
    .card { border-radius:6px; padding:10px 14px; text-align:center; }
    .card-num { font-size:22pt; font-weight:bold; }
    .card-lbl { font-size:9pt; margin-top:2px; }
  </style></head><body>

  <div class="encabezado">
    <h1>Reporte de Cumplimiento Fiscal ${anio}</h1>
    <h2>GESTARCORP · Cartera Completa</h2>
    <p>Agente: ${agenteNombre || '—'} · Generado: ${formatearFecha(new Date())}</p>
  </div>

  <div class="resumen-cards">
    <div class="card" style="background:#f0f9ff;border:1px solid #bae6fd">
      <div class="card-num" style="color:#0369a1">${total}</div>
      <div class="card-lbl" style="color:#0369a1">Total obligaciones</div>
    </div>
    <div class="card" style="background:#f0fdf4;border:1px solid #bbf7d0">
      <div class="card-num" style="color:#166534">${pagadas}</div>
      <div class="card-lbl" style="color:#166534">Pagadas</div>
    </div>
    <div class="card" style="background:#fefce8;border:1px solid #fde68a">
      <div class="card-num" style="color:#854d0e">${pendientes}</div>
      <div class="card-lbl" style="color:#854d0e">Pendientes</div>
    </div>
    <div class="card" style="background:#fef2f2;border:1px solid #fecaca">
      <div class="card-num" style="color:#991b1b">${vencidas}</div>
      <div class="card-lbl" style="color:#991b1b">Vencidas</div>
    </div>
  </div>

  ${vencidas > 0 ? `
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:10pt">
    ⚠️ <strong>Atención:</strong> Existen ${vencidas} obligación(es) vencida(s) sin registrar pago.
    Se recomienda regularizar a la brevedad posible.
  </div>` : ''}

  ${seccionesSociedad}

  <div class="pie-pagina">
    GESTARCORP · Reporte de Cumplimiento Fiscal ${anio} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
