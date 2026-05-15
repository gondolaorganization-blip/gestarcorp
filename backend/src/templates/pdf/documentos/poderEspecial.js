import { estilosLegales, formatearFecha } from '../../../utils/generadorPDF.js';

export function htmlPoderEspecial({ sociedad, directores, apoderado, propositoEspecifico, notario }) {
  const presidente = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = directores.find(d => d.cargo === 'SECRETARIO');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
  </style></head><body>

  <div class="encabezado">
    <h1>${sociedad.nombre}</h1>
    <h2>PODER ESPECIAL</h2>
    <p>Special Power of Attorney</p>
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
    <strong>PODER ESPECIAL</strong> a favor de:</p>

    <div style="border:1px solid #000; padding:12px 16px; margin:16px 0; background:#fafafa;">
      <p style="margin:0"><strong>Nombre:</strong> ${apoderado?.nombre || '___________'}</p>
      <p style="margin:4px 0 0"><strong>${apoderado?.tipoDocumento || 'Cédula / Pasaporte'}:</strong>
      ${apoderado?.numeroDocumento || '___________'}</p>
      ${apoderado?.nacionalidad ? `<p style="margin:4px 0 0"><strong>Nacionalidad:</strong> ${apoderado.nacionalidad}</p>` : ''}
    </div>

    <p>Para que en nombre y representación de <strong>${sociedad.nombre}</strong>,
    lleve a cabo <strong>exclusivamente</strong> el siguiente acto específico:</p>

    <div style="border-left:4px solid #1e40af; padding:12px 16px; margin:16px 0; background:#eff6ff;">
      <p style="margin:0; font-style:italic">${propositoEspecifico || '___________________________________________\n___________________________________________\n___________________________________________'}</p>
    </div>

    <p>Las facultades conferidas en el presente poder se limitan estrictamente al acto
    descrito y quedarán extinguidas de pleno derecho una vez consumado el mismo o al
    vencimiento del plazo establecido, lo que ocurra primero.</p>

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
    GESTARGOV · Poder Especial · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
