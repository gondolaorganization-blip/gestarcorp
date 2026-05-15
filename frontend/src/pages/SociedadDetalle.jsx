import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import Spinner from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatFecha, formatMoneda, estadoBadge, healthBg } from '../utils/format.js';
import {
  ArrowLeft, Edit2, Trash2, Plus, Download, FileText,
  Users, UserCheck, Shield, ClipboardList, File, MessageSquare, BookOpen
} from 'lucide-react';

const TABS = [
  { id: 'datos',         label: 'Datos',          icon: FileText },
  { id: 'directores',    label: 'Directores',      icon: Users },
  { id: 'accionistas',   label: 'Accionistas',     icon: UserCheck },
  { id: 'acciones',      label: 'Acciones',        icon: BookOpen },
  { id: 'beneficiarios', label: 'Beneficiarios',   icon: Shield },
  { id: 'obligaciones',  label: 'Obligaciones',    icon: ClipboardList },
  { id: 'actas',         label: 'Actas',           icon: File },
  { id: 'documentos',    label: 'Documentos',      icon: FileText },
  { id: 'consultas',     label: 'Consultas',       icon: MessageSquare },
];

// ─── FormSociedad ─────────────────────────────────────────────────────────────
function FormSociedad({ onSave, initial }) {
  const ESTADOS = ['ACTIVA','INACTIVA','DISUELTA','SUSPENDIDA'];
  const PLANES  = ['MENSUAL','ANUAL','FUNDADOR'];
  const [form, setForm] = useState(initial || {
    nombre:'', ficha:'', tomo:'', folio:'', fechaConstitucion:'',
    estado:'ACTIVA', planCliente:'MENSUAL', domicilio:'República de Panamá',
    capital:0, cantidadAcciones:0, valorNominal:1, tipoAcciones:'NOMINATIVAS',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e=>{e.preventDefault();onSave(form);}} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Nombre *</label><input className="input" value={form.nombre} onChange={e=>set('nombre',e.target.value)} required/></div>
        <div><label className="label">Ficha</label><input className="input" value={form.ficha||''} onChange={e=>set('ficha',e.target.value)}/></div>
        <div><label className="label">Constitución</label><input type="date" className="input" value={form.fechaConstitucion?.slice?.(0,10)||''} onChange={e=>set('fechaConstitucion',e.target.value)}/></div>
        <div><label className="label">Tomo</label><input className="input" value={form.tomo||''} onChange={e=>set('tomo',e.target.value)}/></div>
        <div><label className="label">Folio</label><input className="input" value={form.folio||''} onChange={e=>set('folio',e.target.value)}/></div>
        <div><label className="label">Estado</label><select className="input" value={form.estado} onChange={e=>set('estado',e.target.value)}>{ESTADOS.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label className="label">Plan</label><select className="input" value={form.planCliente} onChange={e=>set('planCliente',e.target.value)}>{PLANES.map(p=><option key={p}>{p}</option>)}</select></div>
        <div className="col-span-2"><label className="label">Domicilio</label><input className="input" value={form.domicilio||''} onChange={e=>set('domicilio',e.target.value)}/></div>
        <div><label className="label">Capital (USD)</label><input type="number" className="input" value={form.capital||0} onChange={e=>set('capital',Number(e.target.value))}/></div>
        <div><label className="label">Tipo acciones</label><select className="input" value={form.tipoAcciones} onChange={e=>set('tipoAcciones',e.target.value)}><option value="NOMINATIVAS">Nominativas</option><option value="AL_PORTADOR">Al portador</option></select></div>
        <div><label className="label">Cant. acciones</label><input type="number" className="input" value={form.cantidadAcciones||0} onChange={e=>set('cantidadAcciones',Number(e.target.value))}/></div>
        <div><label className="label">Valor nominal (USD)</label><input type="number" className="input" value={form.valorNominal||1} onChange={e=>set('valorNominal',Number(e.target.value))}/></div>
      </div>
      <div className="flex justify-end pt-2"><button type="submit" className="btn-primary">{initial?.id ? 'Guardar cambios' : 'Crear'}</button></div>
    </form>
  );
}

// ─── TabDatos ─────────────────────────────────────────────────────────────────
function TabDatos({ sociedad, onEdit, onDelete }) {
  const campos = [
    ['Ficha', sociedad.ficha], ['Tomo', sociedad.tomo], ['Folio', sociedad.folio],
    ['Constitución', formatFecha(sociedad.fechaConstitucion)],
    ['Estado', sociedad.estado], ['Plan', sociedad.planCliente],
    ['Domicilio', sociedad.domicilio],
    ['Capital', formatMoneda(sociedad.capital)],
    ['Acciones', `${sociedad.cantidadAcciones?.toLocaleString('es-PA') || '—'} ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'} a ${formatMoneda(sociedad.valorNominal)} c/u`],
    ['Vence plan', formatFecha(sociedad.fechaVencimiento)],
  ];
  return (
    <div>
      <div className="flex justify-end gap-3 mb-4">
        <button className="btn-secondary btn-sm" onClick={onEdit}><Edit2 size={14}/> Editar</button>
        <button className="btn-danger btn-sm" onClick={onDelete}><Trash2 size={14}/> Eliminar</button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {campos.map(([k,v]) => (
          <div key={k} className="border-b border-gray-100 pb-3">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k}</dt>
            <dd className="text-sm text-gray-900 mt-0.5">{v || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── TabDirectores ────────────────────────────────────────────────────────────
function TabDirectores({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [delId, setDelId] = useState(null);
  const CARGOS = ['PRESIDENTE','VICEPRESIDENTE','SECRETARIO','TESORERO','DIRECTOR'];

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/directores`);
    setItems(data); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function openNew() { setEditing(null); setForm({ cargo:'DIRECTOR', nombre:'', tipoDocumento:'CEDULA', numeroDocumento:'', nacionalidad:'Panameña', fechaNombramiento:'' }); setShowModal(true); }
  function openEdit(d) { setEditing(d); setForm({ cargo:d.cargo, nombre:d.nombre, tipoDocumento:d.tipoDocumento||'CEDULA', numeroDocumento:d.numeroDocumento||'', nacionalidad:d.nacionalidad||'', fechaNombramiento:d.fechaNombramiento?.slice(0,10)||'' }); setShowModal(true); }

  async function handleSave() {
    try {
      if (editing) await api.put(`/sociedades/${id}/directores/${editing.id}`, form);
      else await api.post(`/sociedades/${id}/directores`, form);
      toast.success('Guardado'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }
  async function handleDelete() {
    try { await api.delete(`/sociedades/${id}/directores/${delId}`); toast.success('Eliminado'); setDelId(null); cargar(); }
    catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14}/> Agregar</button>
      </div>
      {items.length === 0 ? <EmptyState message="Sin directores registrados" /> : (
        <div className="overflow-x-auto">
          <table className="w-full"><thead className="bg-gray-50 border-b"><tr>
            <th className="th">Cargo</th><th className="th">Nombre</th>
            <th className="th">Documento</th><th className="th">Nacionalidad</th>
            <th className="th">Desde</th><th className="th"/>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="td"><span className="badge badge-blue">{d.cargo}</span></td>
                <td className="td font-medium">{d.nombre}</td>
                <td className="td text-gray-500">{d.tipoDocumento} {d.numeroDocumento}</td>
                <td className="td">{d.nacionalidad}</td>
                <td className="td">{formatFecha(d.fechaNombramiento)}</td>
                <td className="td"><div className="flex gap-2">
                  <button className="text-brand-600 hover:text-brand-800" onClick={()=>openEdit(d)}><Edit2 size={14}/></button>
                  <button className="text-red-500 hover:text-red-700" onClick={()=>setDelId(d.id)}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Editar director':'Nuevo director'}>
        <div className="space-y-4">
          <div><label className="label">Cargo</label>
            <select className="input" value={form.cargo||'DIRECTOR'} onChange={e=>setForm(f=>({...f,cargo:e.target.value}))}>
              {CARGOS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Nombre completo</label><input className="input" value={form.nombre||''} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo doc.</label>
              <select className="input" value={form.tipoDocumento||'CEDULA'} onChange={e=>setForm(f=>({...f,tipoDocumento:e.target.value}))}>
                {['CEDULA','PASAPORTE','RUC'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Número doc.</label><input className="input" value={form.numeroDocumento||''} onChange={e=>setForm(f=>({...f,numeroDocumento:e.target.value}))}/></div>
          </div>
          <div><label className="label">Nacionalidad</label><input className="input" value={form.nacionalidad||''} onChange={e=>setForm(f=>({...f,nacionalidad:e.target.value}))}/></div>
          <div><label className="label">Fecha de nombramiento</label><input type="date" className="input" value={form.fechaNombramiento||''} onChange={e=>setForm(f=>({...f,fechaNombramiento:e.target.value}))}/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDelete}
        title="Eliminar director" message="¿Confirmar eliminación de este director?" />
    </div>
  );
}

// ─── TabAccionistas ───────────────────────────────────────────────────────────
function TabAccionistas({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [delId, setDelId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/accionistas`);
    setItems(data); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function openNew() { setEditing(null); setForm({ nombre:'', cantidadAcciones:0, porcentaje:0, tipoDocumento:'CEDULA', numeroDocumento:'', nacionalidad:'Panameña', fechaAdquisicion:'' }); setShowModal(true); }
  function openEdit(a) { setEditing(a); setForm({ nombre:a.nombre, cantidadAcciones:a.cantidadAcciones, porcentaje:a.porcentaje, tipoDocumento:a.tipoDocumento||'CEDULA', numeroDocumento:a.numeroDocumento||'', nacionalidad:a.nacionalidad||'', fechaAdquisicion:a.fechaAdquisicion?.slice(0,10)||'' }); setShowModal(true); }

  async function handleSave() {
    try {
      if (editing) await api.put(`/sociedades/${id}/accionistas/${editing.id}`, form);
      else await api.post(`/sociedades/${id}/accionistas`, form);
      toast.success('Guardado'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }
  async function handleDelete() {
    try { await api.delete(`/sociedades/${id}/accionistas/${delId}`); toast.success('Eliminado'); setDelId(null); cargar(); }
    catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14}/> Agregar</button>
      </div>
      {items.length === 0 ? <EmptyState message="Sin accionistas registrados" /> : (
        <table className="w-full"><thead className="bg-gray-50 border-b"><tr>
          <th className="th">Nombre</th><th className="th">Acciones</th><th className="th">%</th>
          <th className="th">Nacionalidad</th><th className="th"/>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(a => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="td font-medium">{a.nombre}</td>
              <td className="td">{a.cantidadAcciones?.toLocaleString('es-PA')}</td>
              <td className="td">{Number(a.porcentaje).toFixed(2)}%</td>
              <td className="td">{a.nacionalidad}</td>
              <td className="td"><div className="flex gap-2">
                <button className="text-brand-600 hover:text-brand-800" onClick={()=>openEdit(a)}><Edit2 size={14}/></button>
                <button className="text-red-500 hover:text-red-700" onClick={()=>setDelId(a.id)}><Trash2 size={14}/></button>
              </div></td>
            </tr>
          ))}
        </tbody></table>
      )}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Editar accionista':'Nuevo accionista'}>
        <div className="space-y-3">
          <div><label className="label">Nombre</label><input className="input" value={form.nombre||''} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cant. acciones</label><input type="number" className="input" value={form.cantidadAcciones||0} onChange={e=>setForm(f=>({...f,cantidadAcciones:Number(e.target.value)}))}/></div>
            <div><label className="label">% participación</label><input type="number" step="0.01" className="input" value={form.porcentaje||0} onChange={e=>setForm(f=>({...f,porcentaje:Number(e.target.value)}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo doc.</label>
              <select className="input" value={form.tipoDocumento||'CEDULA'} onChange={e=>setForm(f=>({...f,tipoDocumento:e.target.value}))}>
                {['CEDULA','PASAPORTE','RUC'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Número doc.</label><input className="input" value={form.numeroDocumento||''} onChange={e=>setForm(f=>({...f,numeroDocumento:e.target.value}))}/></div>
          </div>
          <div><label className="label">Nacionalidad</label><input className="input" value={form.nacionalidad||''} onChange={e=>setForm(f=>({...f,nacionalidad:e.target.value}))}/></div>
          <div><label className="label">Fecha adquisición</label><input type="date" className="input" value={form.fechaAdquisicion||''} onChange={e=>setForm(f=>({...f,fechaAdquisicion:e.target.value}))}/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDelete}
        title="Eliminar accionista" message="¿Confirmar eliminación?" />
    </div>
  );
}

// ─── TabAcciones (Libro de acciones) ─────────────────────────────────────────
function TabAcciones({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLote, setShowLote] = useState(false);
  const [showTransf, setShowTransf] = useState(null); // accionId
  const [form, setForm] = useState({});
  const [loteForm, setLoteForm] = useState({ cantidad: 1, nombreTitular: '', tipoDocumento: 'CEDULA', numeroDocumento: '', fechaEmision: '' });
  const [transfForm, setTransfForm] = useState({ nuevoTitular: '', tipoDocumento: 'CEDULA', numeroDocumento: '', fechaTransferencia: '' });
  const [downloading, setDownloading] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/acciones`);
    setItems(Array.isArray(data) ? data : data.acciones || []);
    setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function handleCrear() {
    try {
      await api.post(`/sociedades/${id}/acciones`, form);
      toast.success('Acción creada'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function handleLote() {
    try {
      await api.post(`/sociedades/${id}/acciones/lote`, loteForm);
      toast.success(`${loteForm.cantidad} acciones creadas`); setShowLote(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function handleTransferir() {
    try {
      await api.post(`/sociedades/${id}/acciones/${showTransf}/transferir`, transfForm);
      toast.success('Transferencia registrada'); setShowTransf(null); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function descargarCert(accionId, fmt) {
    setDownloading(`${accionId}-${fmt}`);
    try {
      const { data: blob } = await api.get(`/sociedades/${id}/acciones/${accionId}/certificado/${fmt}`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `certificado_${accionId}.${fmt}`;
      a.click();
    } catch(e) { toast.error('Error al descargar certificado'); }
    finally { setDownloading(null); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <button className="btn-secondary btn-sm" onClick={() => { setLoteForm({ cantidad:1, nombreTitular:'', tipoDocumento:'CEDULA', numeroDocumento:'', fechaEmision:'' }); setShowLote(true); }}>
          <Plus size={14}/> Emitir lote
        </button>
        <button className="btn-primary btn-sm" onClick={() => { setForm({ numeroAccion:'', nombreTitular:'', tipoDocumento:'CEDULA', numeroDocumento:'', fechaEmision:'' }); setShowModal(true); }}>
          <Plus size={14}/> Acción individual
        </button>
      </div>

      {items.length === 0 ? <EmptyState message="No hay acciones emitidas en el libro de acciones" /> : (
        <div className="overflow-x-auto">
          <table className="w-full"><thead className="bg-gray-50 border-b"><tr>
            <th className="th"># Acción</th><th className="th">Titular</th>
            <th className="th">Documento</th><th className="th">Emisión</th>
            <th className="th">Estado</th><th className="th">Certificado</th><th className="th"/>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(acc => (
              <tr key={acc.id} className="hover:bg-gray-50">
                <td className="td font-mono font-medium">{acc.numeroAccion}</td>
                <td className="td">{acc.nombreTitular || '—'}</td>
                <td className="td text-gray-500">{acc.tipoDocumento} {acc.numeroDocumento}</td>
                <td className="td">{formatFecha(acc.fechaEmision)}</td>
                <td className="td"><span className={acc.activa ? 'badge badge-green' : 'badge badge-gray'}>{acc.activa ? 'Activa' : 'Transferida'}</span></td>
                <td className="td">
                  <div className="flex gap-1">
                    <button className="btn-secondary btn-sm py-1"
                      disabled={downloading === `${acc.id}-pdf`}
                      onClick={() => descargarCert(acc.id, 'pdf')}>
                      {downloading === `${acc.id}-pdf` ? <Spinner size="sm"/> : <Download size={12}/>} PDF
                    </button>
                    <button className="btn-secondary btn-sm py-1"
                      disabled={downloading === `${acc.id}-docx`}
                      onClick={() => descargarCert(acc.id, 'docx')}>
                      {downloading === `${acc.id}-docx` ? <Spinner size="sm"/> : <Download size={12}/>} DOCX
                    </button>
                  </div>
                </td>
                <td className="td">
                  {acc.activa && (
                    <button className="text-xs text-brand-600 hover:underline font-medium"
                      onClick={() => { setShowTransf(acc.id); setTransfForm({ nuevoTitular:'', tipoDocumento:'CEDULA', numeroDocumento:'', fechaTransferencia:'' }); }}>
                      Transferir →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}

      {/* Modal acción individual */}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Nueva acción">
        <div className="space-y-3">
          <div><label className="label">Número de acción</label><input className="input" value={form.numeroAccion||''} onChange={e=>setForm(f=>({...f,numeroAccion:e.target.value}))}/></div>
          <div><label className="label">Nombre del titular</label><input className="input" value={form.nombreTitular||''} onChange={e=>setForm(f=>({...f,nombreTitular:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo doc.</label>
              <select className="input" value={form.tipoDocumento||'CEDULA'} onChange={e=>setForm(f=>({...f,tipoDocumento:e.target.value}))}>
                {['CEDULA','PASAPORTE','RUC'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Número doc.</label><input className="input" value={form.numeroDocumento||''} onChange={e=>setForm(f=>({...f,numeroDocumento:e.target.value}))}/></div>
          </div>
          <div><label className="label">Fecha de emisión</label><input type="date" className="input" value={form.fechaEmision||''} onChange={e=>setForm(f=>({...f,fechaEmision:e.target.value}))}/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleCrear}>Crear</button>
          </div>
        </div>
      </Modal>

      {/* Modal transferencia */}
      <Modal open={!!showTransf} onClose={()=>setShowTransf(null)} title="Transferir acción">
        <div className="space-y-3">
          <div><label className="label">Nuevo titular</label>
            <input className="input" value={transfForm.nuevoTitular} onChange={e=>setTransfForm(f=>({...f,nuevoTitular:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo doc.</label>
              <select className="input" value={transfForm.tipoDocumento} onChange={e=>setTransfForm(f=>({...f,tipoDocumento:e.target.value}))}>
                {['CEDULA','PASAPORTE','RUC'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Número doc.</label>
              <input className="input" value={transfForm.numeroDocumento} onChange={e=>setTransfForm(f=>({...f,numeroDocumento:e.target.value}))}/>
            </div>
          </div>
          <div><label className="label">Fecha de transferencia</label>
            <input type="date" className="input" value={transfForm.fechaTransferencia} onChange={e=>setTransfForm(f=>({...f,fechaTransferencia:e.target.value}))}/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowTransf(null)}>Cancelar</button>
            <button className="btn-primary" onClick={handleTransferir}
              disabled={!transfForm.nuevoTitular}>
              Registrar transferencia
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal lote */}
      <Modal open={showLote} onClose={()=>setShowLote(false)} title="Emitir lote de acciones">
        <div className="space-y-3">
          <div><label className="label">Cantidad de acciones a emitir</label>
            <input type="number" min="1" max="1000" className="input" value={loteForm.cantidad}
              onChange={e=>setLoteForm(f=>({...f,cantidad:Number(e.target.value)}))}/>
          </div>
          <div><label className="label">Nombre del titular</label>
            <input className="input" value={loteForm.nombreTitular} onChange={e=>setLoteForm(f=>({...f,nombreTitular:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo doc.</label>
              <select className="input" value={loteForm.tipoDocumento} onChange={e=>setLoteForm(f=>({...f,tipoDocumento:e.target.value}))}>
                {['CEDULA','PASAPORTE','RUC'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Número doc.</label>
              <input className="input" value={loteForm.numeroDocumento} onChange={e=>setLoteForm(f=>({...f,numeroDocumento:e.target.value}))}/>
            </div>
          </div>
          <div><label className="label">Fecha de emisión</label>
            <input type="date" className="input" value={loteForm.fechaEmision} onChange={e=>setLoteForm(f=>({...f,fechaEmision:e.target.value}))}/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowLote(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleLote}>Emitir {loteForm.cantidad} acción(es)</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── TabBeneficiarios ─────────────────────────────────────────────────────────
function TabBeneficiarios({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/beneficiarios`);
    setItems(data); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function openNew() { setEditing(null); setForm({ nombre:'', porcentajeControl:0, tipoDocumento:'CEDULA', numeroDocumento:'', nacionalidad:'Panameña', esPEP:false, verificado:false }); setShowModal(true); }
  function openEdit(b) { setEditing(b); setForm({ nombre:b.nombre, porcentajeControl:b.porcentajeControl, tipoDocumento:b.tipoDocumento||'CEDULA', numeroDocumento:b.numeroDocumento||'', nacionalidad:b.nacionalidad||'Panameña', esPEP:b.esPEP||false, verificado:b.verificado||false }); setShowModal(true); }

  async function handleSave() {
    try {
      if (editing) await api.put(`/sociedades/${id}/beneficiarios/${editing.id}`, form);
      else await api.post(`/sociedades/${id}/beneficiarios`, form);
      toast.success('Guardado'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14}/> Agregar</button>
      </div>
      {items.length === 0 ? <EmptyState message="Sin beneficiarios registrados (Ley 52 de 2016)" /> : (
        <table className="w-full"><thead className="bg-gray-50 border-b"><tr>
          <th className="th">Nombre</th><th className="th">% Control</th>
          <th className="th">PEP</th><th className="th">Verificado</th><th className="th"/>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(b => (
            <tr key={b.id} className="hover:bg-gray-50">
              <td className="td font-medium">{b.nombre}</td>
              <td className="td">{Number(b.porcentajeControl).toFixed(2)}%</td>
              <td className="td">{b.esPEP ? <span className="badge badge-red">Sí</span> : <span className="badge badge-gray">No</span>}</td>
              <td className="td">{b.verificado ? <span className="badge badge-green">Sí</span> : <span className="badge badge-yellow">Pendiente</span>}</td>
              <td className="td"><button className="text-brand-600 hover:text-brand-800" onClick={()=>openEdit(b)}><Edit2 size={14}/></button></td>
            </tr>
          ))}
        </tbody></table>
      )}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Editar beneficiario':'Nuevo beneficiario'}>
        <div className="space-y-3">
          <div><label className="label">Nombre</label><input className="input" value={form.nombre||''} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/></div>
          <div><label className="label">% de control</label><input type="number" step="0.01" className="input" value={form.porcentajeControl||0} onChange={e=>setForm(f=>({...f,porcentajeControl:Number(e.target.value)}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo doc.</label>
              <select className="input" value={form.tipoDocumento||'CEDULA'} onChange={e=>setForm(f=>({...f,tipoDocumento:e.target.value}))}>
                {['CEDULA','PASAPORTE','RUC'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Número doc.</label><input className="input" value={form.numeroDocumento||''} onChange={e=>setForm(f=>({...f,numeroDocumento:e.target.value}))}/></div>
          </div>
          <div><label className="label">Nacionalidad</label><input className="input" value={form.nacionalidad||''} onChange={e=>setForm(f=>({...f,nacionalidad:e.target.value}))}/></div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.esPEP||false} onChange={e=>setForm(f=>({...f,esPEP:e.target.checked}))}/>
              Es PEP (Persona Expuesta Políticamente)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.verificado||false} onChange={e=>setForm(f=>({...f,verificado:e.target.checked}))}/>
              Verificado
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── TabObligaciones ──────────────────────────────────────────────────────────
function TabObligaciones({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [anioGenerar, setAnioGenerar] = useState(new Date().getFullYear());
  const [generando, setGenerando] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [nuevaForm, setNuevaForm] = useState({});
  const TIPOS = ['TASA_UNICA','IMPUESTO_RENTA','AVISO_OPERACION','CAJA_SEGURO_SOCIAL','LICENCIA_COMERCIAL','OTRO'];
  const ESTADOS = ['PENDIENTE','PAGADO','VENCIDO','EXENTO'];

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/obligaciones`);
    setItems(data); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function openEdit(o) { setEditing(o); setForm({ tipo:o.tipo, anio:o.anio, entidad:o.entidad||'', fechaVence:o.fechaVence?.slice(0,10)||'', estado:o.estado, monto:o.monto||0, fechaPago:o.fechaPago?.slice(0,10)||'' }); setShowModal(true); }

  async function handleSave() {
    try {
      await api.put(`/sociedades/${id}/obligaciones/${editing.id}`, form);
      toast.success('Guardado'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function handleCrearObligacion() {
    try {
      await api.post(`/sociedades/${id}/obligaciones`, nuevaForm);
      toast.success('Obligación creada'); setShowNueva(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error al crear'); }
  }

  async function handleGenerar() {
    setGenerando(true);
    try {
      const { data } = await api.post(`/sociedades/${id}/obligaciones/generar`, { anio: anioGenerar });
      toast.success(`${data.creadas || 0} obligaciones generadas para ${anioGenerar}`);
      cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error al generar'); }
    finally { setGenerando(false); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="flex items-center justify-end gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">Año:</label>
          <input type="number" className="input w-24 text-sm py-1.5"
            value={anioGenerar} onChange={e => setAnioGenerar(Number(e.target.value))} />
        </div>
        <button className="btn-secondary btn-sm" onClick={handleGenerar} disabled={generando}>
          {generando ? <Spinner size="sm"/> : <Plus size={14}/>}
          Generar año
        </button>
        <button className="btn-primary btn-sm"
          onClick={() => { setNuevaForm({ tipo:'TASA_UNICA', anio:new Date().getFullYear(), entidad:'', fechaVence:'', estado:'PENDIENTE', monto:0 }); setShowNueva(true); }}>
          <Plus size={14}/> Agregar manual
        </button>
      </div>
      {items.length === 0 ? <EmptyState message="Sin obligaciones. Usa 'Generar año' para crearlas automáticamente." /> : (
        <table className="w-full"><thead className="bg-gray-50 border-b"><tr>
          <th className="th">Tipo</th><th className="th">Año</th><th className="th">Entidad</th>
          <th className="th">Vence</th><th className="th">Estado</th><th className="th">Monto</th><th className="th"/>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(o => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="td text-xs">{o.tipo.replace(/_/g,' ')}</td>
              <td className="td">{o.anio}</td>
              <td className="td">{o.entidad||'—'}</td>
              <td className="td">{formatFecha(o.fechaVence)}</td>
              <td className="td"><span className={estadoBadge(o.estado)}>{o.estado}</span></td>
              <td className="td">{formatMoneda(o.monto)}</td>
              <td className="td"><button className="text-brand-600 hover:text-brand-800" onClick={()=>openEdit(o)}><Edit2 size={14}/></button></td>
            </tr>
          ))}
        </tbody></table>
      )}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Editar obligación">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo</label>
              <select className="input" value={form.tipo||''} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                {TIPOS.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div><label className="label">Año</label><input type="number" className="input" value={form.anio||''} onChange={e=>setForm(f=>({...f,anio:Number(e.target.value)}))}/></div>
          </div>
          <div><label className="label">Entidad</label><input className="input" value={form.entidad||''} onChange={e=>setForm(f=>({...f,entidad:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Fecha vence</label><input type="date" className="input" value={form.fechaVence||''} onChange={e=>setForm(f=>({...f,fechaVence:e.target.value}))}/></div>
            <div><label className="label">Monto (USD)</label><input type="number" className="input" value={form.monto||0} onChange={e=>setForm(f=>({...f,monto:Number(e.target.value)}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Estado</label>
              <select className="input" value={form.estado||''} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                {ESTADOS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Fecha pago</label><input type="date" className="input" value={form.fechaPago||''} onChange={e=>setForm(f=>({...f,fechaPago:e.target.value}))}/></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      </Modal>
      <Modal open={showNueva} onClose={()=>setShowNueva(false)} title="Nueva obligación">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo</label>
              <select className="input" value={nuevaForm.tipo||'TASA_UNICA'} onChange={e=>setNuevaForm(f=>({...f,tipo:e.target.value}))}>
                {TIPOS.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div><label className="label">Año</label>
              <input type="number" className="input" value={nuevaForm.anio||new Date().getFullYear()} onChange={e=>setNuevaForm(f=>({...f,anio:Number(e.target.value)}))}/>
            </div>
          </div>
          <div><label className="label">Entidad</label>
            <input className="input" value={nuevaForm.entidad||''} onChange={e=>setNuevaForm(f=>({...f,entidad:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Fecha vence *</label>
              <input type="date" className="input" value={nuevaForm.fechaVence||''} onChange={e=>setNuevaForm(f=>({...f,fechaVence:e.target.value}))}/>
            </div>
            <div><label className="label">Monto (USD)</label>
              <input type="number" className="input" value={nuevaForm.monto||0} onChange={e=>setNuevaForm(f=>({...f,monto:Number(e.target.value)}))}/>
            </div>
          </div>
          <div><label className="label">Estado</label>
            <select className="input" value={nuevaForm.estado||'PENDIENTE'} onChange={e=>setNuevaForm(f=>({...f,estado:e.target.value}))}>
              {ESTADOS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowNueva(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleCrearObligacion}>Crear obligación</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── TabActas ─────────────────────────────────────────────────────────────────
function TabActas({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const TIPOS = ['JUNTA_ORDINARIA','JUNTA_EXTRAORDINARIA','ACTA_DIRECTIVA','NOMBRAMIENTO','RENUNCIA','MODIFICACION_PACTO','DISOLUCION','OTRO'];

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/actas`);
    setItems(Array.isArray(data) ? data : data.actas || []); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function handleSave() {
    try {
      await api.post(`/sociedades/${id}/actas`, form);
      toast.success('Acta creada'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function descargar(actaId, fmt) {
    try {
      const { data: blob } = await api.get(`/sociedades/${id}/actas/${actaId}/${fmt}`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `acta_${actaId}.${fmt}`;
      a.click();
    } catch(e) { toast.error('Error al descargar'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="btn-primary btn-sm" onClick={()=>{setForm({tipo:'JUNTA_ORDINARIA',numero:'',fecha:'',estado:'BORRADOR',contenido:''});setShowModal(true);}}>
          <Plus size={14}/> Nueva acta
        </button>
      </div>
      {items.length === 0 ? <EmptyState message="Sin actas registradas" /> : (
        <table className="w-full"><thead className="bg-gray-50 border-b"><tr>
          <th className="th">#</th><th className="th">Tipo</th>
          <th className="th">Fecha</th><th className="th">Estado</th><th className="th"/>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(a => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="td font-mono">{a.numero}</td>
              <td className="td text-xs">{a.tipo.replace(/_/g,' ')}</td>
              <td className="td">{formatFecha(a.fecha)}</td>
              <td className="td"><span className={estadoBadge(a.estado)}>{a.estado}</span></td>
              <td className="td"><div className="flex gap-1">
                <button className="btn-secondary btn-sm py-1" onClick={()=>descargar(a.id,'pdf')}><Download size={12}/> PDF</button>
                <button className="btn-secondary btn-sm py-1" onClick={()=>descargar(a.id,'docx')}><Download size={12}/> DOCX</button>
              </div></td>
            </tr>
          ))}
        </tbody></table>
      )}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Nueva acta" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo</label>
              <select className="input" value={form.tipo||''} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                {TIPOS.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div><label className="label">Fecha</label><input type="date" className="input" value={form.fecha||''} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/></div>
          </div>
          <div><label className="label">Número de acta</label><input className="input" value={form.numero||''} onChange={e=>setForm(f=>({...f,numero:e.target.value}))}/></div>
          <div><label className="label">Contenido / Agenda</label>
            <textarea className="input h-28 resize-none" value={form.contenido||''} onChange={e=>setForm(f=>({...f,contenido:e.target.value}))}/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}>Crear acta</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── TabDocumentos ────────────────────────────────────────────────────────────
function TabDocumentos({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selTipo, setSelTipo] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    const [d, t] = await Promise.all([
      api.get(`/sociedades/${id}/documentos`),
      api.get(`/sociedades/${id}/documentos/tipos`),
    ]);
    setItems(Array.isArray(d.data) ? d.data : d.data.documentos || []);
    setTipos(t.data);
    if (t.data[0] && !selTipo) setSelTipo(t.data[0].tipo);
    setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function generar(fmt) {
    setGenerating(true);
    try {
      const { data: blob } = await api.post(`/sociedades/${id}/documentos`, { tipo: selTipo, formato: fmt }, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${selTipo}.${fmt}`;
      a.click();
      toast.success('Documento generado'); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error al generar'); }
    finally { setGenerating(false); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="card p-4 mb-4 flex flex-wrap items-end gap-4 bg-gray-50">
        <div className="flex-1 min-w-48">
          <label className="label">Tipo de documento</label>
          <select className="input" value={selTipo} onChange={e=>setSelTipo(e.target.value)}>
            {tipos.map(t => <option key={t.tipo} value={t.tipo}>{t.nombre}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary btn-sm" onClick={()=>generar('pdf')} disabled={generating || !selTipo}>
            {generating ? <Spinner size="sm"/> : <Download size={14}/>} PDF
          </button>
          <button className="btn-secondary btn-sm" onClick={()=>generar('docx')} disabled={generating || !selTipo}>
            {generating ? <Spinner size="sm"/> : <Download size={14}/>} Word
          </button>
        </div>
      </div>
      {items.length === 0 ? <EmptyState message="Sin documentos generados" /> : (
        <table className="w-full"><thead className="bg-gray-50 border-b"><tr>
          <th className="th">Documento</th><th className="th">Formato</th>
          <th className="th">Generado</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(doc => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="td font-medium">{doc.nombre || doc.tipo?.replace(/_/g,' ')}</td>
              <td className="td"><span className="badge badge-blue">{doc.formato}</span></td>
              <td className="td">{formatFecha(doc.creadoEn)}</td>
            </tr>
          ))}
        </tbody></table>
      )}
    </div>
  );
}

// ─── TabConsultas ─────────────────────────────────────────────────────────────
function TabConsultas({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResp, setShowResp] = useState(null);
  const [form, setForm] = useState({});
  const [respuesta, setRespuesta] = useState('');
  const TIPOS = ['LEGAL','FISCAL','DOCUMENTAL','GENERAL','OTRO'];

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/consultas`);
    setItems(Array.isArray(data) ? data : data.consultas || []); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function handleCrear() {
    try {
      await api.post(`/sociedades/${id}/consultas`, form);
      toast.success('Consulta creada'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }
  async function handleResponder(cId) {
    try {
      await api.put(`/sociedades/${id}/consultas/${cId}`, { respuesta, estado:'RESUELTA' });
      toast.success('Respuesta enviada'); setShowResp(null); setRespuesta(''); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="btn-primary btn-sm" onClick={()=>{setForm({tipo:'GENERAL',descripcion:''});setShowModal(true);}}>
          <Plus size={14}/> Nueva consulta
        </button>
      </div>
      {items.length === 0 ? <EmptyState message="Sin consultas registradas" /> : (
        <div className="space-y-3">
          {items.map(c => (
            <div key={c.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="badge badge-purple">{c.tipo}</span>
                  <span className="text-xs text-gray-500">{formatFecha(c.fecha)}</span>
                </div>
                <span className={estadoBadge(c.estado)}>{c.estado}</span>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-700">{c.descripcion}</p>
                {c.respuesta ? (
                  <div className="mt-3 bg-green-50 border-l-4 border-green-400 px-3 py-2 rounded-r-lg">
                    <p className="text-xs font-semibold text-green-700 mb-1">Respuesta ({formatFecha(c.fechaRespuesta)}):</p>
                    <p className="text-sm text-green-800">{c.respuesta}</p>
                  </div>
                ) : (
                  <button className="mt-2 text-xs text-brand-600 hover:underline" onClick={()=>setShowResp(c.id)}>
                    Responder →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Nueva consulta">
        <div className="space-y-3">
          <div><label className="label">Tipo</label>
            <select className="input" value={form.tipo||'GENERAL'} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
              {TIPOS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Descripción</label>
            <textarea className="input h-28 resize-none" value={form.descripcion||''} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))}/>
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleCrear}>Crear</button>
          </div>
        </div>
      </Modal>
      <Modal open={!!showResp} onClose={()=>setShowResp(null)} title="Responder consulta">
        <div className="space-y-3">
          <div><label className="label">Respuesta</label>
            <textarea className="input h-32 resize-none" value={respuesta} onChange={e=>setRespuesta(e.target.value)}/>
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={()=>setShowResp(null)}>Cancelar</button>
            <button className="btn-primary" onClick={()=>handleResponder(showResp)}>Enviar respuesta</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function SociedadDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [sociedad, setSociedad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('datos');
  const [showEdit, setShowEdit] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [delLoading, setDelLoading] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await api.get(`/sociedades/${id}`);
    setSociedad(data); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function handleEdit(form) {
    try {
      await api.put(`/sociedades/${id}`, form);
      toast.success('Sociedad actualizada'); setShowEdit(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }
  async function handleDelete() {
    setDelLoading(true);
    try {
      await api.delete(`/sociedades/${id}`);
      toast.success('Sociedad eliminada'); navigate('/sociedades');
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); setDelLoading(false); }
  }
  async function descargarReporte(fmt) {
    try {
      const { data: blob } = await api.get(`/reportes/${id}/${fmt}`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ficha_${sociedad?.nombre?.replace(/\s+/g,'_')}.${fmt}`;
      a.click();
    } catch(e) { toast.error('Error al generar reporte'); }
  }

  if (loading) return <PageSpinner />;
  if (!sociedad) return <div className="p-6 text-red-600">Sociedad no encontrada</div>;

  const TabCmp = {
    datos:         () => <TabDatos sociedad={sociedad} onEdit={()=>{setEditForm(sociedad);setShowEdit(true);}} onDelete={()=>setShowDel(true)}/>,
    directores:    () => <TabDirectores id={id} />,
    accionistas:   () => <TabAccionistas id={id} />,
    acciones:      () => <TabAcciones id={id} />,
    beneficiarios: () => <TabBeneficiarios id={id} />,
    obligaciones:  () => <TabObligaciones id={id} />,
    actas:         () => <TabActas id={id} />,
    documentos:    () => <TabDocumentos id={id} />,
    consultas:     () => <TabConsultas id={id} />,
  }[tab];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <Link to="/sociedades" className="flex items-center gap-1 text-sm text-brand-600 hover:underline mb-2">
            <ArrowLeft size={14}/> Volver a cartera
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{sociedad.nombre}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={estadoBadge(sociedad.estado)}>{sociedad.estado}</span>
            <span className={estadoBadge(sociedad.planCliente)}>{sociedad.planCliente}</span>
            {sociedad.ficha && <span className="text-xs text-gray-400">Ficha {sociedad.ficha}</span>}
            {sociedad.healthScore != null && (
              <span className={`badge ${healthBg(sociedad.healthScore)}`}>Health: {sociedad.healthScore}%</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={()=>descargarReporte('pdf')}><Download size={14}/> PDF</button>
          <button className="btn-secondary btn-sm" onClick={()=>descargarReporte('docx')}><Download size={14}/> DOCX</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setTab(tid)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === tid
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <Icon size={15}/> {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="card p-6">
        {TabCmp && <TabCmp />}
      </div>

      <Modal open={showEdit} onClose={()=>setShowEdit(false)} title="Editar sociedad" size="lg">
        <FormSociedad initial={editForm} onSave={handleEdit} />
      </Modal>
      <ConfirmDialog open={showDel} onClose={()=>setShowDel(false)} onConfirm={handleDelete}
        loading={delLoading} title="Eliminar sociedad"
        message={`¿Eliminar "${sociedad.nombre}"? Esta acción no se puede deshacer.`} />
    </div>
  );
}
