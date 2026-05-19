import prisma from '../utils/prisma.js';
import { generarObligacionesAnuales } from '../utils/fechasObligaciones.js';

// ─── SOCIEDADES ───────────────────────────────────────────────────────────────

export async function listarSociedades(req, res) {
  const { buscar, estado, plan, pagina = 1, limite = 20 } = req.query;
  const skip = (Number(pagina) - 1) * Number(limite);

  const where = {};
  if (buscar) {
    where.OR = [
      { nombre: { contains: buscar, mode: 'insensitive' } },
      { ficha: { contains: buscar, mode: 'insensitive' } },
      { tomo:  { contains: buscar, mode: 'insensitive' } },
    ];
  }
  if (estado) where.estado = estado;
  if (plan)   where.planCliente = plan;

  const hoy = new Date();

  const [total, sociedades, obligPorSoc, benefPorSoc] = await Promise.all([
    prisma.sociedad.count({ where }),
    prisma.sociedad.findMany({
      where, skip, take: Number(limite),
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { accionistas: true, directores: true, actas: true, consultas: true }
        }
      }
    }),
    prisma.obligacionFiscal.groupBy({
      by: ['sociedadId'],
      where: { estado: 'VENCIDO' },
      _count: { id: true },
    }),
    prisma.beneficiarioFinal.groupBy({
      by: ['sociedadId'],
      where: { OR: [{ verificado: false }, { documentoIdentidad: null }] },
      _count: { id: true },
    }),
  ]);

  const oblMap = Object.fromEntries(obligPorSoc.map(o => [o.sociedadId, o._count.id]));
  const benMap = Object.fromEntries(benefPorSoc.map(b => [b.sociedadId, b._count.id]));

  const sociedadesConScore = sociedades.map(s => {
    const oblVencidas   = oblMap[s.id] || 0;
    const benefSinVerif = benMap[s.id] || 0;
    const diasVenc = s.fechaVencimiento
      ? Math.ceil((new Date(s.fechaVencimiento) - hoy) / 86400000)
      : null;
    let score = 100;
    if (oblVencidas > 0)                     score -= Math.min(oblVencidas * 10, 30);
    if (benefSinVerif > 0)                   score -= Math.min(benefSinVerif * 5, 20);
    if (diasVenc !== null && diasVenc <= 30)  score -= 20;
    if (diasVenc !== null && diasVenc < 0)    score -= 30;
    return { ...s, _oblVencidas: oblVencidas, _benefSinVerif: benefSinVerif, healthScore: Math.max(0, score) };
  });

  res.json({ total, pagina: Number(pagina), limite: Number(limite), sociedades: sociedadesConScore });
}

export async function obtenerSociedad(req, res) {
  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      accionistas: { where: { activo: true }, orderBy: { nombre: 'asc' } },
      directores:  { where: { activo: true }, orderBy: { cargo: 'asc' } },
      obligacionesFiscales: {
        orderBy: [{ anio: 'desc' }, { tipo: 'asc' }],
        take: 20,
      },
      agente: { select: { id: true, nombre: true, email: true, cur: true } },
      _count: { select: { actas: true, acciones: true, documentos: true, consultas: true } }
    }
  });
  res.json(sociedad);
}

export async function crearSociedad(req, res) {
  const d = req.body;

  if (!d.nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre de la sociedad es requerido.' });
  }

  const sociedad = await prisma.sociedad.create({
    data: {
      nombre:           d.nombre.trim().toUpperCase(),
      ficha:            d.ficha || null,
      tomo:             d.tomo  || null,
      folio:            d.folio || null,
      fechaConstitucion: d.fechaConstitucion ? new Date(d.fechaConstitucion) : null,
      duracion:          d.duracion || 'Perpetua',
      domicilio:         d.domicilio || null,
      capital:           d.capital      ? Number(d.capital)          : null,
      tipoAcciones:      d.tipoAcciones || 'NOMINATIVAS',
      cantidadAcciones:  d.cantidadAcciones ? Number(d.cantidadAcciones) : null,
      valorNominal:      d.valorNominal  ? Number(d.valorNominal)    : null,
      estado:            d.estado     || 'ACTIVA',
      planCliente:       d.planCliente || 'TRIAL',
      fechaVencimiento:  d.fechaVencimiento
        ? new Date(d.fechaVencimiento)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días de prueba
      notas:             d.notas || null,
      agenteId:          req.user.id,
    }
  });

  // Crear obligaciones fiscales del año en curso automáticamente
  const anioActual = new Date().getFullYear();
  const obligaciones = generarObligacionesAnuales(
    sociedad.id, anioActual, sociedad.fechaConstitucion
  );
  await prisma.obligacionFiscal.createMany({ data: obligaciones, skipDuplicates: true });

  res.status(201).json(sociedad);
}

