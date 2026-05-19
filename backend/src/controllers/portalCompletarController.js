/**
 * Endpoints del portal cliente para que el cliente complete información
 * de su sociedad sin necesidad de contactar al agente.
 *
 * El cliente puede actualizar: datos de contacto de la sociedad, actividad
 * principal, datos complementarios de directores/accionistas (profesión,
 * domicilio — no datos legales como nombre o documento), y subir documentos.
 */

import prisma from '../utils/prisma.js';
import { uploadDiligencia, handleUpload } from '../middleware/upload.js';

// ─── Datos de contacto y operación de la sociedad ─────────────────────────

export async function completarDatosSociedad(req, res) {
  const { email, telefono, domicilio, actividadPrincipal, jurisdiccion } = req.body;

  const soc = await prisma.sociedad.update({
    where: { id: req.portal.sociedadId },
    data: {
      ...(email              !== undefined && { email }),
      ...(telefono           !== undefined && { telefono }),
      ...(domicilio          !== undefined && { domicilio }),
      ...(actividadPrincipal !== undefined && { actividadPrincipal }),
      ...(jurisdiccion       !== undefined && { jurisdiccion }),
    },
    select: { id: true, email: true, telefono: true, domicilio: true, actividadPrincipal: true, jurisdiccion: true },
  });

  res.json(soc);
}

// ─── Datos complementarios de un director ────────────────────────────────

export async function completarDirector(req, res) {
  const { id } = req.params;
  const { profesion, domicilio, email, telefono } = req.body;

  // Verificar que el director pertenece a la sociedad del portal
  const director = await prisma.director.findFirst({
    where: { id, sociedadId: req.portal.sociedadId, activo: true },
  });
  if (!director) return res.status(404).json({ error: 'Director no encontrado.' });

  const updated = await prisma.director.update({
    where: { id },
    data: {
      ...(profesion !== undefined && { profesion }),
      ...(domicilio !== undefined && { domicilio }),
      ...(email     !== undefined && { email }),
      ...(telefono  !== undefined && { telefono }),
    },
    select: { id: true, nombre: true, profesion: true, domicilio: true, email: true, telefono: true },
  });

  res.json(updated);
}

// ─── Datos complementarios de un accionista ───────────────────────────────

export async function completarAccionista(req, res) {
  const { id } = req.params;
  const { profesion, domicilio, email, telefono, porcentaje } = req.body;

  const accionista = await prisma.accionista.findFirst({
    where: { id, sociedadId: req.portal.sociedadId, activo: true },
  });
  if (!accionista) return res.status(404).json({ error: 'Accionista no encontrado.' });

  const updated = await prisma.accionista.update({
    where: { id },
    data: {
      ...(profesion  !== undefined && { profesion }),
      ...(domicilio  !== undefined && { domicilio }),
      ...(email      !== undefined && { email }),
      ...(telefono   !== undefined && { telefono }),
      ...(porcentaje !== undefined && { porcentaje: parseFloat(porcentaje) }),
    },
    select: { id: true, nombre: true, profesion: true, domicilio: true, email: true, telefono: true, porcentaje: true },
  });

  res.json(updated);
}

// ─── Subida de documentos por el cliente ─────────────────────────────────

export async function subirDocumentoPortal(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Se requiere un archivo.' });

  const { tipo, entidadTipo, entidadId, entidadNombre } = req.body;

  const tiposPermitidos = ['CEDULA_PASAPORTE', 'COMPROBANTE_DOMICILIO', 'REFERENCIA_BANCARIA', 'OTRO'];
  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de documento no válido.' });
  }

  const entidadesPermitidas = ['SOCIEDAD', 'DIRECTOR', 'ACCIONISTA', 'BENEFICIARIO'];
  if (!entidadesPermitidas.includes(entidadTipo)) {
    return res.status(400).json({ error: 'Tipo de entidad no válido.' });
  }

  // Verificar que la entidad pertenece a esta sociedad
  if (entidadId && entidadTipo !== 'SOCIEDAD') {
    const modelo = { DIRECTOR: 'director', ACCIONISTA: 'accionista', BENEFICIARIO: 'beneficiarioFinal' };
    const rec = await prisma[modelo[entidadTipo]]?.findFirst({
      where: { id: entidadId, sociedadId: req.portal.sociedadId },
    });
    if (!rec) return res.status(404).json({ error: 'Entidad no encontrada.' });
  }

  const doc = await prisma.documentoDiligencia.create({
    data: {
      sociedadId:   req.portal.sociedadId,
      tipo,
      entidadTipo,
      entidadId:    entidadId || null,
      entidadNombre: entidadNombre || '',
      archivo:      req.file.path,
      nombreArchivo: req.file.originalname,
      tamanio:      req.file.size,
    },
  });

  res.status(201).json(doc);
}

export const uploadDocPortal = uploadDiligencia;
