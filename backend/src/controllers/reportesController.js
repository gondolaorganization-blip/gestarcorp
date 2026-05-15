import prisma from '../utils/prisma.js';
import { htmlAPDF } from '../utils/generadorPDF.js';
import { addDays } from 'date-fns';

// PDF templates
import { htmlFichaSociedad }       from '../templates/pdf/reportes/fichaSociedad.js';
import { htmlReporteCartera }      from '../templates/pdf/reportes/cartera.js';
import { htmlReporteCumplimiento } from '../templates/pdf/reportes/cumplimientoFiscal.js';
import { htmlHistorialConsultas }  from '../templates/pdf/reportes/historialConsultas.js';

// DOCX templates
import { docxFichaSociedad }       from '../templates/docx/reportes/fichaSociedad.js';
import { docxReporteCartera }      from '../templates/docx/reportes/cartera.js';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function nombreArchivo(tipo, nombre) {
  const slug  = (nombre || tipo).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
  const fecha = new Date().toISOString().slice(0, 10);
  return `${tipo}_${slug}_${fecha}`;
}

async function cargarSociedadCompleta(id) {
  const hoy       = new Date();
  const hace1Anio = addDays(hoy, -365);

  const [sociedad, directores, accionistas, beneficiarios, obligaciones, actas, documentos] =
    await Promise.all([
      prisma.sociedad.findUniqueOrThrow({ where: { id } }),
      prisma.director.findMany({ where: { sociedadId: id, activo: true }, orderBy: { cargo: 'asc' } }),
      prisma.accionista.findMany({ where: { sociedadId: id, activo: true }, orderBy: { porcentaje: 'desc' } }),
      prisma.beneficiarioFinal.findMany({ where: { sociedadId: id }, orderBy: { porcentajeControl: 'desc' } }),
      prisma.obligacionFiscal.findMany({ where: { sociedadId: id }, orderBy: [{ anio: 'desc' }, { fechaVence: 'asc' }] }),
      prisma.acta.findMany({ where: { sociedadId: id }, orderBy: { fecha: 'desc' }, take: 10 }),
      prisma.documentoSocietario.findMany({ where: { sociedadId: id }, orderBy: { creadoEn: 'desc' }, take: 10 }),
    ]);

  return { sociedad, directores, accionistas, beneficiarios, obligaciones, actas, documentos };
}

// ─── REPORTE: FICHA COMPLETA DE SOCIEDAD ─────────────────────────────────────

export async function fichaSociedadPDF(req, res) {
  const datos = await cargarSociedadCompleta(req.params.id);
  const agenteNombre = req.user?.nombre || 'Agente Residente';

  const html = htmlFichaSociedad({ ...datos, agenteNombre });
  const pdf  = await htmlAPDF(html);

  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${nombreArchivo('ficha', datos.sociedad.nombre)}.pdf"`);
  res.send(pdf);
}

export async function fichaSociedadDocx(req, res) {
  const datos = await cargarSociedadCompleta(req.params.id);
  const agenteNombre = req.user?.nombre || 'Agente Residente';

  const buffer = await docxFichaSociedad({ ...datos, agenteNombre });

  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.set('Content-Disposition', `attachment; filename="${nombreArchivo('ficha', datos.sociedad.nombre)}.docx"`);
  res.send(buffer);
}

// ─── REPORTE: CARTERA COMPLETA ────────────────────────────────────────────────

