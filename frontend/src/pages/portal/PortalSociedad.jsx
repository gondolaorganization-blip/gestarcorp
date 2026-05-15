import { useEffect, useState } from 'react';
import { portalApi } from '../../services/api.js';
import { PageSpinner } from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatFecha, formatMoneda, estadoBadge } from '../../utils/format.js';
import { Download, Building2, Users, UserCheck, File } from 'lucide-react';

export default function PortalSociedad() {
  const [sociedad, setSociedad] = useState(null);
  const [directores, setDirectores] = useState([]);
  const [accionistas, setAccionistas] = useState([]);
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      portalApi.get('/portal/sociedad'),
      portalApi.get('/portal/sociedad/directores'),
      portalApi.get('/portal/sociedad/accionistas'),
      portalApi.get('/portal/sociedad/actas'),
    ]).then(([s, d, a, ac]) => {
      setSociedad(s.data);
      setDirectores(Array.isArray(d.data) ? d.data : []);
      setAccionistas(Array.isArray(a.data) ? a.data : []);
      setActas(Array.isArray(ac.data) ? ac.data : ac.data?.actas || []);
    }).finally(() => setLoading(false));
  }, []);

  async function descargarActa(actaId) {
    const { data: blob } = await portalApi.get(`/portal/sociedad/actas/${actaId}/pdf`, { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `acta_${actaId}.pdf`;
    a.click();
  }

  if (loading) return <PageSpinner />;
  if (!sociedad) return <EmptyState message="No se encontraron datos de la sociedad" />;

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{sociedad.nombre}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={estadoBadge(sociedad.estado)}>{sociedad.estado}</span>
          <span className={estadoBadge(sociedad.planCliente)}>{sociedad.planCliente}</span>
          {sociedad.ficha && <span className="text-xs text-gray-400">Ficha {sociedad.ficha}</span>}
        </div>
      </div>

      {/* Datos generales */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-brand-500" /> Datos de inscripción
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3">
          {[
            ['Ficha', sociedad.ficha],
            ['Tomo', sociedad.tomo],
            ['Folio', sociedad.folio],
            ['Constitución', formatFecha(sociedad.fechaConstitucion)],
            ['Domicilio', sociedad.domicilio],
            ['Capital', formatMoneda(sociedad.capital)],
            ['Acciones', `${sociedad.cantidadAcciones?.toLocaleString('es-PA') || '—'} ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'}`],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-gray-100 pb-3">
              <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{k}</dt>
              <dd className="text-sm text-gray-900 mt-0.5">{v || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Junta directiva */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={16} className="text-brand-500" /> Junta Directiva
        </h2>
        {directores.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin directores registrados</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="th">Cargo</th>
                <th className="th">Nombre</th>
                <th className="th">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {directores.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="td"><span className="badge badge-blue">{d.cargo}</span></td>
                  <td className="td font-medium">{d.nombre}</td>
                  <td className="td">{formatFecha(d.fechaNombramiento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Accionistas */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserCheck size={16} className="text-brand-500" /> Accionistas
        </h2>
        {accionistas.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin accionistas registrados</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="th">Nombre</th>
                <th className="th">Acciones</th>
                <th className="th">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accionistas.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="td font-medium">{a.nombre}</td>
                  <td className="td">{a.cantidadAcciones?.toLocaleString('es-PA') || '—'}</td>
                  <td className="td">{Number(a.porcentaje).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Actas recientes */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <File size={16} className="text-brand-500" /> Actas recientes
        </h2>
        {actas.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin actas registradas</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="th">#</th>
                <th className="th">Tipo</th>
                <th className="th">Fecha</th>
                <th className="th">Estado</th>
                <th className="th"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actas.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="td font-mono">{a.numero}</td>
                  <td className="td text-xs">{a.tipo?.replace(/_/g, ' ')}</td>
                  <td className="td">{formatFecha(a.fecha)}</td>
                  <td className="td"><span className={estadoBadge(a.estado)}>{a.estado}</span></td>
                  <td className="td">
                    {a.estado === 'APROBADA' && (
                      <button className="text-brand-600 hover:text-brand-800 flex items-center gap-1 text-xs"
                        onClick={() => descargarActa(a.id)}>
                        <Download size={13}/> PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
