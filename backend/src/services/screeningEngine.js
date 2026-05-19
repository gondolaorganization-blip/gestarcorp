/**
 * Motor de screening de sanciones ONU.
 *
 * Soporta dos tipos de archivo:
 *  - PDF: Notificaciones de la UAF (circulares de altas al Comité de Sanciones ONU).
 *         Formato SDi.NNN / SDe.NNN, texto extraíble directamente.
 *  - XML: Lista Consolidada completa de la ONU (publicada en main.un.org).
 *
 * Flujo:
 * 1. Parsea el archivo → extrae individuos/entidades sancionadas.
 * 2. Recopila todos los sujetos (directores, accionistas, apoderados, BFs) del agente.
 * 3. Pre-filtro algorítmico: token overlap. Descarta combinaciones sin tokens comunes.
 * 4. Evaluación con Claude haiku en batches de 8 (si ANTHROPIC_API_KEY está configurada).
 * 5. Persiste resultados y actualiza SesionScreening.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import Anthropic from '@anthropic-ai/sdk';
import { XMLParser } from 'fast-xml-parser';
import prisma from '../utils/prisma.js';

const require = createRequire(import.meta.url);

// ─── Constantes ────────────────────────────────────────────────────────────────

const BATCH_SIZE = 8;
const TOKEN_THRESHOLD = 1;    // PDF notificaciones son cortas → umbral más permisivo
const MIN_TOKEN_LEN = 3;

// ─── Parser PDF (notificaciones UAF / SC ONU) ─────────────────────────────────

/**
 * Parsea una notificación PDF del tipo SC/IDD.
 * Formato de entrada:
 *   SDi.011 Nombre/Name: 1: APELLIDO 2: NOMBRE ... Buena calidad a.k.a.: a) ALIAS ...
 *
 * Devuelve: [{ referenceNumber, tipo, names }]
 */
