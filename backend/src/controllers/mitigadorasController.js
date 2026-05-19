import prisma from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_BASE = path.join(__dirname, '..', '..', 'uploads');

export async function listarMedidas(req, res) {
  const medidas = await prisma.medidaMitigadora.findMany({
    where: { sociedadId: req.params.id },
    orderBy: [{ entidadTipo: 'asc' }, { entidadNombre: 'asc' }, { tipo: 'asc' }],
  });
  res.json(medidas);
}

export async function crearMedida(req, res) {
  const { tipo, entidadTipo, entidadId, entidadNombre, fechaEmision, fechaVencimiento, capacitacionHoras, notas } = req.body;

  if (!tipo || !entidadTipo || !entidadNombre?.trim()) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'tipo, entidadTipo y entidadNombre son requeridos.' });
  }

  if (tipo === 'DECLARACION_JURADA_NOMINAL' && capacitacionHoras !== undefined) {
    if (Number(capacitacionHoras) < 8) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'La declaración jurada requiere al menos 8 horas de capacitación.' });
    }
  }

  await prisma.sociedad.findUniqueOrThrow({ where: { id: req.params.id } });

  const medida = await prisma.medidaMitigadora.create({
    data: {
      sociedadId:        req.params.id,
      tipo,
      entidadTipo,
      entidadId:         entidadId    || null,
      entidadNombre:     entidadNombre.trim(),
      fechaEmision:      fechaEmision      ? new Date(fechaEmision)      : null,
      fechaVencimiento:  fechaVencimiento  ? new Date(fechaVencimiento)  : null,
      capacitacionHoras: capacitacionHoras ? Number(capacitacionHoras)   : null,
      archivo:           req.file?.filename   || null,
      nombreArchivo:     req.file?.originalname || null,
      notas:             notas        || null,
    },
  });
  res.status(201).json(medida);
}

export async function actualizarMedida(req, res) {
  const d = req.body;
  const medida = await prisma.medidaMitigadora.update({
    where: { id: req.params.medId },
    data: {
      ...(d.estado            && { estado:             d.estado }),
      ...(d.fechaVencimiento !== undefined && {
        fechaVencimiento: d.fechaVencimiento ? new Date(d.fechaVencimiento) : null,
      }),
      ...(d.capacitacionHoras !== undefined && {
        capacitacionHoras: d.capacitacionHoras ? Number(d.capacitacionHoras) : null,
      }),
      ...(d.notas !== undefined && { notas: d.notas || null }),
    },
  });
  res.json(medida);
}

export async function eliminarMedida(req, res) {
  const medida = await prisma.medidaMitigadora.findUniqueOrThrow({
    where: { id: req.params.medId },
  });

  if (medida.archivo) {
    fs.unlink(path.join(UPLOAD_BASE, 'mitigadoras', medida.archivo), () => {});
  }

  await prisma.medidaMitigadora.delete({ where: { id: req.params.medId } });
  res.status(204).send();
}

export async function descargarMedida(req, res) {
  const medida = await prisma.medidaMitigadora.findUniqueOrThrow({
    where: { id: req.params.medId },
  });
  if (!medida.archivo) return res.status(404).json({ error: 'Sin archivo adjunto.' });
  const filePath = path.join(UPLOAD_BASE, 'mitigadoras', medida.archivo);
  res.download(filePath, medida.nombreArchivo);
}
