import prisma from '../utils/prisma.js';
import { htmlAPDF, formatearFecha, formatearMoneda } from '../utils/generadorPDF.js';
import { generarDocxBuffer, bold, normal, italic, parrafo, centrado, tablaSimple } from '../utils/generadorWord.js';
import { estilosLegales } from '../utils/generadorPDF.js';
import { AlignmentType } from 'docx';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function recalcularYRegistrarHistorial(sociedadId, usuarioNombre = 'Sistema') {
  const activos = await prisma.accionista.findMany({
    where: { sociedadId, activo: true },
    select: { id: true, cantidadAcciones: true, porcentaje: true }
  });

  const total = activos.reduce((s, a) => s + a.cantidadAcciones, 0);
  if (total === 0) return;

  await Promise.all(activos.map(a => {
    const nuevoPct = Number(((a.cantidadAcciones / total) * 100).toFixed(4));
    return prisma.accionista.update({
      where: { id: a.id },
      data: { porcentaje: nuevoPct }
    });
  }));

  await prisma.sociedad.update({
    where: { id: sociedadId },
    data: { cantidadAcciones: total }
  });
}

async function registrarMovimiento(accionistaId, tipoMovimiento, anterior, nueva, pctAnterior, pctNueva, motivo, registradoPor) {
  const accionista = await prisma.accionista.findUnique({
    where: { id: accionistaId }, select: { sociedadId: true }
  });
  await prisma.historialAccionista.create({
    data: {
      accionistaId,
      sociedadId:               accionista.sociedadId,
      tipoMovimiento,
      cantidadAccionesAnterior: anterior,
      cantidadAccionesNueva:    nueva,
      porcentajeAnterior:       pctAnterior ?? null,
      porcentajeNueva:          pctNueva    ?? null,
      motivo:                   motivo      || null,
      registradoPor:            registradoPor || null,
      fecha:                    new Date(),
    }
  });
}

// ─── CRUD ACCIONISTAS ─────────────────────────────────────────────────────────

export async function listarAccionistas(req, res) {
  const { soloActivos = 'true', fecha } = req.query;

  // Si se pide fecha específica, reconstruimos el estado histórico
  if (fecha) {
    const fechaCorte = new Date(fecha);
    const historial = await prisma.historialAccionista.findMany({
      where: { sociedadId: req.params.id, fecha: { lte: fechaCorte } },
      include: { accionista: true },
      orderBy: { fecha: 'asc' },
    });

    // Reconstruir estado en esa fecha
    const estadoMap = new Map();
    for (const h of historial) {
      estadoMap.set(h.accionistaId, {
        ...h.accionista,
        cantidadAcciones: h.cantidadAccionesNueva,
        porcentaje:       h.porcentajeNueva,
        activo:           h.tipoMovimiento !== 'SALIDA',
        _fuenteHistorial: true,
        _fechaMovimiento: h.fecha,
      });
    }

    return res.json({
      accionistas: [...estadoMap.values()].filter(a => a.activo),
      fechaCorte,
      esHistorico: true,
    });
  }

  const where = { sociedadId: req.params.id };
  if (soloActivos === 'true') where.activo = true;

  const accionistas = await prisma.accionista.findMany({
    where,
    orderBy: [{ activo: 'desc' }, { porcentaje: 'desc' }, { nombre: 'asc' }],
  });
  res.json({ accionistas, esHistorico: false });
}

export async function obtenerAccionista(req, res) {
  const accionista = await prisma.accionista.findUniqueOrThrow({
    where: { id: req.params.acId },
    include: {
      historial: { orderBy: { fecha: 'desc' } }
    }
  });
  res.json(accionista);
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
      email:            d.email           || null,
      telefono:         d.telefono        || null,
      domicilio:        d.domicilio       || null,
      cantidadAcciones: d.cantidadAcciones ? Number(d.cantidadAcciones) : 0,
      porcentaje:       null,
      fechaIngreso:     d.fechaIngreso ? new Date(d.fechaIngreso) : new Date(),
      activo:           true,
      notas:            d.notas || null,
    }
  });

  await recalcularYRegistrarHistorial(req.params.id);

  const actualizado = await prisma.accionista.findUnique({ where: { id: accionista.id } });

  await registrarMovimiento(
    accionista.id, 'INGRESO',
    0, accionista.cantidadAcciones,
    null, Number(actualizado.porcentaje),
    d.motivo || 'Ingreso inicial',
    req.user?.nombre
  );

  res.status(201).json(actualizado);
}

