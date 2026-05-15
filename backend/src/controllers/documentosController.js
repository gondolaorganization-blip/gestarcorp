import prisma from '../utils/prisma.js';
import { htmlAPDF } from '../utils/generadorPDF.js';

// PDF templates
import { htmlCertificadoIncumbencia }    from '../templates/pdf/documentos/certificadoIncumbencia.js';
import { htmlCertificadoBuenaStanding }  from '../templates/pdf/documentos/certificadoBuenaStanding.js';
import { htmlPoderGeneral }              from '../templates/pdf/documentos/poderGeneral.js';
import { htmlPoderEspecial }             from '../templates/pdf/documentos/poderEspecial.js';
import { htmlResolucionAperturaCuenta }  from '../templates/pdf/documentos/resolucionAperturaCuenta.js';
import { htmlPactoSocial }               from '../templates/pdf/documentos/pactoSocial.js';
import { htmlDeclaracionJuradaDirector } from '../templates/pdf/documentos/declaracionJuradaDirector.js';
import { htmlCartaRenunciaDirector }     from '../templates/pdf/documentos/cartaRenunciaDirector.js';
import { htmlAceptacionCargoDirector }   from '../templates/pdf/documentos/aceptacionCargoDirector.js';

// DOCX templates
import { docxCertificadoIncumbencia }    from '../templates/docx/documentos/certificadoIncumbencia.js';
import { docxCertificadoBuenaStanding }  from '../templates/docx/documentos/certificadoBuenaStanding.js';
import { docxPoderGeneral }              from '../templates/docx/documentos/poderGeneral.js';
import { docxPoderEspecial }             from '../templates/docx/documentos/poderEspecial.js';
import { docxResolucionAperturaCuenta }  from '../templates/docx/documentos/resolucionAperturaCuenta.js';
import { docxPactoSocial }               from '../templates/docx/documentos/pactoSocial.js';
import { docxDeclaracionJuradaDirector } from '../templates/docx/documentos/declaracionJuradaDirector.js';
import { docxCartaRenunciaDirector }     from '../templates/docx/documentos/cartaRenunciaDirector.js';
import { docxAceptacionCargoDirector }   from '../templates/docx/documentos/aceptacionCargoDirector.js';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function cargarDatosSociedad(id) {
  const sociedad = await prisma.sociedad.findUniqueOrThrow({ where: { id } });
  const directores = await prisma.director.findMany({
    where: { sociedadId: id, activo: true },
    orderBy: { cargo: 'asc' },
  });
  return { sociedad, directores };
}

function nombreArchivo(tipo, sociedad) {
  const slug = sociedad.nombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
  const fecha = new Date().toISOString().slice(0, 10);
  return `${tipo}_${slug}_${fecha}`;
}

// Mapas: tipo → función generadora
const generadoresPDF = {
  CERTIFICADO_INCUMBENCIA:    htmlCertificadoIncumbencia,
  CERTIFICADO_BUENA_STANDING: htmlCertificadoBuenaStanding,
  PODER_GENERAL:              htmlPoderGeneral,
  PODER_ESPECIAL:             htmlPoderEspecial,
  RESOLUCION_APERTURA_CUENTA: htmlResolucionAperturaCuenta,
  PACTO_SOCIAL:               htmlPactoSocial,
  DECLARACION_JURADA_DIRECTOR: htmlDeclaracionJuradaDirector,
  CARTA_RENUNCIA_DIRECTOR:    htmlCartaRenunciaDirector,
  ACEPTACION_CARGO_DIRECTOR:  htmlAceptacionCargoDirector,
};

const generadoresDocx = {
  CERTIFICADO_INCUMBENCIA:    docxCertificadoIncumbencia,
  CERTIFICADO_BUENA_STANDING: docxCertificadoBuenaStanding,
  PODER_GENERAL:              docxPoderGeneral,
  PODER_ESPECIAL:             docxPoderEspecial,
  RESOLUCION_APERTURA_CUENTA: docxResolucionAperturaCuenta,
  PACTO_SOCIAL:               docxPactoSocial,
  DECLARACION_JURADA_DIRECTOR: docxDeclaracionJuradaDirector,
  CARTA_RENUNCIA_DIRECTOR:    docxCartaRenunciaDirector,
  ACEPTACION_CARGO_DIRECTOR:  docxAceptacionCargoDirector,
};

const nombresLegibles = {
  CERTIFICADO_INCUMBENCIA:     'Certificado de Incumbencia',
  CERTIFICADO_BUENA_STANDING:  'Certificado de Buena Posición',
  PODER_GENERAL:               'Poder General',
  PODER_ESPECIAL:              'Poder Especial',
  RESOLUCION_APERTURA_CUENTA:  'Resolución de Apertura de Cuenta',
  PACTO_SOCIAL:                'Pacto Social',
  DECLARACION_JURADA_DIRECTOR: 'Declaración Jurada de Director',
  CARTA_RENUNCIA_DIRECTOR:     'Carta de Renuncia de Director',
  ACEPTACION_CARGO_DIRECTOR:   'Aceptación de Cargo de Director',
};

// ─── CRUD DOCUMENTOS ─────────────────────────────────────────────────────────

export async function listarDocumentos(req, res) {
  const documentos = await prisma.documentoSocietario.findMany({
    where: { sociedadId: req.params.id },
    orderBy: { creadoEn: 'desc' },
  });
  res.json(documentos);
}

