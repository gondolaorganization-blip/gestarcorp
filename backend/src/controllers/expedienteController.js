import prisma from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_BASE = path.join(__dirname, '..', '..', 'uploads');

export async function listarExpediente(req, res) {
  const docs = await prisma.documentoDiligencia.findMany({
    where: { sociedadId: req.params.id },
    orderBy: [{ entidadTipo: 'asc' }, { entidadNombre: 'asc' }, { tipo: 'asc' }, { creadoEn: 'desc' }],
  });
  res.json(docs);
}

export async function subirDocumento(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

  const { tipo, entidadTipo, entidadId, entidadNombre, fechaVencimiento, notas } = req.body;

  if (!tipo || !entidadTipo || !entidadNombre?.trim()) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'tipo, entidadTipo y entidadNombre son requeridos.' });
  }

  await prisma.sociedad.findUniqueOrThrow({ where: { id: req.params.id } });

  const doc = await prisma.documentoDiligencia.create({
    data: {
      sociedadId:      req.params.id,
      tipo,
      entidadTipo,
      entidadId:       entidadId     || null,
      entidadNombre:   entidadNombre.trim(),
      archivo:         req.file.filename,
      nombreArchivo:   req.file.originalname,
      tamanio:         req.file.size,
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      notas:           notas          || null,
    },
  });
  res.status(201).json(doc);
}

export async function actualizarDocumento(req, res) {
  const d = req.body;
  const doc = await prisma.documentoDiligencia.update({
    where: { id: req.params.docId },
    data: {
      ...(d.estado           && { estado: d.estado }),
      ...(d.fechaVencimiento !== undefined && {
        fechaVencimiento: d.fechaVencimiento ? new Date(d.fechaVencimiento) : null,
      }),
      ...(d.notas !== undefined && { notas: d.notas || null }),
    },
  });
  res.json(doc);
}

export async function eliminarDocumento(req, res) {
  const doc = await prisma.documentoDiligencia.findUniqueOrThrow({
    where: { id: req.params.docId },
  });

  const filePath = path.join(UPLOAD_BASE, 'diligencia', doc.archivo);
  fs.unlink(filePath, () => {});

  await prisma.documentoDiligencia.delete({ where: { id: req.params.docId } });
  res.status(204).send();
}

export async function descargarDocumento(req, res) {
  const doc = await prisma.documentoDiligencia.findUniqueOrThrow({
    where: { id: req.params.docId },
  });
  const filePath = path.join(UPLOAD_BASE, 'diligencia', doc.archivo);
  res.download(filePath, doc.nombreArchivo);
}
