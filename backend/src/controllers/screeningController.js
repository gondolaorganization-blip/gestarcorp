import fs from 'fs';
import prisma from '../utils/prisma.js';
import { parsearListaSanciones, ejecutarScreening } from '../services/screeningEngine.js';

// ─── Listas de sanciones ──────────────────────────────────────────────────────

export async function listarListas(req, res) {
  const listas = await prisma.listaSanciones.findMany({
    where: { agenteId: req.user.id },
    orderBy: { creadoEn: 'desc' },
  });
  res.json(listas);
}

export async function subirLista(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Se requiere un archivo XML.' });

  let totalEntradas = 0;
  try {
    const entradas = await parsearListaSanciones(req.file.path);
    totalEntradas = entradas.length;
  } catch {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'No se pudo leer el archivo. Verifique que sea un PDF de notificación UAF o un XML de la lista ONU.' });
  }

  // Marcar listas anteriores como no vigentes
  await prisma.listaSanciones.updateMany({
    where: { agenteId: req.user.id, vigente: true },
    data: { vigente: false },
  });

  const version = req.body.version || `UN-${new Date().toISOString().slice(0, 10)}`;

  const lista = await prisma.listaSanciones.create({
    data: {
      agenteId: req.user.id,
      version,
      archivo: req.file.path,
      nombreArchivo: req.file.originalname,
      tamanio: req.file.size,
      totalEntradas,
      vigente: true,
    },
  });

  res.status(201).json(lista);
}

export async function eliminarLista(req, res) {
  const lista = await prisma.listaSanciones.findFirst({
    where: { id: req.params.id, agenteId: req.user.id },
  });
  if (!lista) return res.status(404).json({ error: 'Lista no encontrada.' });

  try { fs.unlinkSync(lista.archivo); } catch { /* ignorar */ }

  await prisma.listaSanciones.delete({ where: { id: lista.id } });
  res.json({ ok: true });
}

// ─── Sesiones de screening ────────────────────────────────────────────────────

export async function listarSesiones(req, res) {
  const sesiones = await prisma.sesionScreening.findMany({
    where: { agenteId: req.user.id },
    include: { listaSanciones: { select: { version: true, totalEntradas: true } } },
    orderBy: { creadoEn: 'desc' },
    take: 20,
  });
  res.json(sesiones);
}

export async function iniciarScreening(req, res) {
  const { listaSancionesId } = req.body;

  if (!listaSancionesId) {
    return res.status(400).json({ error: 'Debe indicar el ID de la lista de sanciones a usar.' });
  }

  const lista = await prisma.listaSanciones.findFirst({
    where: { id: listaSancionesId, agenteId: req.user.id },
  });
  if (!lista) return res.status(404).json({ error: 'Lista de sanciones no encontrada.' });

  // Verificar que no haya una sesión en proceso para este agente
  const enProceso = await prisma.sesionScreening.findFirst({
    where: { agenteId: req.user.id, estado: 'EN_PROCESO' },
  });
  if (enProceso) {
    return res.status(409).json({
      error: 'Ya hay un screening en curso.',
      sesionId: enProceso.id,
    });
  }

  // Crear sesión
  const sesion = await prisma.sesionScreening.create({
    data: {
      agenteId: req.user.id,
      listaSancionesId: lista.id,
      estado: 'EN_PROCESO',
      progreso: 0,
    },
  });

  // Ejecutar en background (sin await)
  ejecutarScreening(sesion.id, req.user.id, lista.archivo).catch(console.error);

  res.status(202).json({ sesionId: sesion.id, mensaje: 'Screening iniciado.' });
}

export async function estadoSesion(req, res) {
  const sesion = await prisma.sesionScreening.findFirst({
    where: { id: req.params.id, agenteId: req.user.id },
    include: { listaSanciones: { select: { version: true } } },
  });
  if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada.' });
  res.json(sesion);
}

export async function resultadosSesion(req, res) {
  const sesion = await prisma.sesionScreening.findFirst({
    where: { id: req.params.id, agenteId: req.user.id },
  });
  if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada.' });

  const nivel = req.query.nivel; // filtro opcional: ALTA | POSIBLE | NINGUNA
  const where = { sesionId: sesion.id };
  if (nivel) where.nivel = nivel;

  const resultados = await prisma.resultadoScreening.findMany({
    where,
    orderBy: [{ nivel: 'asc' }, { sociedadNombre: 'asc' }], // ALTA primero (A < N < P en alpha)
  });

  // Orden manual: ALTA → POSIBLE → NINGUNA
  const orden = { ALTA: 0, POSIBLE: 1, NINGUNA: 2 };
  resultados.sort((a, b) => orden[a.nivel] - orden[b.nivel]);

  res.json(resultados);
}

export async function marcarRevisado(req, res) {
  const resultado = await prisma.resultadoScreening.findFirst({
    where: {
      id: req.params.resultadoId,
      sesion: { agenteId: req.user.id },
    },
    include: { sesion: { select: { agenteId: true } } },
  });
  if (!resultado) return res.status(404).json({ error: 'Resultado no encontrado.' });

  const updated = await prisma.resultadoScreening.update({
    where: { id: resultado.id },
    data: { revisado: !resultado.revisado },
  });
  res.json(updated);
}
