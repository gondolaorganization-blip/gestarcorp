import { verifyToken } from '../utils/tokens.js';

export function requireAuth(req, res, next) {
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
