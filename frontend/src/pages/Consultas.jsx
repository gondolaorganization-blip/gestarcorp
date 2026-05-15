import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatFecha, estadoBadge } from '../utils/format.js';
import { MessageSquare, Filter } from 'lucide-react';

export default function Consultas() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showResp, setShowResp] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [respLoading, setRespLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [c, s] = await Promise.all([
      api.get('/consultas', { params: filtroEstado ? { estado: filtroEstado } : {} }),
      api.get('/consultas/estadisticas'),
    ]);
    setItems(c.data); setStats(s.data); setLoading(false);
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleResponder(c) {
    setRespLoading(true);
    try {
      await api.put(`/sociedades/${c.sociedadId}/consultas/${c.id}`, { respuesta, estado: 'RESUELTA' });
      toast.success('Respuesta enviada'); setShowResp(null); setRespuesta(''); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
    finally { setRespLoading(false); }
  }

  const tipoColor = { LEGAL:'badge-purple', FISCAL:'badge-red', DOCUMENTAL:'badge-blue', GENERAL:'badge-gray', OTRO:'badge-gray' };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Consultas</h1>
        <p className="text-sm text-gray-500 mt-1">Todas las consultas de tus clientes</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Abiertas', value: stats.abiertas, color: 'text-yellow-600' },
            { label: 'En proceso', value: stats.enProceso, color: 'text-blue-600' },
            { label: 'Resueltas', value: stats.resueltas, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtro */}
      <div className="flex items-center gap-3 mb-5">
        <Filter size={16} className="text-gray-400" />
        {['', 'ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CERRADA'].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${filtroEstado === e ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {e || 'Todas'}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : items.length === 0 ? (
        <EmptyState message="No hay consultas" />
      ) : (
        <div className="space-y-3">
          {items.map(c => (
            <div key={c.id} className="card overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className={`badge ${tipoColor[c.tipo] || 'badge-gray'}`}>{c.tipo}</span>
                  <Link to={`/sociedades/${c.sociedadId}`}
                    className="text-sm font-medium text-gray-900 hover:text-brand-600">
                    {c.sociedad?.nombre || '—'}
                  </Link>
                  <span className="text-xs text-gray-400">{formatFecha(c.fecha)}</span>
                </div>
                <span className={estadoBadge(c.estado)}>{c.estado}</span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-700">{c.descripcion}</p>
                {c.respuesta ? (
                  <div className="mt-3 bg-green-50 border-l-4 border-green-400 px-3 py-2 rounded-r-lg">
                    <p className="text-xs font-semibold text-green-700 mb-1">Respuesta ({formatFecha(c.fechaRespuesta)}):</p>
                    <p className="text-sm text-green-800">{c.respuesta}</p>
                  </div>
                ) : (
                  <button className="mt-2 text-xs text-brand-600 hover:underline font-medium"
                    onClick={() => { setShowResp(c); setRespuesta(''); }}>
                    Responder →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!showResp} onClose={() => setShowResp(null)} title="Responder consulta">
        {showResp && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
              <p className="font-medium text-xs text-gray-500 mb-1">Consulta de {showResp.sociedad?.nombre}:</p>
              {showResp.descripcion}
            </div>
            <div>
              <label className="label">Tu respuesta</label>
              <textarea className="input h-32 resize-none" value={respuesta}
                onChange={e => setRespuesta(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowResp(null)}>Cancelar</button>
              <button className="btn-primary" onClick={() => handleResponder(showResp)} disabled={respLoading}>
                {respLoading ? 'Enviando...' : 'Enviar respuesta'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
