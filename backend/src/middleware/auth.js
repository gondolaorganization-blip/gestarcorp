import { verifyToken } from '../utils/tokens.js';
import prisma from '../utils/prisma.js';

let _planCache = null;
let _planCacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function isPlanActivo() {
  const now = Date.now();
  if (_planCache !== null && now - _planCacheTs < CACHE_TTL) return _planCache;
  const cfg = await prisma.configuracion.findUnique({ where: { id: 'singleton' } });
  if (!cfg) { _planCache = true; _planCacheTs = now; return true; }
  const activo = cfg.planActivo || (!!cfg.trialVence && cfg.trialVence > new Date());
  _planCache = activo;
  _planCacheTs = now;
  return activo;
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido.' });
  }

  try {
    const payload = verifyToken(header.slice(7));
    if (payload.tipo === 'portal') {
      return res.status(403).json({ error: 'Este endpoint es exclusivo del agente residente.' });
    }
    req.user = payload;

    if (payload.rol !== 'SUPERADMIN') {
      const activo = await isPlanActivo();
      if (!activo) {
        return res.status(402).json({ error: 'Período de prueba vencido.', code: 'TRIAL_EXPIRED' });
      }
    }

    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

export function requireAgente(req, res, next) {
  if (req.user?.rol !== 'AGENTE' && req.user?.rol !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acceso restringido al agente residente.' });
  }
  next();
}

export function requirePortal(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido.' });
  }

  try {
    const payload = verifyToken(header.slice(7));
    if (payload.tipo !== 'portal') {
      return res.status(403).json({ error: 'Acceso restringido al portal del cliente.' });
    }
    req.portal = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}
