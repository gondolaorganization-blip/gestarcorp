import {
  bold, normal, italic, parrafo, centrado, tablaSimple, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha } from '../../../utils/generadorPDF.js';
import { Paragraph, HeadingLevel } from 'docx';

export async function docxReporteCartera({ sociedades, agenteNombre }) {
  const hoy = new Date();

  const estadisticas = {
    total:   sociedades.length,
    activas: sociedades.filter(s => s.estado === 'ACTIVA').length,
    anual:   sociedades.filter(s => ['ANUAL','FUNDADOR'].includes(s.planCliente)).length,
    oblVencidas: sociedades.reduce((n, s) => n + (s._oblVencidas || 0), 0),
  };

  const filas = sociedades.map(s => {
    const diasVenc = s.fechaVencimiento
      ? Math.ceil((new Date(s.fechaVencimiento) - hoy) / 86400000)
      : null;
    const vencStr = diasVenc == null ? '—' : diasVenc < 0 ? 'VENCIDO' : `${diasVenc}d`;
    const alertas = [
      s._oblVencidas > 0 ? `${s._oblVencidas} oblig.` : '',
      s._benefSinVerif > 0 ? `${s._benefSinVerif} benef.` : '',
    ].filter(Boolean).join(' / ') || '—';

    return [
      s.ficha || '—',
      s.nombre,
      s.estado,
      s.planCliente,
      vencStr,
      `${s.healthScore ?? '—'}%`,
      alertas,
    ];
  });

  const children = [
    centrado([bold((agenteNombre || 'Agente Residente').toUpperCase(), 26)]),
    centrado([bold('REPORTE DE CARTERA CORPORATIVA', 24)]),
    centrado([normal(`Corte al ${formatearFecha(hoy)} — ${estadisticas.total} sociedades`, 22)]),
    new Paragraph({ spacing: { after: 200 } }),

    parrafo([bold('Resumen ejecutivo: '), normal(`${estadisticas.total} sociedades total · ${estadisticas.activas} activas · ${estadisticas.anual} plan anual/fundador · ${estadisticas.oblVencidas} obligaciones vencidas`)]),
    new Paragraph({ spacing: { after: 200 } }),

    tablaSimple(
      ['Ficha', 'Sociedad', 'Estado', 'Plan', 'Plan vence', 'Health', 'Alertas'],
      filas
    ),

    new Paragraph({ spacing: { after: 400 } }),
    ...lineaFirma(agenteNombre || 'Agente Residente', 'Agente Residente'),
  ];

  return generarDocxBuffer({ children });
}
