import nodemailer from 'nodemailer';

function crearTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function enviarEmailResetPortal({ email, token, nombreSociedad }) {
  const transporter = crearTransporter();
  const url = `${process.env.FRONTEND_URL}/portal/reset-password?token=${token}`;

  if (!transporter) {
    // En desarrollo sin SMTP configurado, mostramos el link en consola
    console.log(`[EMAIL SIMULADO] Reset portal para ${email}`);
    console.log(`  URL: ${url}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `GESTARGOV — Restablecer contraseña de ${nombreSociedad}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1e40af">GESTARGOV</h2>
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer la contraseña del portal de
           <strong>${nombreSociedad}</strong>.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <a href="${url}" style="display:inline-block;background:#1e40af;color:white;
           padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">
          Restablecer contraseña
        </a>
        <p style="color:#6b7280;font-size:13px">
          Este enlace expira en 2 horas. Si no solicitaste este cambio, ignora este correo.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb">
        <p style="color:#9ca3af;font-size:12px">GESTARGOV · Gobierno Corporativo Panameño</p>
      </div>
    `,
  });
}

export async function enviarAlertaObligaciones({ emailAgente, alertas }) {
  const transporter = crearTransporter();

  const filas = alertas.map(a => {
    const dias   = a.diasRestantes;
    const badge  = dias < 0
      ? `<span style="background:#991b1b;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">VENCIDA</span>`
      : dias <= 7
        ? `<span style="background:#c2410c;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">${dias}d</span>`
        : `<span style="background:#ca8a04;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">${dias}d</span>`;
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${a.sociedad}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${a.tipo.replace(/_/g,' ')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${a.entidad}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${a.fechaVence}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${badge}</td>
    </tr>`;
  }).join('');

  if (!transporter) {
    console.log(`[EMAIL SIMULADO] Alerta obligaciones para ${emailAgente}`);
    alertas.forEach(a => console.log(`  [${a.diasRestantes >= 0 ? a.diasRestantes + 'd' : 'VENCIDA'}] ${a.sociedad} — ${a.tipo} — ${a.fechaVence}`));
    return;
  }

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to:      emailAgente,
    subject: `GESTARGOV — ${alertas.filter(a => a.diasRestantes < 0).length > 0 ? '⚠️ ' : ''}Resumen de vencimientos fiscales`,
    html: `
      <div style="font-family:sans-serif;max-width:700px;margin:0 auto">
        <h2 style="color:#1e40af">GESTARGOV — Alertas de Vencimientos Fiscales</h2>
        <p>Resumen del <strong>${new Date().toLocaleDateString('es-PA', { day:'numeric', month:'long', year:'numeric' })}</strong>:</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#1e40af;color:#fff">
              <th style="padding:8px 10px;text-align:left">Sociedad</th>
              <th style="padding:8px 10px;text-align:left">Tipo</th>
              <th style="padding:8px 10px;text-align:left">Entidad</th>
              <th style="padding:8px 10px;text-align:left">Vence</th>
              <th style="padding:8px 10px;text-align:center">Estado</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <p style="margin-top:16px">
          <a href="${process.env.FRONTEND_URL}/obligaciones"
             style="display:inline-block;background:#1e40af;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
            Ver en GESTARGOV
          </a>
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:24px">
        <p style="color:#9ca3af;font-size:12px">GESTARGOV · Gobierno Corporativo Panameño</p>
      </div>
    `,
  });
}

export async function enviarNotificacionConsulta({ emailAgente, emailPortal, nombreSociedad, tipo, descripcion, esRespuesta = false }) {
  const transporter = crearTransporter();

  if (esRespuesta) {
    // Notificar al cliente que el agente respondió
    if (!transporter) {
      console.log(`[EMAIL SIMULADO] Respuesta consulta → ${emailPortal}`);
      return;
    }
    await transporter.sendMail({
      from:    process.env.SMTP_FROM,
      to:      emailPortal,
      subject: `GESTARGOV — Tu consulta sobre ${nombreSociedad} fue respondida`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#1e40af">GESTARGOV</h2>
          <p>Tu consulta sobre <strong>${nombreSociedad}</strong> ha sido respondida por tu Agente Residente.</p>
          <a href="${process.env.FRONTEND_URL}/portal/consultas"
             style="display:inline-block;background:#1e40af;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">
            Ver respuesta en el portal
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb">
          <p style="color:#9ca3af;font-size:12px">GESTARGOV · Gobierno Corporativo Panameño</p>
        </div>
      `,
    });
  } else {
    // Notificar al agente que el cliente envió una consulta
    if (!transporter) {
      console.log(`[EMAIL SIMULADO] Nueva consulta [${tipo}] de ${nombreSociedad} → ${emailAgente}`);
      console.log(`  "${descripcion.substring(0, 80)}..."`);
      return;
    }
    await transporter.sendMail({
      from:    process.env.SMTP_FROM,
      to:      emailAgente,
      subject: `GESTARGOV — Nueva consulta de ${nombreSociedad}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#1e40af">GESTARGOV</h2>
          <p>El cliente de <strong>${nombreSociedad}</strong> envió una nueva consulta de tipo <strong>${tipo}</strong>:</p>
          <blockquote style="border-left:4px solid #1e40af;margin:16px 0;padding:8px 16px;background:#eff6ff;color:#1e3a5f">
            ${descripcion.substring(0, 300)}${descripcion.length > 300 ? '...' : ''}
          </blockquote>
          <a href="${process.env.FRONTEND_URL}/consultas"
             style="display:inline-block;background:#1e40af;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:8px 0">
            Responder en GESTARGOV
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb">
          <p style="color:#9ca3af;font-size:12px">GESTARGOV · Gobierno Corporativo Panameño</p>
        </div>
      `,
    });
  }
}

export async function enviarBienvenidaPortal({ email, nombreSociedad, passwordTemporal }) {
  const transporter = crearTransporter();
  const url = `${process.env.FRONTEND_URL}/portal/login`;

  if (!transporter) {
    console.log(`[EMAIL SIMULADO] Bienvenida portal para ${email}`);
    console.log(`  Sociedad: ${nombreSociedad}`);
    console.log(`  Password temporal: ${passwordTemporal}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `GESTARGOV — Acceso al portal de ${nombreSociedad}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1e40af">GESTARGOV</h2>
        <p>Bienvenido al portal de gobierno corporativo de
           <strong>${nombreSociedad}</strong>.</p>
        <p>Sus credenciales de acceso son:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
          <p style="margin:4px 0"><strong>Contraseña temporal:</strong> ${passwordTemporal}</p>
        </div>
        <a href="${url}" style="display:inline-block;background:#1e40af;color:white;
           padding:12px 24px;border-radius:6px;text-decoration:none;margin:8px 0">
          Acceder al portal
        </a>
        <p style="color:#6b7280;font-size:13px">
          Por seguridad, cambia tu contraseña en el primer inicio de sesión.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb">
        <p style="color:#9ca3af;font-size:12px">GESTARGOV · Gobierno Corporativo Panameño</p>
      </div>
    `,
  });
}
