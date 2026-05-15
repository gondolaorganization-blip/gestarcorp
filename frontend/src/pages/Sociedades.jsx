import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatFecha, estadoBadge, healthBg } from '../utils/format.js';
import { Plus, Search, Building2, ChevronRight } from 'lucide-react';

const ESTADOS = ['ACTIVA','INACTIVA','DISUELTA','SUSPENDIDA'];
const PLANES  = ['MENSUAL','ANUAL','FUNDADOR'];

function FormSociedad({ onSave, initial }) {
  const [form, setForm] = useState(initial || {
    nombre:'', ficha:'', tomo:'', folio:'', fechaConstitucion:'',
    estado:'ACTIVA', planCliente:'MENSUAL', domicilio:'República de Panamá',
    capital:0, cantidadAcciones:0, valorNominal:1, tipoAcciones:'NOMINATIVAS',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nombre de la sociedad *</label>
          <input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
        </div>
        <div>
          <label className="label">Ficha</label>
          <input className="input" value={form.ficha} onChange={e => set('ficha', e.target.value)} />
        </div>
        <div>
          <label className="label">Fecha de constitución</label>
          <input type="date" className="input" value={form.fechaConstitucion?.slice?.(0,10) || ''}
            onChange={e => set('fechaConstitucion', e.target.value)} />
        </div>
        <div>
          <label className="label">Tomo</label>
          <input className="input" value={form.tomo} onChange={e => set('tomo', e.target.value)} />
        </div>
        <div>
          <label className="label">Folio</label>
          <input className="input" value={form.folio} onChange={e => set('folio', e.target.value)} />
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="input" value={form.estado} onChange={e => set('estado', e.target.value)}>
            {ESTADOS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Plan</label>
          <select className="input" value={form.planCliente} onChange={e => set('planCliente', e.target.value)}>
            {PLANES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Domicilio</label>
          <input className="input" value={form.domicilio} onChange={e => set('domicilio', e.target.value)} />
        </div>
        <div>
          <label className="label">Capital (USD)</label>
          <input type="number" className="input" value={form.capital} onChange={e => set('capital', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Tipo de acciones</label>
          <select className="input" value={form.tipoAcciones} onChange={e => set('tipoAcciones', e.target.value)}>
            <option value="NOMINATIVAS">Nominativas</option>
            <option value="AL_PORTADOR">Al portador</option>
          </select>
        </div>
        <div>
          <label className="label">Cantidad de acciones</label>
          <input type="number" className="input" value={form.cantidadAcciones} onChange={e => set('cantidadAcciones', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Valor nominal (USD)</label>
          <input type="number" className="input" value={form.valorNominal} onChange={e => set('valorNominal', Number(e.target.value))} />
        </div>
      </div>
      <div className="pt-2 flex justify-end gap-3">
        <button type="submit" className="btn-primary">
          {initial ? 'Guardar cambios' : 'Crear sociedad'}
        </button>
      </div>
    </form>
  );
}

export default function Sociedades() {
  const toast = useToast();
  const [sociedades, setSociedades] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const LIMITE = 20;

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sociedades', {
        params: { buscar: busqueda, pagina, limite: LIMITE }
      });
      setSociedades(data.sociedades || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [busqueda, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleCrear(form) {
    try {
      await api.post('/sociedades', form);
      toast.success('Sociedad creada correctamente');
      setShowModal(false);
      cargar();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al crear');
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sociedades</h1>
          <p className="text-sm text-gray-500 mt-1">{total} en cartera</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nueva sociedad
        </button>
      </div>

      {/* Buscador */}
      <div className="card p-4 mb-5">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar por nombre, ficha..."
            value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }} />
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? <PageSpinner /> : sociedades.length === 0 ? (
          <EmptyState message="No se encontraron sociedades"
            action={<button className="btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={14} /> Nueva</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="th">Sociedad</th>
                  <th className="th">Ficha</th>
                  <th className="th">Estado</th>
                  <th className="th">Plan</th>
                  <th className="th">Vence</th>
                  <th className="th">Health</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sociedades.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="td font-medium text-gray-900">{s.nombre}</td>
                    <td className="td text-gray-500">{s.ficha || '—'}</td>
                    <td className="td"><span className={estadoBadge(s.estado)}>{s.estado}</span></td>
                    <td className="td"><span className={estadoBadge(s.planCliente)}>{s.planCliente}</span></td>
                    <td className="td">{s.fechaVencimiento ? formatFecha(s.fechaVencimiento) : '—'}</td>
                    <td className="td">
                      {s.healthScore != null
                        ? <span className={`badge ${healthBg(s.healthScore)}`}>{s.healthScore}%</span>
                        : '—'}
                    </td>
                    <td className="td">
                      <Link to={`/sociedades/${s.id}`}
                        className="text-brand-600 hover:text-brand-800 inline-flex items-center gap-1 text-xs font-medium">
                        Ver <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {total > LIMITE && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Página {pagina} de {Math.ceil(total / LIMITE)}</span>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" disabled={pagina === 1}
                onClick={() => setPagina(p => p - 1)}>Anterior</button>
              <button className="btn-secondary btn-sm" disabled={pagina * LIMITE >= total}
                onClick={() => setPagina(p => p + 1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva sociedad" size="lg">
        <FormSociedad onSave={handleCrear} />
      </Modal>
    </div>
  );
}
