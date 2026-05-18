import Stripe from 'stripe';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

// Precios de los planes (USD)
const PLANES = {
  MENSUAL:  { monto: 39.00,  label: 'Plan Mensual GESTARCORP — $39/mes' },
  ANUAL:    { monto: 350.00, label: 'Plan Anual GESTARCORP — $350/año (Agente Residente incluido)' },
  FUNDADOR: { monto: 300.00, label: 'Plan Fundador GESTARCORP — $300/año (precio especial)' },
};

// IDs de precios Stripe por plan (configurados en .env)
const STRIPE_PRICES = {
  MENSUAL:  process.env.STRIPE_PRICE_MENSUAL,
  ANUAL:    process.env.STRIPE_PRICE_ANUAL,
  FUNDADOR: process.env.STRIPE_PRICE_FUNDADOR,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function calcularVencimiento(plan) {
  const hoy = new Date();
  if (plan === 'MENSUAL') {
    return new Date(hoy.setMonth(hoy.getMonth() + 1));
  }
  return new Date(hoy.setFullYear(hoy.getFullYear() + 1)); // ANUAL y FUNDADOR
}

async function activarSuscripcion(suscripcionId, metodoPago, referencia, metadatos = {}) {
  const sus = await prisma.suscripcion.findUniqueOrThrow({ where: { id: suscripcionId } });

  const [suscripcion] = await prisma.$transaction([
    prisma.suscripcion.update({
      where: { id: suscripcionId },
      data: {
        estado:          'ACTIVA',
        metodoPago,
        fechaInicio:     new Date(),
        fechaVencimiento: calcularVencimiento(sus.plan),
      },
    }),
    prisma.pago.create({
      data: {
        suscripcionId,
        monto:      sus.monto,
        moneda:     sus.moneda,
        estado:     'COMPLETADO',
        metodoPago,
        referencia,
        descripcion: PLANES[sus.plan]?.label,
        fechaPago:   new Date(),
        metadatos,
      },
    }),
    // Actualizar plan y fecha de vencimiento en la sociedad
    prisma.sociedad.update({
      where: { id: sus.sociedadId },
      data: {
        planCliente:      sus.plan,
        fechaVencimiento: calcularVencimiento(sus.plan),
      },
    }),
  ]);

  return suscripcion;
}

// ─── STRIPE ──────────────────────────────────────────────────────────────────

/**
 * POST /api/suscripciones/stripe/checkout
 * Body: { sociedadId, plan: 'MENSUAL' | 'ANUAL' | 'FUNDADOR' }
 * Crea una sesión de pago en Stripe y devuelve la URL de checkout.
 */
export async function stripeCheckout(req, res) {
  const { sociedadId, plan } = req.body;

  if (!PLANES[plan]) return res.status(400).json({ error: `Plan no válido: ${plan}` });
  const sociedad = await prisma.sociedad.findUniqueOrThrow({ where: { id: sociedadId } });

  const stripeMode = plan === 'MENSUAL' ? 'subscription' : 'payment';
  const lineItem = STRIPE_PRICES[plan] && !STRIPE_PRICES[plan].startsWith('price_pendiente')
    ? { price: STRIPE_PRICES[plan], quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          product_data: { name: PLANES[plan].label, metadata: { plan, sociedadId } },
          unit_amount: Math.round(PLANES[plan].monto * 100),
          ...(plan === 'MENSUAL' && { recurring: { interval: 'month' } }),
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    mode:        stripeMode,
    line_items:  [lineItem],
    success_url: `${process.env.FRONTEND_URL}/suscripcion/exitoso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.FRONTEND_URL}/suscripcion/cancelado`,
    metadata:    { sociedadId, plan },
    customer_email: req.user?.email,
  });

  // Crear suscripción en estado PENDIENTE para poder rastrearla
  const suscripcion = await prisma.suscripcion.create({
    data: {
      sociedadId,
      plan,
      estado:         'PENDIENTE',
      monto:          PLANES[plan].monto,
      moneda:         'USD',
      stripeSessionId: session.id,
      ...(session.subscription && { stripeSubscriptionId: String(session.subscription) }),
    },
  });

  res.json({ url: session.url, sessionId: session.id, suscripcionId: suscripcion.id });
}

/**
 * GET /api/suscripciones/stripe/success?session_id=xxx
 * Verifica el pago completado y activa la suscripción.
 * (El webhook también lo hace; este endpoint es el fallback para la redirección.)
 */
export async function stripeSuccess(req, res) {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id requerido' });

  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.payment_status !== 'paid') {
    return res.status(402).json({ error: 'Pago no completado', status: session.payment_status });
  }

  const sus = await prisma.suscripcion.findFirst({ where: { stripeSessionId: session_id } });
  if (!sus) return res.status(404).json({ error: 'Suscripción no encontrada' });

  if (sus.estado === 'ACTIVA') {
    return res.json({ mensaje: 'Suscripción ya activa', suscripcionId: sus.id });
  }

  const activada = await activarSuscripcion(sus.id, 'STRIPE', session.payment_intent || session_id, {
    stripeSessionId: session_id,
    stripeCustomerId: session.customer,
  });

  res.json({ mensaje: 'Suscripción activada', suscripcion: activada });
}

