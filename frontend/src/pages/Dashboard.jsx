import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import { formatFecha, formatMoneda, healthBg } from '../utils/format.js';
import { Building2, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Users, FileText } from 'lucide-react';

function KpiCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    red:    'bg-red-50 text-red-600 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [actividad, setActividad] = useState([]);
  const [sociedadesRiesgo, setSociedadesRiesgo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/dashboard/actividad?limit=8'),
      api.get('/dashboard/sociedades'),
    ]).then(([d, a, s]) => {
      const r = d.data?.resumen || {};
      setData({
        totalSociedades: r.sociedades?.total,
        activas:         r.sociedades?.activas,
        anual:           r.planes?.anual,
        mensual:         r.planes?.mensual,
        ingresosMes:     r.ingresos?.mesCorriente,
        alertas: {
          obligVencidas: r.alertas?.obligacionesVencidas,
          benefSinVerif: r.alertas?.benefSinVerificar,
        },
      });
      setActividad(Array.isArray(a.data) ? a.data : []);
      setSociedadesRiesgo((Array.isArray(s.data) ? s.data : []).slice(0, 6));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const d = data || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen de tu cartera corporativa</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total sociedades" value={d.totalSociedades} icon={Building2} color="blue" />
        <KpiCard label="Activas" value={d.activas} icon={CheckCircle} color="green"
          sub={`${d.anual || 0} plan anual · ${d.mensual || 0} mensual`} />
        <KpiCard label="Ingresos este mes" value={formatMoneda(d.ingresosMes)} icon={DollarSign} color="purple" />
        <KpiCard label="Oblig. vencidas" value={d.alertas?.obligVencidas || 0} icon={AlertTriangle}
          color={d.alertas?.obligVencidas > 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sociedades en riesgo */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Sociedades con mayor riesgo</h2>
            <Link to="/sociedades" className="text-xs text-brand-600 hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {sociedadesRiesgo.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">Sin datos</p>
            )}
            {sociedadesRiesgo.map(s => (
              <Link key={s.id} to={`/sociedades/${s.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.nombre}</p>
                  <p className="text-xs text-gray-400">{s.estado} · {s.planCliente}</p>
                </div>
                <span className={`badge ${healthBg(s.healthScore)}`}>
                  {s.healthScore}%
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Actividad reciente</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {actividad.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">Sin actividad</p>
            )}
            {actividad.map((item, i) => (
              <div key={i} className="px-5 py-3">
                <p className="text-sm text-gray-700">{item.descripcion || item.tipo}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.sociedad?.nombre && <span className="font-medium">{item.sociedad.nombre} · </span>}
                  {formatFecha(item.fecha || item.creadoEn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {(d.alertas?.obligVencidas > 0 || d.alertas?.benefSinVerif > 0) && (
        <div className="mt-6 card border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Atención requerida</p>
              <ul className="text-sm text-red-700 mt-1 space-y-1">
                {d.alertas?.obligVencidas > 0 && (
                  <li>· {d.alertas.obligVencidas} obligación(es) fiscal(es) vencida(s)</li>
                )}
                {d.alertas?.benefSinVerif > 0 && (
                  <li>· {d.alertas.benefSinVerif} beneficiario(s) sin verificar</li>
                )}
              </ul>
              <Link to="/alertas" className="text-xs text-red-600 hover:underline font-medium mt-2 inline-block">
                Ver alertas →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
