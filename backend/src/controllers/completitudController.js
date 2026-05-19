import prisma from '../utils/prisma.js';
import { calcularCompletitud, selectCompletitud } from '../services/completionChecker.js';
import { ejecutarRecordatorios } from '../jobs/recordatoriosCompletitud.js';

// ─── Panel agente: completitud de una sociedad ─────────────────────────────

export async function obtenerCompletitud(req, res) {
  const sociedad = await prisma.sociedad.findFirst({
    where: { id: req.params.id, agenteId: req.user.id },
    select: selectCompletitud(),
  });
  if (!sociedad) return res.status(404).json({ error: 'Sociedad no encontrada.' });

  const resultado = calcularCompletitud(sociedad);
  res.json(resultado);
}

// ─── Panel agente: configuración de recordatorios ─────────────────────────

export async function obtenerRecordatorioConfig(req, res) {
  const soc = await prisma.sociedad.findFirst({
    where: { id: req.params.id, agenteId: req.user.id },
    select: { id: true },
  });
  if (!soc) return res.status(404).json({ error: 'Sociedad no encontrada.' });

  let config = await prisma.recordatorioConfig.findUnique({
    where: { sociedadId: req.params.id },
  });

  if (!config) {
    // Crear config por defecto si no existe
    config = await prisma.recordatorioConfig.create({
      data: { sociedadId: req.params.id },
    });
  }

  res.json(config);
}

export async function actualizarRecordatorioConfig(req, res) {
  const soc = await prisma.sociedad.findFirst({
    where: { id: req.params.id, agenteId: req.user.id },
    select: { id: true },
  });
  if (!soc) return res.status(404).json({ error: 'Sociedad no encontrada.' });

  const { activo, frecuenciaCritica, frecuenciaAlta, frecuenciaMedia, frecuenciaBaja } = req.body;

  const config = await prisma.recordatorioConfig.upsert({
    where: { sociedadId: req.params.id },
    create: {
      sociedadId: req.params.id,
      ...(activo !== undefined && { activo }),
      ...(frecuenciaCritica && { frecuenciaCritica: Number(frecuenciaCritica) }),
      ...(frecuenciaAlta    && { frecuenciaAlta:    Number(frecuenciaAlta) }),
      ...(frecuenciaMedia   && { frecuenciaMedia:   Number(frecuenciaMedia) }),
      ...(frecuenciaBaja    && { frecuenciaBaja:    Number(frecuenciaBaja) }),
    },
    update: {
      ...(activo !== undefined && { activo }),
      ...(frecuenciaCritica && { frecuenciaCritica: Number(frecuenciaCritica) }),
      ...(frecuenciaAlta    && { frecuenciaAlta:    Number(frecuenciaAlta) }),
      ...(frecuenciaMedia   && { frecuenciaMedia:   Number(frecuenciaMedia) }),
      ...(frecuenciaBaja    && { frecuenciaBaja:    Number(frecuenciaBaja) }),
    },
  });

  res.json(config);
}

export async function enviarRecordatorioManual(req, res) {
  const soc = await prisma.sociedad.findFirst({
    where: { id: req.params.id, agenteId: req.user.id },
    select: { id: true, nombre: true, portalAcceso: { select: { email: true, activo: true } } },
  });
  if (!soc) return res.status(404).json({ error: 'Sociedad no encontrada.' });
  if (!soc.portalAcceso?.email) {
    return res.status(400).json({ error: 'Esta sociedad no tiene portal de cliente configurado.' });
  }

  // Forzar envío reseteando ultimoEnvio
  const config = await prisma.recordatorioConfig.findUnique({ where: { sociedadId: req.params.id } });
  if (config) {
    await prisma.recordatorioConfig.update({
      where: { id: config.id },
      data:  { ultimoEnvio: null },
    });
  } else {
    await prisma.recordatorioConfig.create({ data: { sociedadId: req.params.id } });
  }

  // Ejecutar el proceso para esta sociedad específica
  await ejecutarRecordatorios();

  res.json({ ok: true, mensaje: `Recordatorio enviado a ${soc.portalAcceso.email}` });
}

// ─── Portal cliente: completitud de su propia sociedad ────────────────────

export async function portalObtenerCompletitud(req, res) {
  const sociedad = await prisma.sociedad.findUnique({
    where: { id: req.portal.sociedadId },
    select: selectCompletitud(),
  });
  if (!sociedad) return res.status(404).json({ error: 'Sociedad no encontrada.' });

  const resultado = calcularCompletitud(sociedad);
  res.json(resultado);
}