/**
 * POST /api/suscripciones/stripe/webhook
 * Webhook de Stripe — IMPORTANTE: requiere body RAW (no parseado por express.json()).
 */
export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook inválido: ${err.message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        const sus = await prisma.suscripcion.findFirst({ where: { stripeSessionId: session.id } });
        if (sus && sus.estado !== 'ACTIVA') {
          await activarSuscripcion(sus.id, 'STRIPE', session.payment_intent || session.id, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
          });
          if (session.subscription) {
            await prisma.suscripcion.update({
              where: { id: sus.id },
              data: { stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription },
            });
          }
        }
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const sus = await prisma.suscripcion.findFirst({
          where: { stripeSubscriptionId: invoice.subscription },
        });
        if (sus) {
          await prisma.pago.create({
            data: {
              suscripcionId: sus.id,
              monto:       invoice.amount_paid / 100,
              moneda:      invoice.currency.toUpperCase(),
              estado:      'COMPLETADO',
              metodoPago:  'STRIPE',
              referencia:  invoice.payment_intent,
              descripcion: 'Renovación automática',
              fechaPago:   new Date(invoice.status_transitions.paid_at * 1000),
            },
          });
          await prisma.suscripcion.update({
            where: { id: sus.id },
            data: { fechaVencimiento: calcularVencimiento(sus.plan) },
          });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await prisma.suscripcion.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { estado: 'CANCELADA' },
      });
      break;
    }
  }

  res.json({ recibido: true });
}

/**
 * POST /api/suscripciones/stripe/portal
 * Devuelve URL del portal de cliente Stripe (gestionar suscripción, facturas).
 */
