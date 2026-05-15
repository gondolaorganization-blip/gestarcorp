import prisma from '../utils/prisma.js';
import { htmlAPDF } from '../utils/generadorPDF.js';
import { htmlActa, contenidosPorTipo } from '../templates/pdf/actaBase.js';
import { docxActa } from '../templates/docx/actaBase.js';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function siguienteNumeroActa(sociedadId) {
  const ultima = await prisma.acta.findFirst({
    where: { sociedadId },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });
  return (ultima?.numero ?? 0) + 1;
}

async function calcularQuorum(sociedadId, accionistasPresentesIds = []) {
  const todos = await prisma.accionista.findMany({
    where: { sociedadId, activo: true },
    select: { id: true, nombre: true, cantidadAcciones: true, porcentaje: true },
  });

  const totalAcciones = todos.reduce((s, a) => s + a.cantidadAcciones, 0);
  if (totalAcciones === 0) return { texto: 'Capital no registrado', porcentaje: 0 };

  const presentes = accionistasPresentesIds.length
    ? todos.filter(a => accionistasPresentesIds.includes(a.id))
    : todos; // Si no se especifican, asume todos presentes

  const accionesPresentes = presentes.reduce((s, a) => s + a.cantidadAcciones, 0);
  const pct = ((accionesPresentes / totalAcciones) * 100).toFixed(2);

  return {
    texto: `${accionesPresentes.toLocaleString('es-PA')} de ${totalAcciones.toLocaleString('es-PA')} acciones presentes (${pct}%)`,
    porcentaje: Number(pct),
    accionesPresentes,
    totalAcciones,
    presentes: presentes.map(a => a.nombre),
  };
}

// ─── CRUD ACTAS ───────────────────────────────────────────────────────────────

export async function listarActas(req, res) {
  const { tipo, estado } = req.query;
  const where = { sociedadId: req.params.id };
  if (tipo)   where.tipo   = tipo;
  if (estado) where.estado = estado;

  const actas = await prisma.acta.findMany({
    where,
    orderBy: { numero: 'desc' },
  });
  res.json(actas);
}

export async function obtenerActa(req, res) {
  const acta = await prisma.acta.findUniqueOrThrow({
    where: { id: req.params.actaId },
  });
  res.json(acta);
}

export async function crearActa(req, res) {
  const d = req.body;
  if (!d.tipo || !d.fecha) {
    return res.status(400).json({ error: 'Tipo y fecha del acta son requeridos.' });
  }

  await prisma.sociedad.findUniqueOrThrow({ where: { id: req.params.id } });

  const numero = d.numero ?? await siguienteNumeroActa(req.params.id);

  const acta = await prisma.acta.create({
    data: {
      sociedadId: req.params.id,
      numero:     Number(numero),
      tipo:       d.tipo,
      fecha:      new Date(d.fecha),
      lugar:      d.lugar    || null,
      quorum:     d.quorum   || null,
      agenda:     d.agenda   || null,
      acuerdos:   d.acuerdos || null,
      estado:     d.estado   || 'BORRADOR',
      notas:      d.notas    || null,
    }
  });

  res.status(201).json(acta);
}

export async function actualizarActa(req, res) {
  const d = req.body;
  const acta = await prisma.acta.update({
    where: { id: req.params.actaId },
    data: {
      ...(d.tipo      && { tipo:     d.tipo }),
      ...(d.fecha     && { fecha:    new Date(d.fecha) }),
      ...(d.lugar   !== undefined && { lugar:    d.lugar   || null }),
      ...(d.quorum  !== undefined && { quorum:   d.quorum  || null }),
      ...(d.agenda  !== undefined && { agenda:   d.agenda  || null }),
      ...(d.acuerdos !== undefined && { acuerdos: d.acuerdos || null }),
      ...(d.estado    && { estado:   d.estado }),
      ...(d.notas   !== undefined && { notas:    d.notas   || null }),
    }
  });
  res.json(acta);
}