export async function actualizarSociedad(req, res) {
  const d = req.body;
  const sociedad = await prisma.sociedad.update({
    where: { id: req.params.id },
    data: {
      ...(d.nombre            && { nombre: d.nombre.trim().toUpperCase() }),
      ...(d.ficha  !== undefined && { ficha: d.ficha  || null }),
      ...(d.tomo   !== undefined && { tomo:  d.tomo   || null }),
      ...(d.folio  !== undefined && { folio: d.folio  || null }),
      ...(d.fechaConstitucion  && { fechaConstitucion: new Date(d.fechaConstitucion) }),
      ...(d.duracion           && { duracion:  d.duracion }),
      ...(d.domicilio !== undefined && { domicilio: d.domicilio || null }),
      ...(d.capital   !== undefined && { capital:   d.capital   ? Number(d.capital)   : null }),
      ...(d.tipoAcciones       && { tipoAcciones: d.tipoAcciones }),
      ...(d.cantidadAcciones !== undefined && {
        cantidadAcciones: d.cantidadAcciones ? Number(d.cantidadAcciones) : null
      }),
      ...(d.valorNominal !== undefined && {
        valorNominal: d.valorNominal ? Number(d.valorNominal) : null
      }),
      ...(d.estado       && { estado:       d.estado }),
      ...(d.planCliente  && { planCliente:  d.planCliente }),
      ...(d.fechaVencimiento !== undefined && {
        fechaVencimiento: d.fechaVencimiento ? new Date(d.fechaVencimiento) : null
      }),
      ...(d.notas        !== undefined && { notas:        d.notas        || null }),
      ...(d.email        !== undefined && { email:        d.email        || null }),
      ...(d.telefono     !== undefined && { telefono:     d.telefono     || null }),
      ...(d.jurisdiccion !== undefined && { jurisdiccion: d.jurisdiccion || null }),
      // RUBF fields
      ...(d.tipoPersonaJuridica !== undefined && { tipoPersonaJuridica: d.tipoPersonaJuridica || null }),
      ...(d.ruc !== undefined && { ruc: d.ruc || null }),
      ...(d.actividadPrincipal !== undefined && { actividadPrincipal: d.actividadPrincipal || null }),
      ...(d.estadoRegistroPublico !== undefined && { estadoRegistroPublico: d.estadoRegistroPublico || null }),
      ...(d.fechaRegistroRUBF !== undefined && {
        fechaRegistroRUBF: d.fechaRegistroRUBF ? new Date(d.fechaRegistroRUBF) : null
      }),
      ...(d.servicioAccionistaNominal !== undefined && { servicioAccionistaNominal: Boolean(d.servicioAccionistaNominal) }),
      ...(d.servicioDirectorNominal !== undefined && { servicioDirectorNominal: Boolean(d.servicioDirectorNominal) }),
      ...(d.servicioApoderado !== undefined && { servicioApoderado: Boolean(d.servicioApoderado) }),
    }
  });
  res.json(sociedad);
}

