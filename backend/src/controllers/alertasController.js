import prisma from '../utils/prisma.js';
import { ejecutarVerificacion } from '../jobs/verificarObligaciones.js';

// ─── ALERTAS GLOBALES DEL AGENTE ─────────────────────────────────────────────

/**
 * GET /api/alertas/obligaciones?dias=30
 * Vista global de todas las obligaciones PENDIENTE/VENCIDAS del agente.
 */
export async function alertasObligaciones(req, res) {
  const dias  = Number(req.query.dias || 60);
  const hoy   = new Date();
  const limite = new Date(Date.now() + dias * 86400000);

  const [proximas, vencidas] = await Promise.all([
    prisma.obligacionFiscal.findMany({
      where: {
        estado: 'PENDIENTE',
        fechaVence: { gte: hoy, lte: limite },
      },
      include: { sociedad: { select: { id: true, nombre: true, ficha: true } } },
      orderBy: { fechaVence: 'asc' },
    }),
    prisma.obligacionFiscal.findMany({
      where: { estado: 'VENCIDO' },
      include: { sociedad: { select: { id: true, nombre: true, ficha: true } } },
      orderBy: { fechaVence: 'asc' },
    }),
  ]);

  const enriquecer = (obs) => obs.map(o => ({
    ...o,
    diasRestantes: Math.ceil((new Date(o.fechaVence) - hoy) / 86400000),
    urgente: Math.ceil((new Date(o.fechaVence) - hoy) / 86400000) <= 7,
  }));

  res.json({
    proximas:    enriquecer(proximas),
    vencidas:    enriquecer(vencidas),
    resumen: {
      totalProximas: proximas.length,
      totalVencidas: vencidas.length,
      urgentes:      proximas.filter(o => Math.ceil((new Date(o.fechaVence) - hoy) / 86400000) <= 7).length,
    },
  });
}

/**
 * GET /api/alertas/obligaciones/global
 * Listado plano de todas las obligaciones del año actual, con estado y días restantes.
 * Útil para tabla de control del agente.
 */
export async function obligacionesGlobal(req, res) {
  const { anio = new Date().getFullYear(), estado } = req.query;
  const hoy = new Date();

  const obligaciones = await prisma.obligacionFiscal.findMany({
    where: {
      anio: Number(anio),
      ...(estado && { estado }),
    },
    include: { sociedad: { select: { id: true, nombre: true, ficha: true, estado: true } } },
    orderBy: [{ fechaVence: 'asc' }, { sociedad: { nombre: 'asc' } }],
  });

  const resultado = obligaciones.map(o => ({
    ...o,
    diasRestantes: Math.ceil((new Date(o.fechaVence) - hoy) / 86400000),
  }));

  res.json(resultado);
}

/**
 * POST /api/alertas/obligaciones/verificar
 * Disparo manual de la verificación (marcar vencidas + enviar emails).
 * Útil para testing o ejecución manual.
 */
export async function dispararVerificacion(req, res) {
  res.json({ mensaje: 'Verificación iniciada en segundo plano' });
  ejecutarVerificacion().catch(console.error);
}

// ─── PORTAL DEL CLIENTE ───────────────────────────────────────────────────────

/**
 * GET /api/portal/obligaciones
 * El cliente ve las obligaciones de su propia sociedad.
 */
export async function portalListarObligaciones(req, res) {
  const { anio = new Date().getFullYear() } = req.query;
  const hoy = new Date();

  const obligaciones = await prisma.obligacionFiscal.findMany({
    where: { sociedadId: req.portal.sociedadId, anio: Number(anio) },
    orderBy: { fechaVence: 'asc' },
    select: {
      id: true, tipo: true, entidad: true, descripcion: true,
      anio: true, fechaVence: true, estado: true, monto: true,
    },
  });

  const resultado = obligaciones.map(o => ({
    ...o,
    diasRestantes: Math.ceil((new Date(o.fechaVence) - hoy) / 86400000),
  }));

  res.json(resultado);
}