export async function eliminarActa(req, res) {
  await prisma.acta.delete({ where: { id: req.params.actaId } });
  res.status(204).send();
}

// ─── QUÓRUM ───────────────────────────────────────────────────────────────────

export async function calcularQuorumEndpoint(req, res) {
  const { accionistasPresentesIds } = req.body;
  const resultado = await calcularQuorum(req.params.id, accionistasPresentesIds || []);
  res.json(resultado);
}

// ─── PLANTILLA SUGERIDA ───────────────────────────────────────────────────────

export async function obtenerPlantilla(req, res) {
  const { tipo } = req.params;
  const plantilla = contenidosPorTipo[tipo];
  if (!plantilla) return res.status(404).json({ error: 'Tipo de acta no reconocido.' });

  res.json({
    tipo,
    titulo:         plantilla.titulo,
    agendaSugerida: plantilla.agendaSugerida.join('\n'),
  });
}

// ─── GENERADORES PDF y WORD ───────────────────────────────────────────────────

async function obtenerDatosParaActa(actaId) {
  const acta = await prisma.acta.findUniqueOrThrow({
    where: { id: actaId },
    include: { sociedad: true },
  });
  const directores = await prisma.director.findMany({
    where: { sociedadId: acta.sociedadId, activo: true },
    orderBy: { cargo: 'asc' },
  });
  return { acta, sociedad: acta.sociedad, directores };
}

export async function generarActaPDF(req, res) {
  const { acta, sociedad, directores } = await obtenerDatosParaActa(req.params.actaId);

  // Enriquecer acta con datos del request si vienen (para preview sin guardar)
  const actaMerged = { ...acta, ...req.query };

  const html = htmlActa({ sociedad, acta: actaMerged, directores });
  const pdf  = await htmlAPDF(html);

  const nombre = `Acta-${String(acta.numero).padStart(3, '0')}-${acta.tipo}`;
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${nombre}.pdf"`,
  });
  res.send(pdf);
}

export async function generarActaWord(req, res) {
  const { acta, sociedad, directores } = await obtenerDatosParaActa(req.params.actaId);
  const actaMerged = { ...acta, ...req.query };

  const buffer = await docxActa({ sociedad, acta: actaMerged, directores });

  const nombre = `Acta-${String(acta.numero).padStart(3, '0')}-${acta.tipo}`;
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': `attachment; filename="${nombre}.docx"`,
  });
  res.send(buffer);
}

// ─── PORTAL DEL CLIENTE ───────────────────────────────────────────────────────

export async function portalListarActas(req, res) {
  const actas = await prisma.acta.findMany({
    where: {
      sociedadId: req.portal.sociedadId,
      estado: { in: ['FIRMADA', 'PROTOCOLIZADA'] },
    },
    orderBy: { numero: 'desc' },
    select: {
      id: true, numero: true, tipo: true, fecha: true,
      lugar: true, estado: true, creadoEn: true,
    }
  });
  res.json(actas);
}

export async function portalDescargarActaPDF(req, res) {
  const acta = await prisma.acta.findUniqueOrThrow({
    where: { id: req.params.actaId },
    include: { sociedad: true },
  });

  // Solo actas firmadas o protocolizadas son accesibles desde el portal
  if (!['FIRMADA', 'PROTOCOLIZADA'].includes(acta.estado)) {
    return res.status(403).json({ error: 'Esta acta aún no está disponible.' });
  }

  if (acta.sociedadId !== req.portal.sociedadId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  const directores = await prisma.director.findMany({
    where: { sociedadId: acta.sociedadId, activo: true },
    orderBy: { cargo: 'asc' },
  });

  const html = htmlActa({ sociedad: acta.sociedad, acta, directores });
  const pdf  = await htmlAPDF(html);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="Acta-${String(acta.numero).padStart(3, '0')}.pdf"`,
  });
  res.send(pdf);
}
