import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../utils/prisma.js';
import { htmlAPDF } from '../utils/generadorPDF.js';
import { htmlDeclaracionBeneficiarios } from '../templates/pdf/beneficiarioFinal.js';
import { docxDeclaracionBeneficiarios } from '../templates/docx/beneficiarioFinal.js';
import { addDays } from 'date-fns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── AGENTE: CRUD COMPLETO ────────────────────────────────────────────────────

export async function listarBeneficiarios(req, res) {
  const beneficiarios = await prisma.beneficiarioFinal.findMany({
    where: { sociedadId: req.params.id },
    orderBy: { porcentajeControl: 'desc' },
  });

  // Marcar cuáles están vencidos (más de 1 año sin actualizar)
  const hace1Anio = addDays(new Date(), -365);
  const conAlerta = beneficiarios.map(b => ({
    ...b,
    actualizacionVencida: !b.fechaActualizacion || b.fechaActualizacion < hace1Anio,
    diasSinActualizar: b.fechaActualizacion
      ? Math.floor((Date.now() - new Date(b.fechaActualizacion).getTime()) / 86400000)
      : null,
  }));

  res.json(conAlerta);
}

export async function obtenerBeneficiario(req, res) {
  const b = await prisma.beneficiarioFinal.findUniqueOrThrow({
    where: { id: req.params.bId },
  });
  res.json(b);
}

export async function crearBeneficiario(req, res) {
  const d = req.body;
  if (!d.nombre || !d.tipoDocumento || !d.numeroDocumento) {
    return res.status(400).json({
      error: 'Nombre, tipo y número de documento son requeridos.'
    });
  }

  await prisma.sociedad.findUniqueOrThrow({ where: { id: req.params.id } });

  const b = await prisma.beneficiarioFinal.create({
    data: {
      sociedadId:        req.params.id,
      nombre:            d.nombre.trim(),
      tipoDocumento:     d.tipoDocumento,
      numeroDocumento:   d.numeroDocumento.trim(),
      nacionalidad:      d.nacionalidad      || null,
      fechaNacimiento:   d.fechaNacimiento   ? new Date(d.fechaNacimiento) : null,
      domicilio:         d.domicilio         || null,
      porcentajeControl: d.porcentajeControl ? Number(d.porcentajeControl) : null,
      tipoControl:       d.tipoControl       || 'DIRECTO',
      esPEP:             Boolean(d.esPEP),
      cargoPublico:      d.cargoPublico      || null,
      fechaDeclaracion:  d.fechaDeclaracion  ? new Date(d.fechaDeclaracion) : new Date(),
      fechaActualizacion: new Date(),
      verificado:        false,
      notas:             d.notas            || null,
    }
  });
  res.status(201).json(b);
}

export async function actualizarBeneficiario(req, res) {
  const d = req.body;
  const b = await prisma.beneficiarioFinal.update({
    where: { id: req.params.bId },
    data: {
      ...(d.nombre             && { nombre:            d.nombre.trim() }),
      ...(d.tipoDocumento      && { tipoDocumento:      d.tipoDocumento }),
      ...(d.numeroDocumento    && { numeroDocumento:    d.numeroDocumento.trim() }),
      ...(d.nacionalidad  !== undefined && { nacionalidad:  d.nacionalidad  || null }),
      ...(d.fechaNacimiento    && { fechaNacimiento:    new Date(d.fechaNacimiento) }),
      ...(d.domicilio     !== undefined && { domicilio:     d.domicilio     || null }),
      ...(d.porcentajeControl !== undefined && {
        porcentajeControl: d.porcentajeControl ? Number(d.porcentajeControl) : null
      }),
      ...(d.tipoControl        && { tipoControl:        d.tipoControl }),
      ...(d.esPEP         !== undefined && { esPEP:         Boolean(d.esPEP) }),
      ...(d.cargoPublico  !== undefined && { cargoPublico:  d.cargoPublico  || null }),
      ...(d.fechaDeclaracion   && { fechaDeclaracion:   new Date(d.fechaDeclaracion) }),
      ...(d.verificado    !== undefined && { verificado:    Boolean(d.verificado) }),
      ...(d.notas         !== undefined && { notas:         d.notas        || null }),
      fechaActualizacion: new Date(), // siempre actualiza la fecha al editar
    }
  });
  res.json(b);
}

