import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { PageSpinner } from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatFecha } from '../utils/format.js';
import { Plus, Edit2, UserCheck } from 'lucide-react';

const ROLES = ['AGENTE', 'SUPERADMIN'];

export default function Agentes() {
  const toast = useToast();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/auth/agentes');
    setItems(data); setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  function openNew() {
    setEditing(null);
    setForm({ nombre: '', email: '', password: '', rol: 'AGENTE', activo: true, cur: '' });
    setShowModal(true);
  }
  function openEdit(a) {
    setEditing(a);
    setForm({ nombre: a.nombre, email: a.email, password: '', rol: a.rol, activo: a.activo, cur: a.cur || '' });
    setShowModal(true);
  }

  async function handleSave() {
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) await api.put(`/auth/agentes/${editing.id}`, payload);
      else await api.post('/auth/agentes', payload);
      toast.success(editing ? 'Agente actualizado' : 'Agente creado');
      setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error al guardar'); }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agentes</h1>
          <p className="text-sm text-gray-500 mt-1">Usuarios con acceso al panel administrativo</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={16}/> Nuevo agente</button>
      </div>

      <div className="card overflow-hidden">
        {items.length === 0 ? <EmptyState message="Sin agentes registrados" /> : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="th">Nombre</th>
                <th className="th">Email</th>
                <th className="th">CUR</th>
                <th className="th">Rol</th>
                <th className="th">Estado</th>
                <th className="th">Desde</th>
                <th className="th"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="td font-medium">{a.nombre}</td>
                  <td className="td text-gray-500">{a.email}</td>
                  <td className="td text-gray-500 font-mono text-xs">{a.cur || '—'}</td>
                  <td className="td">
                    <span className={`badge ${a.rol === 'SUPERADMIN' ? 'badge-purple' : 'badge-blue'}`}>{a.rol}</span>
                  </td>
                  <td className="td">
                    {a.activo
                      ? <span className="badge badge-green">Activo</span>
                      : <span className="badge badge-red">Inactivo</span>}
                  </td>
                  <td className="td">{formatFecha(a.creadoEn)}</td>
                  <td className="td">
                    <button className="text-brand-600 hover:text-brand-800" onClick={() => openEdit(a)}>
                      <Edit2 size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar agente' : 'Nuevo agente'}>
        <div className="space-y-4">
          <div><label className="label">Nombre completo *</label>
            <input className="input" value={form.nombre||''} onChange={e=>set('nombre',e.target.value)}/>
          </div>
          <div><label className="label">Email *</label>
            <input type="email" className="input" value={form.email||''} onChange={e=>set('email',e.target.value)}/>
          </div>
          <div>
            <label className="label">{editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <input type="password" className="input" value={form.password||''} onChange={e=>set('password',e.target.value)}/>
          </div>
          <div>
            <label className="label">CUR (Código Único de Registro)</label>
            <input className="input font-mono" placeholder="Ej: 12345-RUBF" value={form.cur||''} onChange={e=>set('cur',e.target.value)}/>
            <p className="text-xs text-gray-400 mt-1">Código asignado al agente residente por el RUBF. Se usará en reportes de beneficiarios finales.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Rol</label>
              <select className="input" value={form.rol||'AGENTE'} onChange={e=>set('rol',e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label">Estado</label>
              <select className="input" value={form.activo ? 'activo' : 'inactivo'} onChange={e=>set('activo',e.target.value==='activo')}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}>
              <UserCheck size={15}/> {editing ? 'Guardar cambios' : 'Crear agente'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