export async function parsearNotificacionPDF(rutaPDF) {
  const pdfParse = require('pdf-parse');
  const buf = fs.readFileSync(rutaPDF);
  const data = await pdfParse(buf);
  const texto = data.text;

  // Encontrar todas las referencias de entrada (SDi.NNN, SDe.NNN, SDi.NN, etc.)
  const refRegex = /\bSD[ie]\.\d+\b/gi;
  const refs = [...texto.matchAll(refRegex)].map(m => ({ ref: m[0], index: m.index }));

  const entradas = [];

  for (let i = 0; i < refs.length; i++) {
    const inicio = refs[i].index;
    const fin    = refs[i + 1]?.index ?? texto.length;
    // Normalizar saltos de línea y espacios múltiples (artefacto de renderizado PDF)
    const bloque = texto.slice(inicio + refs[i].ref.length, fin)
      .replace(/\n/g, ' ')
      .replace(/[ \t]{2,}/g, ' ');
    const ref    = refs[i].ref.toUpperCase();
    const names  = [];

    // — Extraer nombre principal (partes 1: 2: 3: 4:) ——————————————————————
    // Patrón: "Nombre: 1: AL-GONEY 2: HAMDAN 3: DAGALO 4: ..."
    //      o  "Name: 1: AL-GONEY 2: HAMDAN 3: DAGALO"
    const nameBlockMatch = bloque.match(
      /(?:Nombre|Name)\s*:\s*((?:\d[:.]\s+[A-ZÀ-ÿ][A-ZÀ-ÿ'\-\.]*\s*){1,4})/i
    );
    if (nameBlockMatch) {
      // Extraer cada parte numerada
      const partes = [...nameBlockMatch[1].matchAll(/\d[:.]\s+([A-ZÀ-ÿ][A-ZÀ-ÿ'\-\.]*)/gi)];
      const nombreCompleto = partes.map(p => p[1]).join(' ').trim();
      if (nombreCompleto) names.push(nombreCompleto);
    }

    // — Extraer aliases de buena calidad ————————————————————————————————————
    // Español: "Buena calidad, también conocido como: a) ALIAS1 b) ALIAS2"
    // Inglés:  "Good quality a.k.a.: a) ALIAS1 b) ALIAS2"
    const aliasBlockMatch = bloque.match(
      /(?:Buena calidad[^:]*|Good quality a\.k\.a\.)\s*:\s*(.*?)(?=(?:Baja calidad|Low quality|\bNacionalidad\b|\bNationality\b|\bFecha\b|\bDOB\b|\bPasaporte\b|\bPassport\b))/si
    );
    if (aliasBlockMatch) {
      const aliasText = aliasBlockMatch[1];
      // Capturar cada alias: "a) NOMBRE COMPLETO" hasta el siguiente "b)" o fin
      const aliasMatches = [...aliasText.matchAll(/[a-z]\)\s+(.+?)(?=\s+[a-z]\)|$)/g)];
      for (const m of aliasMatches) {
        const alias = m[1].trim();
        if (alias && alias.toLowerCase() !== 'na' && /[A-Z]/.test(alias)) {
          names.push(alias.toUpperCase());
        }
      }
    }

    if (names.length > 0) {
      entradas.push({
        referenceNumber: ref,
        tipo: ref.toUpperCase().includes('SDI') ? 'INDIVIDUAL' : 'ENTITY',
        names: [...new Set(names)],
      });
    }
  }

  return entradas;
}

// ─── Parser XML (lista consolidada ONU) ──────────────────────────────────────

export function parsearListaXML(rutaXML) {
  const xml = fs.readFileSync(rutaXML, 'utf8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => [
      'INDIVIDUAL', 'ENTITY', 'INDIVIDUAL_ALIAS', 'ENTITY_ALIAS',
    ].includes(name),
  });
  const doc = parser.parse(xml);
  const entradas = [];

  const individuals =
    doc?.CONSOLIDATED_LIST?.INDIVIDUALS?.INDIVIDUAL ||
    doc?.consolidated_list?.individuals?.individual || [];

  for (const ind of individuals) {
    const names = [];
    const parts = [ind.FIRST_NAME, ind.SECOND_NAME, ind.THIRD_NAME, ind.FOURTH_NAME].filter(Boolean);
    if (parts.length) names.push(parts.join(' ').trim());
    for (const a of (ind.INDIVIDUAL_ALIAS || [])) {
      if (a.ALIAS_NAME) names.push(String(a.ALIAS_NAME).trim());
    }
    entradas.push({
      referenceNumber: ind['@_referenceNumber'] || '',
      tipo: 'INDIVIDUAL',
      names: [...new Set(names.filter(Boolean))],
    });
  }

  const entities =
    doc?.CONSOLIDATED_LIST?.ENTITIES?.ENTITY ||
    doc?.consolidated_list?.entities?.entity || [];

  for (const ent of entities) {
    const names = [ent.FIRST_NAME].filter(Boolean);
    for (const a of (ent.ENTITY_ALIAS || [])) {
      if (a.ALIAS_NAME) names.push(String(a.ALIAS_NAME).trim());
    }
    entradas.push({
      referenceNumber: ent['@_referenceNumber'] || '',
      tipo: 'ENTITY',
      names: [...new Set(names.filter(Boolean))],
    });
  }

  return entradas;
}

// ─── Auto-detect y parse ──────────────────────────────────────────────────────

export async function parsearListaSanciones(rutaArchivo) {
  const ext = path.extname(rutaArchivo).toLowerCase();
  if (ext === '.pdf') return parsearNotificacionPDF(rutaArchivo);
  if (ext === '.xml') return parsearListaXML(rutaArchivo);
  throw new Error(`Formato no soportado: ${ext}. Use PDF (notificación UAF) o XML (lista ONU).`);
}

// ─── Pre-filtro algorítmico ───────────────────────────────────────────────────

function tokenizar(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= MIN_TOKEN_LEN);
}

function candidatosParaSujeto(nombreSujeto, listaONU) {
  const tokensSujeto = new Set(tokenizar(nombreSujeto));
  if (tokensSujeto.size === 0) return listaONU; // sin tokens → comparar todo (lista corta)

  return listaONU.filter(entrada =>
    entrada.names.some(name => {
      const tokensLista = tokenizar(name);
      const comunes = tokensLista.filter(t => tokensSujeto.has(t));
      return comunes.length >= TOKEN_THRESHOLD;
    })
  );
}

// ─── Evaluación con IA ────────────────────────────────────────────────────────

function buildPromptBatch(sujetos) {
  const items = sujetos.map(s => {
    const cands = s.candidatos
      .slice(0, 10)
      .map(c => `  [${c.referenceNumber}] ${c.names.join(' / ')}`)
      .join('\n');
    return `Sujeto ${s.idx}: "${s.nombre}"\nEntradas de la lista de sanciones:\n${cands}`;
  }).join('\n\n---\n\n');

  return `Eres un especialista en compliance antilavado de dinero (AML/CFT). Evalúa si los nombres de los sujetos coinciden con personas o entidades en la lista de sanciones de la ONU.

Considera: trasliteraciones (árabe, ruso, chino → latín), apodos, variaciones ortográficas, aliases, nombres en distinto orden. Ten en cuenta que muchos nombres son de personas de habla árabe o hispana con múltiples apellidos.

Clasificación:
- ALTA: casi con certeza la misma persona/entidad (≥85% probabilidad). Requiere acción inmediata.
- POSIBLE: similitud significativa que requiere revisión humana (40-84%).
- NINGUNA: no hay coincidencia relevante.

Responde ÚNICAMENTE con JSON en este formato exacto (sin texto adicional):
{
  "resultados": [
    {
      "sujetoIdx": <número>,
      "nivel": "ALTA" | "POSIBLE" | "NINGUNA",
      "referenciaONU": "<código SDi.NNN o null>",
      "justificacion": "<máximo 150 caracteres>"
    }
  ]
}

${items}`;
}

async function evaluarConIA(client, sujetos) {
  if (!sujetos.length) return [];
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPromptBatch(sujetos) }],
    });
    const text = msg.content[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    return JSON.parse(jsonMatch[0]).resultados || [];
  } catch (err) {
    console.error('[screening] Error IA:', err.message);
    return sujetos.map(s => ({
      sujetoIdx: s.idx,
      nivel: 'POSIBLE',
      referenciaONU: null,
      justificacion: 'Error de evaluación IA — requiere revisión manual',
    }));
  }
}