export async function actualizarAccionista(req, res) {
  const d = req.body;

  const anterior = await prisma.accionista.findUniqueOrThrow({
    where: { id: req.params.acId }
  });

  await prisma.accionista.update({
    where: { id: req.params.acId },
    data: {
      ...(d.nombre            && { nombre:          d.nombre.trim() }),
      ...(d.tipoDocumento     && { tipoDocumento:    d.tipoDocumento }),
      ...(d.numeroDocumento   && { numeroDocumento:  d.numeroDocumento.trim() }),
      ...(d.nacionalidad !== undefined && { nacionalidad: d.nacionalidad || null }),
      ...(d.email        !== undefined && { email:        d.email        || null }),
      ...(d.telefono     !== undefined && { telefono:     d.telefono     || null }),
      ...(d.domicilio    !== undefined && { domicilio:    d.domicilio    || null }),
      ...(d.cantidadAcciones !== undefined && {
        cantidadAcciones: Number(d.cantidadAcciones) || 0
      }),
      ...(d.fechaIngreso && { fechaIngreso: new Date(d.fechaIngreso) }),
      ...(d.activo !== undefined && { activo: Boolean(d.activo) }),
      ...(d.notas !== undefined  && { notas:  d.notas || null }),
    }
  });

  await recalcularYRegistrarHistorial(anterior.sociedadId);

  const actualizado = await prisma.accionista.findUnique({ where: { id: req.params.acId } });

  // Registrar en historial solo si cambian las acciones
  if (d.cantidadAcciones !== undefined && Number(d.cantidadAcciones) !== anterior.cantidadAcciones) {
    const tipo = Number(d.cantidadAcciones) === 0 ? 'SALIDA'
      : Number(d.cantidadAcciones) > anterior.cantidadAcciones ? 'AUMENTO'
      : 'REDUCCION';

    await registrarMovimiento(
      req.params.acId, tipo,
      anterior.cantidadAcciones, Number(d.cantidadAcciones),
      Number(anterior.porcentaje), Number(actualizado.porcentaje),
      d.motivo || null,
      req.user?.nombre
    );
  }

  res.json(actualizado);
}

export async function eliminarAccionista(req, res) {
  const accionista = await prisma.accionista.findUniqueOrThrow({
    where: { id: req.params.acId }
  });

  await prisma.accionista.update({
    where: { id: req.params.acId },
    data: { activo: false, cantidadAcciones: 0 }
  });

  await recalcularYRegistrarHistorial(accionista.sociedadId);

  await registrarMovimiento(
    req.params.acId, 'SALIDA',
    accionista.cantidadAcciones, 0,
    Number(accionista.porcentaje), 0,
    'Baja del registro de accionistas',
    req.user?.nombre
  );

  res.status(204).send();
}

export async function listarHistorial(req, res) {
  const historial = await prisma.historialAccionista.findMany({
    where: { sociedadId: req.params.id },
    include: { accionista: { select: { nombre: true, numeroDocumento: true } } },
    orderBy: { fecha: 'desc' },
  });
  res.json(historial);
}

// ─── EXPORTADORES PDF y WORD ──────────────────────────────────────────────────

function filaTablaAccionista(a, i) {
  return [
    String(i + 1),
    a.nombre,
    `${a.tipoDocumento}: ${a.numeroDocumento}`,
    a.nacionalidad || '—',
    a.cantidadAcciones.toLocaleString('es-PA'),
    `${Number(a.porcentaje ?? 0).toFixed(2)}%`,
    formatearFecha(a.fechaIngreso, 'dd/MM/yyyy'),
  ];
}