export async function obtenerDocumento(req, res) {
  const doc = await prisma.documentoSocietario.findUniqueOrThrow({
    where: { id: req.params.docId },
  });
  if (doc.sociedadId !== req.params.id) return res.status(403).json({ error: 'Acceso denegado' });
  res.json(doc);
}

export async function actualizarDocumento(req, res) {
  const { estado, notas, fechaVencimiento } = req.body;
  const doc = await prisma.documentoSocietario.update({
    where: { id: req.params.docId },
    data: {
      ...(estado && { estado }),
      ...(notas !== undefined && { notas }),
      ...(fechaVencimiento !== undefined && { fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null }),
    },
  });
  res.json(doc);
}

export async function eliminarDocumento(req, res) {
  await prisma.documentoSocietario.delete({ where: { id: req.params.docId } });
  res.json({ ok: true });
}

// ─── GENERACIÓN DE DOCUMENTOS ────────────────────────────────────────────────

/**
 * POST /sociedades/:id/documentos/generar/pdf
 * Body: { tipo, parametros: { apoderado, propositoEspecifico, banco, director, ... } }
 * Registra el documento en DB y devuelve el PDF.
 */
export async function generarPDF(req, res) {
  const { tipo, parametros = {}, registrar = true } = req.body;

  if (!tipo || !generadoresPDF[tipo]) {
    return res.status(400).json({ error: `Tipo de documento no válido: ${tipo}` });
  }

  const { sociedad, directores } = await cargarDatosSociedad(req.params.id);
  const agenteNombre = req.user?.nombre || 'Agente Residente';

  const html = generadoresPDF[tipo]({ sociedad, directores, agenteNombre, ...parametros });
  const pdf  = await htmlAPDF(html);

  if (registrar) {
    await prisma.documentoSocietario.create({
      data: {
        sociedadId:    req.params.id,
        tipo,
        nombre:        nombresLegibles[tipo] || tipo,
        fechaGenerado: new Date(),
        estado:        'BORRADOR',
        notas:         parametros.notas || null,
      },
    });
  }

  const filename = nombreArchivo(tipo, sociedad);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  res.send(pdf);
}

/**
 * POST /sociedades/:id/documentos/generar/docx
 * Body: { tipo, parametros: { ... } }
 */
export async function generarDocx(req, res) {
  const { tipo, parametros = {}, registrar = true } = req.body;

  if (!tipo || !generadoresDocx[tipo]) {
    return res.status(400).json({ error: `Tipo de documento no válido: ${tipo}` });
  }

  const { sociedad, directores } = await cargarDatosSociedad(req.params.id);
  const agenteNombre = req.user?.nombre || 'Agente Residente';

  const buffer = await generadoresDocx[tipo]({ sociedad, directores, agenteNombre, ...parametros });

  if (registrar) {
    await prisma.documentoSocietario.create({
      data: {
        sociedadId:    req.params.id,
        tipo,
        nombre:        nombresLegibles[tipo] || tipo,
        fechaGenerado: new Date(),
        estado:        'BORRADOR',
        notas:         parametros.notas || null,
      },
    });
  }

  const filename = nombreArchivo(tipo, sociedad);
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.set('Content-Disposition', `attachment; filename="${filename}.docx"`);
  res.send(buffer);
}

/**
 * POST /sociedades/:id/documentos/generar/ambos
 * Genera PDF + Word simultáneamente, guarda un registro, devuelve JSON con info.
 * El cliente hace dos requests separados para descargar cada formato.
 */
export async function generarAmbos(req, res) {
  const { tipo, parametros = {} } = req.body;

  if (!tipo || !generadoresPDF[tipo]) {
    return res.status(400).json({ error: `Tipo de documento no válido: ${tipo}` });
  }

  const { sociedad, directores } = await cargarDatosSociedad(req.params.id);
  const agenteNombre = req.user?.nombre || 'Agente Residente';

  const [pdf, buffer] = await Promise.all([
    htmlAPDF(generadoresPDF[tipo]({ sociedad, directores, agenteNombre, ...parametros })),
    generadoresDocx[tipo]({ sociedad, directores, agenteNombre, ...parametros }),
  ]);

  const doc = await prisma.documentoSocietario.create({
    data: {
      sociedadId:    req.params.id,
      tipo,
      nombre:        nombresLegibles[tipo] || tipo,
      fechaGenerado: new Date(),
      estado:        'BORRADOR',
      notas:         parametros.notas || null,
    },
  });

  const filename = nombreArchivo(tipo, sociedad);

  // Devolvemos el PDF como descarga principal, con el docx codificado en base64 en headers
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  res.set('X-Documento-Id', doc.id);
  res.set('X-Docx-Disponible', 'true');
  res.set('Access-Control-Expose-Headers', 'X-Documento-Id, X-Docx-Disponible');
  res.send(pdf);
}

// ─── TIPOS DISPONIBLES ───────────────────────────────────────────────────────

export async function listarTiposDocumento(_req, res) {
  const tipos = Object.entries(nombresLegibles).map(([tipo, nombre]) => ({
    tipo,
    nombre,
    requiereParametros: ['PODER_GENERAL', 'PODER_ESPECIAL', 'RESOLUCION_APERTURA_CUENTA',
      'DECLARACION_JURADA_DIRECTOR', 'CARTA_RENUNCIA_DIRECTOR', 'ACEPTACION_CARGO_DIRECTOR'].includes(tipo),
  }));
  res.json(tipos);
}
