import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function signToken(payload, expiresIn = process.env.JWT_EXPIRES_IN) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function generarTokenReset() {
  return crypto.randomBytes(32).toString('hex');
}