export async function eliminarSociedad(req, res) {
  await prisma.sociedad.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function resumenSociedad(req, res) {
  const id = req.params.id;
  const [sociedad, consultasPendientes, obligacionesPendientes] = await Promise.all([
    prisma.sociedad.findUniqueOrThrow({
      where: { id },
      include: {
        _count: {
          select: { accionistas: true, directores: true, actas: true, acciones: true }
        },
        agente: { select: { id: true, nombre: true, email: true, cur: true } },
      }
    }),
    prisma.consulta.count({
      where: { sociedadId: id, estado: { in: ['ABIERTA', 'EN_PROCESO'] } }
    }),
    prisma.obligacionFiscal.findMany({
      where: { sociedadId: id, estado: { in: ['PENDIENTE', 'VENCIDO'] } },
      orderBy: { fechaVence: 'asc' },
    }),
  ]);

  res.json({ sociedad, consultasPendientes, obligacionesPendientes });
}

// ─── DIRECTORES ───────────────────────────────────────────────────────────────

export async function listarDirectores(req, res) {
  const { soloActivos = 'true' } = req.query;
  const where = { sociedadId: req.params.id };
  if (soloActivos === 'true') where.activo = true;

  const directores = await prisma.director.findMany({
    where,
    orderBy: [{ activo: 'desc' }, { cargo: 'asc' }, { nombre: 'asc' }],
  });
  res.json(directores);
}

export async function crearDirector(req, res) {
  const d = req.body;

  if (!d.nombre || !d.cargo || !d.tipoDocumento || !d.numeroDocumento) {
    return res.status(400).json({
      error: 'Nombre, cargo, tipo y número de documento son requeridos.'
    });
  }

  // Verificar que la sociedad existe
  await prisma.sociedad.findUniqueOrThrow({ where: { id: req.params.id } });

  const director = await prisma.director.create({
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
      esNominal:         Boolean(d.esNominal),
      cargo:             d.cargo,
      fechaNombramiento: d.fechaNombramiento ? new Date(d.fechaNombramiento) : null,
      fechaVencimiento:  d.fechaVencimiento  ? new Date(d.fechaVencimiento)  : null,
      activo:            true,
      notas:             d.notas || null,
    }
  });
  res.status(201).json(director);
}

export async function actualizarDirector(req, res) {
  const d = req.body;
  const director = await prisma.director.update({
    where: { id: req.params.dirId },
    data: {
      ...(d.nombre            && { nombre:          d.nombre.trim() }),
      ...(d.tipoDocumento     && { tipoDocumento:    d.tipoDocumento }),
      ...(d.numeroDocumento   && { numeroDocumento:  d.numeroDocumento.trim() }),
      ...(d.nacionalidad  !== undefined && { nacionalidad:  d.nacionalidad  || null }),
      ...(d.profesion     !== undefined && { profesion:     d.profesion     || null }),
      ...(d.rucNT         !== undefined && { rucNT:         d.rucNT         || null }),
      ...(d.email         !== undefined && { email:         d.email         || null }),
      ...(d.telefono      !== undefined && { telefono:      d.telefono      || null }),
      ...(d.domicilio     !== undefined && { domicilio:     d.domicilio     || null }),
      ...(d.jurisdiccion  !== undefined && { jurisdiccion:  d.jurisdiccion  || null }),
      ...(d.cargo             && { cargo:            d.cargo }),
      ...(d.fechaNombramiento && { fechaNombramiento: new Date(d.fechaNombramiento) }),
      ...(d.fechaVencimiento !== undefined && {
        fechaVencimiento: d.fechaVencimiento ? new Date(d.fechaVencimiento) : null
      }),
      ...(d.esNominal !== undefined && { esNominal: Boolean(d.esNominal) }),
      ...(d.activo    !== undefined && { activo:    Boolean(d.activo) }),
      ...(d.notas     !== undefined && { notas:     d.notas || null }),
    }
  });
  res.json(director);
}

export async function eliminarDirector(req, res) {
  // Baja lógica
  await prisma.director.update({
    where: { id: req.params.dirId },
    data: { activo: false }
  });
  res.status(204).send();
}

// ─── ACCIONISTAS ──────────────────────────────────────────────────────────────

export async function listarAccionistas(req, res) {
  const { soloActivos = 'true' } = req.query;
  const where = { sociedadId: req.params.id };
  if (soloActivos === 'true') where.activo = true;

  const accionistas = await prisma.accionista.findMany({
    where,
    orderBy: [{ activo: 'desc' }, { porcentaje: 'desc' }, { nombre: 'asc' }],
  });
  res.json(accionistas);
}

