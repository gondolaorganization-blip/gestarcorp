import { estilosLegales, formatearFecha } from '../../../utils/generadorPDF.js';

export function htmlDeclaracionJuradaDirector({ sociedad, director }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .declarante-box {
      border: 1px solid #000; padding:14px 18px; margin:16px 0; background:#fafafa;
    }
    .declaraciones { counter-reset: decl; margin: 12px 0; }
    .declaracion-item {
      display:flex; gap:12px; margin-bottom:12px; align-items:flex-start;
    }
    .decl-num {
      min-width:28px; height:28px; background:#1e40af; color:#fff;
      border-radius:50%; display:flex; align-items:center; justify-content:center;
      font-size:10pt; font-weight:bold; flex-shrink:0; margin-top:2px;
    }
  </style></head><body>

  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <h2>DECLARACIÓN JURADA DE DIRECTOR</h2>
    <p>Ley 52 de 2016 · Registro Público de Panamá</p>
  </div>

  <div class="cuerpo">
    <p>Yo, el suscrito, declaro bajo juramento que los datos que suministro a continuación
    son verídicos y exactos, en cumplimiento con lo establecido por la Ley 52 de 2016 y
    demás normas concordantes de la República de Panamá:</p>

    <div class="declarante-box">
      <p style="margin:0 0 8px 0"><strong>Nombre completo:</strong> ${director?.nombre || '___________'}</p>
      <p style="margin:0 0 4px 0"><strong>Tipo de documento:</strong> ${director?.tipoDocumento || '___________'}</p>
      <p style="margin:0 0 4px 0"><strong>Número de documento:</strong> ${director?.numeroDocumento || '___________'}</p>
      ${director?.nacionalidad ? `<p style="margin:0 0 4px 0"><strong>Nacionalidad:</strong> ${director.nacionalidad}</p>` : ''}
      <p style="margin:0 0 4px 0"><strong>Cargo en la sociedad:</strong> ${director?.cargo || '___________'}</p>
      <p style="margin:0"><strong>Fecha de nombramiento:</strong> ${formatearFecha(director?.fechaNombramiento)}</p>
    </div>

    <p><strong>En relación con la sociedad <em>${sociedad.nombre}</em>,
    Ficha ${sociedad.ficha || '___________'} del Registro Público de Panamá,
    DECLARO BAJO JURAMENTO:</strong></p>

    <div class="declaraciones">
      <div class="declaracion-item">
        <div class="decl-num">1</div>
        <p style="margin:0">Que ostento el cargo de <strong>${director?.cargo || '___________'}</strong>
        de la sociedad y estoy facultado para actuar en dicha calidad conforme a los estatutos
        sociales y la Ley 32 de 1927.</p>
      </div>
      <div class="declaracion-item">
        <div class="decl-num">2</div>
        <p style="margin:0">Que los datos de identidad suministrados son exactos y corresponden
        a los documentos oficiales de identificación personal que tengo en mi poder.</p>
      </div>
      <div class="declaracion-item">
        <div class="decl-num">3</div>
        <p style="margin:0">Que no existen condenas penales firmes en mi contra relacionadas con
        delitos de blanqueo de capitales, financiamiento del terrorismo, o delitos conexos,
        conforme a la legislación panameña e internacional aplicable.</p>
      </div>
      <div class="declaracion-item">
        <div class="decl-num">4</div>
        <p style="margin:0">Que me comprometo a mantener actualizados mis datos ante el
        agente residente de la sociedad y a notificar cualquier cambio relevante en un
        plazo no mayor de treinta (30) días calendario.</p>
      </div>
      <div class="declaracion-item">
        <div class="decl-num">5</div>
        <p style="margin:0">Que comprendo que la falsedad en las declaraciones aquí vertidas
        acarrea las responsabilidades penales y civiles previstas en la legislación panameña.</p>
      </div>
    </div>

    <p>Firmo la presente declaración en la Ciudad de Panamá, República de Panamá,
    el <strong>${formatearFecha(new Date())}</strong>.</p>
  </div>

  <div class="firmas" style="margin-top:50px">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${director?.nombre || '___________'}</div>
      <div class="firma-cargo">${director?.cargo || 'Director'}</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
  </div>

  <div class="pie-pagina">
    GESTARGOV · Declaración Jurada de Director · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
