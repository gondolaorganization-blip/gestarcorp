/**
 * Motor de completitud de información por sociedad.
 *
 * Evalúa qué datos faltan y los clasifica en 4 tiers de urgencia:
 *   CRITICA  → legal/compliance obligatorio (JD-02-2022, Ley 52-2016)
 *   ALTA     → operacional — necesario para operar la sociedad
 *   MEDIA    → debida diligencia documental
 *   BAJA     → complementario / buenas prácticas
 *
 * La frecuencia del recordatorio la dicta el tier MÁS URGENTE con pendientes.
 */

export const TIERS = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'];

export const TIER_LABEL = {
  CRITICA: 'Crítica',
  ALTA:    'Alta',
  MEDIA:   'Media',
  BAJA:    'Baja',
};

export const TIER_COLOR = {
  CRITICA: '#dc2626',
  ALTA:    '#d97706',
  MEDIA:   '#2563eb',
  BAJA:    '#6b7280',
};

/**
 * Recibe una sociedad cargada con todas las relaciones necesarias.
 * Devuelve: { items[], resumenPorTier, porcentajeGlobal, tierMasUrgente }
 *
 * item = {
 *   id:          string único (para deduplicar)
 *   tier:        'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'
 *   label:       string — descripción human-readable
 *   completado:  boolean
 *   entidad:     'sociedad' | 'director' | 'accionista' | 'beneficiario'
 *   entidadId:   string | null
 *   entidadNombre: string | null
 *   accion:      'completar' | 'subir' | 'verificar'  — qué hay que hacer
 * }
 */