export async function crearAccionista(req, res) {
  const d = req.body;

  if (!d.nombre || !d.tipoDocumento || !d.numeroDocumento) {
    return res.status(400).json({
      error: 'Nombre, tipo y número de documento son requeridos.'
    });
  }

  await prisma.sociedad.findUniqueOrThrow({ where: { id: req.params.id } });

  const accionista = await prisma.accionista.create({
    data: {
      sociedadId:       req.params.id,
      nombre:           d.nombre.trim(),
      tipoDocumento:    d.tipoDocumento,
      numeroDocumento:  d.numeroDocumento.trim(),
      nacionalidad:     d.nacionalidad    || null,
      profesion:        d.profesion       || null,
      rucNT:            d.rucNT           || null,
      email:            d.email           || null,
      telefono:         d.telefono        || null,
      domicilio:        d.domicilio       || null,
      jurisdiccion:     d.jurisdiccion    || null,
      esNominal:        Boolean(d.esNominal),
      cantidadAcciones: d.cantidadAcciones ? Number(d.cantidadAcciones) : 0,
      porcentaje:       d.porcentaje       ? Number(d.porcentaje)       : null,
      fechaIngreso:     d.fechaIngreso     ? new Date(d.fechaIngreso)   : null,
      activo:           true,
      notas:            d.notas || null,
    }
  });

  // Recalcular porcentajes de todos los accionistas activos
  await recalcularPorcentajes(req.params.id);

  const actualizado = await prisma.accionista.findUniqueOrThrow({
    where: { id: accionista.id }
  });
  res.status(201).json(actualizado);
}

export async function actualizarAccionista(req, res) {
  const d = req.body;
  await prisma.accionista.update({
    where: { id: req.params.acId },
    data: {
      ...(d.nombre            && { nombre:          d.nombre.trim() }),
      ...(d.tipoDocumento     && { tipoDocumento:    d.tipoDocumento }),
      ...(d.numeroDocumento   && { numeroDocumento:  d.numeroDocumento.trim() }),
      ...(d.nacionalidad  !== undefined && { nacionalidad:  d.nacionalidad  || null }),
      ...(d.profesion     !== undefined && { profesion:     d.profesion     || null }),
      ...(d.rucNT         !== undefined && { rucNT:         d.rucNT         || null }),
      ...(d.email         !== undefined && { email:         d.email         || null }),
      ...(d.telefono      !== undefined && { telefono:      d.telefono      || null }),
      ...(d.domicilio     !== undefined && { domicilio:     d.domicilio     || null }),
      ...(d.jurisdiccion  !== undefined && { jurisdiccion:  d.jurisdiccion  || null }),
      ...(d.esNominal !== undefined && { esNominal: Boolean(d.esNominal) }),
      ...(d.cantidadAcciones !== undefined && {
        cantidadAcciones: Number(d.cantidadAcciones) || 0
      }),
      ...(d.fechaIngreso && { fechaIngreso: new Date(d.fechaIngreso) }),
      ...(d.activo !== undefined && { activo: Boolean(d.activo) }),
      ...(d.notas !== undefined  && { notas:  d.notas || null }),
    }
  });

  const sociedadId = (await prisma.accionista.findUnique({
    where: { id: req.params.acId }, select: { sociedadId: true }
  }))?.sociedadId || req.params.id;

  await recalcularPorcentajes(sociedadId);

  const actualizado = await prisma.accionista.findUniqueOrThrow({
    where: { id: req.params.acId }
  });
  res.json(actualizado);
}

export async function eliminarAccionista(req, res) {
  const accionista = await prisma.accionista.findUniqueOrThrow({
    where: { id: req.params.acId }, select: { sociedadId: true }
  });
  await prisma.accionista.update({
    where: { id: req.params.acId },
    data: { activo: false, cantidadAcciones: 0 }
  });
  await recalcularPorcentajes(accionista.sociedadId);
  res.status(204).send();
}

async function recalcularPorcentajes(sociedadId) {
  const activos = await prisma.accionista.findMany({
    where: { sociedadId, activo: true },
    select: { id: true, cantidadAcciones: true }
  });

  const total = activos.reduce((s, a) => s + a.cantidadAcciones, 0);
  if (total === 0) return;

  await Promise.all(activos.map(a =>
    prisma.accionista.update({
      where: { id: a.id },
      data: { porcentaje: Number(((a.cantidadAcciones / total) * 100).toFixed(4)) }
    })
  ));

  // Actualizar cantidadAcciones total en la sociedad
  await prisma.sociedad.update({
    where: { id: sociedadId },
    data: { cantidadAcciones: total }
  });
}

