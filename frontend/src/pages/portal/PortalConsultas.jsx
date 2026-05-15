import { useState, useEffect, useCallback } from 'react';
import { portalApi } from '../../services/api.js';
import { PageSpinner } from '../../components/Spinner.jsx';
import Modal from '../../components/Modal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatFecha, estadoBadge } from '../../utils/format.js';
import { Plus, MessageSquare, AlertCircle } from 'lucide-react';

export default function PortalConsultas() {
  const [items, setItems] = useState([]);
  const [cuota, setCuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tipo: 'GENERAL', descripcion: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const TIPOS = ['LEGAL','FISCAL','DOCUMENTAL','GENERAL','OTRO'];

  const cargar = useCallback(async () => {
    setLoading(true);
    const [c, q] = await Promise.all([
      portalApi.get('/portal/consultas'),
      portalApi.get('/portal/consultas/cuota'),
    ]);
    setItems(c.data); setCuota(q.data); setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function handleCrear() {
    setError(''); setSaving(true);
    try {
      await portalApi.post('/portal/consultas', form);
      setShowModal(false);
      setForm({ tipo: 'GENERAL', descripcion: '' });
      cargar();
    } catch(e) {
      setError(e?.response?.data?.error || 'Error al enviar');
    } finally { setSaving(false); }
  }

  if (loading) return <PageSpinner />;

  const sinCuota = cuota?.planCliente === 'MENSUAL' && cuota?.usadas >= 2;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultas</h1>
          <p className="text-sm text-gray-500 mt-1">Envía preguntas legales o fiscales a tu agente</p>
        </div>
        <button className="btn-primary" disabled={sinCuota}
          onClick={() => { setForm({ tipo: 'GENERAL', descripcion: '' }); setShowModal(true); }}>
          <Plus size={16} /> Nueva consulta
        </button>
      </div>

      {/* Cuota */}
      {cuota?.planCliente === 'MENSUAL' && (
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${sinCuota ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <AlertCircle size={18} className={sinCuota ? 'text-red-500' : 'text-blue-500'} />
          <div className="text-sm">
            <span className="font-medium">{sinCuota ? 'Cuota agotada' : 'Plan mensual'}:</span>{' '}
            {cuota.usadas} / 2 consultas usadas este mes.
            {sinCuota && ' Contáctanos para actualizar tu plan.'}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState message="Aún no has enviado consultas"
          action={!sinCuota && (
            <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Primera consulta
            </button>
          )} />
      ) : (
        <div className="space-y-4">
          {items.map(c => (
            <div key={c.id} className="card overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <MessageSquare size={15} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{c.tipo}</span>
                  <span className="text-xs text-gray-400">{formatFecha(c.fecha)}</span>
                </div>
                <span className={estadoBadge(c.estado)}>{c.estado}</span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-700">{c.descripcion}</p>
                {c.respuesta ? (
                  <div className="mt-3 bg-green-50 border-l-4 border-green-400 px-3 py-2 rounded-r-lg">
                    <p className="text-xs font-semibold text-green-700 mb-1">
                      Respuesta de tu agente ({formatFecha(c.fechaRespuesta)}):
                    </p>
                    <p className="text-sm text-green-800">{c.respuesta}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-400 italic">Esperando respuesta del agente...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva consulta">
        <div className="space-y-4">
          <div>
            <label className="label">Tipo de consulta</label>
            <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Describe tu consulta</label>
            <textarea className="input h-32 resize-none" value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Explica tu consulta con el mayor detalle posible..." />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleCrear} disabled={saving || !form.descripcion.trim()}>
              {saving ? 'Enviando...' : 'Enviar consulta'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