async function cargarCartera() {
  const hoy       = new Date();
  const hace1Anio = addDays(hoy, -365);

  const sociedades = await prisma.sociedad.findMany({
    orderBy: { nombre: 'asc' },
  });

  const [obligPorSoc, benefPorSoc] = await Promise.all([
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

  const oblMap  = Object.fromEntries(obligPorSoc.map(o => [o.sociedadId, o._count.id]));
  const benMap  = Object.fromEntries(benefPorSoc.map(b => [b.sociedadId, b._count.id]));

  return sociedades.map(s => {
    const oblVencidas   = oblMap[s.id]  || 0;
    const benefSinVerif = benMap[s.id]  || 0;
    const diasVenc = s.fechaVencimiento
      ? Math.ceil((new Date(s.fechaVencimiento) - hoy) / 86400000)
      : null;

    let score = 100;
    if (oblVencidas > 0)                              score -= Math.min(oblVencidas * 10, 30);
    if (benefSinVerif > 0)                            score -= Math.min(benefSinVerif * 5, 20);
    if (diasVenc !== null && diasVenc <= 30)          score -= 20;
    if (diasVenc !== null && diasVenc < 0)            score -= 30;

    return { ...s, _oblVencidas: oblVencidas, _benefSinVerif: benefSinVerif, healthScore: Math.max(0, score) };
  }).sort((a, b) => a.healthScore - b.healthScore);
}

export async function carteraPDF(req, res) {
  const sociedades   = await cargarCartera();
  const agenteNombre = req.user?.nombre || 'Agente Residente';

  const html = htmlReporteCartera({ sociedades, agenteNombre });
  const pdf  = await htmlAPDF(html);

  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${nombreArchivo('cartera', agenteNombre)}.pdf"`);
  res.send(pdf);
}

export async function carteraDocx(req, res) {
  const sociedades   = await cargarCartera();
  const agenteNombre = req.user?.nombre || 'Agente Residente';

  const buffer = await docxReporteCartera({ sociedades, agenteNombre });

  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.set('Content-Disposition', `attachment; filename="${nombreArchivo('cartera', agenteNombre)}.docx"`);
  res.send(buffer);
}

// ─── REPORTE: CUMPLIMIENTO FISCAL ────────────────────────────────────────────

export async function cumplimientoFiscalPDF(req, res) {
  const anio = Number(req.query.anio || new Date().getFullYear());
  const { id } = req.params; // opcional: si viene, solo para esa sociedad

  const where = { anio };
  if (id) where.sociedadId = id;

  const obligaciones = await prisma.obligacionFiscal.findMany({
    where,
    include: { sociedad: { select: { id: true, nombre: true, ficha: true } } },
    orderBy: [{ sociedad: { nombre: 'asc' } }, { fechaVence: 'asc' }],
  });

  const agenteNombre = req.user?.nombre || 'Agente Residente';
  const html  = htmlReporteCumplimiento({ obligaciones, anio, agenteNombre });
  const pdf   = await htmlAPDF(html);

  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${nombreArchivo('cumplimiento', String(anio))}.pdf"`);
  res.send(pdf);
}

// ─── REPORTE: HISTORIAL DE CONSULTAS ─────────────────────────────────────────

export async function historialConsultasPDF(req, res) {
  const { id } = req.params; // opcional: si viene, solo para esa sociedad
  const { desde, hasta, estado } = req.query;

  const where = {};
  if (id) where.sociedadId = id;
  if (estado) where.estado = estado;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta);
  }

  const consultas = await prisma.consulta.findMany({
    where,
    include: { sociedad: { select: { id: true, nombre: true } } },
    orderBy: { fecha: 'desc' },
    take: 200,
  });

  const sociedad = id
    ? await prisma.sociedad.findUnique({ where: { id }, select: { nombre: true } })
    : null;

  const periodo = desde && hasta
    ? `${desde} al ${hasta}`
    : desde
      ? `Desde ${desde}`
      : hasta
        ? `Hasta ${hasta}`
        : 'Período completo';

  const agenteNombre = req.user?.nombre || 'Agente Residente';
  const html  = htmlHistorialConsultas({ consultas, sociedad, agenteNombre, periodo });
  const pdf   = await htmlAPDF(html);

  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${nombreArchivo('consultas', sociedad?.nombre || agenteNombre)}.pdf"`);
  res.send(pdf);
}