export function calcularCompletitud(sociedad) {
  const items = [];

  const push = (id, tier, label, completado, entidad = 'sociedad', entidadId = null, entidadNombre = null, accion = 'completar') => {
    items.push({ id, tier, label, completado, entidad, entidadId, entidadNombre, accion });
  };

  // ─── CRÍTICA ──────────────────────────────────────────────────────────────

  // RUC de la sociedad — solo el agente puede ingresarlo
  push('ruc', 'CRITICA', 'RUC de la sociedad', !!sociedad.ruc,
    'sociedad', null, null, 'verificar');

  // Al menos 1 beneficiario final declarado — el agente gestiona los BF
  push('bf_existe', 'CRITICA', 'Beneficiario final declarado (Ley 52-2016)',
    (sociedad.beneficiarios?.length ?? 0) > 0, 'beneficiario', null, null, 'verificar');

  // Evaluación de riesgo BC/FT — solo el agente la realiza
  push('riesgo_eval', 'CRITICA', 'Evaluación de riesgo BC/FT realizada',
    (sociedad.evaluaciones?.length ?? 0) > 0, 'sociedad', null, null, 'verificar');

  // Directores activos: documento de identidad — el agente registra los datos legales
  for (const d of (sociedad.directores ?? []).filter(x => x.activo)) {
    const ok = !!(d.tipoDocumento && d.numeroDocumento && d.nacionalidad);
    push(`dir_doc_${d.id}`, 'CRITICA',
      `Documento de identidad de director ${d.nombre}`,
      ok, 'director', d.id, d.nombre, 'verificar');
  }

  // Accionistas activos: documento de identidad — el agente registra los datos legales
  for (const a of (sociedad.accionistas ?? []).filter(x => x.activo)) {
    const ok = !!(a.tipoDocumento && a.numeroDocumento && a.nacionalidad);
    push(`acc_doc_${a.id}`, 'CRITICA',
      `Documento de identidad de accionista ${a.nombre}`,
      ok, 'accionista', a.id, a.nombre, 'verificar');
  }

  // ─── ALTA ─────────────────────────────────────────────────────────────────

  push('email', 'ALTA', 'Email de contacto de la sociedad', !!sociedad.email);
  push('telefono', 'ALTA', 'Teléfono de contacto de la sociedad', !!sociedad.telefono);
  push('domicilio', 'ALTA', 'Domicilio de la sociedad', !!sociedad.domicilio);
  push('actividad', 'ALTA', 'Actividad principal / objeto social', !!sociedad.actividadPrincipal);

  // Porcentaje de participación accionaria
  for (const a of (sociedad.accionistas ?? []).filter(x => x.activo)) {
    const ok = !!(a.porcentaje && Number(a.porcentaje) > 0);
    push(`acc_pct_${a.id}`, 'ALTA',
      `Participación accionaria de ${a.nombre}`,
      ok, 'accionista', a.id, a.nombre);
  }

  // ─── MEDIA ────────────────────────────────────────────────────────────────

  // Documento de identidad SUBIDO (no solo declarado) para directores
  const docsPorEntidad = {};
  for (const doc of (sociedad.docsDiligencia ?? [])) {
    if (!docsPorEntidad[doc.entidadId]) docsPorEntidad[doc.entidadId] = [];
    docsPorEntidad[doc.entidadId].push(doc.tipo);
  }

  for (const d of (sociedad.directores ?? []).filter(x => x.activo)) {
    const tieneDoc = (docsPorEntidad[d.id] ?? []).some(t =>
      t === 'CEDULA_PASAPORTE' || t === 'OTRO');
    push(`dir_docsubido_${d.id}`, 'MEDIA',
      `Copia de identidad subida — director ${d.nombre}`,
      tieneDoc, 'director', d.id, d.nombre, 'subir');
  }

  // Documento subido para accionistas
  for (const a of (sociedad.accionistas ?? []).filter(x => x.activo)) {
    const tieneDoc = (docsPorEntidad[a.id] ?? []).some(t =>
      t === 'CEDULA_PASAPORTE' || t === 'OTRO');
    push(`acc_docsubido_${a.id}`, 'MEDIA',
      `Copia de identidad subida — accionista ${a.nombre}`,
      tieneDoc, 'accionista', a.id, a.nombre, 'subir');
  }

  // Profesión de directores
  for (const d of (sociedad.directores ?? []).filter(x => x.activo)) {
    push(`dir_prof_${d.id}`, 'MEDIA',
      `Profesión de director ${d.nombre}`,
      !!d.profesion, 'director', d.id, d.nombre);
  }

  // Profesión de accionistas
  for (const a of (sociedad.accionistas ?? []).filter(x => x.activo)) {
    push(`acc_prof_${a.id}`, 'MEDIA',
      `Profesión de accionista ${a.nombre}`,
      !!a.profesion, 'accionista', a.id, a.nombre);
  }

  // Beneficiarios verificados
  for (const bf of (sociedad.beneficiarios ?? [])) {
    push(`bf_ver_${bf.id}`, 'MEDIA',
      `Beneficiario final verificado — ${bf.nombre}`,
      !!bf.verificado, 'beneficiario', bf.id, bf.nombre, 'verificar');
  }

  // ─── BAJA ─────────────────────────────────────────────────────────────────

  // Domicilio de directores
  for (const d of (sociedad.directores ?? []).filter(x => x.activo)) {
    push(`dir_dom_${d.id}`, 'BAJA',
      `Domicilio de director ${d.nombre}`,
      !!d.domicilio, 'director', d.id, d.nombre);
  }

  // Domicilio de accionistas
  for (const a of (sociedad.accionistas ?? []).filter(x => x.activo)) {
    push(`acc_dom_${a.id}`, 'BAJA',
      `Domicilio de accionista ${a.nombre}`,
      !!a.domicilio, 'accionista', a.id, a.nombre);
  }

  // Comprobante de domicilio de BFs
  for (const bf of (sociedad.beneficiarios ?? [])) {
    const tieneDoc = (docsPorEntidad[bf.id] ?? []).some(t =>
      t === 'COMPROBANTE_DOMICILIO' || t === 'OTRO');
    push(`bf_compr_${bf.id}`, 'BAJA',
      `Comprobante de domicilio — ${bf.nombre}`,
      tieneDoc, 'beneficiario', bf.id, bf.nombre, 'subir');
  }

  // ─── Resumen ──────────────────────────────────────────────────────────────

  const resumenPorTier = {};
  for (const tier of TIERS) {
    const del_tier = items.filter(i => i.tier === tier);
    const completados = del_tier.filter(i => i.completado).length;
    resumenPorTier[tier] = {
      total:      del_tier.length,
      completado: completados,
      pendientes: del_tier.length - completados,
      pct:        del_tier.length > 0
        ? Math.round((completados / del_tier.length) * 100)
        : 100,
    };
  }

  const totalItems = items.length;
  const totalCompletados = items.filter(i => i.completado).length;
  const porcentajeGlobal = totalItems > 0
    ? Math.round((totalCompletados / totalItems) * 100)
    : 100;

  // Tier más urgente con pendientes — determina la frecuencia del recordatorio
  const tierMasUrgente = TIERS.find(t => resumenPorTier[t].pendientes > 0) || null;

  return { items, resumenPorTier, porcentajeGlobal, tierMasUrgente };
}

/**
 * Carga una sociedad con todas las relaciones que necesita calcularCompletitud.
 */
export function selectCompletitud() {
  return {
    id: true, nombre: true, ruc: true, email: true, telefono: true,
    domicilio: true, actividadPrincipal: true,
    directores:    { where: { activo: true }, select: { id: true, nombre: true, tipoDocumento: true, numeroDocumento: true, nacionalidad: true, profesion: true, domicilio: true, activo: true } },
    accionistas:   { where: { activo: true }, select: { id: true, nombre: true, tipoDocumento: true, numeroDocumento: true, nacionalidad: true, profesion: true, domicilio: true, porcentaje: true, activo: true } },
    beneficiarios: { select: { id: true, nombre: true, verificado: true } },
    evaluaciones:  { select: { id: true } },
    docsDiligencia: { select: { id: true, tipo: true, entidadId: true } },
  };
}
