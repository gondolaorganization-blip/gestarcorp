import {
  bold, normal, italic, parrafo, centrado, tablaSimple, lineaFirma, generarDocxBuffer
} from '../../../utils/generadorWord.js';
import { formatearFecha } from '../../../utils/generadorPDF.js';
import { Paragraph, AlignmentType, TextRun } from 'docx';

export async function docxResolucionAperturaCuenta({ sociedad, directores, banco, firmantes }) {
  const presidente = directores.find(d => d.cargo === 'PRESIDENTE');
  const secretario = directores.find(d => d.cargo === 'SECRETARIO');
  const tesorero   = directores.find(d => d.cargo === 'TESORERO');

  const firmantesDefault = [presidente, tesorero, secretario].filter(Boolean);
  const listaFirmantes   = (firmantes && firmantes.length > 0) ? firmantes : firmantesDefault;
  const numRes = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2,'0')}-001`;

  const considerando = (num, texto) => parrafo([bold(`${num}: `), normal(texto)]);
  const resuelve     = (num, texto) => parrafo([bold(`${num}: `), normal(texto)]);

  const children = [
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([bold('RESOLUCIÓN DE JUNTA DIRECTIVA', 26)]),
    centrado([normal('Apertura de Cuenta Bancaria', 24)]),
    centrado([normal(`Resolución No. ${numRes}`, 22)]),
    new Paragraph({ spacing: { after: 300 } }),
    parrafo([
      normal('Los suscritos, Presidente y Secretario de la Junta Directiva de la sociedad '),
      bold(sociedad.nombre),
      normal(`, sociedad anónima inscrita en el Registro Público de Panamá, Ficha `),
      bold(sociedad.ficha || '___________'), normal(`,`),
    ]),
    new Paragraph({ children: [bold('CONSIDERANDO:', 24)], spacing: { after: 120 }, alignment: AlignmentType.JUSTIFIED }),
    considerando('PRIMERO', 'Que la sociedad requiere apertura de cuenta bancaria para el manejo de sus fondos y operaciones comerciales.'),
    considerando('SEGUNDO', `Que el banco ${banco || '___________'} ofrece los servicios adecuados para las necesidades de la sociedad.`),
    considerando('TERCERO', 'Que la Junta Directiva, debidamente convocada y constituida, ha deliberado y acordado lo siguiente.'),
    new Paragraph({ children: [bold('RESUELVE:', 24)], spacing: { after: 120, before: 160 }, alignment: AlignmentType.JUSTIFIED }),
    resuelve('PRIMERO', `Autorizar la apertura de una o varias cuentas bancarias a nombre de ${sociedad.nombre} en ${banco || '___________'}.`),
    resuelve('SEGUNDO', 'Designar como firmantes autorizados de dichas cuentas a las siguientes personas:'),
    tablaSimple(
      ['Nombre', 'Cargo', 'Documento'],
      listaFirmantes.map(f => [f?.nombre || '___________', f?.cargo || '___________', `${f?.tipoDocumento || ''} ${f?.numeroDocumento || '___________'}`])
    ),
    new Paragraph({ spacing: { after: 160 } }),
    resuelve('TERCERO', 'Autorizar a los firmantes designados para girar, endosar, depositar y retirar fondos, así como para suscribir todos los documentos bancarios que sean necesarios.'),
    resuelve('CUARTO', 'La presente resolución tendrá plena vigencia desde la fecha de su adopción y hasta que sea revocada expresamente por la Junta Directiva.'),
    parrafo([
      normal('Adoptada en la Ciudad de Panamá, República de Panamá, el '),
      bold(formatearFecha(new Date())), normal('.'),
    ]),
    new Paragraph({ spacing: { after: 400 } }),
    ...lineaFirma(presidente?.nombre || '___________', `Presidente — ${sociedad.nombre}`),
    new Paragraph({ spacing: { after: 200 } }),
    ...lineaFirma(secretario?.nombre || '___________', `Secretario — ${sociedad.nombre}`),
  ];

  return generarDocxBuffer({ children });
}
