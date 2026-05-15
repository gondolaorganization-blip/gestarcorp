import { estilosLegales, formatearFecha, formatearMoneda } from '../../utils/generadorPDF.js';

// Contenido sugerido por tipo de acta
export const contenidosPorTipo = {
  ASAMBLEA_ORDINARIA: {
    titulo: 'ACTA DE ASAMBLEA GENERAL ORDINARIA DE ACCIONISTAS',
    agendaSugerida: [
      '1. Verificación del quórum y declaratoria de instalación.',
      '2. Designación del Presidente y Secretario de la Asamblea.',
      '3. Lectura y aprobación del acta anterior.',
      '4. Presentación y aprobación del informe de gestión del ejercicio.',
      '5. Presentación y aprobación de los estados financieros del ejercicio.',
      '6. Distribución de utilidades o dividendos.',
      '7. Ratificación de dignatarios.',
      '8. Asuntos varios.',
      '9. Cierre de la sesión.',
    ],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, República de Panamá, siendo las ` +
      `${a.horaInicio || '___'} horas del día ${formatearFecha(a.fecha)}, ` +
      `se reunieron los accionistas de <strong>${s.nombre}</strong>, ` +
      `sociedad anónima debidamente constituida bajo las leyes de la República de Panamá, ` +
      `con el objeto de celebrar Asamblea General Ordinaria de Accionistas, conforme a lo ` +
      `establecido en el pacto social de la sociedad y en la Ley 32 de 1927.`,
  },

  ASAMBLEA_EXTRAORDINARIA: {
    titulo: 'ACTA DE ASAMBLEA GENERAL EXTRAORDINARIA DE ACCIONISTAS',
    agendaSugerida: [
      '1. Verificación del quórum y declaratoria de instalación.',
      '2. Designación del Presidente y Secretario de la Asamblea.',
      '3. Exposición del objeto de la asamblea extraordinaria.',
      '4. Deliberación y votación sobre los puntos extraordinarios.',
      '5. Adopción de acuerdos.',
      '6. Cierre de la sesión.',
    ],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, República de Panamá, siendo las ` +
      `${a.horaInicio || '___'} horas del día ${formatearFecha(a.fecha)}, ` +
      `se reunieron los accionistas de <strong>${s.nombre}</strong> en Asamblea General ` +
      `Extraordinaria de Accionistas, convocada para tratar los asuntos especiales que se ` +
      `detallan en la agenda, de conformidad con el pacto social y la Ley 32 de 1927.`,
  },

  JUNTA_DIRECTIVA: {
    titulo: 'ACTA DE SESIÓN DE JUNTA DIRECTIVA',
    agendaSugerida: [
      '1. Verificación del quórum y apertura de la sesión.',
      '2. Lectura y aprobación del acta anterior.',
      '3. Informe del Presidente.',
      '4. Revisión y aprobación de estados financieros.',
      '5. Resoluciones de la Junta Directiva.',
      '6. Asuntos generales.',
      '7. Cierre de la sesión.',
    ],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, República de Panamá, siendo las ` +
      `${a.horaInicio || '___'} horas del día ${formatearFecha(a.fecha)}, ` +
      `se reunieron los miembros de la Junta Directiva de <strong>${s.nombre}</strong>, ` +
      `en sesión ordinaria de la Junta Directiva, con el quórum necesario para deliberar y tomar acuerdos.`,
  },

  RESOLUCION: {
    titulo: 'RESOLUCIÓN DE JUNTA DIRECTIVA',
    agendaSugerida: ['1. Lectura y aprobación de la resolución.'],
    textoApertura: (s, a) =>
      `Los miembros de la Junta Directiva de <strong>${s.nombre}</strong>, ` +
      `reunidos en sesión del día ${formatearFecha(a.fecha)}, ` +
      `y de conformidad con las facultades que les confiere el pacto social, adoptan la siguiente resolución:`,
  },

  NOMBRAMIENTO_DIGNATARIOS: {
    titulo: 'ACTA DE NOMBRAMIENTO DE DIGNATARIOS',
    agendaSugerida: [
      '1. Verificación del quórum.',
      '2. Nombramiento de Presidente.',
      '3. Nombramiento de Secretario.',
      '4. Nombramiento de Tesorero.',
      '5. Aceptación de cargos.',
      '6. Cierre.',
    ],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, República de Panamá, el día ${formatearFecha(a.fecha)}, ` +
      `la Junta Directiva de <strong>${s.nombre}</strong> procede al nombramiento de dignatarios ` +
      `para el período que corresponde, de conformidad con el pacto social y la Ley 32 de 1927.`,
  },

  APROBACION_ESTADOS_FINANCIEROS: {
    titulo: 'ACTA DE APROBACIÓN DE ESTADOS FINANCIEROS',
    agendaSugerida: [
      '1. Presentación de estados financieros por el Tesorero.',
      '2. Revisión del balance general.',
      '3. Revisión del estado de resultados.',
      '4. Aprobación de los estados financieros.',
      '5. Instrucciones al Secretario.',
    ],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, el día ${formatearFecha(a.fecha)}, ` +
      `los accionistas y directivos de <strong>${s.nombre}</strong> se reúnen para la ` +
      `presentación, revisión y aprobación de los estados financieros del ejercicio fiscal correspondiente.`,
  },

  DISTRIBUCION_DIVIDENDOS: {
    titulo: 'ACTA DE DISTRIBUCIÓN DE DIVIDENDOS',
    agendaSugerida: [
      '1. Presentación del resultado del ejercicio.',
      '2. Propuesta de distribución de dividendos.',
      '3. Aprobación del monto por acción.',
      '4. Instrucciones de pago.',
    ],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, el día ${formatearFecha(a.fecha)}, ` +
      `la Asamblea General de Accionistas de <strong>${s.nombre}</strong> aprueba la ` +
      `distribución de dividendos del ejercicio fiscal, conforme a los estados financieros aprobados.`,
  },

  AUMENTO_CAPITAL: {
    titulo: 'ACTA DE AUMENTO DE CAPITAL SOCIAL',
    agendaSugerida: [
      '1. Exposición de la necesidad de aumento de capital.',
      '2. Propuesta de monto del aumento.',
      '3. Forma y condiciones de suscripción.',
      '4. Aprobación del aumento de capital.',
      '5. Instrucciones para protocolización en el Registro Público.',
    ],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, el día ${formatearFecha(a.fecha)}, ` +
      `la Asamblea General Extraordinaria de Accionistas de <strong>${s.nombre}</strong> ` +
      `se reúne con el objeto de aprobar el aumento del capital social autorizado, ` +
      `de conformidad con el pacto social y la Ley 32 de 1927.`,
  },

  CAMBIO_DOMICILIO: {
    titulo: 'ACTA DE CAMBIO DE DOMICILIO SOCIAL',
    agendaSugerida: [
      '1. Exposición de la propuesta de cambio de domicilio.',
      '2. Nuevo domicilio propuesto.',
      '3. Aprobación del cambio de domicilio.',
      '4. Instrucciones para protocolización.',
    ],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, el día ${formatearFecha(a.fecha)}, ` +
      `la Asamblea General Extraordinaria de Accionistas de <strong>${s.nombre}</strong> ` +
      `se reúne para aprobar el cambio del domicilio social de la corporación.`,
  },

  DISOLUCION_LIQUIDACION: {
    titulo: 'ACTA DE DISOLUCIÓN Y LIQUIDACIÓN',
    agendaSugerida: [
      '1. Presentación de la propuesta de disolución.',
      '2. Motivos de la disolución.',
      '3. Nombramiento del Liquidador.',
      '4. Aprobación de la disolución y liquidación.',
      '5. Instrucciones para protocolización e inscripción en el Registro Público.',
    ],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, el día ${formatearFecha(a.fecha)}, ` +
      `la Asamblea General Extraordinaria de Accionistas de <strong>${s.nombre}</strong> ` +
      `se reúne para deliberar y resolver sobre la disolución y liquidación de la sociedad, ` +
      `de conformidad con lo establecido en la Ley 32 de 1927.`,
  },

  OTRO: {
    titulo: 'ACTA DE REUNIÓN',
    agendaSugerida: ['1. Apertura de la sesión.', '2. Puntos del día.', '3. Cierre.'],
    textoApertura: (s, a) =>
      `En la ciudad de ${a.lugar || 'Panamá'}, el día ${formatearFecha(a.fecha)}, ` +
      `se reunieron los accionistas y/o directivos de <strong>${s.nombre}</strong>.`,
  },
};

export function htmlActa({ sociedad, acta, directores = [], accionistas = [] }) {
  const plantilla = contenidosPorTipo[acta.tipo] || contenidosPorTipo.OTRO;
  const numeroFormateado = String(acta.numero).padStart(3, '0');

  const listaDirectores = directores.length
    ? `<ul>${directores.map(d => `<li><strong>${d.nombre}</strong> — ${d.cargo}</li>`).join('')}</ul>`
    : '<p><em>(Registre los asistentes)</em></p>';

  const agendaHtml = acta.agenda
    ? acta.agenda.split('\n').map(l => `<p>${l}</p>`).join('')
    : plantilla.agendaSugerida.map(p => `<p>${p}</p>`).join('');

  const acuerdosHtml = acta.acuerdos
    ? acta.acuerdos.split('\n').map(l => `<p>${l}</p>`).join('')
    : `<p><em>(Registre aquí los acuerdos adoptados en la reunión)</em></p>`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .numero-acta {
      font-size: 12pt; font-weight: bold; border: 1px solid #000;
      display: inline-block; padding: 4px 14px; margin-bottom: 12px;
    }
    .datos-reunion {
      background: #f8f8f8; border: 1px solid #ddd;
      padding: 12px 16px; margin: 16px 0; font-size: 11pt;
    }
    .datos-reunion table { margin: 0; }
    .datos-reunion td { border: none; padding: 3px 8px; }
    .datos-reunion td:first-child { font-weight: bold; width: 140px; }
    .quorum-box {
      border: 2px solid #000; padding: 10px 16px;
      margin: 16px 0; font-size: 11pt;
    }
    .estado-${acta.estado?.toLowerCase()} {
      display: inline-block; padding: 2px 10px; border-radius: 3px;
      font-size: 10pt; font-weight: bold; margin-left: 8px;
    }
    .estado-borrador { background: #fef9c3; color: #854d0e; }
    .estado-firmada  { background: #dcfce7; color: #166534; }
    .estado-protocolizada { background: #dbeafe; color: #1e40af; }
  </style></head><body>

  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <p>Sociedad Anónima · República de Panamá</p>
    ${sociedad.ficha ? `<p>Ficha: ${sociedad.ficha} · Tomo: ${sociedad.tomo || '—'} · Folio: ${sociedad.folio || '—'}</p>` : ''}
  </div>

  <div style="text-align:center; margin-bottom:20px;">
    <div class="numero-acta">ACTA N° ${numeroFormateado}</div>
    <span class="estado-${acta.estado?.toLowerCase()}">${acta.estado || 'BORRADOR'}</span>
    <div style="font-size:14pt; font-weight:bold; text-transform:uppercase;
                letter-spacing:1px; margin-top:8px;">${plantilla.titulo}</div>
  </div>

  <div class="datos-reunion">
    <table>
      <tr><td>Tipo de reunión:</td><td>${plantilla.titulo}</td></tr>
      <tr><td>Número de acta:</td><td>${numeroFormateado}</td></tr>
      <tr><td>Fecha:</td><td>${formatearFecha(acta.fecha)}</td></tr>
      <tr><td>Lugar:</td><td>${acta.lugar || '___________'}</td></tr>
      ${acta.quorum ? `<tr><td>Quórum:</td><td>${acta.quorum}</td></tr>` : ''}
    </table>
  </div>

  <div class="cuerpo">
    <div class="seccion">
      <div class="seccion-titulo">I. APERTURA</div>
      <p>${plantilla.textoApertura(sociedad, acta)}</p>
    </div>

    ${directores.length ? `
    <div class="seccion">
      <div class="seccion-titulo">II. ASISTENTES</div>
      ${listaDirectores}
    </div>` : ''}

    ${acta.quorum ? `
    <div class="quorum-box">
      <strong>QUÓRUM:</strong> ${acta.quorum}
    </div>` : ''}

    <div class="seccion">
      <div class="seccion-titulo">${directores.length ? 'III' : 'II'}. AGENDA</div>
      ${agendaHtml}
    </div>

    <div class="seccion">
      <div class="seccion-titulo">${directores.length ? 'IV' : 'III'}. ACUERDOS ADOPTADOS</div>
      ${acuerdosHtml}
    </div>

    <div class="seccion">
      <div class="seccion-titulo">CIERRE</div>
      <p>No habiendo más asuntos que tratar, se da por terminada la reunión siendo las
      ${acta.horaFin || '___'} horas del día ${formatearFecha(acta.fecha)}, en fe de lo cual
      se levanta la presente acta que firma el Secretario de la reunión.</p>
    </div>
  </div>

  <div class="firmas">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Presidente de la Reunión</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Secretario de la Reunión</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
  </div>

  <div class="pie-pagina">
    GESTARGOV · Acta N° ${numeroFormateado} · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
