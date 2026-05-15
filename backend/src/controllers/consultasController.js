import prisma from '../utils/prisma.js';
import { enviarNotificacionConsulta } from '../utils/email.js';
import { startOfMonth, endOfMonth } from 'date-fns';

// Límite de consultas/mes por plan para clientes portal
const LIMITE_MENSUAL = 2;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function obtenerEmailAgente(sociedadId) {
  const sociedad = await prisma.sociedad.findUnique({
    where: { id: sociedadId },
    select: { agente: { select: { email: true, nombre: true } } },
  });
  return sociedad?.agente?.email || null;
}

async function obtenerEmailPortal(sociedadId) {
  const acceso = await prisma.portalAcceso.findUnique({
    where: { sociedadId },
    select: { email: true },
  });
  return acceso?.email || null;
}

async function contarConsultasMes(sociedadId) {
  const hoy = new Date();
  return prisma.consulta.count({
    where: {
      sociedadId,
      usuarioId: null, // solo consultas originadas desde el portal
      fecha: { gte: startOfMonth(hoy), lte: endOfMonth(hoy) },
    },
  });
}

// ─── LADO AGENTE ─────────────────────────────────────────────────────────────

/** GET /api/sociedades/:id/consultas */
export async function listarConsultas(req, res) {
  const { estado, tipo } = req.query;
  const consultas = await prisma.consulta.findMany({
    where: {
      sociedadId: req.params.id,
      ...(estado && { estado }),
      ...(tipo && { tipo }),
    },
    include: { usuario: { select: { nombre: true, email: true } } },
    orderBy: [{ estado: 'asc' }, { fecha: 'desc' }],
  });
  res.json(consultas);
}

/** GET /api/consultas (vista global — todas las sociedades) */
export async function listarTodasConsultas(req, res) {
  const { estado, tipo, limit = 50 } = req.query;
  const consultas = await prisma.consulta.findMany({
    where: {
      ...(estado && { estado }),
      ...(tipo && { tipo }),
    },
    include: {
      sociedad: { select: { id: true, nombre: true, ficha: true } },
      usuario:  { select: { nombre: true } },
    },
    orderBy: [{ estado: 'asc' }, { fecha: 'desc' }],
    take: Number(limit),
  });
  res.json(consultas);
}

/** GET /api/sociedades/:id/consultas/:cId */
export async function obtenerConsulta(req, res) {
  const consulta = await prisma.consulta.findUniqueOrThrow({
    where: { id: req.params.cId },
    include: { usuario: { select: { nombre: true, email: true } } },
  });
  if (consulta.sociedadId !== req.params.id) return res.status(403).json({ error: 'Acceso denegado' });
  res.json(consulta);
}

/** POST /api/sociedades/:id/consultas — agente crea una consulta (seguimiento de llamada, etc.) */
export async function crearConsultaAgente(req, res) {
  const { tipo = 'GENERAL', descripcion, notas } = req.body;
  if (!descripcion?.trim()) return res.status(400).json({ error: 'descripcion requerida' });

  const consulta = await prisma.consulta.create({
    data: {
      sociedadId:  req.params.id,
      usuarioId:   req.user.id,
      tipo,
      descripcion: descripcion.trim(),
      notas:       notas?.trim() || null,
      estado:      'EN_PROCESO',
    },
  });
  res.status(201).json(consulta);
}

/**
 * PUT /api/sociedades/:id/consultas/:cId/responder
 * Body: { respuesta, estado? }
 */
export async function responderConsulta(req, res) {
  const { respuesta, estado = 'RESUELTA', notas } = req.body;
  if (!respuesta?.trim()) return res.status(400).json({ error: 'respuesta requerida' });

  const consulta = await prisma.consulta.findUniqueOrThrow({ where: { id: req.params.cId } });
  if (consulta.sociedadId !== req.params.id) return res.status(403).json({ error: 'Acceso denegado' });

  const actualizada = await prisma.consulta.update({
    where: { id: req.params.cId },
    data: {
      respuesta:      respuesta.trim(),
      estado,
      fechaRespuesta: new Date(),
      ...(notas !== undefined && { notas: notas?.trim() || null }),
    },
  });

  // Notificar al cliente si la consulta vino del portal
  if (!consulta.usuarioId) {
    const [emailPortal, sociedad] = await Promise.all([
      obtenerEmailPortal(req.params.id),
      prisma.sociedad.findUnique({ where: { id: req.params.id }, select: { nombre: true } }),
    ]);
    if (emailPortal) {
      enviarNotificacionConsulta({
        emailAgente: null, emailPortal,
        nombreSociedad: sociedad.nombre,
        tipo: consulta.tipo,
        descripcion: respuesta,
        esRespuesta: true,
      }).catch(console.error);
    }
  }

  res.json(actualizada);
}

