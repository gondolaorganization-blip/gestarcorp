import prisma from '../utils/prisma.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listarPlantillas(req, res) {
  const plantillas = await prisma.plantilla.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(plantillas);
}

export async function obtenerPlantilla(req, res) {
  const p = await prisma.plantilla.findUniqueOrThrow({ where: { id: req.params.id } });
  res.json(p);
}

export async function crearPlantilla(req, res) {
  const { nombre, descripcion, contenido } = req.body;
  if (!nombre?.trim() || !contenido?.trim())
    return res.status(400).json({ error: 'Nombre y contenido son requeridos.' });
  const p = await prisma.plantilla.create({ data: { nombre: nombre.trim(), descripcion: descripcion?.trim() || null, contenido } });
  res.status(201).json(p);
}

export async function actualizarPlantilla(req, res) {
  const { nombre, descripcion, contenido, activo } = req.body;
  const data = {};
  if (nombre !== undefined)      data.nombre      = nombre.trim();
  if (descripcion !== undefined) data.descripcion = descripcion?.trim() || null;
  if (contenido !== undefined)   data.contenido   = contenido;
  if (activo !== undefined)      data.activo      = Boolean(activo);
  const p = await prisma.plantilla.update({ where: { id: req.params.id }, data });
  res.json(p);
}

export async function eliminarPlantilla(req, res) {
  await prisma.plantilla.update({ where: { id: req.params.id }, data: { activo: false } });
  res.status(204).send();
}

// ─── GENERACIÓN DOCX ──────────────────────────────────────────────────────────

export async function generarDesadePlantilla(req, res) {
  const { plantillaId, sociedadId } = req.body;
  if (!plantillaId || !sociedadId)
    return res.status(400).json({ error: 'plantillaId y sociedadId son requeridos.' });

  const [plantilla, sociedad] = await Promise.all([
    prisma.plantilla.findUniqueOrThrow({ where: { id: plantillaId } }),
    prisma.sociedad.findUniqueOrThrow({
      where: { id: sociedadId },
      include: {
        directores: { where: { activo: true } },
        accionistas: { where: { activo: true } },
        agente: true,
      },
    }),
  ]);

  const fechaHoy = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });
  const presidente = sociedad.directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = sociedad.directores.find(d => d.cargo === 'SECRETARIO');
  const tesorero   = sociedad.directores.find(d => d.cargo === 'TESORERO');

  const fmtDoc = (d) => d
    ? `${d.nombre}, ${d.tipoDocumento} ${d.numeroDocumento}${d.domicilio ? ', con domicilio en ' + d.domicilio : ''}`
    : '___________';

  const listaDirectores = sociedad.directores
    .map(d => `${d.nombre} — ${d.cargo.replace(/_/g, ' ')}`)
    .join('\n');

  const listaDirectoresCompleto = sociedad.directores
    .map(d => `${d.nombre}, ${d.tipoDocumento} Nº ${d.numeroDocumento}${d.domicilio ? ', domiciliado en ' + d.domicilio : ''} — ${d.cargo.replace(/_/g, ' ')}`)
    .join('\n');

  const listaAccionistas = sociedad.accionistas
    .map(a => `${a.nombre} — ${Number(a.porcentaje || 0).toFixed(2)}% (${a.cantidadAcciones} acciones)`)
    .join('\n');

  const vars = {
    '{{nombre_sociedad}}':       sociedad.nombre,
    '{{ficha}}':                 sociedad.ficha        || '___________',
    '{{tomo}}':                  sociedad.tomo         || '___________',
    '{{folio}}':                 sociedad.folio        || '___________',
    '{{fecha_constitucion}}':    sociedad.fechaConstitucion
                                   ? format(new Date(sociedad.fechaConstitucion), "d 'de' MMMM 'de' yyyy", { locale: es })
                                   : '___________',
    '{{fecha_hoy}}':             fechaHoy,
    '{{capital}}':               sociedad.capital ? `USD ${Number(sociedad.capital).toLocaleString('es-PA', { minimumFractionDigits: 2 })}` : '___________',
    '{{domicilio}}':             sociedad.domicilio    || '___________',
    '{{duracion}}':              sociedad.duracion     || 'Perpetua',
    '{{directores}}':            listaDirectores       || '___________',
    '{{directores_completo}}':   listaDirectoresCompleto || '___________',
    '{{accionistas}}':           listaAccionistas      || '___________',
    // Presidente
    '{{presidente}}':            presidente?.nombre         || '___________',
    '{{presidente_tipo_doc}}':   presidente?.tipoDocumento  || '___________',
    '{{presidente_num_doc}}':    presidente?.numeroDocumento || '___________',
    '{{presidente_domicilio}}':  presidente?.domicilio      || '___________',
    '{{presidente_completo}}':   fmtDoc(presidente),
    // Secretario
    '{{secretario}}':            secretario?.nombre         || '___________',
    '{{secretario_tipo_doc}}':   secretario?.tipoDocumento  || '___________',
    '{{secretario_num_doc}}':    secretario?.numeroDocumento || '___________',
    '{{secretario_domicilio}}':  secretario?.domicilio      || '___________',
    '{{secretario_completo}}':   fmtDoc(secretario),
    // Tesorero
    '{{tesorero}}':              tesorero?.nombre           || '___________',
    '{{tesorero_tipo_doc}}':     tesorero?.tipoDocumento    || '___________',
    '{{tesorero_num_doc}}':      tesorero?.numeroDocumento  || '___________',
    '{{tesorero_domicilio}}':    tesorero?.domicilio        || '___________',
    '{{tesorero_completo}}':     fmtDoc(tesorero),
    // Agente
    '{{agente_nombre}}':         sociedad.agente?.nombre    || '___________',
    '{{agente_email}}':          sociedad.agente?.email     || '___________',
  };

  let texto = plantilla.contenido;
  for (const [variable, valor] of Object.entries(vars)) {
    texto = texto.replaceAll(variable, valor);
  }

  const parrafos = texto.split('\n').map(linea =>
    new Paragraph({
      children: [new TextRun({ text: linea, size: 24, font: 'Times New Roman' })],
      spacing: { after: linea.trim() === '' ? 0 : 200 },
      alignment: AlignmentType.JUSTIFIED,
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 } },
      },
      children: parrafos,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const nombreArchivo = `${plantilla.nombre.replace(/\s+/g, '_')}_${sociedad.nombre.replace(/\s+/g, '_')}.docx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  res.send(buffer);
}
