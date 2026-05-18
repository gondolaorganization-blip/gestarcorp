import { estilosLegales, formatearFecha, formatearMoneda } from '../../../utils/generadorPDF.js';

export function htmlPactoSocial({ sociedad, directores, accionistas }) {
  const presidente = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = directores.find(d => d.cargo === 'SECRETARIO');
  const tesorero   = directores.find(d => d.cargo === 'TESORERO');

  const articuloCapital = sociedad.cantidadAcciones
    ? `${sociedad.cantidadAcciones?.toLocaleString('es-PA')} acciones ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'} de ${formatearMoneda(sociedad.valorNominal)} cada una`
    : '___________';

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <style>
    ${estilosLegales}
    .articulo { margin-bottom:16px; }
    .art-num { font-weight:bold; text-decoration:underline; }
  </style></head><body>

  <div class="encabezado">
    <h1>PACTO SOCIAL</h1>
    <h2>${sociedad.nombre}</h2>
    <p>Sociedad Anónima · República de Panamá</p>
    <p>Ley 32 de 1927</p>
  </div>

  <div class="cuerpo">
    <p>Los suscritos, mayores de edad, capaces civilmente, de las generales que se
    dirán, han convenido en constituir una sociedad anónima, de conformidad con la
    Ley 32 de 1927 de la República de Panamá, bajo las cláusulas y disposiciones
    que a continuación se expresan:</p>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO PRIMERO – NOMBRE:</span>
      La sociedad se denominará <strong>${sociedad.nombre}</strong>.</p>
    </div>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO SEGUNDO – DOMICILIO:</span>
      El domicilio principal de la sociedad será en la
      <strong>${sociedad.domicilio || 'República de Panamá'}</strong>,
      sin perjuicio de que pueda establecer agencias, sucursales u oficinas en
      cualquier lugar de la República de Panamá o en el extranjero.</p>
    </div>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO TERCERO – OBJETO:</span>
      La sociedad podrá dedicarse a toda clase de negocios lícitos, actos de comercio
      y actividades industriales, financieras o de servicios, tanto en la República de
      Panamá como en el extranjero, incluyendo sin limitación la adquisición y disposición
      de bienes muebles e inmuebles, participaciones en otras entidades, y cualesquiera
      otras actividades permitidas por la ley.</p>
    </div>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO CUARTO – DURACIÓN:</span>
      La sociedad tendrá una duración <strong>indefinida</strong> a partir de la fecha de
      su inscripción en el Registro Público.</p>
    </div>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO QUINTO – CAPITAL AUTORIZADO:</span>
      El capital autorizado de la sociedad es de
      <strong>${formatearMoneda(sociedad.capital)}</strong>,
      dividido en <strong>${articuloCapital}</strong>.</p>
    </div>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO SEXTO – JUNTA DIRECTIVA:</span>
      La sociedad será administrada por una Junta Directiva compuesta por un mínimo de
      tres (3) directores, quienes podrán ser personas naturales o jurídicas, nacionales
      o extranjeras. Los directores serán elegidos por la Junta de Accionistas y durarán
      en sus cargos por el período que ésta determine. La Junta Directiva estará integrada
      por los cargos de Presidente, Secretario y Tesorero, como mínimo.</p>
    </div>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO SÉPTIMO – REPRESENTACIÓN:</span>
      La representación legal de la sociedad corresponde al Presidente de la Junta
      Directiva, quien tendrá las más amplias facultades de administración y disposición,
      con o sin la firma conjunta de otro dignatario, según lo determine la Junta Directiva
      mediante resolución.</p>
    </div>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO OCTAVO – AGENTE RESIDENTE:</span>
      La sociedad tendrá un Agente Residente en la República de Panamá conforme a lo
      establecido en el Artículo 2 de la Ley 32 de 1927. El Agente Residente tendrá
      las obligaciones señaladas en la Ley 52 de 2016 y demás normas aplicables.</p>
    </div>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO NOVENO – LIBROS:</span>
      La sociedad llevará los libros requeridos por la ley, incluyendo el Libro de
      Registro de Acciones, Libro de Actas y demás que sean necesarios para el
      correcto funcionamiento corporativo.</p>
    </div>

    <div class="articulo">
      <p><span class="art-num">ARTÍCULO DÉCIMO – DISOLUCIÓN:</span>
      La sociedad podrá disolverse por las causas establecidas en la Ley 32 de 1927 y
      mediante acuerdo de la Junta de Accionistas convocada para tal efecto.</p>
    </div>

    <p style="margin-top:20px">Los directores fundadores de la sociedad son:</p>
    <table style="margin:12px 0">
      <tr><th>Cargo</th><th>Nombre</th><th>Documento</th></tr>
      ${presidente ? `<tr><td>Presidente</td><td>${presidente.nombre}</td><td>${presidente.tipoDocumento} ${presidente.numeroDocumento}</td></tr>` : ''}
      ${secretario ? `<tr><td>Secretario</td><td>${secretario.nombre}</td><td>${secretario.tipoDocumento} ${secretario.numeroDocumento}</td></tr>` : ''}
      ${tesorero   ? `<tr><td>Tesorero</td><td>${tesorero.nombre}</td><td>${tesorero.tipoDocumento} ${tesorero.numeroDocumento}</td></tr>` : ''}
    </table>

    <p>El presente Pacto Social fue firmado en la Ciudad de Panamá, República de Panamá,
    el <strong>${formatearFecha(sociedad.fechaConstitucion || new Date())}</strong>.</p>
  </div>

  <div class="firmas">
    ${[presidente, secretario, tesorero].filter(Boolean).map(d => `
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${d.nombre}</div>
      <div class="firma-cargo">${d.cargo}</div>
    </div>`).join('')}
  </div>

  <div class="pie-pagina">
    GESTARCORP · Pacto Social · ${sociedad.nombre} · ${formatearFecha(new Date())}
  </div>
  </body></html>`;
}
