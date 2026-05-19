import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert, Upload, Play, RefreshCw, CheckCircle2, AlertTriangle,
  XCircle, FileText, Clock, ChevronDown, ChevronRight, Eye, EyeOff,
  Loader2, List, BarChart2, Trash2,
} from 'lucide-react';
import { useToast } from '../components/Toast.jsx';

const API = '/api/screening';

const NIVEL_CFG = {
  ALTA:    { label: 'Coincidencia Alta',    cls: 'bg-red-100 text-red-800 border-red-200',    icon: XCircle,       dot: 'bg-red-500' },
  POSIBLE: { label: 'Posible Coincidencia', cls: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertTriangle, dot: 'bg-amber-400' },
  NINGUNA: { label: 'Sin Coincidencia',     cls: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2,  dot: 'bg-green-500' },
};

const TIPO_LABEL = {
  DIRECTOR: 'Director',
  ACCIONISTA: 'Accionista',
  APODERADO: 'Apoderado',
  BENEFICIARIO: 'Beneficiario Final',
};

function apiFetch(url, opts = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ─── Sección: Gestión de la lista ONU ────────────────────────────────────────

function SeccionListas({ listas, cargando, onRefresh }) {
  const { addToast } = useToast();
  const [subiendo, setSubiendo] = useState(false);
  const [version, setVersion] = useState('');
  const fileRef = useRef();

  async function handleSubir(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('archivo', file);
    if (version.trim()) fd.append('version', version.trim());

    setSubiendo(true);
    try {
      const r = await apiFetch(`${API}/listas`, { method: 'POST', body: fd });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || 'Error al subir');
      }
      const lista = await r.json();
      addToast(`Lista cargada: ${lista.totalEntradas.toLocaleString()} entradas.`, 'success');
      setVersion('');
      if (fileRef.current) fileRef.current.value = '';
      onRefresh();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar esta lista? Las sesiones de screening que la usaron se conservarán.')) return;
    try {
      const r = await apiFetch(`${API}/listas/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Error al eliminar');
      addToast('Lista eliminada.', 'success');
      onRefresh();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  const listaVigente = listas.find(l => l.vigente);

  return (
    <div className="space-y-4">
      {/* Estado lista vigente */}
      {listaVigente ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-green-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-800">Lista activa: {listaVigente.version}</p>
            <p className="text-xs text-green-700 mt-0.5">
              {listaVigente.totalEntradas.toLocaleString()} entradas —{' '}
              cargada el {new Date(listaVigente.creadoEn).toLocaleDateString('es-PA')}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Sin lista cargada</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Descargue la Lista Consolidada ONU en formato XML y súbala aquí antes de ejecutar un screening.
            </p>
          </div>
        </div>
      )}

      {/* Formulario de carga */}
      <form onSubmit={handleSubir} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Cargar notificación de sanciones</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.xml"
            className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            required
          />
          <input
            type="text"
            placeholder="Versión / fecha (opcional)"
            value={version}
            onChange={e => setVersion(e.target.value)}
            className="input text-sm flex-1 min-w-0"
          />
          <button
            type="submit"
            disabled={subiendo}
            className="btn btn-primary flex items-center gap-2 shrink-0"
          >
            {subiendo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {subiendo ? 'Procesando…' : 'Cargar'}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          PDF de notificación UAF (circular SC/IDD del Comité de Sanciones ONU). También acepta XML de la lista consolidada. Máximo 50 MB.
        </p>
      </form>

      {/* Historial de listas */}
      {listas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Historial de listas</p>
            <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600">
              <RefreshCw size={14} />
            </button>
          </div>
          {cargando ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Cargando…</div>
          ) : (
            listas.map(lista => (
              <div key={lista.id} className="px-4 py-3 flex items-center gap-3">
                <FileText size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{lista.version}</p>
                  <p className="text-xs text-gray-500">
                    {lista.totalEntradas.toLocaleString()} entradas — {lista.nombreArchivo}
                  </p>
                </div>
                {lista.vigente && (
                  <span className="badge bg-green-100 text-green-800 text-xs">Reciente</span>
                )}
                <button
                  onClick={() => handleEliminar(lista.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sección: Ejecutar screening ──────────────────────────────────────────────

function SeccionEjecutar({ listas, sesiones, onSesionIniciada }) {
  const { addToast } = useToast();
  const [iniciando, setIniciando] = useState(false);
  const [listaId, setListaId] = useState('');

  const listaVigente = listas.find(l => l.vigente);
  const sesionEnProceso = sesiones.find(s => s.estado === 'EN_PROCESO');

  useEffect(() => {
    if (listaVigente && !listaId) setListaId(listaVigente.id);
  }, [listaVigente, listaId]);

  async function handleIniciar() {
    if (!listaId) return;
    setIniciando(true);
    try {
      const r = await apiFetch(`${API}/sesiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listaSancionesId: listaId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error al iniciar');
      addToast('Screening iniciado. Puede tomar varios minutos.', 'success');
      onSesionIniciada(d.sesionId);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIniciando(false);
    }
  }

  if (listas.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
        Cargue primero una lista ONU para poder ejecutar un screening.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
      <div className="flex items-start gap-3">
        <ShieldAlert size={20} className="text-brand-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Screening de todas las sociedades</p>
          <p className="text-xs text-gray-500 mt-1">
            El sistema cotejará todos los directores, accionistas, apoderados y beneficiarios
            finales de sus sociedades activas contra los individuos de la notificación seleccionada.
            Cargue cada circular que reciba de la UAF y ejecute un screening por cada una.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Lista a utilizar</label>
          <select
            value={listaId}
            onChange={e => setListaId(e.target.value)}
            className="input text-sm w-full"
          >
            <option value="">Seleccionar lista…</option>
            {listas.map(l => (
              <option key={l.id} value={l.id}>
                {l.version} — {l.totalEntradas.toLocaleString()} entradas
                {l.vigente ? ' (activa)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleIniciar}
          disabled={iniciando || !listaId || !!sesionEnProceso}
          className="btn btn-primary flex items-center gap-2 shrink-0"
        >
          {iniciando ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {iniciando ? 'Iniciando…' : 'Ejecutar screening'}
        </button>
      </div>

      {sesionEnProceso && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-2 text-sm text-blue-800">
          <Loader2 size={15} className="animate-spin shrink-0" />
          <span>Hay un screening en curso ({sesionEnProceso.progreso}%). Espere a que termine.</span>
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta de sesión ────────────────────────────────────────────────────────

function TarjetaSesion({ sesion, activa, onSeleccionar, onRefrescar }) {
  const esActiva = sesion.estado === 'EN_PROCESO';

  return (
    <button
      onClick={() => onSeleccionar(sesion.id)}
      className={`w-full text-left px-4 py-3 transition-colors ${
        activa ? 'bg-brand-50 border-l-4 border-brand-600' : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {sesion.listaSanciones?.version || 'Lista eliminada'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(sesion.creadoEn).toLocaleDateString('es-PA', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {sesion.estado === 'EN_PROCESO' && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <Loader2 size={11} className="animate-spin" />
              {sesion.progreso}%
            </span>
          )}
          {sesion.estado === 'COMPLETADO' && (
            <span className="text-xs text-green-700 font-medium">Completado</span>
          )}
          {sesion.estado === 'ERROR' && (
            <span className="text-xs text-red-600 font-medium">Error</span>
          )}
          {sesion.coincidenciasAltas > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
              {sesion.coincidenciasAltas} alta{sesion.coincidenciasAltas !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      {esActiva && (
        <div className="mt-2 w-full bg-blue-100 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${sesion.progreso}%` }}
          />
        </div>
      )}
    </button>
  );
}

// ─── Vista de resultados ──────────────────────────────────────────────────────

function VistaResultados({ sesionId, sesion, onActualizar }) {
  const { addToast } = useToast();
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState('');
  const [expandidas, setExpandidas] = useState({});

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const url = filtroNivel
        ? `${API}/sesiones/${sesionId}/resultados?nivel=${filtroNivel}`
        : `${API}/sesiones/${sesionId}/resultados`;
      const r = await apiFetch(url);
      if (!r.ok) throw new Error('Error al cargar resultados');
      setResultados(await r.json());
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [sesionId, filtroNivel, addToast]);

  useEffect(() => { cargar(); }, [cargar]);

  async function toggleRevisado(id) {
    try {
      const r = await apiFetch(`${API}/resultados/${id}/revisado`, { method: 'PATCH' });
      if (!r.ok) throw new Error('Error');
      const upd = await r.json();
      setResultados(prev => prev.map(x => x.id === id ? { ...x, revisado: upd.revisado } : x));
    } catch {
      addToast('Error al actualizar.', 'error');
    }
  }

  function toggleExpand(id) {
    setExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Agrupar por sociedad
  const porSociedad = {};
  for (const r of resultados) {
    if (!porSociedad[r.sociedadNombre]) porSociedad[r.sociedadNombre] = [];
    porSociedad[r.sociedadNombre].push(r);
  }

  const totalAltas    = resultados.filter(r => r.nivel === 'ALTA').length;
  const totalPosibles = resultados.filter(r => r.nivel === 'POSIBLE').length;
  const totalNinguna  = resultados.filter(r => r.nivel === 'NINGUNA').length;

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { nivel: 'ALTA',    count: totalAltas,    label: 'Altas' },
          { nivel: 'POSIBLE', count: totalPosibles, label: 'Posibles' },
          { nivel: 'NINGUNA', count: totalNinguna,  label: 'Sin coincidencia' },
        ].map(({ nivel, count, label }) => {
          const cfg = NIVEL_CFG[nivel];
          return (
            <button
              key={nivel}
              onClick={() => setFiltroNivel(filtroNivel === nivel ? '' : nivel)}
              className={`rounded-lg border p-3 text-center transition-all ${
                filtroNivel === nivel ? cfg.cls + ' ring-2 ring-offset-1 ring-current' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs mt-0.5 font-medium">{label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtroNivel ? `Filtrando: ${NIVEL_CFG[filtroNivel].label}` : `${resultados.length} sujetos verificados`}
        </p>
        <div className="flex items-center gap-2">
          {filtroNivel && (
            <button onClick={() => setFiltroNivel('')} className="text-xs text-brand-600 hover:underline">
              Ver todos
            </button>
          )}
          <button onClick={cargar} className="text-gray-400 hover:text-gray-600">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Resultados por sociedad */}
      {cargando ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-600" />
        </div>
      ) : Object.keys(porSociedad).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
          No hay resultados con el filtro seleccionado.
        </div>
      ) : (
        Object.entries(porSociedad).map(([sociedad, items]) => {
          const tieneAlerta = items.some(i => i.nivel !== 'NINGUNA');
          return (
            <div key={sociedad} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className={`px-4 py-3 flex items-center gap-2 ${tieneAlerta ? 'bg-red-50' : 'bg-gray-50'}`}>
                <ChevronRight size={16} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-800 flex-1">{sociedad}</p>
                <span className="text-xs text-gray-500">{items.length} sujeto{items.length !== 1 ? 's' : ''}</span>
                {items.filter(i => i.nivel === 'ALTA').length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                    {items.filter(i => i.nivel === 'ALTA').length} alta{items.filter(i => i.nivel === 'ALTA').length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {items.map(item => {
                  const cfg = NIVEL_CFG[item.nivel];
                  const Icon = cfg.icon;
                  const expandido = expandidas[item.id];
                  const coincidencias = item.coincidenciasDetectadas
                    ? JSON.parse(item.coincidenciasDetectadas)
                    : [];

                  return (
                    <div key={item.id} className={`${item.nivel !== 'NINGUNA' ? 'bg-white' : ''}`}>
                      <div className="px-4 py-3 flex items-start gap-3">
                        <Icon size={16} className={`mt-0.5 shrink-0 ${
                          item.nivel === 'ALTA' ? 'text-red-600' :
                          item.nivel === 'POSIBLE' ? 'text-amber-600' : 'text-green-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-800">{item.sujetoNombre}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {TIPO_LABEL[item.tipoSujeto]}
                            </span>
                            {item.revisado && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                Revisado
                              </span>
                            )}
                          </div>
                          {item.sujetoDocumento && (
                            <p className="text-xs text-gray-400 mt-0.5">Doc: {item.sujetoDocumento}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.nivel !== 'NINGUNA' && (
                            <>
                              <button
                                onClick={() => toggleRevisado(item.id)}
                                className={`text-xs flex items-center gap-1 ${
                                  item.revisado ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
                                }`}
                                title={item.revisado ? 'Marcar como no revisado' : 'Marcar como revisado'}
                              >
                                {item.revisado ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                              {coincidencias.length > 0 && (
                                <button
                                  onClick={() => toggleExpand(item.id)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <ChevronDown
                                    size={16}
                                    className={`transition-transform ${expandido ? 'rotate-180' : ''}`}
                                  />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Detalle expandible */}
                      {expandido && item.nivel !== 'NINGUNA' && (
                        <div className="mx-4 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2">
                          {item.justificacionIA && (
                            <div>
                              <p className="font-semibold text-gray-700 mb-1">Evaluación IA:</p>
                              <p className="text-gray-600">{item.justificacionIA}</p>
                            </div>
                          )}
                          {coincidencias.length > 0 && (
                            <div>
                              <p className="font-semibold text-gray-700 mb-1">Entradas ONU candidatas:</p>
                              {coincidencias.map((c, i) => (
                                <div key={i} className="text-gray-600">
                                  <span className="font-mono text-gray-400">[{c.referenceNumber}]</span>{' '}
                                  {Array.isArray(c.nombres) ? c.nombres.join(' / ') : c.nombres}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Screening() {
  const [tab, setTab] = useState('ejecutar');
  const [listas, setListas] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [cargandoListas, setCargandoListas] = useState(true);
  const [cargandoSesiones, setCargandoSesiones] = useState(true);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [sesionDetalle, setSesionDetalle] = useState(null);
  const pollingRef = useRef(null);

  const cargarListas = useCallback(async () => {
    setCargandoListas(true);
    try {
      const r = await apiFetch(`${API}/listas`);
      if (r.ok) setListas(await r.json());
    } finally {
      setCargandoListas(false);
    }
  }, []);

  const cargarSesiones = useCallback(async () => {
    setCargandoSesiones(true);
    try {
      const r = await apiFetch(`${API}/sesiones`);
      if (r.ok) setSesiones(await r.json());
    } finally {
      setCargandoSesiones(false);
    }
  }, []);

  useEffect(() => {
    cargarListas();
    cargarSesiones();
  }, [cargarListas, cargarSesiones]);

  // Polling automático si hay sesión en curso
  useEffect(() => {
    const hayEnProceso = sesiones.some(s => s.estado === 'EN_PROCESO');
    if (hayEnProceso && !pollingRef.current) {
      pollingRef.current = setInterval(cargarSesiones, 4000);
    } else if (!hayEnProceso && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      // Si teníamos una sesión seleccionada, recargar su detalle
      if (sesionSeleccionada) cargarDetalleSesion(sesionSeleccionada);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sesiones, sesionSeleccionada, cargarSesiones]);

  async function cargarDetalleSesion(id) {
    try {
      const r = await apiFetch(`${API}/sesiones/${id}`);
      if (r.ok) setSesionDetalle(await r.json());
    } catch { /* ignorar */ }
  }

  async function handleSeleccionarSesion(id) {
    setSesionSeleccionada(id);
    setTab('resultados');
    await cargarDetalleSesion(id);
  }

  function handleSesionIniciada(id) {
    cargarSesiones();
    setSesionSeleccionada(id);
    setTab('resultados');
  }

  const TABS = [
    { key: 'ejecutar', label: 'Ejecutar', icon: Play },
    { key: 'listas',   label: 'Listas ONU', icon: Upload },
    { key: 'historial', label: 'Historial', icon: List },
    ...(sesionSeleccionada ? [{ key: 'resultados', label: 'Resultados', icon: BarChart2 }] : []),
  ];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
          <ShieldAlert size={20} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Screening de Sanciones Internacionales</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Cotejo de sus sociedades contra las notificaciones de sanciones de la UAF/ONU (Guía JD-02-2022)
          </p>
        </div>
      </div>

      {/* Alerta sin API key */}
      {!import.meta.env.VITE_IA_DISPONIBLE && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>Modo sin IA:</strong> El screening usará únicamente el pre-filtro algorítmico.
            Los candidatos se marcarán como "Posible Coincidencia" para revisión humana.
            Configure <code>ANTHROPIC_API_KEY</code> en el servidor para activar la evaluación IA.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: historial de sesiones (siempre visible en lg+) */}
        <div className="hidden lg:block space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Screenings recientes</p>
            <button onClick={cargarSesiones} className="text-gray-400 hover:text-gray-600">
              <RefreshCw size={13} />
            </button>
          </div>
          {cargandoSesiones ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin mx-auto" />
            </div>
          ) : sesiones.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-400">
              Sin sesiones aún
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
              {sesiones.map(s => (
                <TarjetaSesion
                  key={s.id}
                  sesion={s}
                  activa={s.id === sesionSeleccionada}
                  onSeleccionar={handleSeleccionarSesion}
                  onRefrescar={cargarSesiones}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho: contenido de tab */}
        <div className="lg:col-span-2">
          {tab === 'ejecutar' && (
            <SeccionEjecutar
              listas={listas}
              sesiones={sesiones}
              onSesionIniciada={handleSesionIniciada}
            />
          )}
          {tab === 'listas' && (
            <SeccionListas
              listas={listas}
              cargando={cargandoListas}
              onRefresh={cargarListas}
            />
          )}
          {tab === 'historial' && (
            <div className="space-y-2">
              {cargandoSesiones ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-brand-600" />
                </div>
              ) : sesiones.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
                  No se han ejecutado screenings aún.
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                  {sesiones.map(s => (
                    <TarjetaSesion
                      key={s.id}
                      sesion={s}
                      activa={s.id === sesionSeleccionada}
                      onSeleccionar={handleSeleccionarSesion}
                      onRefrescar={cargarSesiones}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === 'resultados' && sesionSeleccionada && (
            <VistaResultados
              sesionId={sesionSeleccionada}
              sesion={sesionDetalle}
              onActualizar={cargarSesiones}
            />
          )}
          {tab === 'resultados' && !sesionSeleccionada && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
              Seleccione una sesión del historial para ver sus resultados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
