import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, PageOrientation,
  Header, Footer, PageNumber, NumberFormat, convertInchesToTwip,
  UnderlineType, ShadingType,
} from 'docx';

export { Packer };

// Helpers de formato
export const bold   = (text, size = 24) => new TextRun({ text: String(text), bold: true, size });
export const normal = (text, size = 24) => new TextRun({ text: String(text), size });
export const italic = (text, size = 24) => new TextRun({ text: String(text), italics: true, size });

export function parrafo(runs, opciones = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [normal(runs)],
    spacing: { after: 160 },
    alignment: AlignmentType.JUSTIFIED,
    ...opciones,
  });
}

export function titulo(texto, nivel = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text: texto,
    heading: nivel,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
}

export function centrado(runs) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [bold(runs)],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  });
}

export function lineaFirma(nombre, cargo) {
  return [
    new Paragraph({
      children: [new TextRun({ text: ' ', size: 24 })],
      spacing: { before: 800, after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
    }),
    new Paragraph({
      children: [bold(nombre, 22)],
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 0 },
    }),
    new Paragraph({
      children: [italic(cargo, 22)],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
    }),
  ];
}

export function tablaSimple(encabezados, filas, anchos) {
  const makeCell = (text, isHeader = false) =>
    new TableCell({
      children: [new Paragraph({
        children: [isHeader ? bold(text, 22) : normal(text, 22)],
        alignment: AlignmentType.LEFT,
        spacing: { before: 80, after: 80 },
      })],
      shading: isHeader ? { type: ShadingType.SOLID, color: 'E8E8E8' } : undefined,
    });

  const headerRow = new TableRow({
    children: encabezados.map(h => makeCell(h, true)),
    tableHeader: true,
  });

  const dataRows = filas.map(fila =>
    new TableRow({ children: fila.map(c => makeCell(String(c ?? ''))) })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Configura márgenes y encabezado/pie de página estándar legal panameño
export function configuracionDocumento(opciones = {}) {
  return {
    sections: [],
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    ...opciones,
  };
}

export async function generarDocxBuffer(seccion) {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Times New Roman', size: 24 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left:   convertInchesToTwip(1.25),
              right:  convertInchesToTwip(1.25),
            },
          },
        },
        ...seccion,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