// ─── Obtener sujetos del agente ───────────────────────────────────────────────

async function obtenerSujetosAgente(agenteId) {
  const sociedades = await prisma.sociedad.findMany({
    where: { agenteId },
    select: {
      id: true,
      nombre: true,
      directores:  { where: { activo: true }, select: { id: true, nombre: true, numeroDocumento: true } },
      accionistas: { where: { activo: true }, select: { id: true, nombre: true, numeroDocumento: true } },
      apoderados:  { where: { activo: true }, select: { id: true, nombre: true, numeroDocumento: true } },
      beneficiarios: { select: { id: true, nombre: true, numeroDocumento: true } },
    },
  });

  const sujetos = [];
  for (const soc of sociedades) {
    for (const d of soc.directores)    sujetos.push({ ...d, sociedadId: soc.id, sociedadNombre: soc.nombre, tipoSujeto: 'DIRECTOR' });
    for (const a of soc.accionistas)   sujetos.push({ ...a, sociedadId: soc.id, sociedadNombre: soc.nombre, tipoSujeto: 'ACCIONISTA' });
    for (const ap of soc.apoderados)   sujetos.push({ ...ap, sociedadId: soc.id, sociedadNombre: soc.nombre, tipoSujeto: 'APODERADO' });
    for (const bf of soc.beneficiarios) sujetos.push({ ...bf, sociedadId: soc.id, sociedadNombre: soc.nombre, tipoSujeto: 'BENEFICIARIO' });
  }
  return { sociedades, sujetos };
}

// ─── Runner principal ─────────────────────────────────────────────────────────

