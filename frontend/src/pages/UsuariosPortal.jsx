import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatFecha } from '../utils/format.js';
import { Plus, Key, User } from 'lucide-react';

export default function UsuariosPortal() {
  const toast = useToast();
  const [sociedades, setSociedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ sociedadId:'', email:'', password:'', nombre:'' });
  const [saving, setSaving] = useState(false);
  const [accesos, setAccesos] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/sociedades?limite=100');
    setSociedades(data.sociedades || []);
    setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function verAcceso(sId) {
    try {
      const { data } = await api.get(`/auth/portal/sociedad/${sId}`);
      setAccesos(a => ({ ...a, [sId]: data }));
    } catch {
      setAccesos(a => ({ ...a, [sId]: null }));
    }
  }

  async function handleCrear() {
    setSaving(true);
    try {
      await api.post(`/auth/portal/sociedad/${form.sociedadId}`, {
        email: form.email,
        password: form.password,
        nombre: form.nombre,
      });
      toast.success('Usuario portal creado');
      setShowModal(false);
      setForm({ sociedadId:'', email:'', password:'', nombre:'' });
      // Actualizar acceso de la sociedad
      await verAcceso(form.sociedadId);
    } catch(e) {
      toast.error(e?.response?.data?.error || 'Error al crear usuario');
    } finally { setSaving(false); }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios del Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea accesos para que tus clientes vean sus obligaciones y consultas
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ sociedadId:'', email:'', password:'', nombre:'' }); setShowModal(true); }}>
          <Plus size={16}/> Crear acceso portal
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-blue-50">
          <p className="text-sm text-blue-700">
            <strong>¿Cómo funciona?</strong> Cada sociedad puede tener un usuario de portal.
            El cliente ingresa en <code className="bg-blue-100 px-1 rounded">/portal/login</code> con
            el email y contraseña que le asignes aquí.
          </p>
        </div>
        {sociedades.length === 0 ? (
          <EmptyState message="No hay sociedades en cartera" />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="th">Sociedad</th>
                <th className="th">Plan</th>
                <th className="th">Acceso portal</th>
                <th className="th"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sociedades.map(s => {
                const acc = accesos[s.id];
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="td font-medium text-gray-900">{s.nombre}</td>
                    <td className="td">
                      <span className={`badge ${s.planCliente === 'ANUAL' || s.planCliente === 'FUNDADOR' ? 'badge-purple' : 'badge-blue'}`}>
                        {s.planCliente}
                      </span>
                    </td>
                    <td className="td">
                      {acc === undefined ? (
                        <button className="text-xs text-brand-600 hover:underline" onClick={() => verAcceso(s.id)}>
                          Ver estado
                        </button>
                      ) : acc === null ? (
                        <span className="text-xs text-gray-400 italic">Sin acceso configurado</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-green-500" />
                          <span className="text-xs text-green-700 font-medium">{acc.email}</span>
                          <span className="text-xs text-gray-400">· {acc.activo ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      )}
                    </td>
                    <td className="td">
                      <button className="btn-secondary btn-sm"
                        onClick={() => { setForm({ sociedadId: s.id, email:'', password:'', nombre: s.nombre }); setShowModal(true); }}>
                        <Key size={13}/> {acc ? 'Actualizar' : 'Crear acceso'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Crear / Actualizar acceso portal">
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
            <label className="label">Nombre del contacto</label>
            <input className="input" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre del representante legal" />
          </div>
          <div>
            <label className="label">Email de acceso *</label>
            <input type="email" className="input" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="cliente@empresa.com" />
          </div>
          <div>
            <label className="label">Contraseña *</label>
            <input type="password" className="input" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres" />
          </div>
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
            El cliente usará estas credenciales en <strong>/portal/login</strong> para ver sus obligaciones
            fiscales y enviar consultas.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleCrear}
              disabled={saving || !form.sociedadId || !form.email || !form.password}>
              {saving ? 'Creando...' : 'Crear acceso'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
