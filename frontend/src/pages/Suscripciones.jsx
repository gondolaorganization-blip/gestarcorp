import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatFecha, formatMoneda, estadoBadge } from '../utils/format.js';
import { CreditCard, Calendar, AlertTriangle, Plus, DollarSign } from 'lucide-react';

export default function Suscripciones() {
  const toast = useToast();
  const [vencimientos, setVencimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [sociedades, setSociedades] = useState([]);
  const [form, setForm] = useState({ sociedadId:'', plan:'ANUAL', monto:350, metodoPago:'TRANSFERENCIA', referencia:'' });
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [v, s] = await Promise.all([
      api.get('/suscripciones/vencimientos'),
      api.get('/sociedades?limite=100'),
    ]);
    setVencimientos(v.data);
    setSociedades(s.data.sociedades || []);
    setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function handlePagoManual() {
    setSaving(true);
    try {
      await api.post('/suscripciones/manual', form);
      toast.success('Pago registrado correctamente');
      setShowManual(false);
      cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error al registrar'); }
    finally { setSaving(false); }
  }

  const urgentes = vencimientos.filter(v => v.diasRestantes != null && v.diasRestantes <= 30);
  const resto = vencimientos.filter(v => v.diasRestantes == null || v.diasRestantes > 30);

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suscripciones</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de planes y pagos de la cartera</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ sociedadId:'', plan:'ANUAL', monto:350, metodoPago:'TRANSFERENCIA', referencia:'' }); setShowManual(true); }}>
          <Plus size={16}/> Registrar pago manual
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-brand-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{vencimientos.length}</p>
              <p className="text-xs text-gray-500">Con fecha de vencimiento</p>
            </div>
          </div>
        </div>
        <div className={`card p-5 ${urgentes.length > 0 ? 'border-yellow-200 bg-yellow-50' : ''}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className={urgentes.length > 0 ? 'text-yellow-500' : 'text-gray-300'} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{urgentes.length}</p>
              <p className="text-xs text-gray-500">Vencen en 30 días</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoneda(vencimientos.reduce((s, v) => s + (v.monto || 0), 0))}
              </p>
              <p className="text-xs text-gray-500">Facturación pendiente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Urgentes */}
      {urgentes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={15}/> Próximos a vencer (30 días)
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-yellow-50 border-b border-yellow-100"><tr>
                <th className="th">Sociedad</th><th className="th">Plan</th>
                <th className="th">Vence</th><th className="th">Días</th><th className="th">Monto</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {urgentes.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="td">
                      <Link to={`/sociedades/${v.id}`} className="text-brand-600 hover:underline font-medium">{v.nombre}</Link>
                    </td>
                    <td className="td"><span className={estadoBadge(v.planCliente)}>{v.planCliente}</span></td>
                    <td className="td">{formatFecha(v.fechaVencimiento)}</td>
                    <td className="td">
                      <span className={`badge ${v.diasRestantes <= 7 ? 'badge-red' : 'badge-yellow'}`}>
                        {v.diasRestantes}d
                      </span>
                    </td>
                    <td className="td">{formatMoneda(v.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resto */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Todas las suscripciones
        </h2>
        {vencimientos.length === 0 ? (
          <div className="card p-8 text-center text-gray-400 text-sm">
            No hay suscripciones con fechas de vencimiento registradas
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="th">Sociedad</th><th className="th">Plan</th>
                <th className="th">Vence</th><th className="th">Días restantes</th><th className="th">Monto</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {vencimientos.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="td">
                      <Link to={`/sociedades/${v.id}`} className="text-brand-600 hover:underline font-medium">{v.nombre}</Link>
                    </td>
                    <td className="td"><span className={estadoBadge(v.planCliente)}>{v.planCliente}</span></td>
                    <td className="td">{formatFecha(v.fechaVencimiento)}</td>
                    <td className="td">
                      {v.diasRestantes != null
                        ? <span className={`badge ${v.diasRestantes < 0 ? 'badge-red' : v.diasRestantes <= 30 ? 'badge-yellow' : 'badge-green'}`}>
                            {v.diasRestantes < 0 ? 'VENCIDO' : `${v.diasRestantes}d`}
                          </span>
                        : '—'}
                    </td>
                    <td className="td">{formatMoneda(v.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pago manual */}
      <Modal open={showManual} onClose={() => setShowManual(false)} title="Registrar pago manual">
        <div className="space-y-4">
          <div>
            <label className="label">Sociedad *</label>
            <select className="input" value={form.sociedadId}
              onChange={e => setForm(f => ({ ...f, sociedadId: e.target.value }))}>
              <option value="">— Seleccionar —</option>
              {sociedades.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Plan</label>
              <select className="input" value={form.plan}
                onChange={e => {
                  const montos = { MENSUAL:39, ANUAL:350, FUNDADOR:300 };
                  setForm(f => ({ ...f, plan: e.target.value, monto: montos[e.target.value] || 0 }));
                }}>
                <option value="MENSUAL">Mensual — $39</option>
                <option value="ANUAL">Anual — $350</option>
                <option value="FUNDADOR">Fundador — $300</option>
              </select>
            </div>
            <div>
              <label className="label">Monto (USD)</label>
              <input type="number" className="input" value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Método de pago</label>
              <select className="input" value={form.metodoPago}
                onChange={e => setForm(f => ({ ...f, metodoPago: e.target.value }))}>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="YAPPY">Yappy</option>
                <option value="STRIPE">Stripe</option>
              </select>
            </div>
            <div>
              <label className="label">Referencia</label>
              <input className="input" value={form.referencia}
                onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
                placeholder="N° cheque, transacción..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowManual(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handlePagoManual}
              disabled={saving || !form.sociedadId}>
              {saving ? 'Registrando...' : 'Registrar pago'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
