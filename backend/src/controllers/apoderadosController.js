import prisma from '../utils/prisma.js';

export async function listarApoderados(req, res) {
  const { soloActivos = 'true' } = req.query;
  const where = { sociedadId: req.params.id };
  if (soloActivos === 'true') where.activo = true;

  const apoderados = await prisma.apoderado.findMany({
    where,
    orderBy: [{ activo: 'desc' }, { tipoPoder: 'asc' }, { nombre: 'asc' }],
  });
  res.json(apoderados);
}

export async function crearApoderado(req, res) {
  const d = req.body;
  if (!d.nombre?.trim() || !d.tipoDocumento || !d.numeroDocumento?.trim()) {
    return res.status(400).json({ error: 'Nombre, tipo y número de documento son requeridos.' });
  }

  await prisma.sociedad.findUniqueOrThrow({ where: { id: req.params.id } });

  const apoderado = await prisma.apoderado.create({
    data: {
      sociedadId:        req.params.id,
      nombre:            d.nombre.trim(),
      tipoDocumento:     d.tipoDocumento,
      numeroDocumento:   d.numeroDocumento.trim(),
      nacionalidad:      d.nacionalidad      || null,
      profesion:         d.profesion         || null,
      rucNT:             d.rucNT             || null,
      email:             d.email             || null,
      telefono:          d.telefono          || null,
      domicilio:         d.domicilio         || null,
      jurisdiccion:      d.jurisdiccion      || null,
      tipoPoder:         d.tipoPoder         || 'GENERAL',
      facultades:        d.facultades        || null,
      fechaOtorgamiento: d.fechaOtorgamiento ? new Date(d.fechaOtorgamiento) : null,
      fechaVencimiento:  d.fechaVencimiento  ? new Date(d.fechaVencimiento)  : null,
      notaria:           d.notaria           || null,
      tomoEscritura:     d.tomoEscritura     || null,
      folioEscritura:    d.folioEscritura    || null,
      activo:            true,
      notas:             d.notas             || null,
    },
  });
  res.status(201).json(apoderado);
}

export async function actualizarApoderado(req, res) {
  const d = req.body;
  const apoderado = await prisma.apoderado.update({
    where: { id: req.params.apId },
    data: {
      ...(d.nombre           && { nombre:            d.nombre.trim() }),
      ...(d.tipoDocumento    && { tipoDocumento:      d.tipoDocumento }),
      ...(d.numeroDocumento  && { numeroDocumento:    d.numeroDocumento.trim() }),
      ...(d.nacionalidad  !== undefined && { nacionalidad:  d.nacionalidad  || null }),
      ...(d.profesion     !== undefined && { profesion:     d.profesion     || null }),
      ...(d.rucNT         !== undefined && { rucNT:         d.rucNT         || null }),
      ...(d.email         !== undefined && { email:         d.email         || null }),
      ...(d.telefono      !== undefined && { telefono:      d.telefono      || null }),
      ...(d.domicilio     !== undefined && { domicilio:     d.domicilio     || null }),
      ...(d.jurisdiccion  !== undefined && { jurisdiccion:  d.jurisdiccion  || null }),
      ...(d.tipoPoder        && { tipoPoder:          d.tipoPoder }),
      ...(d.facultades    !== undefined && { facultades:    d.facultades    || null }),
      ...(d.fechaOtorgamiento && { fechaOtorgamiento: new Date(d.fechaOtorgamiento) }),
      ...(d.fechaVencimiento !== undefined && {
        fechaVencimiento: d.fechaVencimiento ? new Date(d.fechaVencimiento) : null,
      }),
      ...(d.notaria       !== undefined && { notaria:       d.notaria       || null }),
      ...(d.tomoEscritura !== undefined && { tomoEscritura: d.tomoEscritura || null }),
      ...(d.folioEscritura!== undefined && { folioEscritura:d.folioEscritura|| null }),
      ...(d.activo        !== undefined && { activo:        Boolean(d.activo) }),
      ...(d.notas         !== undefined && { notas:         d.notas         || null }),
    },
  });
  res.json(apoderado);
}

export async function eliminarApoderado(req, res) {
  await prisma.apoderado.update({
    where: { id: req.params.apId },
    data: { activo: false },
  });
  res.status(204).send();
}