// ─── OBLIGACIONES FISCALES ────────────────────────────────────────────────────

export async function listarObligaciones(req, res) {
  const { anio } = req.query;
  const where = { sociedadId: req.params.id };
  if (anio) where.anio = Number(anio);

  const obligaciones = await prisma.obligacionFiscal.findMany({
    where,
    orderBy: [{ anio: 'desc' }, { fechaVence: 'asc' }],
  });
  res.json(obligaciones);
}

export async function generarObligacionesAnio(req, res) {
  const { anio } = req.body;
  if (!anio) return res.status(400).json({ error: 'El año es requerido.' });

  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: req.params.id },
    select: { fechaConstitucion: true }
  });

  const data = generarObligacionesAnuales(
    req.params.id, Number(anio), sociedad.fechaConstitucion
  );

  const creadas = await prisma.obligacionFiscal.createMany({
    data,
    skipDuplicates: true
  });

  const obligaciones = await prisma.obligacionFiscal.findMany({
    where: { sociedadId: req.params.id, anio: Number(anio) },
    orderBy: { fechaVence: 'asc' },
  });

  res.status(201).json({ creadas: creadas.count, obligaciones });
}

export async function crearObligacion(req, res) {
  const d = req.body;
  if (!d.tipo || !d.anio || !d.fechaVence) {
    return res.status(400).json({ error: 'tipo, anio y fechaVence son requeridos.' });
  }
  const obligacion = await prisma.obligacionFiscal.create({
    data: {
      sociedadId: req.params.id,
      tipo:       d.tipo,
      anio:       Number(d.anio),
      entidad:    d.entidad || null,
      fechaVence: new Date(d.fechaVence),
      estado:     d.estado || 'PENDIENTE',
      monto:      d.monto ? Number(d.monto) : null,
    }
  });
  res.status(201).json(obligacion);
}

export async function actualizarObligacion(req, res) {
  const d = req.body;
  const obligacion = await prisma.obligacionFiscal.update({
    where: { id: req.params.obId },
    data: {
      ...(d.estado      && { estado:     d.estado }),
      ...(d.monto  !== undefined && { monto:     d.monto ? Number(d.monto) : null }),
      ...(d.fechaPago   && { fechaPago:  new Date(d.fechaPago) }),
      ...(d.comprobante !== undefined && { comprobante: d.comprobante || null }),
      ...(d.entidad     && { entidad:    d.entidad }),
      ...(d.descripcion && { descripcion: d.descripcion }),
      ...(d.notas !== undefined && { notas: d.notas || null }),
      ...(d.fechaVence  && { fechaVence: new Date(d.fechaVence) }),
    }
  });
  res.json(obligacion);
}

// ─── PORTAL DEL CLIENTE ───────────────────────────────────────────────────────

export async function portalObtenerSociedad(req, res) {
  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: req.portal.sociedadId },
    include: {
      directores:  { where: { activo: true }, orderBy: { cargo: 'asc' } },
      accionistas: { where: { activo: true }, orderBy: { porcentaje: 'desc' } },
      obligacionesFiscales: {
        where: { estado: { in: ['PENDIENTE', 'VENCIDO'] } },
        orderBy: { fechaVence: 'asc' },
      },
      _count: { select: { actas: true, documentos: true, consultas: true } }
    }
  });
  res.json(sociedad);
}

export async function portalListarDirectores(req, res) {
  const directores = await prisma.director.findMany({
    where: { sociedadId: req.portal.sociedadId, activo: true },
    orderBy: { cargo: 'asc' },
  });
  res.json(directores);
}

export async function portalListarAccionistas(req, res) {
  const accionistas = await prisma.accionista.findMany({
    where: { sociedadId: req.portal.sociedadId, activo: true },
    orderBy: { porcentaje: 'desc' },
  });
  res.json(accionistas);
}