export async function eliminarBeneficiario(req, res) {
  await prisma.beneficiarioFinal.delete({ where: { id: req.params.bId } });
  res.status(204).send();
}

// ─── CARGA DE DOCUMENTO DE IDENTIDAD ─────────────────────────────────────────

export async function cargarDocumentoIdentidad(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  }

  const rutaRelativa = `identidades/${req.file.filename}`;
  const b = await prisma.beneficiarioFinal.update({
    where: { id: req.params.bId },
    data: {
      documentoIdentidad: rutaRelativa,
      fechaActualizacion: new Date(),
    }
  });

  res.json({
    mensaje: 'Documento cargado correctamente.',
    archivo: rutaRelativa,
    beneficiario: b,
  });
}

// ─── ALERTAS Y ESTADÍSTICAS ───────────────────────────────────────────────────

export async function alertasBeneficiarios(req, res) {
  const hace1Anio = addDays(new Date(), -365);

  const [desactualizados, sinDocumento, sinVerificar, conPEP] = await Promise.all([
    prisma.beneficiarioFinal.findMany({
      where: {
        OR: [
          { fechaActualizacion: null },
          { fechaActualizacion: { lt: hace1Anio } },
        ]
      },
      include: { sociedad: { select: { id: true, nombre: true } } },
      orderBy: { fechaActualizacion: 'asc' },
    }),
    prisma.beneficiarioFinal.count({ where: { documentoIdentidad: null } }),
    prisma.beneficiarioFinal.count({ where: { verificado: false } }),
    prisma.beneficiarioFinal.findMany({
      where: { esPEP: true },
      include: { sociedad: { select: { id: true, nombre: true } } },
    }),
  ]);

  res.json({
    desactualizados,
    totales: {
      sinActualizar: desactualizados.length,
      sinDocumento,
      sinVerificar,
      conPEP: conPEP.length,
    },
    pepIdentificados: conPEP,
  });
}

// ─── EXPORTADORES ─────────────────────────────────────────────────────────────

async function obtenerDatosExport(sociedadId) {
  const [sociedad, beneficiarios] = await Promise.all([
    prisma.sociedad.findUniqueOrThrow({ where: { id: sociedadId } }),
    prisma.beneficiarioFinal.findMany({
      where: { sociedadId },
      orderBy: { porcentajeControl: 'desc' },
    }),
  ]);
  return { sociedad, beneficiarios };
}

export async function exportarPDF(req, res) {
  const { sociedad, beneficiarios } = await obtenerDatosExport(req.params.id);
  const html = htmlDeclaracionBeneficiarios({ sociedad, beneficiarios });
  const pdf  = await htmlAPDF(html);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="Beneficiarios-${sociedad.nombre.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
  });
  res.send(pdf);
}

export async function exportarWord(req, res) {
  const { sociedad, beneficiarios } = await obtenerDatosExport(req.params.id);
  const buffer = await docxDeclaracionBeneficiarios({ sociedad, beneficiarios });

  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': `attachment; filename="Beneficiarios-${sociedad.nombre.replace(/[^a-z0-9]/gi, '_')}.docx"`,
  });
  res.send(buffer);
}

// ─── PORTAL DEL CLIENTE — AUTODECLARACIÓN ────────────────────────────────────

export async function portalListarBeneficiarios(req, res) {
  const beneficiarios = await prisma.beneficiarioFinal.findMany({
    where: { sociedadId: req.portal.sociedadId },
    orderBy: { porcentajeControl: 'desc' },
    select: {
      id: true, nombre: true, tipoDocumento: true, numeroDocumento: true,
      nacionalidad: true, porcentajeControl: true, tipoControl: true,
      esPEP: true, fechaDeclaracion: true, fechaActualizacion: true,
      documentoIdentidad: true, verificado: true,
    },
  });

  const hace1Anio = addDays(new Date(), -365);
  const conAlerta = beneficiarios.map(b => ({
    ...b,
    actualizacionVencida: !b.fechaActualizacion || b.fechaActualizacion < hace1Anio,
  }));

  res.json(conAlerta);
}

