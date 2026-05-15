import prisma from '../utils/prisma.js';
import { signToken } from '../utils/tokens.js';
import { hashPassword, verifyPassword, validarPassword } from '../utils/password.js';
import { generarTokenReset } from '../utils/tokens.js';
import { enviarEmailResetPortal, enviarBienvenidaPortal } from '../utils/email.js';
import { addHours } from 'date-fns';

// ─── AGENTE RESIDENTE ─────────────────────────────────────────────────────────

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const ok = await verifyPassword(password, usuario.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const token = signToken({
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre,
  });

  res.json({
    token,
    usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
  });
}

export async function setup(req, res) {
  const total = await prisma.usuario.count();
  if (total > 0) {
    return res.status(403).json({ error: 'El sistema ya está configurado.' });
  }

  const { email, password, nombre } = req.body;
  if (!email || !password || !nombre) {
    return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos.' });
  }

  const errorPass = validarPassword(password);
  if (errorPass) return res.status(400).json({ error: errorPass });

  const passwordHash = await hashPassword(password);
  const usuario = await prisma.usuario.create({
    data: { email: email.toLowerCase().trim(), passwordHash, nombre, rol: 'AGENTE' },
  });

  const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre });

  res.status(201).json({
    token,
    usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
  });
}

export async function me(req, res) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, nombre: true, rol: true, activo: true },
  });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
  res.json(usuario);
}

export async function cambiarPassword(req, res) {
  const { passwordActual, passwordNueva } = req.body;
  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas.' });
  }

  const errorPass = validarPassword(passwordNueva);
  if (errorPass) return res.status(400).json({ error: errorPass });

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: req.user.id } });
  const ok = await verifyPassword(passwordActual, usuario.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });

  const passwordHash = await hashPassword(passwordNueva);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { passwordHash } });

  res.json({ mensaje: 'Contraseña actualizada correctamente.' });
}

// ─── PORTAL DEL CLIENTE ───────────────────────────────────────────────────────

export async function loginPortal(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  const acceso = await prisma.portalAcceso.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      sociedad: {
        select: {
          id: true, nombre: true, estado: true,
          planCliente: true, fechaVencimiento: true,
        },
      },
    },
  });

  if (!acceso || !acceso.activo) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const ok = await verifyPassword(password, acceso.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas.' });

  await prisma.portalAcceso.update({
    where: { id: acceso.id },
    data: { ultimoAcceso: new Date() },
  });

  const token = signToken({
    id: acceso.id,
    tipo: 'portal',
    sociedadId: acceso.sociedadId,
    email: acceso.email,
  });

  res.json({ token, sociedad: acceso.sociedad });
}

export async function mePortal(req, res) {
  const acceso = await prisma.portalAcceso.findUnique({
    where: { id: req.portal.id },
    select: {
      id: true, email: true, ultimoAcceso: true,
      sociedad: {
        select: {
          id: true, nombre: true, estado: true, ficha: true, tomo: true, folio: true,
          planCliente: true, fechaVencimiento: true, fechaConstitucion: true,
        },
      },
    },
  });
  if (!acceso) return res.status(404).json({ error: 'Acceso no encontrado.' });
  res.json(acceso);
}

export async function cambiarPasswordPortal(req, res) {
  const { passwordActual, passwordNueva } = req.body;
  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas.' });
  }

  const errorPass = validarPassword(passwordNueva);
  if (errorPass) return res.status(400).json({ error: errorPass });

  const acceso = await prisma.portalAcceso.findUniqueOrThrow({ where: { id: req.portal.id } });
  const ok = await verifyPassword(passwordActual, acceso.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });

  const passwordHash = await hashPassword(passwordNueva);
  await prisma.portalAcceso.update({ where: { id: acceso.id }, data: { passwordHash } });

  res.json({ mensaje: 'Contraseña actualizada correctamente.' });
}

export async function solicitarResetPortal(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email es requerido.' });

  // Respuesta genérica para no revelar si el email existe
  const acceso = await prisma.portalAcceso.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { sociedad: { select: { nombre: true } } },
  });

  if (acceso && acceso.activo) {
    const token = generarTokenReset();
    const vence = addHours(new Date(), 2);

    await prisma.portalAcceso.update({
      where: { id: acceso.id },
      data: { tokenReset: token, tokenResetVence: vence },
    });

    await enviarEmailResetPortal({
      email: acceso.email,
      token,
      nombreSociedad: acceso.sociedad.nombre,
    });
  }

  res.json({ mensaje: 'Si el email está registrado, recibirás las instrucciones en breve.' });
}

export async function resetPasswordPortal(req, res) {
  const { token, passwordNueva } = req.body;
  if (!token || !passwordNueva) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });
  }

  const errorPass = validarPassword(passwordNueva);
  if (errorPass) return res.status(400).json({ error: errorPass });

  const acceso = await prisma.portalAcceso.findFirst({
    where: { tokenReset: token, tokenResetVence: { gt: new Date() } },
  });

  if (!acceso) {
    return res.status(400).json({ error: 'Token inválido o expirado.' });
  }

  const passwordHash = await hashPassword(passwordNueva);
  await prisma.portalAcceso.update({
    where: { id: acceso.id },
    data: { passwordHash, tokenReset: null, tokenResetVence: null },
  });

  res.json({ mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
}

// ─── GESTIÓN DE ACCESOS DE PORTAL (desde panel del agente) ───────────────────

export async function obtenerAccesoPortal(req, res) {
  const acceso = await prisma.portalAcceso.findUnique({
    where: { sociedadId: req.params.id },
    select: { id: true, email: true, ultimoAcceso: true, activo: true, creadoEn: true },
  });
  res.json(acceso || null);
}

export async function crearAccesoPortal(req, res) {
  const { email, password } = req.body;
  const sociedadId = req.params.id;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  const errorPass = validarPassword(password);
  if (errorPass) return res.status(400).json({ error: errorPass });

  // Verificar que la sociedad exista
  const sociedad = await prisma.sociedad.findUniqueOrThrow({
    where: { id: sociedadId },
    select: { nombre: true },
  });

  const passwordHash = await hashPassword(password);
  const acceso = await prisma.portalAcceso.create({
    data: {
      sociedadId,
      email: email.toLowerCase().trim(),
      passwordHash,
      activo: true,
    },
    select: { id: true, email: true, activo: true, creadoEn: true },
  });

  await enviarBienvenidaPortal({
    email: acceso.email,
    nombreSociedad: sociedad.nombre,
    passwordTemporal: password,
  });

  res.status(201).json(acceso);
}

export async function actualizarAccesoPortal(req, res) {
  const { email, password, activo } = req.body;
  const sociedadId = req.params.id;

  const accesoExistente = await prisma.portalAcceso.findUnique({ where: { sociedadId } });
  if (!accesoExistente) return res.status(404).json({ error: 'Acceso de portal no encontrado.' });

  const data = {};
  if (email) data.email = email.toLowerCase().trim();
  if (activo !== undefined) data.activo = activo;

  if (password) {
    const errorPass = validarPassword(password);
    if (errorPass) return res.status(400).json({ error: errorPass });
    data.passwordHash = await hashPassword(password);
  }

  const acceso = await prisma.portalAcceso.update({
    where: { sociedadId },
    data,
    select: { id: true, email: true, activo: true, ultimoAcceso: true },
  });

  res.json(acceso);
}
