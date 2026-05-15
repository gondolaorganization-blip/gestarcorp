import cron from 'node-cron';
import prisma from '../utils/prisma.js';
import { enviarAlertaObligaciones } from '../utils/email.js';
import { generarObligacionesAnuales } from '../utils/fechasObligaciones.js';

// Umbrales de alerta en días
const UMBRALES = [30, 15, 7, 3, 1];

/**
 * Marca como VENCIDO las obligaciones PENDIENTE cuya fecha ya pasó.
 * Devuelve el número de obligaciones marcadas.
 */
async function marcarVencidas() {
  const ahora = new Date();
  const { count } = await prisma.obligacionFiscal.updateMany({
    where: {
      estado:    'PENDIENTE',
      fechaVence: { lt: ahora },
    },
    data: { estado: 'VENCIDO' },
  });
  if (count > 0) console.log(`[CRON] ${count} obligaciones marcadas como VENCIDAS`);
  return count;
}

/**
 * Para cada sociedad ACTIVA, genera obligaciones del año siguiente si aún no existen.
 * Ejecuta en diciembre para preparar el año nuevo.
 */
async function generarObligacionesAnioNuevo() {
  const hoy  = new Date();
  if (hoy.getMonth() !== 11) return; // Solo en diciembre (mes 11, 0-indexed)

  const anioProximo = hoy.getFullYear() + 1;
  const sociedades = await prisma.sociedad.findMany({
    where: { estado: 'ACTIVA' },
    select: { id: true, nombre: true, fechaConstitucion: true },
  });

  let generadas = 0;
  for (const s of sociedades) {
    const data = generarObligacionesAnuales(s.id, anioProximo, s.fechaConstitucion);
    const { count } = await prisma.obligacionFiscal.createMany({ data, skipDuplicates: true });
    generadas += count;
  }

  if (generadas > 0) {
    console.log(`[CRON] ${generadas} obligaciones generadas para el año ${anioProximo}`);
  }
}

/**
 * Construye la lista de alertas para los próximos N días + vencidas sin resolver.
 */
async function recopilarAlertas(diasMaximo = 30) {
  const hoy      = new Date();
  const limite   = new Date(Date.now() + diasMaximo * 86400000);

  const obligaciones = await prisma.obligacionFiscal.findMany({
    where: {
      OR: [
        // Próximas a vencer
        { estado: 'PENDIENTE', fechaVence: { gte: hoy, lte: limite } },
        // Ya vencidas sin pagar
        { estado: 'VENCIDO' },
      ],
    },
    include: { sociedad: { select: { nombre: true, ficha: true } } },
    orderBy: { fechaVence: 'asc' },
  });

  return obligaciones.map(o => ({
    id:           o.id,
    sociedad:     o.sociedad.nombre,
    ficha:        o.sociedad.ficha,
    tipo:         o.tipo,
    entidad:      o.entidad || '',
    descripcion:  o.descripcion || '',
    fechaVence:   o.fechaVence.toLocaleDateString('es-PA'),
    estado:       o.estado,
    diasRestantes: Math.ceil((new Date(o.fechaVence) - hoy) / 86400000),
  }));
}

/**
 * Envía email de alerta al agente residente de cada sociedad con obligaciones urgentes.
 */
async function enviarAlertas() {
  const alertas = await recopilarAlertas(30);
  if (alertas.length === 0) return;

  // Agrupa por agente
  const porAgente = {};
  const sociedadesConAlerta = [...new Set(alertas.map(a => a.sociedad))];

  const sociedades = await prisma.sociedad.findMany({
    where: { nombre: { in: sociedadesConAlerta } },
    select: { nombre: true, agente: { select: { email: true } } },
  });

  for (const s of sociedades) {
    if (!s.agente?.email) continue;
    if (!porAgente[s.agente.email]) porAgente[s.agente.email] = [];
    porAgente[s.agente.email].push(...alertas.filter(a => a.sociedad === s.nombre));
  }

  for (const [emailAgente, alertasAgente] of Object.entries(porAgente)) {
    await enviarAlertaObligaciones({ emailAgente, alertas: alertasAgente });
    console.log(`[CRON] Email de alerta enviado a ${emailAgente} (${alertasAgente.length} obligaciones)`);
  }
}

/**
 * Tarea completa: marcar vencidas + generar año nuevo + enviar emails.
 */
export async function ejecutarVerificacion() {
  console.log('[CRON] Verificando obligaciones fiscales...');
  try {
    await marcarVencidas();
    await generarObligacionesAnioNuevo();
    await enviarAlertas();
    console.log('[CRON] Verificación completada');
  } catch (err) {
    console.error('[CRON] Error en verificación:', err.message);
  }
}

/**
 * Registra el cron job para ejecutarse cada día a las 8:00am (hora del servidor).
 * También exporta la función para poder llamarla manualmente desde la API.
 */
export function iniciarCronObligaciones() {
  // Lunes a viernes a las 8:00am — para no molestar fines de semana
  cron.schedule('0 8 * * 1-5', ejecutarVerificacion, { timezone: 'America/Panama' });
  console.log('[CRON] Job de verificación de obligaciones registrado (L-V 8:00am Panamá)');
}