/** PUT /api/sociedades/:id/consultas/:cId — actualizar estado, notas */
export async function actualizarConsulta(req, res) {
  const { estado, notas } = req.body;
  const consulta = await prisma.consulta.findUniqueOrThrow({ where: { id: req.params.cId } });
  if (consulta.sociedadId !== req.params.id) return res.status(403).json({ error: 'Acceso denegado' });

  const actualizada = await prisma.consulta.update({
    where: { id: req.params.cId },
    data: {
      ...(estado && { estado }),
      ...(notas !== undefined && { notas: notas?.trim() || null }),
    },
  });
  res.json(actualizada);
}

/** DELETE /api/sociedades/:id/consultas/:cId */
export async function eliminarConsulta(req, res) {
  const consulta = await prisma.consulta.findUniqueOrThrow({ where: { id: req.params.cId } });
  if (consulta.sociedadId !== req.params.id) return res.status(403).json({ error: 'Acceso denegado' });
  await prisma.consulta.delete({ where: { id: req.params.cId } });
  res.json({ ok: true });
}

/** GET /api/consultas/estadisticas — métricas para el dashboard del agente */
export async function estadisticasConsultas(req, res) {
  const [abiertas, enProceso, resueltas, porTipo] = await Promise.all([
    prisma.consulta.count({ where: { estado: 'ABIERTA' } }),
    prisma.consulta.count({ where: { estado: 'EN_PROCESO' } }),
    prisma.consulta.count({ where: { estado: 'RESUELTA' } }),
    prisma.consulta.groupBy({ by: ['tipo'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
  ]);

  res.json({
    abiertas,
    enProceso,
    resueltas,
    total: abiertas + enProceso + resueltas,
    porTipo: porTipo.map(t => ({ tipo: t.tipo, cantidad: t._count.id })),
  });
}

// ─── LADO PORTAL (CLIENTE) ───────────────────────────────────────────────────

/** GET /api/portal/consultas */
export async function portalListarConsultas(req, res) {
  const consultas = await prisma.consulta.findMany({
    where: { sociedadId: req.portal.sociedadId },
    orderBy: { fecha: 'desc' },
    select: {
      id: true, tipo: true, descripcion: true, estado: true,
      respuesta: true, fecha: true, fechaRespuesta: true,
    },
  });
  res.json(consultas);
}

/** POST /api/portal/consultas */
export async function portalCrearConsulta(req, res) {
  const { tipo = 'GENERAL', descripcion } = req.body;
  if (!descripcion?.trim()) return res.status(400).json({ error: 'descripcion requerida' });

  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: req.portal.sociedadId },
    select: { nombre: true, planCliente: true, agente: { select: { email: true } } },
  });

  // Verificar límite del plan MENSUAL
  if (sociedad.planCliente === 'MENSUAL') {
    const usadas = await contarConsultasMes(req.portal.sociedadId);
    if (usadas >= LIMITE_MENSUAL) {
      return res.status(402).json({
        error: `El plan Mensual incluye ${LIMITE_MENSUAL} consultas por mes. Has alcanzado el límite. Actualiza al plan Anual para consultas ilimitadas.`,
        consultasUsadas: usadas,
        limite: LIMITE_MENSUAL,
      });
    }
  }

  const consulta = await prisma.consulta.create({
    data: {
      sociedadId:  req.portal.sociedadId,
      usuarioId:   null, // marca que viene del portal
      tipo,
      descripcion: descripcion.trim(),
      estado:      'ABIERTA',
    },
  });

  // Notificar al agente
  if (sociedad.agente?.email) {
    enviarNotificacionConsulta({
      emailAgente:    sociedad.agente.email,
      emailPortal:    null,
      nombreSociedad: sociedad.nombre,
      tipo,
      descripcion:    descripcion.trim(),
      esRespuesta:    false,
    }).catch(console.error);
  }

  res.status(201).json({
    ...consulta,
    ...(sociedad.planCliente === 'MENSUAL' && {
      consultasUsadas: await contarConsultasMes(req.portal.sociedadId),
      limite: LIMITE_MENSUAL,
    }),
  });
}

/** GET /api/portal/consultas/:cId */
export async function portalObtenerConsulta(req, res) {
  const consulta = await prisma.consulta.findUniqueOrThrow({
    where: { id: req.params.cId },
    select: {
      id: true, tipo: true, descripcion: true, estado: true,
      respuesta: true, fecha: true, fechaRespuesta: true,
    },
  });
  if (consulta.sociedadId !== req.portal.sociedadId) return res.status(403).json({ error: 'Acceso denegado' });
  res.json(consulta);
}

/** GET /api/portal/consultas/cuota — cuota restante del plan mensual */
export async function portalCuotaConsultas(req, res) {
  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: req.portal.sociedadId },
    select: { planCliente: true },
  });

  if (sociedad.planCliente !== 'MENSUAL') {
    return res.json({ plan: sociedad.planCliente, limite: null, usadas: null, ilimitado: true });
  }

  const usadas = await contarConsultasMes(req.portal.sociedadId);
  res.json({
    plan:      'MENSUAL',
    limite:    LIMITE_MENSUAL,
    usadas,
    restantes: Math.max(0, LIMITE_MENSUAL - usadas),
    ilimitado: false,
  });
}