export async function exportarPDF(req, res) {
  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: req.params.id }
  });
  const accionistas = await prisma.accionista.findMany({
    where: { sociedadId: req.params.id, activo: true },
    orderBy: { porcentaje: 'desc' },
  });

  const filas = accionistas.map(filaTablaAccionista);
  const totalAcciones = accionistas.reduce((s, a) => s + a.cantidadAcciones, 0);

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .alerta { background:#fffbeb; border:1px solid #f59e0b; padding:10px 14px;
              border-radius:4px; font-size:10pt; margin-bottom:16px; }
  </style></head><body>
  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <h2>Libro de Accionistas</h2>
    <p>Ficha: ${sociedad.ficha || '—'} · Tomo: ${sociedad.tomo || '—'} · Folio: ${sociedad.folio || '—'}</p>
    <p>Generado el ${formatearFecha(new Date())}</p>
  </div>

  <p class="alerta">Este registro corresponde al estado actual del Libro de Accionistas
  conforme a la Ley 32 de 1927 de la República de Panamá.</p>

  <table>
    <thead><tr>
      <th>#</th><th>Nombre</th><th>Documento</th><th>Nacionalidad</th>
      <th>Acciones</th><th>%</th><th>Fecha Ingreso</th>
    </tr></thead>
    <tbody>
      ${filas.map(f => `<tr>${f.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
    </tbody>
    <tfoot><tr>
      <td colspan="4"><strong>TOTALES</strong></td>
      <td><strong>${totalAcciones.toLocaleString('es-PA')}</strong></td>
      <td><strong>100.00%</strong></td>
      <td></td>
    </tr></tfoot>
  </table>

  <div style="margin-top:24px; font-size:11pt;">
    <p><strong>Capital autorizado:</strong> ${formatearMoneda(sociedad.capital)}</p>
    <p><strong>Tipo de acciones:</strong> ${sociedad.tipoAcciones}</p>
    <p><strong>Valor nominal por acción:</strong> ${formatearMoneda(sociedad.valorNominal)}</p>
  </div>

  <div class="firmas">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Secretario</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Agente Residente</div>
      <div class="firma-cargo">Registro certificado</div>
    </div>
  </div>

  <div class="pie-pagina">
    GESTARGOV · Gestión Societaria Panameña · ${formatearFecha(new Date())}
  </div>
  </body></html>`;

  const pdf = await htmlAPDF(html);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="Libro-Accionistas-${sociedad.nombre.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
  });
  res.send(pdf);
}

export async function exportarWord(req, res) {
  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: req.params.id }
  });
  const accionistas = await prisma.accionista.findMany({
    where: { sociedadId: req.params.id, activo: true },
    orderBy: { porcentaje: 'desc' },
  });

  const totalAcciones = accionistas.reduce((s, a) => s + a.cantidadAcciones, 0);
  const filas = accionistas.map((a, i) => [
    String(i + 1),
    a.nombre,
    `${a.tipoDocumento}: ${a.numeroDocumento}`,
    a.nacionalidad || '—',
    a.cantidadAcciones.toLocaleString('es-PA'),
    `${Number(a.porcentaje ?? 0).toFixed(2)}%`,
    formatearFecha(a.fechaIngreso, 'dd/MM/yyyy'),
  ]);
  filas.push(['', 'TOTALES', '', '', totalAcciones.toLocaleString('es-PA'), '100.00%', '']);

  const { Paragraph, TextRun, AlignmentType } = await import('docx');

  const children = [
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([bold('LIBRO DE ACCIONISTAS', 26)]),
    centrado([normal(`Ficha: ${sociedad.ficha || '—'}  ·  Tomo: ${sociedad.tomo || '—'}  ·  Folio: ${sociedad.folio || '—'}`, 20)]),
    centrado([italic(`Generado el ${formatearFecha(new Date())}`, 20)]),
    new Paragraph({ text: '', spacing: { after: 200 } }),

    parrafo([normal(
      'Este registro corresponde al estado actual del Libro de Accionistas conforme ' +
      'a la Ley 32 de 1927 de la República de Panamá.'
    )]),
    new Paragraph({ text: '', spacing: { after: 120 } }),

    tablaSimple(
      ['#', 'Nombre', 'Documento', 'Nacionalidad', 'Acciones', '%', 'Fecha Ingreso'],
      filas
    ),

    new Paragraph({ text: '', spacing: { after: 200 } }),
    parrafo([bold('Capital autorizado: '), normal(formatearMoneda(sociedad.capital))]),
    parrafo([bold('Tipo de acciones: '), normal(sociedad.tipoAcciones || '—')]),
    parrafo([bold('Valor nominal por acción: '), normal(formatearMoneda(sociedad.valorNominal))]),

    new Paragraph({ text: '', spacing: { after: 600 } }),

    new Paragraph({
      children: [bold('_________________________________          _________________________________', 22)],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 80 },
    }),
    new Paragraph({
      children: [normal('         Secretario                                    Agente Residente', 22)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [italic(`         ${sociedad.nombre}`, 20)],
      alignment: AlignmentType.CENTER,
    }),
  ];

  const buffer = await generarDocxBuffer({ children });

  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': `attachment; filename="Libro-Accionistas-${sociedad.nombre.replace(/[^a-z0-9]/gi, '_')}.docx"`,
  });
  res.send(buffer);
}

// ─── PORTAL DEL CLIENTE ───────────────────────────────────────────────────────

export async function portalListarAccionistas(req, res) {
  const accionistas = await prisma.accionista.findMany({
    where: { sociedadId: req.portal.sociedadId, activo: true },
    orderBy: { porcentaje: 'desc' },
    select: {
      id: true, nombre: true, cantidadAcciones: true,
      porcentaje: true, fechaIngreso: true, nacionalidad: true,
    }
  });
  res.json(accionistas);
}
