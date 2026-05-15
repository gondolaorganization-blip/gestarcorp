import { useEffect, useState } from 'react';
import { portalApi } from '../../services/api.js';
import { PageSpinner } from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatFecha, formatMoneda, estadoBadge } from '../../utils/format.js';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function PortalObligaciones() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi.get('/portal/obligaciones')
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);

  const vencidas  = items.filter(o => o.estado === 'VENCIDO');
  const pendientes = items.filter(o => o.estado === 'PENDIENTE');
  const pagadas   = items.filter(o => o.estado === 'PAGADO');

  if (loading) return <PageSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Obligaciones Fiscales</h1>
        <p className="text-sm text-gray-500 mt-1">{items.length} obligaciones registradas</p>
      </div>

      {vencidas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Tienes {vencidas.length} obligación(es) vencida(s)</p>
            <p className="text-xs text-red-600 mt-0.5">Contacta a tu agente para regularizar.</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState message="No tienes obligaciones registradas" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="th">Tipo</th><th className="th">Año</th>
                <th className="th">Entidad</th><th className="th">Vence</th>
                <th className="th">Estado</th><th className="th">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="td text-xs font-medium">{o.tipo.replace(/_/g,' ')}</td>
                  <td className="td">{o.anio}</td>
                  <td className="td">{o.entidad || '—'}</td>
                  <td className="td">{formatFecha(o.fechaVence)}</td>
                  <td className="td"><span className={estadoBadge(o.estado)}>{o.estado}</span></td>
                  <td className="td">{formatMoneda(o.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagadas.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle size={16} />
          {pagadas.length} obligación(es) pagada(s) este periodo
        </div>
      )}
    </div>
  );
}