export async function portalDeclararBeneficiario(req, res) {
  const d = req.body;
  if (!d.nombre || !d.tipoDocumento || !d.numeroDocumento) {
    return res.status(400).json({
      error: 'Nombre, tipo y número de documento son requeridos.'
    });
  }
  if (d.porcentajeControl && Number(d.porcentajeControl) < 25) {
    return res.status(400).json({
      error: 'El porcentaje de control debe ser igual o mayor al 25% para ser considerado beneficiario final (Ley 52 de 2016).'
    });
  }

  const b = await prisma.beneficiarioFinal.create({
    data: {
      sociedadId:        req.portal.sociedadId,
      nombre:            d.nombre.trim(),
      tipoDocumento:     d.tipoDocumento,
      numeroDocumento:   d.numeroDocumento.trim(),
      nacionalidad:      d.nacionalidad      || null,
      fechaNacimiento:   d.fechaNacimiento   ? new Date(d.fechaNacimiento) : null,
      domicilio:         d.domicilio         || null,
      porcentajeControl: d.porcentajeControl ? Number(d.porcentajeControl) : null,
      tipoControl:       d.tipoControl       || 'DIRECTO',
      esPEP:             Boolean(d.esPEP),
      cargoPublico:      d.cargoPublico      || null,
      fechaDeclaracion:  new Date(),
      fechaActualizacion: new Date(),
      verificado:        false,
    }
  });
  res.status(201).json(b);
}

export async function portalActualizarBeneficiario(req, res) {
  const d = req.body;

  // Verificar que el beneficiario pertenece a la sociedad del portal
  const existente = await prisma.beneficiarioFinal.findUniqueOrThrow({
    where: { id: req.params.bId }
  });
  if (existente.sociedadId !== req.portal.sociedadId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  if (d.porcentajeControl && Number(d.porcentajeControl) < 25) {
    return res.status(400).json({
      error: 'El porcentaje de control debe ser igual o mayor al 25% (Ley 52 de 2016).'
    });
  }

  const b = await prisma.beneficiarioFinal.update({
    where: { id: req.params.bId },
    data: {
      ...(d.nombre             && { nombre:            d.nombre.trim() }),
      ...(d.tipoDocumento      && { tipoDocumento:      d.tipoDocumento }),
      ...(d.numeroDocumento    && { numeroDocumento:    d.numeroDocumento.trim() }),
      ...(d.nacionalidad  !== undefined && { nacionalidad:  d.nacionalidad  || null }),
      ...(d.fechaNacimiento    && { fechaNacimiento:    new Date(d.fechaNacimiento) }),
      ...(d.domicilio     !== undefined && { domicilio:     d.domicilio     || null }),
      ...(d.porcentajeControl !== undefined && {
        porcentajeControl: d.porcentajeControl ? Number(d.porcentajeControl) : null
      }),
      ...(d.tipoControl        && { tipoControl:        d.tipoControl }),
      ...(d.esPEP         !== undefined && { esPEP:         Boolean(d.esPEP) }),
      ...(d.cargoPublico  !== undefined && { cargoPublico:  d.cargoPublico  || null }),
      fechaDeclaracion:  new Date(),
      fechaActualizacion: new Date(),
      verificado:        false, // requiere re-verificación por el agente tras cada actualización
    }
  });
  res.json(b);
}

export async function portalCargarDocumento(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  }

  const existente = await prisma.beneficiarioFinal.findUniqueOrThrow({
    where: { id: req.params.bId }
  });
  if (existente.sociedadId !== req.portal.sociedadId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  const rutaRelativa = `identidades/${req.file.filename}`;
  const b = await prisma.beneficiarioFinal.update({
    where: { id: req.params.bId },
    data: { documentoIdentidad: rutaRelativa, fechaActualizacion: new Date() }
  });

  res.json({ mensaje: 'Documento cargado correctamente.', archivo: rutaRelativa });
}
