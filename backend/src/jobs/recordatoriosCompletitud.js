import cron from 'node-cron';
import prisma from '../utils/prisma.js';
import { calcularCompletitud, selectCompletitud } from '../services/completionChecker.js';
import { enviarRecordatorioCompletitud } from '../utils/email.js';

const FRECUENCIA_DEFAULTS = { CRITICA: 7, ALTA: 15, MEDIA: 30, BAJA: 60 };

/**
 * Para una sociedad con RecordatorioConfig activo y portal configurado:
 * 1. Calcula su completitud.
 * 2. Si hay pendientes, determina la frecuencia según el tier más urgente.
 * 3. Si el tiempo transcurrido desde ultimoEnvio >= frecuencia, envía el email.
 */
async function procesarSociedad(sociedad, config, emailPortal) {
  const { items, porcentajeGlobal, tierMasUrgente } = calcularCompletitud(sociedad);
  const pendientes = items.filter(i => !i.completado);

  if (pendientes.length === 0) return; // Todo completo — no enviar
  if (!tierMasUrgente) return;

  // Frecuencia a aplicar = la del tier más urgente con pendientes
  const frecuenciaDias =
    config[`frecuencia${tierMasUrgente.charAt(0) + tierMasUrgente.slice(1).toLowerCase()}`]
    ?? FRECUENCIA_DEFAULTS[tierMasUrgente];

  const ahora = new Date();
  if (config.ultimoEnvio) {
    const diasDesdeUltimo = (ahora - new Date(config.ultimoEnvio)) / 86400000;
    if (diasDesdeUltimo < frecuenciaDias) return; // Todavía no toca
  }

  // Ordenar pendientes por tier (CRITICA primero)
  const ORDEN = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
  pendientes.sort((a, b) => ORDEN[a.tier] - ORDEN[b.tier]);

  try {
    await enviarRecordatorioCompletitud({
      emailPortal,
      nombreSociedad: sociedad.nombre,
      porcentajeGlobal,
      tierMasUrgente,
      itemsPendientes: pendientes,
    });

    await prisma.recordatorioConfig.update({
      where: { id: config.id },
      data:  { ultimoEnvio: ahora },
    });

    console.log(`[RECORDATORIO] Email enviado a ${emailPortal} — ${sociedad.nombre} (${porcentajeGlobal}% completo, ${pendientes.length} pendientes)`);
  } catch (err) {
    console.error(`[RECORDATORIO] Error enviando a ${emailPortal}:`, err.message);
  }
}

export async function ejecutarRecordatorios() {
  console.log('[RECORDATORIO] Verificando completitud de expedientes...');

  // Obtener todas las sociedades con recordatorio activo y portal configurado
  const configs = await prisma.recordatorioConfig.findMany({
    where: { activo: true },
    include: {
      sociedad: {
        select: {
          ...selectCompletitud(),
          portalAcceso: { select: { email: true, activo: true } },
        },
      },
    },
  });

  let enviados = 0;
  for (const config of configs) {
    const soc = config.sociedad;
    const emailPortal = soc.portalAcceso?.email;

    if (!emailPortal || !soc.portalAcceso?.activo) continue;

    await procesarSociedad(soc, config, emailPortal);
    enviados++;
  }

  console.log(`[RECORDATORIO] Proceso completado (${configs.length} sociedades revisadas)`);
}

export function iniciarCronRecordatorios() {
  // Todos los días a las 9:00am hora Panamá (una hora después de las obligaciones)
  cron.schedule('0 9 * * *', ejecutarRecordatorios, { timezone: 'America/Panama' });
  console.log('[CRON] Job de recordatorios de completitud registrado (diario 9:00am Panamá)');
}
