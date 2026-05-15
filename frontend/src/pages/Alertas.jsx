import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatFecha } from '../utils/format.js';
import { AlertTriangle, CheckCircle, RefreshCw, Shield } from 'lucide-react';

export default function Alertas() {
  const toast = useToast();
  const [obligs, setObligs] = useState(null);
  const [benefs, setBenefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/alertas/obligaciones'),
      api.get('/alertas/beneficiarios'),
    ]).then(([o, b]) => {
      setObligs(o.data); setBenefs(b.data);
    }).finally(() => setLoading(false));
  }, []);

  async function dispararVerificacion() {
    setRunning(true);
    try {
      await api.post('/alertas/obligaciones/verificar');
      toast.success('Verificación iniciada en segundo plano');
    } catch(e) { toast.error('Error al iniciar verificación'); }
    finally { setRunning(false); }
  }

  if (loading) return <PageSpinner />;

  const proximas = obligs?.proximas || [];
  const vencidas = obligs?.vencidas || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="text-sm text-gray-500 mt-1">Obligaciones y cumplimiento de tu cartera</p>
        </div>
        <button className="btn-secondary btn-sm" onClick={dispararVerificacion} disabled={running}>
          <RefreshCw size={14} className={running ? 'animate-spin' : ''} />
          {running ? 'Procesando...' : 'Verificar ahora'}
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className={`card p-5 ${vencidas.length > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className={vencidas.length > 0 ? 'text-red-500' : 'text-gray-300'} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{vencidas.length}</p>
              <p className="text-xs text-gray-500">Obligaciones vencidas</p>
            </div>
          </div>
        </div>
        <div className={`card p-5 ${proximas.length > 0 ? 'border-yellow-200 bg-yellow-50' : ''}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className={proximas.length > 0 ? 'text-yellow-500' : 'text-gray-300'} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{proximas.length}</p>
              <p className="text-xs text-gray-500">Próximas a vencer (30 días)</p>
            </div>
          </div>
        </div>
        <div className={`card p-5 ${benefs.length > 0 ? 'border-orange-200 bg-orange-50' : ''}`}>
          <div className="flex items-center gap-3">
            <Shield size={20} className={benefs.length > 0 ? 'text-orange-500' : 'text-gray-300'} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{benefs.length}</p>
              <p className="text-xs text-gray-500">Sociedades con benef. pendientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vencidas */}
      {vencidas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Obligaciones vencidas
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-red-50 border-b border-red-100">
                <tr>
                  <th className="th">Sociedad</th><th className="th">Tipo</th>
                  <th className="th">Venció</th><th className="th">Entidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vencidas.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="td">
                      <Link to={`/sociedades/${o.sociedadId}`} className="text-brand-600 hover:underline font-medium">
                        {o.sociedad?.nombre || '—'}
                      </Link>
                    </td>
                    <td className="td text-xs">{o.tipo?.replace(/_/g,' ')}</td>
                    <td className="td text-red-600 font-medium">{formatFecha(o.fechaVence)}</td>
                    <td className="td">{o.entidad || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Próximas */}
      {proximas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Próximas a vencer
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-yellow-50 border-b border-yellow-100">
                <tr>
                  <th className="th">Sociedad</th><th className="th">Tipo</th>
                  <th className="th">Vence</th><th className="th">Días</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proximas.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="td">
                      <Link to={`/sociedades/${o.sociedadId}`} className="text-brand-600 hover:underline font-medium">
                        {o.sociedad?.nombre || '—'}
                      </Link>
                    </td>
                    <td className="td text-xs">{o.tipo?.replace(/_/g,' ')}</td>
                    <td className="td">{formatFecha(o.fechaVence)}</td>
                    <td className="td">
                      <span className={`badge ${o.urgente ? 'badge-red' : 'badge-yellow'}`}>
                        {o.diasRestantes}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Beneficiarios */}
      {benefs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-orange-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Shield size={16} /> Beneficiarios sin verificar (Ley 52)
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-orange-50 border-b border-orange-100">
                <tr><th className="th">Sociedad</th><th className="th">Pendientes</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {benefs.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="td">
                      <Link to={`/sociedades/${b.id}`} className="text-brand-600 hover:underline font-medium">
                        {b.nombre}
                      </Link>
                    </td>
                    <td className="td"><span className="badge badge-yellow">{b._sinVerificar}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vencidas.length === 0 && proximas.length === 0 && benefs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CheckCircle size={48} className="text-green-400 mb-3" />
          <p className="text-lg font-medium text-gray-600">Todo en orden</p>
          <p className="text-sm mt-1">No hay alertas activas en tu cartera</p>
        </div>
      )}
    </div>
  );
}
