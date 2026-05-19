import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatFecha, formatMoneda, estadoBadge } from '../utils/format.js';
import { CreditCard, Calendar, AlertTriangle, Plus, DollarSign, Clock } from 'lucide-react';

const PLANES_INFO = {
  MENSUAL:  { label: 'Mensual',  monto: 39,  desc: '$39 / mes' },
  ANUAL:    { label: 'Anual',    monto: 350, desc: '$350 / año — Agente Residente incluido' },
  FUNDADOR: { label: 'Fundador', monto: 300, desc: '$300 / año — precio especial' },
};

// ─── Modal PayPal ─────────────────────────────────────────────────────────────

function ModalPayPal({ open, onClose, sociedades, onExito }) {
  const toast = useToast();
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({ sociedadId: '', plan: 'ANUAL' });
  const [suscripcionId, setSuscripcionId] = useState(null);

  function reset() { setPaso(1); setForm({ sociedadId: '', plan: 'ANUAL' }); setSuscripcionId(null); }
  function cerrar() { reset(); onClose(); }

  async function crearOrden() {
    const { data } = await api.post('/suscripciones/paypal/crear-orden', form);
    setSuscripcionId(data.suscripcionId);
    return data.orderID;
  }

  async function onApprove({ orderID }) {
    try {
      await api.post('/suscripciones/paypal/capturar', { orderID, suscripcionId });
      toast.success('¡Pago completado! Suscripción activada.');
      cerrar();
      onExito();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al confirmar el pago');
    }
  }

  const planSeleccionado = PLANES_INFO[form.plan];

  return (
    <Modal open={open} onClose={cerrar} title="Pagar con PayPal">
      {paso === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="label">Sociedad *</label>
            <select className="input" value={form.sociedadId}
              onChange={e => setForm(f => ({ ...f, sociedadId: e.target.value }))}>
              <option value="">— Seleccionar —</option>
              {sociedades.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Plan</label>
            <div className="space-y-2">
              {Object.entries(PLANES_INFO).map(([key, p]) => (
                <label key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${form.plan === key ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="plan" value={key} checked={form.plan === key}
                    onChange={() => setForm(f => ({ ...f, plan: key }))} className="text-brand-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                    <p className="text-xs text-gray-500">{p.desc}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatMoneda(p.monto)}</p>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={cerrar}>Cancelar</button>
            <button className="btn-primary" disabled={!form.sociedadId}
              onClick={() => setPaso(2)}>
              Continuar →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p className="text-gray-500">Sociedad</p>
            <p className="font-semibold">{sociedades.find(s => s.id === form.sociedadId)?.nombre}</p>
            <p className="text-gray-500 mt-2">Plan</p>
            <p className="font-semibold">{planSeleccionado.label} — {formatMoneda(planSeleccionado.monto)}</p>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Serás redirigido al popup de PayPal para completar el pago de forma segura.
          </p>

          <PayPalScriptProvider options={{
            clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
            currency: 'USD',
            intent:   'capture',
          }}>
            <PayPalButtons
              style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
              createOrder={crearOrden}
              onApprove={onApprove}
              onError={() => toast.error('Error en el pago con PayPal. Intente de nuevo.')}
              onCancel={() => { setSuscripcionId(null); toast.error('Pago cancelado.'); }}
            />
          </PayPalScriptProvider>

          <button className="text-xs text-gray-400 hover:text-gray-600 w-full text-center"
            onClick={() => { setSuscripcionId(null); setPaso(1); }}>
            ← Cambiar plan o sociedad
          </button>
        </div>
      )}
    </Modal>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Suscripciones() {
  const toast = useToast();
  const [vencimientos, setVencimientos] = useState([]);
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [sociedades, setSociedades] = useState([]);
  const [form, setForm] = useState({ sociedadId:'', plan:'ANUAL', monto:350, metodoPago:'TRANSFERENCIA', referencia:'' });
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [v, t, s] = await Promise.all([
      api.get('/suscripciones/vencimientos'),
      api.get('/suscripciones/trials'),
      api.get('/sociedades?limite=100'),
    ]);
    setVencimientos(v.data);
    setTrials(t.data);
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

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suscripciones</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de planes y pagos de la cartera</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowPayPal(true)}>
            <CreditCard size={16}/> Cobrar con PayPal
          </button>
          <button className="btn-primary" onClick={() => {
            setForm({ sociedadId:'', plan:'ANUAL', monto:350, metodoPago:'TRANSFERENCIA', referencia:'' });
            setShowManual(true);
          }}>
            <Plus size={16}/> Registrar pago manual
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-8">
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
        <div className={`card p-5 ${trials.length > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
          <div className="flex items-center gap-3">
            <Clock size={20} className={trials.length > 0 ? 'text-amber-500' : 'text-gray-300'} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{trials.length}</p>
              <p className="text-xs text-gray-500">En período de prueba</p>
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

      {/* Períodos de prueba activos */}
      {trials.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={15}/> Períodos de prueba activos ({trials.length})
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-100"><tr>
                <th className="th">Sociedad</th>
                <th className="th">Ficha</th>
                <th className="th">Vence</th>
                <th className="th">Días restantes</th>
                <th className="th"/>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {trials.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="td">
                      <Link to={`/sociedades/${t.id}`} className="text-brand-600 hover:underline font-medium">{t.nombre}</Link>
                    </td>
                    <td className="td text-gray-500">{t.ficha || '—'}</td>
                    <td className="td">{formatFecha(t.fechaVencimiento)}</td>
                    <td className="td">
                      {t.diasRestantes != null
                        ? <span className={`badge ${t.diasRestantes < 0 ? 'badge-red' : t.diasRestantes <= 3 ? 'badge-red' : t.diasRestantes <= 7 ? 'badge-yellow' : 'badge-amber'}`}>
                            {t.diasRestantes < 0 ? 'VENCIDO' : `${t.diasRestantes}d`}
                          </span>
                        : '—'}
                    </td>
                    <td className="td">
                      <button
                        className="text-xs font-semibold text-brand-600 hover:underline"
                        onClick={() => { setShowPayPal(true); }}
                      >
                        Activar plan →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Todas */}
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
                <option value="PAYPAL">PayPal</option>
                <option value="YAPPY">Yappy</option>
                <option value="STRIPE">Stripe</option>
              </select>
            </div>
            <div>
              <label className="label">Referencia</label>
              <input className="input" value={form.referencia}
                onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
                placeholder="N° transacción..." />
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

      {/* Modal PayPal */}
      <ModalPayPal
        open={showPayPal}
        onClose={() => setShowPayPal(false)}
        sociedades={sociedades}
        onExito={cargar}
      />
    </div>
  );
}