export async function ejecutarScreening(sesionId, agenteId, rutaArchivo) {
  try {
    const listaSanciones = await parsearListaSanciones(rutaArchivo);

    const { sujetos } = await obtenerSujetosAgente(agenteId);
    const sociedadesUnicas = new Set(sujetos.map(s => s.sociedadId)).size;

    await prisma.sesionScreening.update({
      where: { id: sesionId },
      data: { totalSujetos: sujetos.length, totalSociedades: sociedadesUnicas, progreso: 5 },
    });

    if (sujetos.length === 0 || listaSanciones.length === 0) {
      await prisma.sesionScreening.update({
        where: { id: sesionId },
        data: { estado: 'COMPLETADO', progreso: 100, completadoEn: new Date() },
      });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const client = apiKey ? new Anthropic({ apiKey }) : null;

    const resultados = [];
    const conCandidatos = sujetos.map(s => ({
      ...s,
      candidatos: candidatosParaSujeto(s.nombre, listaSanciones),
    }));

    // Sujetos sin candidatos → NINGUNA directa
    for (const s of conCandidatos) {
      if (s.candidatos.length === 0) {
        resultados.push({
          sesionId,
          sociedadId: s.sociedadId,
          sociedadNombre: s.sociedadNombre,
          tipoSujeto: s.tipoSujeto,
          sujetoNombre: s.nombre,
          sujetoDocumento: s.numeroDocumento,
          nivel: 'NINGUNA',
          coincidenciasDetectadas: null,
          justificacionIA: null,
        });
      }
    }

    const conCand = conCandidatos.filter(s => s.candidatos.length > 0);
    const batches = [];
    for (let i = 0; i < conCand.length; i += BATCH_SIZE) batches.push(conCand.slice(i, i + BATCH_SIZE));

    let procesados = 0;
    for (const batch of batches) {
      const input = batch.map((s, li) => ({ idx: procesados + li, nombre: s.nombre, candidatos: s.candidatos, sujeto: s }));

      let evaluaciones;
      if (client) {
        evaluaciones = await evaluarConIA(client, input);
      } else {
        evaluaciones = input.map(s => ({
          sujetoIdx: s.idx,
          nivel: 'POSIBLE',
          referenciaONU: null,
          justificacion: 'Revisión manual requerida (configure ANTHROPIC_API_KEY para evaluación IA)',
        }));
      }

      for (const item of input) {
        const ev = evaluaciones.find(e => e.sujetoIdx === item.idx) || { nivel: 'POSIBLE', referenciaONU: null, justificacion: 'Sin respuesta IA' };
        const coincidencias = item.candidatos.slice(0, 5).map(c => ({ referenceNumber: c.referenceNumber, nombres: c.names }));
        resultados.push({
          sesionId,
          sociedadId: item.sujeto.sociedadId,
          sociedadNombre: item.sujeto.sociedadNombre,
          tipoSujeto: item.sujeto.tipoSujeto,
          sujetoNombre: item.sujeto.nombre,
          sujetoDocumento: item.sujeto.numeroDocumento,
          nivel: ev.nivel,
          coincidenciasDetectadas: JSON.stringify(coincidencias),
          justificacionIA: ev.justificacion || null,
        });
      }

      procesados += batch.length;
      const pct = Math.round(5 + (procesados / conCand.length) * 90);
      await prisma.sesionScreening.update({ where: { id: sesionId }, data: { progreso: pct } });
    }

    await prisma.resultadoScreening.createMany({ data: resultados });

    const altas    = resultados.filter(r => r.nivel === 'ALTA').length;
    const posibles = resultados.filter(r => r.nivel === 'POSIBLE').length;

    await prisma.sesionScreening.update({
      where: { id: sesionId },
      data: { estado: 'COMPLETADO', progreso: 100, completadoEn: new Date(), coincidenciasAltas: altas, coincidenciasPosibles: posibles },
    });

  } catch (err) {
    console.error('[screening] Error fatal:', err);
    await prisma.sesionScreening.update({
      where: { id: sesionId },
      data: { estado: 'ERROR', error: err.message, progreso: 0 },
    }).catch(() => {});
  }
}
