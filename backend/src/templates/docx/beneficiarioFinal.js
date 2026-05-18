import { Paragraph, AlignmentType, BorderStyle } from 'docx';
import {
  bold, normal, italic, parrafo, centrado, tablaSimple, generarDocxBuffer,
} from '../../utils/generadorWord.js';
import { formatearFecha } from '../../utils/generadorPDF.js';

export async function docxDeclaracionBeneficiarios({ sociedad, beneficiarios }) {
  const fechaHoy = formatearFecha(new Date());

  const filas = beneficiarios.map((b, i) => [
    String(i + 1),
    b.nombre,
    `${b.tipoDocumento}: ${b.numeroDocumento}`,
    b.nacionalidad || '—',
    b.fechaNacimiento ? formatearFecha(b.fechaNacimiento, 'dd/MM/yyyy') : '—',
    b.porcentajeControl != null ? `${Number(b.porcentajeControl).toFixed(2)}%` : '—',
    b.tipoControl,
    b.esPEP ? 'SÍ' : 'NO',
    b.verificado ? 'Verificado' : 'Pendiente',
  ]);

  const children = [
    centrado([bold(sociedad.nombre.toUpperCase(), 28)]),
    centrado([bold('REGISTRO DE BENEFICIARIOS FINALES', 26)]),
    centrado([normal('Conforme a la Ley 52 de 22 de octubre de 2016', 22)]),
    centrado([normal(
      `Ficha: ${sociedad.ficha || '—'}  ·  Tomo: ${sociedad.tomo || '—'}  ·  Folio: ${sociedad.folio || '—'}`, 20
    )]),
    centrado([italic(`Generado el ${fechaHoy}`, 20)]),

    new Paragraph({ text: '', spacing: { after: 200 } }),

    parrafo([bold('CONFIDENCIAL — USO OFICIAL. ', 22),
      normal(
        'La presente declaración se emite de conformidad con la Ley 52 de 2016 de la República de Panamá, ' +
        'que establece la obligación del Agente Residente de conocer y mantener información actualizada ' +
        'sobre los beneficiarios finales. Se entiende por beneficiario final toda persona natural que, ' +
        'directa o indirectamente, sea propietaria o ejerza control sobre el 25% o más de las acciones ' +
        'o derechos de voto.', 22
      )
    ]),

    new Paragraph({ text: '', spacing: { after: 160 } }),

    // Resumen numérico
    tablaSimple(
      ['Indicador', 'Valor'],
      [
        ['Total de beneficiarios declarados', String(beneficiarios.length)],
        ['PEP identificados', String(beneficiarios.filter(b => b.esPEP).length)],
        ['Beneficiarios verificados', String(beneficiarios.filter(b => b.verificado).length)],
        ['Beneficiarios pendientes de verificación', String(beneficiarios.filter(b => !b.verificado).length)],
      ]
    ),

    new Paragraph({ text: '', spacing: { after: 200 } }),

    new Paragraph({
      children: [bold('DETALLE DE BENEFICIARIOS FINALES', 24)],
      spacing: { before: 200, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
    }),

    new Paragraph({ text: '', spacing: { after: 120 } }),

    beneficiarios.length === 0
      ? parrafo([italic('No se han registrado beneficiarios finales.')])
      : tablaSimple(
          ['#', 'Nombre', 'Documento', 'Nacion.', 'Nacimiento', '% Control', 'Tipo', 'PEP', 'Estado'],
          filas
        ),

    new Paragraph({ text: '', spacing: { after: 200 } }),

    // PEPs detalle
    ...(beneficiarios.filter(b => b.esPEP).length > 0 ? [
      new Paragraph({
        children: [bold('PERSONAS EXPUESTAS POLÍTICAMENTE (PEP)', 24)],
        spacing: { before: 200, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cc0000' } },
      }),
      ...beneficiarios.filter(b => b.esPEP).map(b =>
        parrafo([bold(`${b.nombre}: `), normal(`Cargo público: ${b.cargoPublico || 'No especificado'}`)])
      ),
    ] : []),

    new Paragraph({ text: '', spacing: { after: 200 } }),

    // Declaración
    new Paragraph({
      children: [bold('DECLARACIÓN DEL AGENTE RESIDENTE', 24)],
      spacing: { before: 200, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
    }),
    parrafo([normal(
      `El Agente Residente de ${sociedad.nombre} declara que la información contenida en el presente ` +
      `registro es completa, veraz y actualizada al día de hoy, ${fechaHoy}, de conformidad con la ` +
      `Ley 52 de 2016 y sus reglamentaciones.`
    )]),

    new Paragraph({ text: '', spacing: { after: 600 } }),

    new Paragraph({
      children: [bold('_________________________________          _________________________________', 22)],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 80 },
    }),
    new Paragraph({
      children: [normal('         Agente Residente                              Representante Legal', 22)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [italic(`         Registro N° ___________                       ${sociedad.nombre}`, 20)],
      alignment: AlignmentType.CENTER,
    }),

    new Paragraph({ text: '', spacing: { after: 300 } }),
    new Paragraph({
      children: [italic(
        `GESTARCORP · Registro de Beneficiarios Finales — Ley 52 de 2016 · ${fechaHoy}`, 18
      )],
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: '888888' } },
    }),
  ];

  return generarDocxBuffer({ children });
}
