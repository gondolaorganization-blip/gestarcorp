import prisma from '../utils/prisma.js';
import { htmlAPDF } from '../utils/generadorPDF.js';
import { htmlCertificadoAccion } from '../templates/pdf/certificadoAccion.js';
import { docxCertificadoAccion } from '../templates/docx/certificadoAccion.js';

// ─── LIBRO DE ACCIONES ────────────────────────────────────────────────────────

export async function listarAcciones(req, res) {
  const { estado, clase } = req.query;
  const where = { sociedadId: req.params.id };
  if (estado) where.estado = estado;
  if (clase)  where.clase  = clase;

  const acciones = await prisma.accion.findMany({
    where,
    include: {
      transferencias: { orderBy: { fecha: 'asc' } }
    },
    orderBy: [{ estado: 'asc' }, { numero: 'asc' }],
  });

  // Resumen del capital accionario
  const resumen = acciones.reduce((acc, a) => {
    if (a.estado === 'VIGENTE') {
      acc.vigentes++;
      acc.titulares.add(a.titular);
    }
    if (a.estado === 'TRANSFERIDA') acc.transferidas++;
    if (a.estado === 'CANCELADA')   acc.canceladas++;
    return acc;
  }, { vigentes: 0, transferidas: 0, canceladas: 0, titulares: new Set() });

  res.json({
    acciones,
    resumen: {
      total:        acciones.length,
      vigentes:     resumen.vigentes,
      transferidas: resumen.transferidas,
      canceladas:   resumen.canceladas,
      titularesUnicos: resumen.titulares.size,
    }
  });
}

export async function obtenerAccion(req, res) {
  const accion = await prisma.accion.findUniqueOrThrow({
    where: { id: req.params.accionId },
    include: { transferencias: { orderBy: { fecha: 'asc' } } }
  });
  res.json(accion);
}

export async function crearAccion(req, res) {
  const d = req.body;
  if (!d.numero || !d.titular) {
    return res.status(400).json({ error: 'Número de acción y titular son requeridos.' });
  }

  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: req.params.id }
  });

  const accion = await prisma.accion.create({
    data: {
      sociedadId:         req.params.id,
      numero:             String(d.numero).trim(),
      clase:              d.clase        || 'COMUN',
      titular:            d.titular.trim(),
      titularDocumento:   d.titularDocumento || null,
      fechaEmision:       d.fechaEmision  ? new Date(d.fechaEmision) : new Date(),
      valorNominal:       d.valorNominal  ? Number(d.valorNominal)   : (sociedad.valorNominal ? Number(sociedad.valorNominal) : null),
      estado:             'VIGENTE',
      certificadoGenerado: false,
      notas:              d.notas || null,
    }
  });
  res.status(201).json(accion);
}

export async function crearAccionesLote(req, res) {
  // Crea varias acciones correlativas a la vez
  const { desde, hasta, titular, titularDocumento, clase, fechaEmision, valorNominal } = req.body;

  if (!desde || !hasta || !titular) {
    return res.status(400).json({ error: 'desde, hasta y titular son requeridos.' });
  }
  if (Number(hasta) < Number(desde)) {
    return res.status(400).json({ error: '"hasta" debe ser mayor o igual que "desde".' });
  }
  if (Number(hasta) - Number(desde) > 999) {
    return res.status(400).json({ error: 'Máximo 1000 acciones por lote.' });
  }

  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: req.params.id }
  });

  const fecha = fechaEmision ? new Date(fechaEmision) : new Date();
  const vn    = valorNominal ? Number(valorNominal) : (sociedad.valorNominal ? Number(sociedad.valorNominal) : null);

  const data = [];
  for (let n = Number(desde); n <= Number(hasta); n++) {
    data.push({
      sociedadId: req.params.id,
      numero:     String(n),
      clase:      clase || 'COMUN',
      titular:    titular.trim(),
      titularDocumento: titularDocumento || null,
      fechaEmision: fecha,
      valorNominal: vn,
      estado:     'VIGENTE',
      certificadoGenerado: false,
    });
  }

  const resultado = await prisma.accion.createMany({ data, skipDuplicates: true });
  res.status(201).json({
    creadas: resultado.count,
    mensaje: `${resultado.count} acciones creadas (números ${desde} al ${hasta}).`
  });
}

