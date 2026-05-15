import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login, setup, me, cambiarPassword,
  loginPortal, mePortal, cambiarPasswordPortal,
  solicitarResetPortal, resetPasswordPortal,
  obtenerAccesoPortal, crearAccesoPortal, actualizarAccesoPortal,
  listarAgentes, crearAgente, actualizarAgente,
} from '../controllers/authController.js';
import { requireAuth, requireAgente, requirePortal } from '../middleware/auth.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── SETUP INICIAL (solo cuando no existe ningún usuario) ────────────────────
authRouter.post('/setup', setup);

// ─── AGENTE RESIDENTE ─────────────────────────────────────────────────────────
authRouter.post('/login', loginLimiter, login);
authRouter.get('/me', requireAuth, me);
authRouter.put('/cambiar-password', requireAuth, requireAgente, cambiarPassword);

// ─── PORTAL DEL CLIENTE ───────────────────────────────────────────────────────
authRouter.post('/portal/login', loginLimiter, loginPortal);
authRouter.get('/portal/me', requirePortal, mePortal);
authRouter.put('/portal/cambiar-password', requirePortal, cambiarPasswordPortal);
authRouter.post('/portal/solicitar-reset', loginLimiter, solicitarResetPortal);
authRouter.post('/portal/reset-password', resetPasswordPortal);

// ─── GESTIÓN DE ACCESOS DE PORTAL (agente) ───────────────────────────────────
authRouter.get('/portal/sociedad/:id', requireAuth, requireAgente, obtenerAccesoPortal);
authRouter.post('/portal/sociedad/:id', requireAuth, requireAgente, crearAccesoPortal);
authRouter.put('/portal/sociedad/:id', requireAuth, requireAgente, actualizarAccesoPortal);

// ─── GESTIÓN DE AGENTES (cualquier agente autenticado) ────────────────────────
authRouter.get('/agentes',         requireAuth, requireAgente, listarAgentes);
authRouter.post('/agentes',        requireAuth, requireAgente, crearAgente);
authRouter.put('/agentes/:uid',    requireAuth, requireAgente, actualizarAgente);