export async function stripePortal(req, res) {
  const { sociedadId } = req.body;
  const sus = await prisma.suscripcion.findFirst({
    where: { sociedadId, stripeCustomerId: { not: null } },
    orderBy: { creadoEn: 'desc' },
  });

  if (!sus?.stripeCustomerId) {
    return res.status(404).json({ error: 'No hay suscripción Stripe activa para esta sociedad' });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   sus.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL}/suscripcion`,
  });

  res.json({ url: portalSession.url });
}

// ─── YAPPY ───────────────────────────────────────────────────────────────────

function yappyHash(merchantId, orderId, total) {
  return crypto
    .createHmac('sha256', process.env.YAPPY_SECRET_KEY)
    .update(`${merchantId}${orderId}${total}`)
    .digest('hex');
}

/**
 * POST /api/suscripciones/yappy/iniciar
 * Body: { sociedadId, plan }
 * Genera un enlace de pago Yappy y registra la suscripción como PENDIENTE.
 */
export async function yappyIniciar(req, res) {
  const { sociedadId, plan } = req.body;

  if (!PLANES[plan]) return res.status(400).json({ error: `Plan no válido: ${plan}` });
  await prisma.sociedad.findUniqueOrThrow({ where: { id: sociedadId } });

  const orderId   = `GEST-${sociedadId.substring(0, 8)}-${Date.now()}`;
  const total     = PLANES[plan].monto.toFixed(2);
  const merchantId = process.env.YAPPY_MERCHANT_ID;
  const hash      = yappyHash(merchantId, orderId, total);

  const payload = {
    orderId,
    subtotal: total,
    taxes:    '0.00',
    total,
    domain:   process.env.FRONTEND_URL || 'https://gestarcorp.com',
    successUrl: `${process.env.API_URL}/api/suscripciones/yappy/callback?orderId=${orderId}&status=success`,
    failUrl:    `${process.env.API_URL}/api/suscripciones/yappy/callback?orderId=${orderId}&status=fail`,
  };

  const yappyRes = await fetch(`${process.env.YAPPY_API_URL}/webpayment/pay`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant-id':  merchantId,
      'hash':         hash,
    },
    body: JSON.stringify(payload),
  });

  if (!yappyRes.ok) {
    const errorBody = await yappyRes.text();
    throw new Error(`Error Yappy API: ${yappyRes.status} ${errorBody}`);
  }

  const yappyData = await yappyRes.json();

  const suscripcion = await prisma.suscripcion.create({
    data: {
      sociedadId,
      plan,
      estado:      'PENDIENTE',
      monto:       PLANES[plan].monto,
      moneda:      'USD',
      metodoPago:  'YAPPY',
      yappyOrderId: orderId,
    },
  });

  res.json({ url: yappyData.url || yappyData.paymentUrl, orderId, suscripcionId: suscripcion.id });
}

/**
 * GET /api/suscripciones/yappy/callback
 * Yappy redirige aquí tras el pago. Se verifica y activa.
 */
export async function yappyCallback(req, res) {
  const { orderId, status } = req.query;

  if (status !== 'success') {
    return res.redirect(`${process.env.FRONTEND_URL}/suscripcion/cancelado`);
  }

  const sus = await prisma.suscripcion.findFirst({ where: { yappyOrderId: orderId } });
  if (!sus || sus.estado === 'ACTIVA') {
    return res.redirect(`${process.env.FRONTEND_URL}/suscripcion`);
  }

  await activarSuscripcion(sus.id, 'YAPPY', orderId, { yappyOrderId: orderId });
  res.redirect(`${process.env.FRONTEND_URL}/suscripcion/exitoso`);
}

/**
 * POST /api/suscripciones/yappy/webhook
 * Webhook de Yappy — confirmación asíncrona del pago.
 */
export async function yappyWebhook(req, res) {
  const { orderId, status, hash } = req.body;

  // Verificar firma
  const expectedHash = yappyHash(process.env.YAPPY_MERCHANT_ID, orderId, req.body.total || '');
  if (hash && hash !== expectedHash) {
    return res.status(400).json({ error: 'Hash inválido' });
  }

  if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'approved') {
    const sus = await prisma.suscripcion.findFirst({ where: { yappyOrderId: orderId } });
    if (sus && sus.estado !== 'ACTIVA') {
      await activarSuscripcion(sus.id, 'YAPPY', orderId, { ...req.body });
    }
  }

  res.json({ recibido: true });
}

// ─── MANUAL (TRANSFERENCIA / EFECTIVO) ───────────────────────────────────────

/**
 * POST /api/suscripciones/manual
 * El agente registra un pago manual (transferencia bancaria, efectivo).
 * Body: { sociedadId, plan, metodoPago, referencia, notas }
 */
export async function registrarPagoManual(req, res) {
  const { sociedadId, plan, metodoPago, referencia, notas } = req.body;

  if (!PLANES[plan]) return res.status(400).json({ error: `Plan no válido: ${plan}` });
  if (!['TRANSFERENCIA', 'EFECTIVO'].includes(metodoPago)) {
    return res.status(400).json({ error: 'metodoPago debe ser TRANSFERENCIA o EFECTIVO' });
  }

  const suscripcion = await prisma.suscripcion.create({
    data: {
      sociedadId,
      plan,
      estado:          'PENDIENTE',
      monto:           PLANES[plan].monto,
      moneda:          'USD',
      metodoPago,
    },
  });

  const activada = await activarSuscripcion(suscripcion.id, metodoPago, referencia, { notas });

  res.status(201).json({ mensaje: 'Pago registrado y suscripción activada', suscripcion: activada });
}

// ─── CONSULTAS ───────────────────────────────────────────────────────────────

export async function obtenerSuscripcion(req, res) {
  const suscripcion = await prisma.suscripcion.findFirst({
    where: { sociedadId: req.params.id },
    orderBy: { creadoEn: 'desc' },
    include: { pagos: { orderBy: { creadoEn: 'desc' }, take: 10 } },
  });
  res.json(suscripcion ?? null);
}

export async function historialPagos(req, res) {
  const pagos = await prisma.pago.findMany({
    where: { suscripcion: { sociedadId: req.params.id } },
    orderBy: { creadoEn: 'desc' },
  });
  res.json(pagos);
}

/**
 * GET /api/suscripciones/vencimientos
 * Lista sociedades con suscripciones próximas a vencer (próximos 30 días).
 */
export async function vencimientosProximos(req, res) {
  const en30dias = new Date(Date.now() + 30 * 86400000);

  const suscripciones = await prisma.suscripcion.findMany({
    where: {
      estado: 'ACTIVA',
      fechaVencimiento: { lte: en30dias },
    },
    include: { sociedad: { select: { id: true, nombre: true, ficha: true } } },
    orderBy: { fechaVencimiento: 'asc' },
  });

  const resultado = suscripciones.map(s => ({
    ...s,
    diasRestantes: Math.ceil((new Date(s.fechaVencimiento) - Date.now()) / 86400000),
  }));

  res.json(resultado);
}

export async function cancelarSuscripcion(req, res) {
  const { suscripcionId } = req.params;

  const sus = await prisma.suscripcion.findUniqueOrThrow({ where: { id: suscripcionId } });

  // Cancelar en Stripe si tiene subscripción activa
  if (sus.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(sus.stripeSubscriptionId);
  }

  const cancelada = await prisma.suscripcion.update({
    where: { id: suscripcionId },
    data: { estado: 'CANCELADA' },
  });

  res.json({ mensaje: 'Suscripción cancelada', suscripcion: cancelada });
}

export { PLANES };