export async function actualizarAccion(req, res) {
  const d = req.body;
  const accion = await prisma.accion.update({
    where: { id: req.params.accionId },
    data: {
      ...(d.titular           && { titular:          d.titular.trim() }),
      ...(d.titularDocumento !== undefined && { titularDocumento: d.titularDocumento || null }),
      ...(d.clase             && { clase:             d.clase }),
      ...(d.valorNominal !== undefined && { valorNominal: d.valorNominal ? Number(d.valorNominal) : null }),
      ...(d.fechaEmision      && { fechaEmision:      new Date(d.fechaEmision) }),
      ...(d.estado            && { estado:            d.estado }),
      ...(d.notas !== undefined && { notas:           d.notas || null }),
    }
  });
  res.json(accion);
}

// ─── TRANSFERENCIAS ───────────────────────────────────────────────────────────

export async function registrarTransferencia(req, res) {
  const d = req.body;
  if (!d.cesionario || !d.fecha) {
    return res.status(400).json({ error: 'Cesionario y fecha son requeridos.' });
  }

  const accion = await prisma.accion.findUniqueOrThrow({
    where: { id: req.params.accionId }
  });

  if (accion.estado !== 'VIGENTE') {
    return res.status(400).json({ error: 'Solo se pueden transferir acciones vigentes.' });
  }

  // Registrar transferencia y actualizar titular en una transacción
  const [transferencia] = await prisma.$transaction([
    prisma.transferenciaAccion.create({
      data: {
        accionId:  accion.id,
        cedente:   accion.titular,
        cesionario: d.cesionario.trim(),
        cantidad:  1,
        fecha:     new Date(d.fecha),
        precio:    d.precio ? Number(d.precio) : null,
        actaId:    d.actaId || null,
        registrado: d.registrado ?? false,
        notas:     d.notas || null,
      }
    }),
    prisma.accion.update({
      where: { id: accion.id },
      data: {
        titular:            d.cesionario.trim(),
        titularDocumento:   d.cesionarioDocumento || null,
        estado:             'TRANSFERIDA',
        certificadoGenerado: false, // el nuevo titular necesita nuevo certificado
      }
    }),
    // Crear nueva acción vigente con el nuevo titular (la transferida queda como historial)
    prisma.accion.update({
      where: { id: accion.id },
      data: { estado: 'VIGENTE' }
    }),
  ]);

  // Actualizar estado de la acción original a historial transferido
  await prisma.accion.update({
    where: { id: accion.id },
    data: { titular: d.cesionario.trim(), titularDocumento: d.cesionarioDocumento || null }
  });

  res.status(201).json(transferencia);
}

export async function listarTransferencias(req, res) {
  const transferencias = await prisma.transferenciaAccion.findMany({
    where: {
      accion: { sociedadId: req.params.id }
    },
    include: { accion: { select: { numero: true, clase: true } } },
    orderBy: { fecha: 'desc' },
  });
  res.json(transferencias);
}

// ─── GENERACIÓN DE CERTIFICADOS ───────────────────────────────────────────────

async function obtenerDatosParaCertificado(accionId) {
  const accion = await prisma.accion.findUniqueOrThrow({
    where: { id: accionId },
    include: { sociedad: true }
  });
  return { accion, sociedad: accion.sociedad };
}

export async function generarCertificadoPDF(req, res) {
  const { accion, sociedad } = await obtenerDatosParaCertificado(req.params.accionId);

  const html = htmlCertificadoAccion({ sociedad, accion });
  const pdf  = await htmlAPDF(html);

  await prisma.accion.update({
    where: { id: accion.id },
    data: { certificadoGenerado: true }
  });

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="Certificado-Accion-${accion.numero}.pdf"`,
  });
  res.send(pdf);
}

export async function generarCertificadoWord(req, res) {
  const { accion, sociedad } = await obtenerDatosParaCertificado(req.params.accionId);

  const buffer = await docxCertificadoAccion({ sociedad, accion });

  await prisma.accion.update({
    where: { id: accion.id },
    data: { certificadoGenerado: true }
  });

  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': `attachment; filename="Certificado-Accion-${accion.numero}.docx"`,
  });
  res.send(buffer);
}

// ─── PORTAL DEL CLIENTE ───────────────────────────────────────────────────────

export async function portalListarAcciones(req, res) {
  const acciones = await prisma.accion.findMany({
    where: { sociedadId: req.portal.sociedadId },
    orderBy: { numero: 'asc' },
    select: {
      id: true, numero: true, clase: true, titular: true,
      fechaEmision: true, valorNominal: true, estado: true, certificadoGenerado: true,
    }
  });
  res.json(acciones);
}
