import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight,
  Upload, Loader2, Save, RefreshCw,
} from 'lucide-react';
import { useToast } from '../../components/Toast.jsx';

const API = '/api/portal';

const TIER_CFG = {
  CRITICA: { label: 'Crítica',  color: 'red',    icon: XCircle,       bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-800' },
  ALTA:    { label: 'Alta',     color: 'amber',  icon: AlertTriangle, bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-800' },
  MEDIA:   { label: 'Media',    color: 'blue',   icon: AlertTriangle, bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-800' },
  BAJA:    { label: 'Baja',     color: 'gray',   icon: AlertTriangle, bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   badge: 'bg-gray-100 text-gray-700' },
};

const TIERS = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'];

function portalFetch(url, opts = {}) {
  const token = localStorage.getItem('portalToken');
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

// ─── Barra de progreso ────────────────────────────────────────────────────────

function BarraProgreso({ pct, tier }) {
  const color = tier === 'CRITICA' ? 'bg-red-500' : tier === 'ALTA' ? 'bg-amber-500' : tier === 'MEDIA' ? 'bg-blue-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Formulario inline por entidad ───────────────────────────────────────────

function FormularioItem({ item, onGuardado }) {
  const { addToast } = useToast();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);

  if (item.completado) return null;
  if (item.accion === 'verificar') return null; // Solo el agente puede verificar

  async function handleGuardar() {
    setGuardando(true);
    try {
      if (item.accion === 'subir') {
        if (!archivo) { addToast('Seleccione un archivo.', 'error'); return; }
        const fd = new FormData();
        fd.append('archivo', archivo);
        fd.append('tipo', 'CEDULA_PASAPORTE');
        fd.append('entidadTipo', item.entidad.toUpperCase());
        if (item.entidadId) fd.append('entidadId', item.entidadId);
        fd.append('entidadNombre', item.entidadNombre || '');
        const r = await portalFetch(`${API}/completar/documentos`, { method: 'POST', body: fd });
        if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Error'); }
        addToast('Documento subido.', 'success');
      } else {
        // Determinar qué campo y qué endpoint actualizar
        let url, campo;
        if (item.entidad === 'sociedad') {
          url = `${API}/completar/sociedad`;
          campo = campoDesdeId(item.id);
        } else if (item.entidad === 'director') {
          url = `${API}/completar/directores/${item.entidadId}`;
          campo = campoDesdeId(item.id);
        } else if (item.entidad === 'accionista') {
          url = `${API}/completar/accionistas/${item.entidadId}`;
          campo = campoDesdeId(item.id);
        }
        if (!url || !campo) return;
        const r = await portalFetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [campo]: valor }),
        });
        if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Error'); }
        addToast('Guardado.', 'success');
      }
      setEditando(false);
      onGuardado();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mt-2">
      {!editando ? (
        <button
          onClick={() => setEditando(true)}
          className="text-xs text-brand-600 hover:underline font-medium"
        >
          {item.accion === 'subir' ? 'Subir documento' : 'Completar'}
        </button>
      ) : (
        <div className="flex items-center gap-2 mt-1">
          {item.accion === 'subir' ? (
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setArchivo(e.target.files?.[0] || null)}
              className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-brand-50 file:text-brand-700"
            />
          ) : (
            <input
              type="text"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="Escribir aquí..."
              className="input input-sm text-sm flex-1"
              onKeyDown={e => e.key === 'Enter' && handleGuardar()}
              autoFocus
            />
          )}
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="btn btn-primary btn-sm flex items-center gap-1"
          >
            {guardando ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {guardando ? '' : 'Guardar'}
          </button>
          <button onClick={() => setEditando(false)} className="text-xs text-gray-400 hover:text-gray-600">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function campoDesdeId(id) {
  if (id === 'email') return 'email';
  if (id === 'telefono') return 'telefono';
  if (id === 'domicilio' || id.includes('_dom_')) return 'domicilio';
  if (id === 'actividad') return 'actividadPrincipal';
  if (id.includes('_prof_')) return 'profesion';
  if (id.includes('_pct_')) return 'porcentaje';
  return null;
}

// ─── Sección por tier ─────────────────────────────────────────────────────────

function SeccionTier({ tier, resumen, items, onRefresh }) {
  const [expandido, setExpandido] = useState(tier === 'CRITICA' || tier === 'ALTA');
  const cfg = TIER_CFG[tier];
  const Icon = cfg.icon;

  const pendientes = items.filter(i => !i.completado);
  if (items.length === 0) return null;

  return (
    <div className={`border rounded-lg overflow-hidden ${cfg.border}`}>
      <button
        onClick={() => setExpandido(e => !e)}
        className={`w-full flex items-center gap-3 px-4 py-3 ${cfg.bg} text-left`}
      >
        <Icon size={16} className={cfg.text} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${cfg.text}`}>
              Prioridad {cfg.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
              {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
            </span>
          </div>
          <BarraProgreso pct={resumen.pct} tier={tier} />
        </div>
        {expandido ? <ChevronDown size={16} className={cfg.text} /> : <ChevronRight size={16} className={cfg.text} />}
      </button>

      {expandido && (
        <div className="bg-white divide-y divide-gray-100">
          {items.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-start gap-3">
              {item.completado
                ? <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                : <div className={`h-4 w-4 rounded-full border-2 ${
                    tier === 'CRITICA' ? 'border-red-400' : tier === 'ALTA' ? 'border-amber-400' : 'border-blue-400'
                  } mt-0.5 shrink-0`} />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.completado ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {item.label}
                </p>
                {item.accion === 'verificar' && !item.completado && (
                  <p className="text-xs text-gray-400 mt-0.5">El agente residente debe verificar este dato.</p>
                )}
                {!item.completado && item.accion !== 'verificar' && (
                  <FormularioItem item={item} onGuardado={onRefresh} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PortalCompletar() {
  const [completitud, setCompletitud] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await portalFetch(`${API}/completitud`);
      if (r.ok) setCompletitud(await r.json());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={24} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (!completitud) return null;

  const { items, resumenPorTier, porcentajeGlobal, tierMasUrgente } = completitud;
  const estaCompleto = porcentajeGlobal === 100;
  const barColor = porcentajeGlobal >= 80 ? 'bg-green-500' : porcentajeGlobal >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Completar información</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          La información que complete aquí es compartida con su agente residente.
        </p>
      </div>

      {/* Progreso global */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Completitud del expediente</p>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${estaCompleto ? 'text-green-600' : 'text-gray-800'}`}>
              {porcentajeGlobal}%
            </span>
            <button onClick={cargar} className="text-gray-400 hover:text-gray-600">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="bg-gray-200 rounded-full h-3">
          <div className={`${barColor} h-3 rounded-full transition-all`} style={{ width: `${porcentajeGlobal}%` }} />
        </div>

        {estaCompleto ? (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 size={16} />
            <span>¡Expediente completo! No hay información pendiente.</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 pt-1">
            {TIERS.map(tier => {
              const r = resumenPorTier[tier];
              if (r.total === 0) return null;
              const cfg = TIER_CFG[tier];
              return (
                <div key={tier} className={`text-center rounded-lg border p-2 ${cfg.bg} ${cfg.border}`}>
                  <p className={`text-lg font-bold ${cfg.text}`}>{r.pendientes}</p>
                  <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Secciones por tier */}
      {!estaCompleto && TIERS.map(tier => {
        const tiersItems = items.filter(i => i.tier === tier);
        return (
          <SeccionTier
            key={tier}
            tier={tier}
            resumen={resumenPorTier[tier]}
            items={tiersItems}
            onRefresh={cargar}
          />
        );
      })}
    </div>
  );
}
