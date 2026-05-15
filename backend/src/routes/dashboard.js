import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';
import { addDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth, requireAgente);

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────

dashboardRouter.get('/', async (req, res) => {
  const hoy   = new Date();
  const en7   = addDays(hoy, 7);
  const en30  = addDays(hoy, 30);
  const en60  = addDays(hoy, 60);
  const en90  = addDays(hoy, 90);
  const hace1Anio = addDays(hoy, -365);
  const hace48h   = addDays(hoy, -2);

  const [
    // Conteos de sociedades
    totalActivas, totalInactivas, totalDisueltas,
    planMensual, planAnual, planFundador,

    // Vencimientos de suscripción
    suscVencen30, suscVencen60, suscVencen90,
    suscVencidas,

    // Obligaciones fiscales
    obligPendientesUrgentes, obligPendientesTotal, obligVencidas,

    // Consultas
    consultasAbiertas, consultasSinRespuesta48h,

    // Beneficiarios
    beneficiariosDesactualizados, benefSinDocumento, benefSinVerificar, benefPEP,

    // Suscripciones activas (módulo de pagos)
    suscripcionesActivas,

    // Ingresos del mes actual
    ingresosMes,

  ] = await Promise.all([
    prisma.sociedad.count({ where: { estado: 'ACTIVA' } }),
    prisma.sociedad.count({ where: { estado: 'INACTIVA' } }),
    prisma.sociedad.count({ where: { estado: 'DISUELTA' } }),
    prisma.sociedad.count({ where: { planCliente: 'MENSUAL', estado: 'ACTIVA' } }),
    prisma.sociedad.count({ where: { planCliente: 'ANUAL',   estado: 'ACTIVA' } }),
    prisma.sociedad.count({ where: { planCliente: 'FUNDADOR',estado: 'ACTIVA' } }),

    prisma.sociedad.count({ where: { estado: 'ACTIVA', fechaVencimiento: { gte: hoy, lte: en30 } } }),
    prisma.sociedad.count({ where: { estado: 'ACTIVA', fechaVencimiento: { gte: hoy, lte: en60 } } }),
    prisma.sociedad.count({ where: { estado: 'ACTIVA', fechaVencimiento: { gte: hoy, lte: en90 } } }),
    prisma.sociedad.count({ where: { estado: 'ACTIVA', fechaVencimiento: { lt: hoy } } }),

    prisma.obligacionFiscal.count({ where: { estado: 'PENDIENTE', fechaVence: { gte: hoy, lte: en7 } } }),
    prisma.obligacionFiscal.count({ where: { estado: 'PENDIENTE', fechaVence: { lte: en60 } } }),
    prisma.obligacionFiscal.count({ where: { estado: 'VENCIDO' } }),

    prisma.consulta.count({ where: { estado: { in: ['ABIERTA', 'EN_PROCESO'] } } }),
    prisma.consulta.count({ where: { estado: 'ABIERTA', fecha: { lt: hace48h } } }),

    prisma.beneficiarioFinal.count({
      where: { OR: [{ fechaActualizacion: null }, { fechaActualizacion: { lt: hace1Anio } }] }
    }),
    prisma.beneficiarioFinal.count({ where: { documentoIdentidad: null } }),
    prisma.beneficiarioFinal.count({ where: { verificado: false } }),
    prisma.beneficiarioFinal.count({ where: { esPEP: true } }),

    prisma.suscripcion.count({ where: { estado: 'ACTIVA' } }),

    prisma.pago.aggregate({
      where: {
        estado:    'COMPLETADO',
        fechaPago: { gte: startOfMonth(hoy), lte: endOfMonth(hoy) },
      },
      _sum: { monto: true },
    }),
  ]);

  // Detalles: sociedades por vencer pronto
  const [sociedadesVencenProximo, obligacionesProximas, consultasRecientes, pagosRecientes] =
    await Promise.all([
      prisma.sociedad.findMany({
        where: { estado: 'ACTIVA', fechaVencimiento: { gte: hoy, lte: en90 } },
        select: { id: true, nombre: true, planCliente: true, fechaVencimiento: true },
        orderBy: { fechaVencimiento: 'asc' },
        take: 10,
      }),
      prisma.obligacionFiscal.findMany({
        where: {
          OR: [
            { estado: 'PENDIENTE', fechaVence: { lte: en60 } },
            { estado: 'VENCIDO' },
          ],
        },
        include: { sociedad: { select: { id: true, nombre: true } } },
        orderBy: { fechaVence: 'asc' },
        take: 15,
      }),
      prisma.consulta.findMany({
        where: { estado: { in: ['ABIERTA', 'EN_PROCESO'] } },
        include: { sociedad: { select: { id: true, nombre: true } } },
        orderBy: { fecha: 'desc' },
        take: 8,
      }),
      prisma.pago.findMany({
        where: { estado: 'COMPLETADO' },
        include: { suscripcion: { select: { plan: true, sociedadId: true, sociedad: { select: { nombre: true } } } } },
        orderBy: { fechaPago: 'desc' },
        take: 5,
      }),
    ]);

  res.json({
    resumen: {
      sociedades: {
        total:    totalActivas + totalInactivas + totalDisueltas,
        activas:  totalActivas,
        inactivas: totalInactivas,
        disueltas: totalDisueltas,
      },
      planes: { mensual: planMensual, anual: planAnual, fundador: planFundador },
      suscripciones: {
        activas:   suscripcionesActivas,
        vencidas:  suscVencidas,
        vencen30:  suscVencen30,
        vencen60:  suscVencen60,
        vencen90:  suscVencen90,
      },
      ingresos: {
        mesCorriente: Number(ingresosMes._sum.monto || 0),
      },
      alertas: {
        obligacionesUrgentes:     obligPendientesUrgentes,
        obligacionesPendientes:   obligPendientesTotal,
        obligacionesVencidas:     obligVencidas,
        consultasAbiertas,
        consultasSinRespuesta48h,
        beneficiariosDesactualizados,
        benefSinDocumento,
        benefSinVerificar,
        benefPEP,
        // Score de urgencia global (0 = sin alertas)
        scoreAlertas: obligPendientesUrgentes * 3 + obligVencidas * 2 +
                      consultasSinRespuesta48h * 2 + beneficiariosDesactualizados,
      },
    },
    sociedadesVencenProximo: sociedadesVencenProximo.map(s => ({
      ...s,
      diasRestantes: s.fechaVencimiento
        ? Math.ceil((new Date(s.fechaVencimiento) - hoy) / 86400000)
        : null,
    })),
    obligacionesProximas: obligacionesProximas.map(o => ({
      ...o,
      diasRestantes: Math.ceil((new Date(o.fechaVence) - hoy) / 86400000),
    })),
    consultasRecientes,
    pagosRecientes,
  });
});

