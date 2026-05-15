import { estilosLegales, formatearFecha } from '../../../utils/generadorPDF.js';

export function htmlPoderGeneral({ sociedad, directores, apoderado, facultades, notario }) {
  const presidente = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = directores.find(d => d.cargo === 'SECRETARIO');

  const facultadesDefault = [
    'Representar a la sociedad ante toda clase de personas naturales y jurídicas, públicas y privadas.',
    'Abrir, cerrar y manejar cuentas bancarias; girar, endosar, cobrar y depositar cheques.',
    'Suscribir contratos, convenios y demás actos jurídicos en nombre de la sociedad.',
    'Gestionar y tramitar permisos, licencias y registros ante cualquier autoridad.',
    'Ejercer cualquier otro acto de administración ordinaria necesario para el cumplimiento del objeto social.',
  ];

  const listaFacultades = (facultades && facultades.length > 0) ? facultades : facultadesDefault;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    ol.facultades { margin: 12px 0 12px 24px; }
    ol.facultades li { margin-bottom: 8px; text-align: justify; }
  </style></head><body>

  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <h2>PODER GENERAL</h2>
    <p>General Power of Attorney</p>
  </div>

  <div class="cuerpo">
    <p>Nosotros, <strong>${presidente?.nombre || '___________'}</strong>, en su calidad de
    Presidente, y <strong>${secretario?.nombre || '___________'}</strong>, en su calidad
    de Secretario, de la sociedad anónima denominada <strong>${sociedad.nombre}</strong>,
    debidamente inscrita en el Registro Público de la República de Panamá, Ficha
    <strong>${sociedad.ficha || '___________'}</strong>, Tomo
    <strong>${sociedad.tomo || '___________'}</strong>, Folio
    <strong>${sociedad.folio || '___________'}</strong>;</p>

    <p><strong>OTORGAMOS</strong> por medio del presente instrumento
    <strong>PODER GENERAL AMPLIO Y SUFICIENTE</strong> a favor de:</p>

    <div style="border:1px solid #000; padding:12px 16px; margin:16px 0; background:#fafafa;">
      <p style="margin:0"><strong>Nombre:</strong> ${apoderado?.nombre || '___________'}</p>
      <p style="margin:4px 0 0"><strong>${apoderado?.tipoDocumento || 'Cédula / Pasaporte'}:</strong>
      ${apoderado?.numeroDocumento || '___________'}</p>
      ${apoderado?.nacionalidad ? `<p style="margin:4px 0 0"><strong>Nacionalidad:</strong> ${apoderado.nacionalidad}</p>` : ''}
    </div>

    <p>Para que en nombre y representación de <strong>${sociedad.nombre}</strong>,
    pueda realizar los siguientes actos y gestiones, sin limitación alguna:</p>

    <ol class="facultades">
      ${listaFacultades.map(f => `<li>${f}</li>`).join('')}
    </ol>

    <p>El presente poder tendrá vigencia indefinida a partir de la fecha de su otorgamiento,
    salvo que sea revocado expresamente por la Junta Directiva de la sociedad.</p>

    <p>En fe de lo cual, firmamos en la Ciudad de Panamá, República de Panamá,
    el <strong>${formatearFecha(new Date())}</strong>.</p>
  </div>

  <div class="firmas">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${presidente?.nombre || '___________'}</div>
      <div class="firma-cargo">Presidente</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${secretario?.nombre || '___________'}</div>
      <div class="firma-cargo">Secretario</div>
      <div class="firma-cargo">${sociedad.nombre}</div>
    </div>
  </div>

  ${notario ? `
  <div class="seccion" style="margin-top:40px; border-top:1px dashed #000; padding-top:16px;">
    <div class="seccion-titulo">Autenticación Notarial</div>
    <p>Ante mí, <strong>${notario.nombre}</strong>, Notario Público de la República de Panamá,
    comparecieron los señores arriba indicados, a quienes identifico y quienes firmaron este
    instrumento en mi presencia.</p>
    <div class="firma-bloque" style="margin-top:40px; max-width:300px">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${notario.nombre}</div>
      <div class="firma-cargo">Notario Público</div>
    </div>
  </div>` : ''}

  <div class="pie-pagina">
    GESTARGOV · Poder General · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
