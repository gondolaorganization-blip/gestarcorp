import prisma from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_BASE = path.join(__dirname, '..', '..', 'uploads');

export async function listarEventos(req, res) {
  const eventos = await prisma.eventoCorporativo.findMany({
    where: { sociedadId: req.params.id },
    include: { registradoPor: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' },
  });
  res.json(eventos);
}

export async function crearEvento(req, res) {
  const { tipo, estado, fecha, descripcion,
    agenteAnteriorNombre, agenteNuevoNombre, agenteNuevoId,
    documentosEntregados, motivoDisolucion, notas } = req.body;

  if (!tipo || !fecha) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'tipo y fecha son requeridos.' });
  }

  const sociedad = await prisma.sociedad.findUniqueOrThrow({ where: { id: req.params.id } });

  const estaCompleto = estado === 'COMPLETADO';
  const fechaEvento  = new Date(fecha);

  // Calcular retención 5 años para disolución
  let fechaRetension = null;
  if (tipo === 'DISOLUCION' && estaCompleto) {
    fechaRetension = new Date(fechaEvento);
    fechaRetension.setFullYear(fechaRetension.getFullYear() + 5);
  }

  // Construir updates de sociedad
  const socUpdate = {};
  if (tipo === 'DISOLUCION' && estaCompleto) {
    socUpdate.estado                  = 'DISUELTA';
    socUpdate.fechaDisolucion         = fechaEvento;
    socUpdate.fechaVencimientoRetension = fechaRetension;
  }
  if (tipo === 'CAMBIO_AGENTE' && estaCompleto && agenteNuevoId) {
    socUpdate.agenteId = agenteNuevoId;
  }

  const docsJson = documentosEntregados
    ? (Array.isArray(documentosEntregados)
        ? JSON.stringify(documentosEntregados)
        : documentosEntregados)
    : null;

  const ops = [
    prisma.eventoCorporativo.create({
      data: {
        sociedadId:           req.params.id,
        tipo,
        estado:               estado || 'PENDIENTE',
        fecha:                fechaEvento,
        descripcion:          descripcion          || null,
        agenteAnteriorNombre: agenteAnteriorNombre || (tipo === 'CAMBIO_AGENTE' ? sociedad.agenteId ? null : null : null),
        agenteNuevoNombre:    agenteNuevoNombre    || null,
        agenteNuevoId:        agenteNuevoId        || null,
        documentosEntregados: docsJson,
        motivoDisolucion:     motivoDisolucion     || null,
        fechaVencimientoRetension: fechaRetension,
        archivo:              req.file?.filename    || null,
        nombreArchivo:        req.file?.originalname || null,
        notas:                notas                || null,
        registradoPorId:      req.user?.id          || null,
      },
      include: { registradoPor: { select: { nombre: true } } },
    }),
  ];

  if (Object.keys(socUpdate).length > 0) {
    ops.push(prisma.sociedad.update({ where: { id: req.params.id }, data: socUpdate }));
  }

  const [evento] = await prisma.$transaction(ops);
  res.status(201).json(evento);
}

export async function actualizarEvento(req, res) {
  const d = req.body;

  // If completing a previously pending event, apply side effects
  if (d.estado === 'COMPLETADO') {
    const evento = await prisma.eventoCorporativo.findUniqueOrThrow({
      where: { id: req.params.eveId },
    });

    if (evento.estado !== 'COMPLETADO') {
      const socUpdate = {};
      if (evento.tipo === 'DISOLUCION') {
        const fecha = d.fecha ? new Date(d.fecha) : evento.fecha;
        const ret = new Date(fecha); ret.setFullYear(ret.getFullYear() + 5);
        socUpdate.estado                    = 'DISUELTA';
        socUpdate.fechaDisolucion           = fecha;
        socUpdate.fechaVencimientoRetension = ret;
      }
      if (evento.tipo === 'CAMBIO_AGENTE' && evento.agenteNuevoId) {
        socUpdate.agenteId = evento.agenteNuevoId;
      }
      if (Object.keys(socUpdate).length > 0) {
        await prisma.sociedad.update({ where: { id: req.params.id }, data: socUpdate });
      }
    }
  }

  const evento = await prisma.eventoCorporativo.update({
    where: { id: req.params.eveId },
    data: {
      ...(d.estado      && { estado:      d.estado }),
      ...(d.descripcion !== undefined && { descripcion: d.descripcion || null }),
      ...(d.notas       !== undefined && { notas:       d.notas       || null }),
    },
    include: { registradoPor: { select: { nombre: true } } },
  });
  res.json(evento);
}

export async function eliminarEvento(req, res) {
  const evento = await prisma.eventoCorporativo.findUniqueOrThrow({
    where: { id: req.params.eveId },
  });

  if (evento.archivo) {
    fs.unlink(path.join(UPLOAD_BASE, 'eventos', evento.archivo), () => {});
  }

  await prisma.eventoCorporativo.delete({ where: { id: req.params.eveId } });
  res.status(204).send();
}

export async function descargarEvento(req, res) {
  const evento = await prisma.eventoCorporativo.findUniqueOrThrow({
    where: { id: req.params.eveId },
  });
  if (!evento.archivo) return res.status(404).json({ error: 'Sin archivo adjunto.' });
  const filePath = path.join(UPLOAD_BASE, 'eventos', evento.archivo);
  res.download(filePath, evento.nombreArchivo);
}
