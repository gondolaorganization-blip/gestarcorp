import prisma from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_BASE = path.join(__dirname, '..', '..', 'uploads', 'cumplimiento');

function cleanFile(filename) {
  if (filename) fs.unlink(path.join(UPLOAD_BASE, filename), () => {});
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function resumenCumplimiento(req, res) {
  const id = req.user.id;
  const anio = new Date().getFullYear();
  const inicioAnio = new Date(anio, 0, 1);

  const [caps, manuales, evals, decls] = await Promise.all([
    prisma.capacitacionAgente.findMany({
      where: { agenteId: id, fecha: { gte: inicioAnio } },
      select: { horas: true },
    }),
    prisma.manualPrevencion.findMany({
      where: { agenteId: id },
      orderBy: { creadoEn: 'desc' },
      take: 1,
    }),
    prisma.evaluacionIndependiente.findMany({
      where: { agenteId: id, anio },
    }),
    prisma.declaracionJuradaAnual.findMany({
      where: { agenteId: id, anio },
    }),
  ]);

  const horasAnio = caps.reduce((s, c) => s + c.horas, 0);
  const manualVigente = manuales.find(m => m.estado === 'VIGENTE') || null;
  const manualVencido = manualVigente?.fechaProximaRevision
    ? new Date(manualVigente.fechaProximaRevision) < new Date()
    : false;

  res.json({
    anio,
    capacitaciones: { horasAnio, cumple: horasAnio >= 8 },
    manual: { vigente: !!manualVigente, vencido: manualVencido, fechaRevision: manualVigente?.fechaProximaRevision || null },
    evaluacion: { cumple: evals.length > 0 },
    declaracion: { cumple: decls.length > 0 },
  });
}

// ─── Capacitaciones ────────────────────────────────────────────────────────────

export async function listarCapacitaciones(req, res) {
  const items = await prisma.capacitacionAgente.findMany({
    where: { agenteId: req.user.id },
    orderBy: { fecha: 'desc' },
  });
  res.json(items);
}

export async function crearCapacitacion(req, res) {
  const { fecha, horas, temas, proveedor, tipo, participantes, notas } = req.body;
  if (!fecha || !horas || !temas?.trim()) {
    if (req.file) cleanFile(req.file.filename);
    return res.status(400).json({ error: 'fecha, horas y temas son requeridos.' });
  }
  const item = await prisma.capacitacionAgente.create({
    data: {
      agenteId:      req.user.id,
      fecha:         new Date(fecha),
      horas:         Number(horas),
      temas:         temas.trim(),
      proveedor:     proveedor     || null,
      tipo:          tipo          || 'EXTERNA',
      participantes: participantes || null,
      archivo:       req.file?.filename    || null,
      nombreArchivo: req.file?.originalname || null,
      notas:         notas         || null,
    },
  });
  res.status(201).json(item);
}

export async function eliminarCapacitacion(req, res) {
  const item = await prisma.capacitacionAgente.findUniqueOrThrow({ where: { id: req.params.id } });
  cleanFile(item.archivo);
  await prisma.capacitacionAgente.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function descargarCapacitacion(req, res) {
  const item = await prisma.capacitacionAgente.findUniqueOrThrow({ where: { id: req.params.id } });
  if (!item.archivo) return res.status(404).json({ error: 'Sin archivo.' });
  res.download(path.join(UPLOAD_BASE, item.archivo), item.nombreArchivo);
}

// ─── Manual de Prevención ─────────────────────────────────────────────────────

export async function listarManuales(req, res) {
  const items = await prisma.manualPrevencion.findMany({
    where: { agenteId: req.user.id },
    orderBy: { creadoEn: 'desc' },
  });
  res.json(items);
}

export async function crearManual(req, res) {
  const { version, fechaAprobacion, fechaProximaRevision, notas } = req.body;
  if (!version?.trim() || !fechaAprobacion) {
    if (req.file) cleanFile(req.file.filename);
    return res.status(400).json({ error: 'version y fechaAprobacion son requeridos.' });
  }
  // Mark previous VIGENTE manuals as DESACTUALIZADO
  await prisma.manualPrevencion.updateMany({
    where: { agenteId: req.user.id, estado: 'VIGENTE' },
    data:  { estado: 'DESACTUALIZADO' },
  });
  const item = await prisma.manualPrevencion.create({
    data: {
      agenteId:            req.user.id,
      version:             version.trim(),
      fechaAprobacion:     new Date(fechaAprobacion),
      fechaProximaRevision: fechaProximaRevision ? new Date(fechaProximaRevision) : null,
      estado:              'VIGENTE',
      archivo:             req.file?.filename    || null,
      nombreArchivo:       req.file?.originalname || null,
      notas:               notas || null,
    },
  });
  res.status(201).json(item);
}

export async function eliminarManual(req, res) {
  const item = await prisma.manualPrevencion.findUniqueOrThrow({ where: { id: req.params.id } });
  cleanFile(item.archivo);
  await prisma.manualPrevencion.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function descargarManual(req, res) {
  const item = await prisma.manualPrevencion.findUniqueOrThrow({ where: { id: req.params.id } });
  if (!item.archivo) return res.status(404).json({ error: 'Sin archivo.' });
  res.download(path.join(UPLOAD_BASE, item.archivo), item.nombreArchivo);
}

// ─── Evaluaciones Independientes ──────────────────────────────────────────────

export async function listarEvaluaciones(req, res) {
  const items = await prisma.evaluacionIndependiente.findMany({
    where: { agenteId: req.user.id },
    orderBy: { anio: 'desc' },
  });
  res.json(items);
}

export async function crearEvaluacion(req, res) {
  const { anio, evaluador, fechaEvaluacion, hallazgos, resultado, notas } = req.body;
  if (!anio || !evaluador?.trim() || !fechaEvaluacion) {
    if (req.file) cleanFile(req.file.filename);
    return res.status(400).json({ error: 'anio, evaluador y fechaEvaluacion son requeridos.' });
  }
  const item = await prisma.evaluacionIndependiente.create({
    data: {
      agenteId:        req.user.id,
      anio:            Number(anio),
      evaluador:       evaluador.trim(),
      fechaEvaluacion: new Date(fechaEvaluacion),
      hallazgos:       hallazgos  || null,
      resultado:       resultado  || 'SATISFACTORIO',
      archivo:         req.file?.filename    || null,
      nombreArchivo:   req.file?.originalname || null,
      notas:           notas      || null,
    },
  });
  res.status(201).json(item);
}

export async function eliminarEvaluacion(req, res) {
  const item = await prisma.evaluacionIndependiente.findUniqueOrThrow({ where: { id: req.params.id } });
  cleanFile(item.archivo);
  await prisma.evaluacionIndependiente.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function descargarEvaluacion(req, res) {
  const item = await prisma.evaluacionIndependiente.findUniqueOrThrow({ where: { id: req.params.id } });
  if (!item.archivo) return res.status(404).json({ error: 'Sin archivo.' });
  res.download(path.join(UPLOAD_BASE, item.archivo), item.nombreArchivo);
}

// ─── Declaraciones Juradas Anuales ────────────────────────────────────────────

export async function listarDeclaraciones(req, res) {
  const items = await prisma.declaracionJuradaAnual.findMany({
    where: { agenteId: req.user.id },
    orderBy: { anio: 'desc' },
  });
  res.json(items);
}

export async function crearDeclaracion(req, res) {
  const { anio, fechaPresentacion, autoridad, estado, notas } = req.body;
  if (!anio || !fechaPresentacion) {
    if (req.file) cleanFile(req.file.filename);
    return res.status(400).json({ error: 'anio y fechaPresentacion son requeridos.' });
  }
  const item = await prisma.declaracionJuradaAnual.create({
    data: {
      agenteId:          req.user.id,
      anio:              Number(anio),
      fechaPresentacion: new Date(fechaPresentacion),
      autoridad:         autoridad || null,
      estado:            estado    || 'PRESENTADA',
      comprobante:       req.file?.filename    || null,
      nombreComprobante: req.file?.originalname || null,
      notas:             notas     || null,
    },
  });
  res.status(201).json(item);
}

export async function eliminarDeclaracion(req, res) {
  const item = await prisma.declaracionJuradaAnual.findUniqueOrThrow({ where: { id: req.params.id } });
  cleanFile(item.comprobante);
  await prisma.declaracionJuradaAnual.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function descargarDeclaracion(req, res) {
  const item = await prisma.declaracionJuradaAnual.findUniqueOrThrow({ where: { id: req.params.id } });
  if (!item.comprobante) return res.status(404).json({ error: 'Sin archivo.' });
  res.download(path.join(UPLOAD_BASE, item.comprobante), item.nombreComprobante);
}