// ─── ACTIVIDAD RECIENTE ───────────────────────────────────────────────────────

dashboardRouter.get('/actividad', async (req, res) => {
  const limite = Number(req.query.limit || 25);

  const [actas, documentos, beneficiarios, pagos, consultas] = await Promise.all([
    prisma.acta.findMany({
      select: { id: true, tipo: true, numero: true, fecha: true, creadoEn: true, sociedad: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' }, take: limite,
    }),
    prisma.documentoSocietario.findMany({
      select: { id: true, tipo: true, nombre: true, creadoEn: true, sociedad: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' }, take: limite,
    }),
    prisma.beneficiarioFinal.findMany({
      select: { id: true, nombre: true, actualizadoEn: true, sociedad: { select: { nombre: true } } },
      orderBy: { actualizadoEn: 'desc' }, take: Math.floor(limite / 2),
    }),
    prisma.pago.findMany({
      where: { estado: 'COMPLETADO' },
      select: { id: true, monto: true, metodoPago: true, fechaPago: true, creadoEn: true,
                suscripcion: { select: { plan: true, sociedad: { select: { nombre: true } } } } },
      orderBy: { creadoEn: 'desc' }, take: Math.floor(limite / 3),
    }),
    prisma.consulta.findMany({
      where: { estado: 'RESUELTA' },
      select: { id: true, tipo: true, fechaRespuesta: true, actualizadoEn: true, sociedad: { select: { nombre: true } } },
      orderBy: { actualizadoEn: 'desc' }, take: Math.floor(limite / 2),
    }),
  ]);

  // Unificar en un timeline
  const eventos = [
    ...actas.map(a => ({
      tipo: 'ACTA', icono: '📋',
      descripcion: `Acta #${a.numero} — ${a.tipo.replace(/_/g,' ')}`,
      sociedad: a.sociedad.nombre, fecha: a.creadoEn, id: a.id,
    })),
    ...documentos.map(d => ({
      tipo: 'DOCUMENTO', icono: '📄',
      descripcion: d.nombre,
      sociedad: d.sociedad.nombre, fecha: d.creadoEn, id: d.id,
    })),
    ...beneficiarios.map(b => ({
      tipo: 'BENEFICIARIO', icono: '👤',
      descripcion: `Beneficiario actualizado: ${b.nombre}`,
      sociedad: b.sociedad.nombre, fecha: b.actualizadoEn, id: b.id,
    })),
    ...pagos.map(p => ({
      tipo: 'PAGO', icono: '💳',
      descripcion: `Pago ${p.metodoPago} — Plan ${p.suscripcion?.plan} — $${Number(p.monto).toFixed(2)}`,
      sociedad: p.suscripcion?.sociedad?.nombre || '—', fecha: p.creadoEn, id: p.id,
    })),
    ...consultas.map(c => ({
      tipo: 'CONSULTA', icono: '💬',
      descripcion: `Consulta ${c.tipo} resuelta`,
      sociedad: c.sociedad.nombre, fecha: c.actualizadoEn, id: c.id,
    })),
  ]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, limite);

  res.json(eventos);
});

// ─── INGRESOS (últimos 12 meses) ─────────────────────────────────────────────

dashboardRouter.get('/ingresos', async (req, res) => {
  const meses = [];
  for (let i = 11; i >= 0; i--) {
    const fecha = subMonths(new Date(), i);
    meses.push({ inicio: startOfMonth(fecha), fin: endOfMonth(fecha), label: format(fecha, 'MMM yyyy', { locale: es }) });
  }

  const series = await Promise.all(
    meses.map(async ({ inicio, fin, label }) => {
      const [total, porPlan] = await Promise.all([
        prisma.pago.aggregate({
          where: { estado: 'COMPLETADO', fechaPago: { gte: inicio, lte: fin } },
          _sum: { monto: true }, _count: { id: true },
        }),
        prisma.pago.groupBy({
          by: ['suscripcionId'],
          where: { estado: 'COMPLETADO', fechaPago: { gte: inicio, lte: fin } },
          _sum: { monto: true },
        }),
      ]);
      return {
        mes:    label,
        total:  Number(total._sum.monto || 0),
        pagos:  total._count.id,
      };
    })
  );

  // Ingresos por plan (acumulado del año)
  const anioActual = new Date().getFullYear();
  const inicioAnio = new Date(`${anioActual}-01-01`);

  const porPlan = await prisma.pago.findMany({
    where: { estado: 'COMPLETADO', fechaPago: { gte: inicioAnio } },
    select: { monto: true, suscripcion: { select: { plan: true } } },
  });

  const resumenPlan = { MENSUAL: 0, ANUAL: 0, FUNDADOR: 0 };
  for (const p of porPlan) {
    const plan = p.suscripcion?.plan;
    if (plan && resumenPlan[plan] !== undefined) resumenPlan[plan] += Number(p.monto);
  }

  res.json({
    porMes: series,
    porPlan: resumenPlan,
    totalAnio: Object.values(resumenPlan).reduce((a, b) => a + b, 0),
  });
});

// ─── ALERTAS CONSOLIDADAS ─────────────────────────────────────────────────────

dashboardRouter.get('/alertas', async (req, res) => {
  const hoy       = new Date();
  const en7       = addDays(hoy, 7);
  const hace1Anio = addDays(hoy, -365);
  const hace48h   = addDays(hoy, -2);

  const [
    obligUrgentes, obligVencidas,
    suscVencidas,
    consultasSinRespuesta,
    benefDesactualizados, benefSinDoc, benefPEP,
  ] = await Promise.all([
    prisma.obligacionFiscal.findMany({
      where: { estado: 'PENDIENTE', fechaVence: { gte: hoy, lte: en7 } },
      include: { sociedad: { select: { id: true, nombre: true } } },
      orderBy: { fechaVence: 'asc' },
    }),
    prisma.obligacionFiscal.findMany({
      where: { estado: 'VENCIDO' },
      include: { sociedad: { select: { id: true, nombre: true } } },
      orderBy: { fechaVence: 'asc' },
      take: 20,
    }),
    prisma.suscripcion.findMany({
      where: { estado: 'ACTIVA', fechaVencimiento: { lt: hoy } },
      include: { sociedad: { select: { id: true, nombre: true } } },
      orderBy: { fechaVencimiento: 'asc' },
    }),
    prisma.consulta.findMany({
      where: { estado: 'ABIERTA', fecha: { lt: hace48h } },
      include: { sociedad: { select: { id: true, nombre: true } } },
      orderBy: { fecha: 'asc' },
    }),
    prisma.beneficiarioFinal.findMany({
      where: { OR: [{ fechaActualizacion: null }, { fechaActualizacion: { lt: hace1Anio } }] },
      include: { sociedad: { select: { id: true, nombre: true } } },
      take: 15,
    }),
    prisma.beneficiarioFinal.findMany({
      where: { documentoIdentidad: null },
      include: { sociedad: { select: { id: true, nombre: true } } },
      take: 15,
    }),
    prisma.beneficiarioFinal.findMany({
      where: { esPEP: true, verificado: false },
      include: { sociedad: { select: { id: true, nombre: true } } },
    }),
  ]);

  const nivel = (lista) => lista.length === 0 ? 'ok' : lista.length <= 3 ? 'advertencia' : 'critico';

  res.json({
    obligacionesUrgentes:  { items: obligUrgentes.map(o => ({ ...o, diasRestantes: Math.ceil((new Date(o.fechaVence) - hoy) / 86400000) })), nivel: nivel(obligUrgentes) },
    obligacionesVencidas:  { items: obligVencidas, nivel: nivel(obligVencidas) },
    suscripcionesVencidas: { items: suscVencidas, nivel: nivel(suscVencidas) },
    consultasSinRespuesta: { items: consultasSinRespuesta, nivel: nivel(consultasSinRespuesta) },
    beneficiariosDesactualizados: { items: benefDesactualizados, nivel: nivel(benefDesactualizados) },
    beneficiariosSinDocumento:    { items: benefSinDoc, nivel: nivel(benefSinDoc) },
    pepsSinVerificar:             { items: benefPEP, nivel: nivel(benefPEP) },
    resumen: {
      criticos:    [obligUrgentes, obligVencidas, suscVencidas, consultasSinRespuesta, benefPEP].filter(l => l.length > 3).length,
      advertencias:[obligUrgentes, obligVencidas, suscVencidas, consultasSinRespuesta, benefPEP].filter(l => l.length > 0 && l.length <= 3).length,
      totalItems:  obligUrgentes.length + obligVencidas.length + suscVencidas.length + consultasSinRespuesta.length + benefDesactualizados.length + benefSinDoc.length + benefPEP.length,
    },
  });
});

// ─── SOCIEDADES CON HEALTH SCORE ─────────────────────────────────────────────

dashboardRouter.get('/sociedades', async (req, res) => {
  const hoy       = new Date();
  const hace1Anio = addDays(hoy, -365);
  const en30      = addDays(hoy, 30);

  const sociedades = await prisma.sociedad.findMany({
    where: { estado: 'ACTIVA' },
    select: {
      id: true, nombre: true, ficha: true, planCliente: true,
      fechaVencimiento: true, estado: true, creadoEn: true,
      _count: {
        select: {
          accionistas:  true,
          directores:   true,
          actas:        true,
          beneficiarios: true,
          consultas:    true,
        },
      },
    },
    orderBy: { nombre: 'asc' },
  });

  // Para cada sociedad, calcular alertas individualmente sería lento;
  // hacemos un batch con groupBy
  const [obligPendientesRaw, benefSinVerificarRaw] = await Promise.all([
    prisma.obligacionFiscal.groupBy({
      by: ['sociedadId'],
      where: { estado: { in: ['PENDIENTE', 'VENCIDO'] } },
      _count: { id: true },
    }),
    prisma.beneficiarioFinal.groupBy({
      by: ['sociedadId'],
      where: { OR: [{ verificado: false }, { documentoIdentidad: null }] },
      _count: { id: true },
    }),
  ]);

  const obligMap = Object.fromEntries(obligPendientesRaw.map(o => [o.sociedadId, o._count.id]));
  const benefMap = Object.fromEntries(benefSinVerificarRaw.map(b => [b.sociedadId, b._count.id]));

  const resultado = sociedades.map(s => {
    const diasVencimiento = s.fechaVencimiento
      ? Math.ceil((new Date(s.fechaVencimiento) - hoy) / 86400000)
      : null;
    const obligs  = obligMap[s.id] || 0;
    const bAlerta = benefMap[s.id] || 0;

    // Health score 0-100 (100 = todo ok)
    let score = 100;
    if (obligs > 0)       score -= Math.min(obligs * 10, 30);
    if (bAlerta > 0)      score -= Math.min(bAlerta * 5, 20);
    if (diasVencimiento !== null && diasVencimiento <= 30) score -= 20;
    if (diasVencimiento !== null && diasVencimiento < 0)   score -= 30;
    score = Math.max(0, score);

    return {
      ...s,
      diasVencimiento,
      obligacionesAlerta: obligs,
      beneficiariosAlerta: bAlerta,
      healthScore: score,
      healthLabel: score >= 80 ? 'bueno' : score >= 50 ? 'advertencia' : 'critico',
    };
  });

  // Ordenar: críticos primero
  resultado.sort((a, b) => a.healthScore - b.healthScore);

  res.json(resultado);
});
