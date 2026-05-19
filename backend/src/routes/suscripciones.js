import { Router } from 'express';
import express from 'express';
import {
  stripeCheckout, stripeSuccess, stripeWebhook, stripePortal,
  yappyIniciar, yappyCallback, yappyWebhook,
  paypalCrearOrden, paypalCapturar,
  registrarPagoManual,
  obtenerSuscripcion, historialPagos, vencimientosProximos, listarTrials, cancelarSuscripcion,
} from '../controllers/suscripcionesController.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const suscripcionesRouter = Router();

// ─── Stripe webhook — body RAW (antes de express.json) ───────────────────────
suscripcionesRouter.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// ─── Yappy webhook ───────────────────────────────────────────────────────────
suscripcionesRouter.post('/yappy/webhook',  yappyWebhook);

// ─── Yappy callback (redirección tras pago, sin auth) ────────────────────────
suscripcionesRouter.get('/yappy/callback',  yappyCallback);

// ─── Stripe success (sin auth, viene del redirect de Stripe) ─────────────────
suscripcionesRouter.get('/stripe/success',  stripeSuccess);

// ─── Rutas autenticadas ───────────────────────────────────────────────────────
suscripcionesRouter.use(requireAuth, requireAgente);

// Vencimientos próximos y trials activos
suscripcionesRouter.get('/vencimientos', vencimientosProximos);
suscripcionesRouter.get('/trials',       listarTrials);

// Checkout
suscripcionesRouter.post('/stripe/checkout',  stripeCheckout);
suscripcionesRouter.post('/stripe/portal',     stripePortal);
suscripcionesRouter.post('/yappy/iniciar',     yappyIniciar);
suscripcionesRouter.post('/paypal/crear-orden', paypalCrearOrden);
suscripcionesRouter.post('/paypal/capturar',    paypalCapturar);
suscripcionesRouter.post('/manual',             registrarPagoManual);

// Por sociedad
suscripcionesRouter.get('/:id',               obtenerSuscripcion);
suscripcionesRouter.get('/:id/pagos',         historialPagos);
suscripcionesRouter.delete('/:suscripcionId/cancelar', cancelarSuscripcion);
