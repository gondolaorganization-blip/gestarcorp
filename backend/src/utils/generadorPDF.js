import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function htmlAPDF(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '25mm', right: '25mm' },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

export function formatearFecha(fecha, fmt = "d 'de' MMMM 'de' yyyy") {
  if (!fecha) return '___________';
  return format(new Date(fecha), fmt, { locale: es });
}

export function formatearMoneda(monto) {
  if (monto == null) return 'N/D';
  return new Intl.NumberFormat('es-PA', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2
  }).format(Number(monto));
}

// Estilos CSS reutilizables para todos los documentos legales
export const estilosLegales = `
  @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:ital,wght@0,400;0,700;1,400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
    background: #fff;
  }
  .encabezado {
    text-align: center;
    margin-bottom: 24px;
    border-bottom: 2px solid #000;
    padding-bottom: 16px;
  }
  .encabezado h1 { font-size: 14pt; text-transform: uppercase; letter-spacing: 1px; }
  .encabezado h2 { font-size: 13pt; margin-top: 6px; }
  .encabezado p  { font-size: 11pt; margin-top: 4px; color: #333; }
  .cuerpo { text-align: justify; }
  .cuerpo p { margin-bottom: 12px; }
  .seccion { margin-top: 20px; }
  .seccion-titulo {
    font-weight: bold;
    text-transform: uppercase;
    text-decoration: underline;
    margin-bottom: 8px;
  }
  .firmas {
    margin-top: 60px;
    display: flex;
    justify-content: space-around;
    gap: 40px;
  }
  .firma-bloque { text-align: center; flex: 1; }
  .firma-linea {
    border-top: 1px solid #000;
    margin-bottom: 6px;
    margin-top: 50px;
  }
  .firma-nombre { font-weight: bold; font-size: 11pt; }
  .firma-cargo  { font-size: 10pt; font-style: italic; }
  .pie-pagina {
    position: fixed;
    bottom: 8mm;
    left: 0; right: 0;
    text-align: center;
    font-size: 9pt;
    color: #666;
    border-top: 1px solid #ccc;
    padding-top: 4px;
  }
  .numero-certificado {
    font-size: 11pt;
    border: 1px solid #000;
    display: inline-block;
    padding: 4px 12px;
    margin-bottom: 8px;
  }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #555; padding: 6px 10px; font-size: 11pt; }
  th { background: #f0f0f0; font-weight: bold; text-align: left; }
`;
