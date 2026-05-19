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
  Users, UserCheck, Shield, ClipboardList, File, MessageSquare, BookOpen, Briefcase,
  FolderOpen, Upload, CheckCircle2, XCircle,
  AlertTriangle, ShieldCheck, ShieldAlert,
  GitBranch, Clock, ArrowRightLeft, ClipboardCheck, Bell, Send, Loader2,
  ChevronDown, ChevronRight,
} from 'lucide-react';

const TABS = [
  { id: 'datos',         label: 'Datos',          icon: FileText },
  { id: 'directores',    label: 'Directores',      icon: Users },
  { id: 'accionistas',   label: 'Accionistas',     icon: UserCheck },
  { id: 'apoderados',    label: 'Apoderados',      icon: Briefcase },
  { id: 'acciones',      label: 'Acciones',        icon: BookOpen },
  { id: 'beneficiarios', label: 'Beneficiarios',   icon: Shield },
  { id: 'obligaciones',  label: 'Obligaciones',    icon: ClipboardList },
  { id: 'actas',         label: 'Actas',           icon: File },
  { id: 'documentos',    label: 'Documentos',      icon: FileText },
  { id: 'consultas',     label: 'Consultas',       icon: MessageSquare },
  { id: 'expediente',   label: 'Expediente',      icon: FolderOpen },
  { id: 'riesgo',       label: 'Riesgo',          icon: ShieldAlert },
  { id: 'nominales',    label: 'Nominales',       icon: UserCheck },
  { id: 'flujos',       label: 'Flujos',          icon: GitBranch },
  { id: 'completitud',  label: 'Completitud',     icon: ClipboardCheck },
];

// ─── FormSociedad ─────────────────────────────────────────────────────────────
const TIPOS_PJ = [
  { value: 'SOCIEDAD_ANONIMA',                    label: 'Sociedad Anónima' },
  { value: 'FUNDACION_INTERES_PRIVADO',            label: 'Fundación de Interés Privado' },
  { value: 'SOCIEDAD_RESPONSABILIDAD_LIMITADA',    label: 'Sociedad de Responsabilidad Limitada' },
  { value: 'SOCIEDAD_EXTRANJERA',                  label: 'Sociedad Extranjera' },
];

function FormSociedad({ onSave, initial }) {
  const ESTADOS = ['ACTIVA','INACTIVA','DISUELTA','SUSPENDIDA'];
  const PLANES  = ['TRIAL','MENSUAL','ANUAL','FUNDADOR'];
  const [form, setForm] = useState(initial || {
    nombre:'', ficha:'', tomo:'', folio:'', fechaConstitucion:'',
    estado:'ACTIVA', planCliente:'MENSUAL', domicilio:'República de Panamá',
    email:'', telefono:'', jurisdiccion:'',
    capital:0, cantidadAcciones:0, valorNominal:1, tipoAcciones:'NOMINATIVAS',
    tipoPersonaJuridica:'SOCIEDAD_ANONIMA', ruc:'', actividadPrincipal:'',
    estadoRegistroPublico:'', fechaRegistroRUBF:'',
    servicioAccionistaNominal:false, servicioDirectorNominal:false, servicioApoderado:false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e=>{e.preventDefault();onSave(form);}} className="space-y-5">
      {/* Datos generales */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos generales</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Nombre *</label><input className="input" value={form.nombre} onChange={e=>set('nombre',e.target.value)} required/></div>
          <div><label className="label">Ficha</label><input className="input" value={form.ficha||''} onChange={e=>set('ficha',e.target.value)}/></div>
          <div><label className="label">Constitución</label><input type="date" className="input" value={form.fechaConstitucion?.slice?.(0,10)||''} onChange={e=>set('fechaConstitucion',e.target.value)}/></div>
          <div><label className="label">Tomo</label><input className="input" value={form.tomo||''} onChange={e=>set('tomo',e.target.value)}/></div>
          <div><label className="label">Folio</label><input className="input" value={form.folio||''} onChange={e=>set('folio',e.target.value)}/></div>
          <div><label className="label">Estado</label><select className="input" value={form.estado} onChange={e=>set('estado',e.target.value)}>{ESTADOS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="label">Plan</label><select className="input" value={form.planCliente} onChange={e=>set('planCliente',e.target.value)}>{PLANES.map(p=><option key={p}>{p}</option>)}</select></div>
          <div className="col-span-2"><label className="label">Domicilio</label><input className="input" value={form.domicilio||''} onChange={e=>set('domicilio',e.target.value)}/></div>
          <div><label className="label">Email de la sociedad</label><input type="email" className="input" value={form.email||''} onChange={e=>set('email',e.target.value)}/></div>
          <div><label className="label">Teléfono</label><input className="input" placeholder="+507..." value={form.telefono||''} onChange={e=>set('telefono',e.target.value)}/></div>
          <div className="col-span-2"><label className="label">Jurisdicción(es) donde opera</label><input className="input" placeholder="Ej: Panamá, Colombia, EE.UU." value={form.jurisdiccion||''} onChange={e=>set('jurisdiccion',e.target.value)}/></div>
          <div><label className="label">Capital (USD)</label><input type="number" className="input" value={form.capital||0} onChange={e=>set('capital',Number(e.target.value))}/></div>
          <div><label className="label">Tipo acciones</label><select className="input" value={form.tipoAcciones} onChange={e=>set('tipoAcciones',e.target.value)}><option value="NOMINATIVAS">Nominativas</option><option value="AL_PORTADOR">Al portador</option></select></div>
          <div><label className="label">Cant. acciones</label><input type="number" className="input" value={form.cantidadAcciones||0} onChange={e=>set('cantidadAcciones',Number(e.target.value))}/></div>
          <div><label className="label">Valor nominal (USD)</label><input type="number" className="input" value={form.valorNominal||1} onChange={e=>set('valorNominal',Number(e.target.value))}/></div>
        </div>
      </div>

      {/* Datos RUBF */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos RUBF (Registro Único de Beneficiarios Finales)</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Tipo de persona jurídica</label>
            <select className="input" value={form.tipoPersonaJuridica||'SOCIEDAD_ANONIMA'} onChange={e=>set('tipoPersonaJuridica',e.target.value)}>
              {TIPOS_PJ.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><label className="label">RUC</label><input className="input" placeholder="Número de RUC" value={form.ruc||''} onChange={e=>set('ruc',e.target.value)}/></div>
          <div><label className="label">Fecha de registro RUBF</label><input type="date" className="input" value={form.fechaRegistroRUBF?.slice?.(0,10)||''} onChange={e=>set('fechaRegistroRUBF',e.target.value)}/></div>
          <div className="col-span-2"><label className="label">Actividad principal</label><input className="input" placeholder="Ej: Tenencia de activos, comercio internacional..." value={form.actividadPrincipal||''} onChange={e=>set('actividadPrincipal',e.target.value)}/></div>
          <div className="col-span-2"><label className="label">Estado del Registro Público</label><input className="input" placeholder="Ej: Al día, En mora, Disuelta..." value={form.estadoRegistroPublico||''} onChange={e=>set('estadoRegistroPublico',e.target.value)}/></div>
          <div className="col-span-2">
            <label className="label mb-2">Servicios nominales</label>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.servicioAccionistaNominal} onChange={e=>set('servicioAccionistaNominal',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                Accionista Nominal
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.servicioDirectorNominal} onChange={e=>set('servicioDirectorNominal',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                Director Nominal
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.servicioApoderado} onChange={e=>set('servicioApoderado',e.target.checked)} className="w-4 h-4 accent-brand-600"/>
                Apoderado
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2"><button type="submit" className="btn-primary">{initial?.id ? 'Guardar cambios' : 'Crear'}</button></div>
    </form>
  );
}

// ─── TabDatos ─────────────────────────────────────────────────────────────────
const LABEL_TIPO_PJ = {
  SOCIEDAD_ANONIMA:                 'Sociedad Anónima',
  FUNDACION_INTERES_PRIVADO:        'Fundación de Interés Privado',
  SOCIEDAD_RESPONSABILIDAD_LIMITADA:'Sociedad de Responsabilidad Limitada',
  SOCIEDAD_EXTRANJERA:              'Sociedad Extranjera',
};

function Campo({ label, value }) {
  return (
    <div className="border-b border-gray-100 pb-3">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{value || '—'}</dd>
    </div>
  );
}

function TabDatos({ sociedad, onEdit, onDelete }) {
  const si = v => v ? 'Sí' : 'No';
  return (
    <div>
      <div className="flex justify-end gap-3 mb-4">
        <button className="btn-secondary btn-sm" onClick={onEdit}><Edit2 size={14}/> Editar</button>
        <button className="btn-danger btn-sm" onClick={onDelete}><Trash2 size={14}/> Eliminar</button>
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos generales</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-6">
        <Campo label="Ficha" value={sociedad.ficha} />
        <Campo label="Tomo" value={sociedad.tomo} />
        <Campo label="Folio" value={sociedad.folio} />
        <Campo label="Constitución" value={formatFecha(sociedad.fechaConstitucion)} />
        <Campo label="Estado" value={sociedad.estado} />
        <Campo label="Plan" value={sociedad.planCliente} />
        <Campo label="Domicilio" value={sociedad.domicilio} />
        <Campo label="Email" value={sociedad.email} />
        <Campo label="Teléfono" value={sociedad.telefono} />
        <Campo label="Jurisdicción donde opera" value={sociedad.jurisdiccion} />
        <Campo label="Capital" value={formatMoneda(sociedad.capital)} />
        <Campo label="Acciones" value={`${sociedad.cantidadAcciones?.toLocaleString('es-PA') || '—'} ${sociedad.tipoAcciones === 'NOMINATIVAS' ? 'nominativas' : 'al portador'} a ${formatMoneda(sociedad.valorNominal)} c/u`} />
        <Campo label="Vence plan" value={formatFecha(sociedad.fechaVencimiento)} />
      </dl>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos RUBF</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <Campo label="Agente residente" value={sociedad.agente?.nombre} />
        <Campo label="CUR (agente)" value={sociedad.agente?.cur} />
        <Campo label="Tipo de persona jurídica" value={LABEL_TIPO_PJ[sociedad.tipoPersonaJuridica] || sociedad.tipoPersonaJuridica} />
        <Campo label="RUC" value={sociedad.ruc} />
        <Campo label="Fecha de registro RUBF" value={formatFecha(sociedad.fechaRegistroRUBF)} />
        <Campo label="Actividad principal" value={sociedad.actividadPrincipal} />
        <Campo label="Estado Registro Público" value={sociedad.estadoRegistroPublico} />
        <div className="border-b border-gray-100 pb-3 sm:col-span-2">
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Servicios nominales</dt>
          <dd className="text-sm text-gray-900 mt-0.5">
            Accionista: <strong>{si(sociedad.servicioAccionistaNominal)}</strong>
            {' · '}Director: <strong>{si(sociedad.servicioDirectorNominal)}</strong>
            {' · '}Apoderado: <strong>{si(sociedad.servicioApoderado)}</strong>
          </dd>
        </div>
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

  function openNew() { setEditing(null); setForm({ cargo:'DIRECTOR', nombre:'', tipoDocumento:'CEDULA', numeroDocumento:'', nacionalidad:'Panameña', profesion:'', rucNT:'', email:'', telefono:'', domicilio:'', jurisdiccion:'', fechaNombramiento:'', esNominal:false }); setShowModal(true); }
  function openEdit(d) { setEditing(d); setForm({ cargo:d.cargo, nombre:d.nombre, tipoDocumento:d.tipoDocumento||'CEDULA', numeroDocumento:d.numeroDocumento||'', nacionalidad:d.nacionalidad||'', profesion:d.profesion||'', rucNT:d.rucNT||'', email:d.email||'', telefono:d.telefono||'', domicilio:d.domicilio||'', jurisdiccion:d.jurisdiccion||'', fechaNombramiento:d.fechaNombramiento?.slice(0,10)||'', esNominal:!!d.esNominal }); setShowModal(true); }

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
                <td className="td">
                  <span className="badge badge-blue">{d.cargo}</span>
                  {d.esNominal && <span className="ml-1 badge badge-amber">NOMINAL</span>}
                </td>
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
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Editar director':'Nuevo director'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cargo</label>
              <select className="input" value={form.cargo||'DIRECTOR'} onChange={e=>setForm(f=>({...f,cargo:e.target.value}))}>
                {CARGOS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Fecha de nombramiento</label><input type="date" className="input" value={form.fechaNombramiento||''} onChange={e=>setForm(f=>({...f,fechaNombramiento:e.target.value}))}/></div>
          </div>
          <div><label className="label">Nombre completo *</label><input className="input" value={form.nombre||''} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo doc. *</label>
              <select className="input" value={form.tipoDocumento||'CEDULA'} onChange={e=>setForm(f=>({...f,tipoDocumento:e.target.value}))}>
                {['CEDULA','PASAPORTE','RUC'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Número doc. *</label><input className="input" value={form.numeroDocumento||''} onChange={e=>setForm(f=>({...f,numeroDocumento:e.target.value}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nacionalidad</label><input className="input" value={form.nacionalidad||''} onChange={e=>setForm(f=>({...f,nacionalidad:e.target.value}))}/></div>
            <div><label className="label">Profesión u ocupación</label><input className="input" placeholder="Ej: Abogado, Empresario..." value={form.profesion||''} onChange={e=>setForm(f=>({...f,profesion:e.target.value}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">RUC / N° tributario</label><input className="input" placeholder="Número tributario o RUC" value={form.rucNT||''} onChange={e=>setForm(f=>({...f,rucNT:e.target.value}))}/></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Teléfono</label><input className="input" placeholder="+507..." value={form.telefono||''} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))}/></div>
            <div><label className="label">Jurisdicción donde opera</label><input className="input" placeholder="Ej: Panamá, EE.UU., España..." value={form.jurisdiccion||''} onChange={e=>setForm(f=>({...f,jurisdiccion:e.target.value}))}/></div>
          </div>
          <div><label className="label">Domicilio</label><input className="input" placeholder="Ciudad, provincia, país" value={form.domicilio||''} onChange={e=>setForm(f=>({...f,domicilio:e.target.value}))}/></div>
          <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!form.esNominal} onChange={e=>setForm(f=>({...f,esNominal:e.target.checked}))}/>
            <span className="font-medium text-gray-700">Director / dignatario nominal</span>
            <span className="text-xs text-gray-400">(actúa por cuenta de un BF — requiere medidas mitigadoras)</span>
          </label>
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
    setItems(data.accionistas || data || []); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function openNew() { setEditing(null); setForm({ nombre:'', cantidadAcciones:0, porcentaje:0, tipoDocumento:'CEDULA', numeroDocumento:'', nacionalidad:'Panameña', profesion:'', rucNT:'', email:'', telefono:'', domicilio:'', jurisdiccion:'', fechaAdquisicion:'', esNominal:false }); setShowModal(true); }
  function openEdit(a) { setEditing(a); setForm({ nombre:a.nombre, cantidadAcciones:a.cantidadAcciones, porcentaje:a.porcentaje, tipoDocumento:a.tipoDocumento||'CEDULA', numeroDocumento:a.numeroDocumento||'', nacionalidad:a.nacionalidad||'', profesion:a.profesion||'', rucNT:a.rucNT||'', email:a.email||'', telefono:a.telefono||'', domicilio:a.domicilio||'', jurisdiccion:a.jurisdiccion||'', fechaAdquisicion:(a.fechaAdquisicion||a.fechaIngreso)?.slice(0,10)||'', esNominal:!!a.esNominal }); setShowModal(true); }

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
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Editar accionista':'Nuevo accionista'} size="lg">
        <div className="space-y-3">
          <div><label className="label">Nombre completo *</label><input className="input" value={form.nombre||''} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cant. acciones</label><input type="number" className="input" value={form.cantidadAcciones||0} onChange={e=>setForm(f=>({...f,cantidadAcciones:Number(e.target.value)}))}/></div>
            <div><label className="label">Fecha adquisición</label><input type="date" className="input" value={form.fechaAdquisicion||''} onChange={e=>setForm(f=>({...f,fechaAdquisicion:e.target.value}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo doc. *</label>
              <select className="input" value={form.tipoDocumento||'CEDULA'} onChange={e=>setForm(f=>({...f,tipoDocumento:e.target.value}))}>
                {['CEDULA','PASAPORTE','RUC'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Número doc. *</label><input className="input" value={form.numeroDocumento||''} onChange={e=>setForm(f=>({...f,numeroDocumento:e.target.value}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nacionalidad</label><input className="input" value={form.nacionalidad||''} onChange={e=>setForm(f=>({...f,nacionalidad:e.target.value}))}/></div>
            <div><label className="label">Profesión u ocupación</label><input className="input" placeholder="Ej: Empresario, Inversor..." value={form.profesion||''} onChange={e=>setForm(f=>({...f,profesion:e.target.value}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">RUC / N° tributario</label><input className="input" placeholder="Número tributario o RUC" value={form.rucNT||''} onChange={e=>setForm(f=>({...f,rucNT:e.target.value}))}/></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Teléfono</label><input className="input" placeholder="+507..." value={form.telefono||''} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))}/></div>
            <div><label className="label">Jurisdicción donde opera</label><input className="input" placeholder="Ej: Panamá, EE.UU...." value={form.jurisdiccion||''} onChange={e=>setForm(f=>({...f,jurisdiccion:e.target.value}))}/></div>
          </div>
          <div><label className="label">Domicilio</label><input className="input" placeholder="Ciudad, provincia, país" value={form.domicilio||''} onChange={e=>setForm(f=>({...f,domicilio:e.target.value}))}/></div>
          <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!form.esNominal} onChange={e=>setForm(f=>({...f,esNominal:e.target.checked}))}/>
            <span className="font-medium text-gray-700">Accionista nominal</span>
            <span className="text-xs text-gray-400">(actúa por cuenta de un BF — requiere medidas mitigadoras)</span>
          </label>
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

// ─── TabApoderados ────────────────────────────────────────────────────────────
const TIPOS_PODER = ['GENERAL','ESPECIAL','JUDICIAL','ADMINISTRATIVO'];

function TabApoderados({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [delId, setDelId] = useState(null);
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/apoderados`);
    setItems(data); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  const formVacioAp = () => ({
    nombre:'', tipoDocumento:'CEDULA', numeroDocumento:'', nacionalidad:'Panameña',
    profesion:'', rucNT:'', email:'', telefono:'', domicilio:'', jurisdiccion:'',
    tipoPoder:'GENERAL', facultades:'', fechaOtorgamiento:'', fechaVencimiento:'',
    notaria:'', tomoEscritura:'', folioEscritura:'', notas:'',
  });

  function openNew() { setEditing(null); setForm(formVacioAp()); setShowModal(true); }
  function openEdit(a) {
    setEditing(a);
    setForm({
      nombre: a.nombre, tipoDocumento: a.tipoDocumento||'CEDULA', numeroDocumento: a.numeroDocumento||'',
      nacionalidad: a.nacionalidad||'', profesion: a.profesion||'', rucNT: a.rucNT||'',
      email: a.email||'', telefono: a.telefono||'', domicilio: a.domicilio||'', jurisdiccion: a.jurisdiccion||'',
      tipoPoder: a.tipoPoder||'GENERAL', facultades: a.facultades||'',
      fechaOtorgamiento: a.fechaOtorgamiento?.slice(0,10)||'',
      fechaVencimiento: a.fechaVencimiento?.slice(0,10)||'',
      notaria: a.notaria||'', tomoEscritura: a.tomoEscritura||'', folioEscritura: a.folioEscritura||'',
      notas: a.notas||'',
    });
    setShowModal(true);
  }

  async function handleSave() {
    try {
      if (editing) await api.put(`/sociedades/${id}/apoderados/${editing.id}`, form);
      else         await api.post(`/sociedades/${id}/apoderados`, form);
      toast.success('Guardado'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }
  async function handleDelete() {
    try { await api.delete(`/sociedades/${id}/apoderados/${delId}`); toast.success('Eliminado'); setDelId(null); cargar(); }
    catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14}/> Agregar</button>
      </div>
      {items.length === 0 ? <EmptyState message="Sin apoderados registrados" /> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="th">Nombre</th>
              <th className="th">Documento</th>
              <th className="th">Tipo de poder</th>
              <th className="th">Otorgado</th>
              <th className="th">Vence</th>
              <th className="th"/>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="td font-medium">
                    <div>{a.nombre}</div>
                    {a.profesion && <div className="text-xs text-gray-400">{a.profesion}</div>}
                  </td>
                  <td className="td text-gray-500 text-sm">{a.tipoDocumento} {a.numeroDocumento}</td>
                  <td className="td"><span className="badge badge-blue">{a.tipoPoder}</span></td>
                  <td className="td text-sm">{formatFecha(a.fechaOtorgamiento)}</td>
                  <td className="td text-sm">
                    {a.fechaVencimiento
                      ? <span className={new Date(a.fechaVencimiento) < new Date() ? 'text-red-600 font-medium' : ''}>{formatFecha(a.fechaVencimiento)}</span>
                      : <span className="text-gray-400">Sin vencimiento</span>}
                  </td>
                  <td className="td">
                    <div className="flex gap-2">
                      <button className="text-brand-600 hover:text-brand-800" onClick={()=>openEdit(a)}><Edit2 size={14}/></button>
                      <button className="text-red-500 hover:text-red-700" onClick={()=>setDelId(a.id)}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Editar apoderado':'Nuevo apoderado'} size="xl">
        <div className="space-y-5">
          {/* Datos personales */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos personales</p>
            <div className="space-y-3">
              <div><label className="label">Nombre completo *</label><input className="input" value={form.nombre||''} onChange={e=>f('nombre',e.target.value)}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Tipo documento *</label>
                  <select className="input" value={form.tipoDocumento||'CEDULA'} onChange={e=>f('tipoDocumento',e.target.value)}>
                    {['CEDULA','PASAPORTE','RUC','OTRO'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Número documento *</label><input className="input" value={form.numeroDocumento||''} onChange={e=>f('numeroDocumento',e.target.value)}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nacionalidad</label><input className="input" value={form.nacionalidad||''} onChange={e=>f('nacionalidad',e.target.value)}/></div>
                <div><label className="label">Profesión u ocupación</label><input className="input" placeholder="Ej: Abogado, Empresario..." value={form.profesion||''} onChange={e=>f('profesion',e.target.value)}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">RUC / N° tributario</label><input className="input" value={form.rucNT||''} onChange={e=>f('rucNT',e.target.value)}/></div>
                <div><label className="label">Jurisdicción donde opera</label><input className="input" placeholder="Ej: Panamá, EE.UU...." value={form.jurisdiccion||''} onChange={e=>f('jurisdiccion',e.target.value)}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Email</label><input type="email" className="input" value={form.email||''} onChange={e=>f('email',e.target.value)}/></div>
                <div><label className="label">Teléfono</label><input className="input" placeholder="+507..." value={form.telefono||''} onChange={e=>f('telefono',e.target.value)}/></div>
              </div>
              <div><label className="label">Domicilio</label><input className="input" placeholder="Ciudad, provincia, país" value={form.domicilio||''} onChange={e=>f('domicilio',e.target.value)}/></div>
            </div>
          </div>

          {/* Datos del poder */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos del poder</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Tipo de poder</label>
                  <select className="input" value={form.tipoPoder||'GENERAL'} onChange={e=>f('tipoPoder',e.target.value)}>
                    {TIPOS_PODER.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Notaría</label><input className="input" placeholder="Notaría donde se otorgó" value={form.notaria||''} onChange={e=>f('notaria',e.target.value)}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Fecha de otorgamiento</label><input type="date" className="input" value={form.fechaOtorgamiento||''} onChange={e=>f('fechaOtorgamiento',e.target.value)}/></div>
                <div><label className="label">Fecha de vencimiento</label><input type="date" className="input" value={form.fechaVencimiento||''} onChange={e=>f('fechaVencimiento',e.target.value)}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Tomo escritura</label><input className="input" value={form.tomoEscritura||''} onChange={e=>f('tomoEscritura',e.target.value)}/></div>
                <div><label className="label">Folio escritura</label><input className="input" value={form.folioEscritura||''} onChange={e=>f('folioEscritura',e.target.value)}/></div>
              </div>
              <div><label className="label">Facultades otorgadas</label>
                <textarea className="input resize-none" rows={3} placeholder="Describe las facultades y alcance del poder..." value={form.facultades||''} onChange={e=>f('facultades',e.target.value)}/>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDelete}
        title="Revocar apoderado" message="¿Confirmar la revocación de este apoderado? Se marcará como inactivo." />
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
  const [showHistorial, setShowHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

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

  async function cargarHistorial() {
    setLoadingHistorial(true);
    try {
      const { data } = await api.get(`/sociedades/${id}/acciones/transferencias/todas`);
      setHistorial(Array.isArray(data) ? data : []);
    } catch { setHistorial([]); }
    finally { setLoadingHistorial(false); }
  }

  function toggleHistorial() {
    if (!showHistorial && historial.length === 0) cargarHistorial();
    setShowHistorial(v => !v);
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

      {/* Historial de transferencias */}
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={toggleHistorial}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700"
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={15} className="text-gray-500" />
            Historial de transferencias
          </div>
          {showHistorial ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
        </button>
        {showHistorial && (
          <div className="bg-white">
            {loadingHistorial ? (
              <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-brand-600"/></div>
            ) : historial.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No hay transferencias registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="th"># Acción</th>
                      <th className="th">Cedente</th>
                      <th className="th">Cesionario</th>
                      <th className="th">Fecha</th>
                      <th className="th">Precio</th>
                      <th className="th">Registrado</th>
                      <th className="th">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historial.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="td font-mono font-medium">{t.accion?.numero ?? '—'}</td>
                        <td className="td">{t.cedente}</td>
                        <td className="td">{t.cesionario}</td>
                        <td className="td">{formatFecha(t.fecha)}</td>
                        <td className="td">{t.precio ? formatMoneda(t.precio) : '—'}</td>
                        <td className="td">
                          {t.registrado
                            ? <span className="badge badge-green">Sí</span>
                            : <span className="badge badge-gray">No</span>}
                        </td>
                        <td className="td text-gray-500 max-w-xs truncate">{t.notas || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

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
const MOTIVOS_CONDICION = [
  'Posee o controla, directa o indirectamente, el 25% de las acciones, participaciones o derecho a voto de la persona jurídica.',
  'Ejerce control de la persona jurídica a través de otros medios.',
  'Persona natural que ejerce cargo administrativo superior o ejerce control efectivo, siempre que no se logre identificar por los superiores.',
  'Percibe beneficios económicos, directos o indirectos de la fundación de interés privado y ejerce control final eficaz.',
  'Percibe beneficios económicos, directos o indirectos de la fundación de interés privado.',
  'Ejerce control eficaz final de la Fundación de Interés Privado.',
  'Fiduciario de un fideicomiso dentro de la estructura corporativa; o posición similar dentro de otro tipo de estructura jurídica.',
  'Fideicomitente de un fideicomiso dentro de la estructura corporativa; o posición similar dentro de otro tipo de estructura jurídica.',
  'Protector de un fideicomiso dentro de la estructura corporativa; o posición similar dentro de otro tipo de estructura jurídica.',
  'Beneficiario de un fideicomiso dentro de la estructura corporativa; o posición similar dentro de otro tipo de estructura jurídica.',
  'Persona que ejerce control eficaz final de un fideicomiso dentro de la estructura corporativa; o posición similar dentro de otro tipo.',
  'Liquidador o curador de proceso de quiebra.',
  'Persona natural que actúe como albacea o representante personal del patrimonio de un socio o accionista fallecido.',
  'Otros...',
];

const TIPO_LABEL = {
  PERSONA_NATURAL:             'Persona Natural',
  PERSONA_JURIDICA_BOLSA:      'PJ que cotiza en Bolsa',
  ESTADO:                      'Estado',
  ENTIDAD_ESTATAL_MULTILATERAL:'Entidad Estatal / Multilateral',
};

function formVacio(tipo = 'PERSONA_NATURAL') {
  return { tipoBeneficiario: tipo, primerNombre:'', segundoNombre:'', primerApellido:'', segundoApellido:'', tipoDocumento:'CEDULA', numeroDocumento:'', nacionalidad:'Panameña', fechaNacimiento:'', lugarNacimiento:'', profesion:'', actividadDeclarada:'', rucNT:'', jurisdiccion:'', domicilio:'', esPEP:false, cargoPublico:'', porcentajeControl:0, tipoControl:'DIRECTO', motivoCondicion:'', fechaDeclaracion:'', email:'', telefonoPrefijo:'+507', telefono:'', nombre:'', paisConstitucion:'', nombreBolsa:'', jurisdiccionBolsa:'', representanteLegal:'', personaContacto:'', paisSede:'', fechaConstitucionEstado:'' };
}

function copiarRUBF(b) {
  const lineas = [`TIPO: ${TIPO_LABEL[b.tipoBeneficiario] || b.tipoBeneficiario}`];
  if (b.tipoBeneficiario === 'PERSONA_NATURAL') {
    if (b.primerNombre)   lineas.push(`Primer Nombre: ${b.primerNombre}`);
    if (b.segundoNombre)  lineas.push(`Segundo Nombre: ${b.segundoNombre}`);
    if (b.primerApellido) lineas.push(`Primer Apellido: ${b.primerApellido}`);
    if (b.segundoApellido)lineas.push(`Segundo Apellido: ${b.segundoApellido}`);
    if (b.tipoDocumento && b.numeroDocumento) lineas.push(`Documento: ${b.tipoDocumento} ${b.numeroDocumento}`);
    if (b.fechaNacimiento) lineas.push(`Fecha de nacimiento: ${b.fechaNacimiento?.slice(0,10)}`);
    if (b.nacionalidad)   lineas.push(`Nacionalidad: ${b.nacionalidad}`);
    if (b.domicilio)      lineas.push(`Dirección: ${b.domicilio}`);
    if (b.esPEP)          lineas.push(`PEP: Sí${b.cargoPublico ? ' — ' + b.cargoPublico : ''}`);
  } else if (b.tipoBeneficiario === 'PERSONA_JURIDICA_BOLSA') {
    if (b.nombre)             lineas.push(`Nombre PJ: ${b.nombre}`);
    if (b.domicilio)          lineas.push(`Dirección: ${b.domicilio}`);
    if (b.paisConstitucion)   lineas.push(`País de constitución: ${b.paisConstitucion}`);
    if (b.nombreBolsa)        lineas.push(`Bolsa de Valores: ${b.nombreBolsa}`);
    if (b.jurisdiccionBolsa)  lineas.push(`Jurisdicción Bolsa: ${b.jurisdiccionBolsa}`);
    if (b.representanteLegal) lineas.push(`Representante Legal: ${b.representanteLegal}`);
  } else if (b.tipoBeneficiario === 'ESTADO') {
    if (b.nombre)              lineas.push(`País: ${b.nombre}`);
    if (b.fechaConstitucionEstado) lineas.push(`Fecha constitución Estado: ${b.fechaConstitucionEstado?.slice(0,10)}`);
    if (b.personaContacto)    lineas.push(`Persona de contacto: ${b.personaContacto}`);
  } else {
    if (b.nombre)             lineas.push(`Entidad: ${b.nombre}`);
    if (b.domicilio)          lineas.push(`Dirección: ${b.domicilio}`);
    if (b.paisSede)           lineas.push(`País/Sede: ${b.paisSede}`);
    if (b.representanteLegal) lineas.push(`Representante Legal: ${b.representanteLegal}`);
  }
  if (b.email)            lineas.push(`Email: ${b.email}`);
  if (b.telefono)         lineas.push(`Teléfono: ${b.telefonoPrefijo || '+507'} ${b.telefono}`);
  if (b.fechaDeclaracion) lineas.push(`Fecha adquisición condición: ${b.fechaDeclaracion?.slice(0,10)}`);
  if (b.motivoCondicion)  lineas.push(`Motivo: ${b.motivoCondicion}`);
  if (b.porcentajeControl) lineas.push(`% Control: ${Number(b.porcentajeControl).toFixed(2)}%`);
  return lineas.join('\n');
}

function TabBeneficiarios({ id }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(formVacio());
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/beneficiarios`);
    setItems(data); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function openNew() { setEditing(null); setForm(formVacio()); setShowModal(true); }
  function openEdit(b) { setEditing(b); setForm({ ...formVacio(b.tipoBeneficiario), ...b, fechaNacimiento: b.fechaNacimiento?.slice(0,10)||'', fechaDeclaracion: b.fechaDeclaracion?.slice(0,10)||'', fechaConstitucionEstado: b.fechaConstitucionEstado?.slice(0,10)||'' }); setShowModal(true); }

  async function handleSave() {
    try {
      if (editing) await api.put(`/sociedades/${id}/beneficiarios/${editing.id}`, form);
      else         await api.post(`/sociedades/${id}/beneficiarios`, form);
      toast.success('Guardado'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function toggleVerificado(b) {
    try {
      await api.put(`/sociedades/${id}/beneficiarios/${b.id}`, { verificado: !b.verificado });
      setItems(prev => prev.map(x => x.id === b.id ? { ...x, verificado: !b.verificado } : x));
      toast.success(!b.verificado ? 'Marcado como verificado' : 'Marcado como pendiente');
    } catch(e) { toast.error('Error al actualizar'); }
  }

  function handleCopiar(b) {
    navigator.clipboard.writeText(copiarRUBF(b));
    toast.success('Datos copiados al portapapeles');
  }

  const tipo = form.tipoBeneficiario || 'PERSONA_NATURAL';
  const esPN   = tipo === 'PERSONA_NATURAL';
  const esBolsa= tipo === 'PERSONA_JURIDICA_BOLSA';
  const esEstado = tipo === 'ESTADO';
  const esMulti  = tipo === 'ENTIDAD_ESTATAL_MULTILATERAL';

  if (loading) return <PageSpinner />;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14}/> Agregar</button>
      </div>
      {items.length === 0 ? <EmptyState message="Sin beneficiarios registrados (Ley 52 de 2016)" /> : (
        <table className="w-full"><thead className="bg-gray-50 border-b"><tr>
          <th className="th">Nombre</th><th className="th">Tipo</th><th className="th">% Control</th>
          <th className="th">Verificado</th><th className="th"/>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(b => (
            <tr key={b.id} className="hover:bg-gray-50">
              <td className="td font-medium">{b.nombre}</td>
              <td className="td text-xs">{TIPO_LABEL[b.tipoBeneficiario] || b.tipoBeneficiario}</td>
              <td className="td">{b.porcentajeControl ? `${Number(b.porcentajeControl).toFixed(2)}%` : '—'}</td>
              <td className="td">
                <button onClick={() => toggleVerificado(b)} className="cursor-pointer">
                  {b.verificado ? <span className="badge badge-green">Verificado ✓</span> : <span className="badge badge-yellow">Pendiente</span>}
                </button>
              </td>
              <td className="td">
                <div className="flex gap-2">
                  <button className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-0.5" onClick={() => handleCopiar(b)} title="Copiar datos para RUBF">Copiar RUBF</button>
                  <button className="text-brand-600 hover:text-brand-800" onClick={() => openEdit(b)}><Edit2 size={14}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody></table>
      )}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Editar beneficiario':'Nuevo beneficiario'} size="lg">
        <div className="space-y-3">

          {/* Tipo de beneficiario */}
          <div><label className="label">Tipo de beneficiario final *</label>
            <select className="input" value={tipo} onChange={e=>{ setForm(formVacio(e.target.value)); }}>
              <option value="PERSONA_NATURAL">Persona Natural</option>
              <option value="PERSONA_JURIDICA_BOLSA">Persona Jurídica que cotiza en Bolsa</option>
              <option value="ESTADO">Estado</option>
              <option value="ENTIDAD_ESTATAL_MULTILATERAL">Entidad Estatal o Multilateral</option>
            </select>
          </div>

          {/* ── PERSONA NATURAL ── */}
          {esPN && <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Primer nombre *</label><input className="input" value={form.primerNombre||''} onChange={e=>f('primerNombre',e.target.value)}/></div>
              <div><label className="label">Segundo nombre</label><input className="input" value={form.segundoNombre||''} onChange={e=>f('segundoNombre',e.target.value)}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Primer apellido *</label><input className="input" value={form.primerApellido||''} onChange={e=>f('primerApellido',e.target.value)}/></div>
              <div><label className="label">Segundo apellido</label><input className="input" value={form.segundoApellido||''} onChange={e=>f('segundoApellido',e.target.value)}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Tipo documento *</label>
                <select className="input" value={form.tipoDocumento||'CEDULA'} onChange={e=>f('tipoDocumento',e.target.value)}>
                  {['CEDULA','PASAPORTE','OTRO'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Número documento *</label><input className="input" value={form.numeroDocumento||''} onChange={e=>f('numeroDocumento',e.target.value)}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Fecha de nacimiento *</label><input type="date" className="input" value={form.fechaNacimiento||''} onChange={e=>f('fechaNacimiento',e.target.value)}/></div>
              <div><label className="label">Lugar de nacimiento</label><input className="input" placeholder="Ciudad, país" value={form.lugarNacimiento||''} onChange={e=>f('lugarNacimiento',e.target.value)}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Nacionalidad *</label><input className="input" value={form.nacionalidad||''} onChange={e=>f('nacionalidad',e.target.value)}/></div>
              <div><label className="label">Profesión u ocupación</label><input className="input" placeholder="Ej: Empresario, Abogado..." value={form.profesion||''} onChange={e=>f('profesion',e.target.value)}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">RUC / N° tributario</label><input className="input" placeholder="RUC o número tributario" value={form.rucNT||''} onChange={e=>f('rucNT',e.target.value)}/></div>
              <div><label className="label">Jurisdicción donde opera</label><input className="input" placeholder="Ej: Panamá, EE.UU...." value={form.jurisdiccion||''} onChange={e=>f('jurisdiccion',e.target.value)}/></div>
            </div>
            <div><label className="label">Actividad declarada</label><input className="input" placeholder="Actividad económica principal" value={form.actividadDeclarada||''} onChange={e=>f('actividadDeclarada',e.target.value)}/></div>
            <div><label className="label">Dirección *</label><input className="input" value={form.domicilio||''} onChange={e=>f('domicilio',e.target.value)}/></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.esPEP||false} onChange={e=>f('esPEP',e.target.checked)}/>
              Es PEP (Persona Expuesta Políticamente)
            </label>
            {form.esPEP && <div><label className="label">Cargo público</label><input className="input" value={form.cargoPublico||''} onChange={e=>f('cargoPublico',e.target.value)}/></div>}
          </>}

          {/* ── PJ BOLSA ── */}
          {esBolsa && <>
            <div><label className="label">Nombre completo de la PJ *</label><input className="input" value={form.nombre||''} onChange={e=>f('nombre',e.target.value)}/></div>
            <div><label className="label">Dirección *</label><input className="input" value={form.domicilio||''} onChange={e=>f('domicilio',e.target.value)}/></div>
            <div><label className="label">País de constitución *</label><input className="input" value={form.paisConstitucion||''} onChange={e=>f('paisConstitucion',e.target.value)}/></div>
            <div><label className="label">Nombre de la Bolsa de Valores *</label><input className="input" value={form.nombreBolsa||''} onChange={e=>f('nombreBolsa',e.target.value)}/></div>
            <div><label className="label">Jurisdicción donde opera la Bolsa *</label><input className="input" value={form.jurisdiccionBolsa||''} onChange={e=>f('jurisdiccionBolsa',e.target.value)}/></div>
            <div><label className="label">Nombre del representante legal *</label><input className="input" value={form.representanteLegal||''} onChange={e=>f('representanteLegal',e.target.value)}/></div>
          </>}

          {/* ── ESTADO ── */}
          {esEstado && <>
            <div><label className="label">Nombre del País *</label><input className="input" value={form.nombre||''} onChange={e=>f('nombre',e.target.value)}/></div>
            <div><label className="label">Fecha de constitución del Estado *</label><input type="date" className="input" value={form.fechaConstitucionEstado||''} onChange={e=>f('fechaConstitucionEstado',e.target.value)}/></div>
            <div><label className="label">Nombre de la persona de contacto *</label><input className="input" value={form.personaContacto||''} onChange={e=>f('personaContacto',e.target.value)}/></div>
          </>}

          {/* ── MULTILATERAL ── */}
          {esMulti && <>
            <div><label className="label">Nombre completo de la entidad *</label><input className="input" value={form.nombre||''} onChange={e=>f('nombre',e.target.value)}/></div>
            <div><label className="label">Dirección *</label><input className="input" value={form.domicilio||''} onChange={e=>f('domicilio',e.target.value)}/></div>
            <div><label className="label">País y/o sede *</label><input className="input" value={form.paisSede||''} onChange={e=>f('paisSede',e.target.value)}/></div>
            <div><label className="label">Nombre del representante legal *</label><input className="input" value={form.representanteLegal||''} onChange={e=>f('representanteLegal',e.target.value)}/></div>
          </>}

          {/* ── CONTACTO (todos) ── */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email||''} onChange={e=>f('email',e.target.value)}/></div>
            <div><label className="label">Prefijo</label>
              <select className="input" value={form.telefonoPrefijo||'+507'} onChange={e=>f('telefonoPrefijo',e.target.value)}>
                {['+507','+1','+34','+52','+57','+58','+51','+54','+55','+56'].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">Teléfono</label><input className="input" value={form.telefono||''} onChange={e=>f('telefono',e.target.value)}/></div>
          </div>

          {/* ── CONDICIÓN (todos) ── */}
          <div><label className="label">Fecha en que adquiere condición *</label><input type="date" className="input" value={form.fechaDeclaracion||''} onChange={e=>f('fechaDeclaracion',e.target.value)}/></div>
          <div><label className="label">Motivo de la condición *</label>
            <select className="input" value={form.motivoCondicion||''} onChange={e=>f('motivoCondicion',e.target.value)}>
              <option value="">— Seleccione —</option>
              {MOTIVOS_CONDICION.map(m=><option key={m} value={m}>{m.length>80 ? m.slice(0,80)+'…' : m}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">% de control</label><input type="number" step="0.01" min="0" max="100" className="input" value={form.porcentajeControl||0} onChange={e=>f('porcentajeControl',Number(e.target.value))}/></div>
            <div><label className="label">Tipo de control</label>
              <select className="input" value={form.tipoControl||'DIRECTO'} onChange={e=>f('tipoControl',e.target.value)}>
                <option value="DIRECTO">Directo</option>
                <option value="INDIRECTO">Indirecto</option>
                <option value="DIRECTO_E_INDIRECTO">Directo e Indirecto</option>
              </select>
            </div>
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

  function openEdit(o) { setEditing(o); setForm({ tipo:o.tipo, anio:o.anio, entidad:o.entidad||'', descripcion:o.descripcion||'', fechaVence:o.fechaVence?.slice(0,10)||'', estado:o.estado, monto:o.monto||0, fechaPago:o.fechaPago?.slice(0,10)||'' }); setShowModal(true); }

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
              <td className="td text-xs">{o.tipo === 'OTRO' && o.descripcion ? o.descripcion : o.tipo.replace(/_/g,' ')}</td>
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
          {form.tipo === 'OTRO' && (
            <div><label className="label">Descripción de la obligación *</label>
              <input className="input" placeholder="Ej: Licencia sanitaria, Permiso municipal..." value={form.descripcion||''} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))}/>
            </div>
          )}
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
          {nuevaForm.tipo === 'OTRO' && (
            <div><label className="label">Descripción de la obligación *</label>
              <input className="input" placeholder="Ej: Licencia sanitaria, Permiso municipal..." value={nuevaForm.descripcion||''} onChange={e=>setNuevaForm(f=>({...f,descripcion:e.target.value}))}/>
            </div>
          )}
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
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selTipo, setSelTipo] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    const [d, t, p] = await Promise.all([
      api.get(`/sociedades/${id}/documentos`),
      api.get(`/sociedades/${id}/documentos/tipos`),
      api.get('/plantillas'),
    ]);
    setItems(Array.isArray(d.data) ? d.data : d.data.documentos || []);
    setTipos(t.data);
    setPlantillas(p.data);
    if (t.data[0] && !selTipo) setSelTipo(t.data[0].tipo);
    setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  const esPlantillaPersonalizada = plantillas.some(p => p.id === selTipo);

  async function generar(fmt) {
    setGenerating(true);
    try {
      let blob;
      if (esPlantillaPersonalizada) {
        // Plantilla personalizada — siempre genera Word
        const resp = await api.post('/plantillas/generar', { plantillaId: selTipo, sociedadId: id }, { responseType: 'blob' });
        blob = resp.data;
        fmt = 'docx';
      } else {
        const resp = await api.post(`/sociedades/${id}/documentos/generar/${fmt}`, { tipo: selTipo }, { responseType: 'blob' });
        blob = resp.data;
      }
      const nombrePlantilla = plantillas.find(p => p.id === selTipo)?.nombre || selTipo;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${nombrePlantilla}.${fmt}`;
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
            <optgroup label="── Documentos predefinidos ──">
              {tipos.map(t => <option key={t.tipo} value={t.tipo}>{t.nombre}</option>)}
            </optgroup>
            {plantillas.length > 0 && (
              <optgroup label="── Mis plantillas ──">
                {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </optgroup>
            )}
          </select>
        </div>
        <div className="flex gap-2">
          {esPlantillaPersonalizada ? (
            <button className="btn-primary btn-sm" onClick={()=>generar('docx')} disabled={generating || !selTipo}>
              {generating ? <Spinner size="sm"/> : <Download size={14}/>} Word
            </button>
          ) : (
            <>
              <button className="btn-primary btn-sm" onClick={()=>generar('pdf')} disabled={generating || !selTipo}>
                {generating ? <Spinner size="sm"/> : <Download size={14}/>} PDF
              </button>
              <button className="btn-secondary btn-sm" onClick={()=>generar('docx')} disabled={generating || !selTipo}>
                {generating ? <Spinner size="sm"/> : <Download size={14}/>} Word
              </button>
            </>
          )}
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
  const [showResp, setShowResp] = useState(null);
  const [respuesta, setRespuesta] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/consultas`);
    setItems(Array.isArray(data) ? data : data.consultas || []); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function handleResponder(cId) {
    try {
      await api.put(`/sociedades/${id}/consultas/${cId}`, { respuesta, estado:'RESUELTA' });
      toast.success('Respuesta enviada'); setShowResp(null); setRespuesta(''); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div>
      {items.length === 0 ? (
        <EmptyState message="Sin consultas. El cliente puede enviar consultas desde su portal." />
      ) : (
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
                    <p className="text-xs font-semibold text-green-700 mb-1">Tu respuesta ({formatFecha(c.fechaRespuesta)}):</p>
                    <p className="text-sm text-green-800">{c.respuesta}</p>
                  </div>
                ) : (
                  <button className="mt-2 text-xs text-brand-600 hover:underline font-medium"
                    onClick={() => { setShowResp(c.id); setRespuesta(''); }}>
                    Responder →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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

// ─── TabCompletitud ───────────────────────────────────────────────────────────

const TIER_CFG_AGENTE = {
  CRITICA: { label: 'Crítica',  badgeCls: 'bg-red-100 text-red-800',    dot: 'bg-red-500' },
  ALTA:    { label: 'Alta',     badgeCls: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  MEDIA:   { label: 'Media',    badgeCls: 'bg-blue-100 text-blue-800',   dot: 'bg-blue-500' },
  BAJA:    { label: 'Baja',     badgeCls: 'bg-gray-100 text-gray-700',   dot: 'bg-gray-400' },
};

function TabCompletitud({ id }) {
  const { addToast } = useToast();
  const [completitud, setCompletitud] = useState(null);
  const [config, setConfig]           = useState(null);
  const [cargando, setCargando]       = useState(true);
  const [enviando, setEnviando]       = useState(false);
  const [guardandoCfg, setGuardandoCfg] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const [rc, rk] = await Promise.all([
        api.get(`/sociedades/${id}/completitud`),
        api.get(`/sociedades/${id}/recordatorio`),
      ]);
      setCompletitud(rc.data);
      setConfig(rk.data);
    } catch { /* ignorar */ }
    finally { setCargando(false); }
  }

  useEffect(() => { cargar(); }, [id]);

  async function handleEnviarManual() {
    setEnviando(true);
    try {
      const r = await api.post(`/sociedades/${id}/recordatorio/enviar`);
      addToast(r.data.mensaje || 'Recordatorio enviado.', 'success');
      cargar();
    } catch (e) {
      addToast(e.response?.data?.error || 'Error al enviar.', 'error');
    } finally { setEnviando(false); }
  }

  async function handleGuardarConfig(e) {
    e.preventDefault();
    setGuardandoCfg(true);
    try {
      await api.put(`/sociedades/${id}/recordatorio`, config);
      addToast('Configuración guardada.', 'success');
    } catch { addToast('Error al guardar.', 'error'); }
    finally { setGuardandoCfg(false); }
  }

  if (cargando) return <div className="p-8 flex justify-center"><Spinner /></div>;
  if (!completitud || !config) return null;

  const { items, resumenPorTier, porcentajeGlobal, tierMasUrgente } = completitud;
  const pendientes = items.filter(i => !i.completado);
  const barColor = porcentajeGlobal >= 80 ? 'bg-green-500' : porcentajeGlobal >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-6">
      {/* Progreso global */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Completitud del expediente</h3>
          <span className={`text-2xl font-bold ${porcentajeGlobal === 100 ? 'text-green-600' : 'text-gray-800'}`}>
            {porcentajeGlobal}%
          </span>
        </div>
        <div className="bg-gray-200 rounded-full h-3 mb-4">
          <div className={`${barColor} h-3 rounded-full transition-all`} style={{ width: `${porcentajeGlobal}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {['CRITICA','ALTA','MEDIA','BAJA'].map(tier => {
            const r = resumenPorTier[tier];
            if (!r || r.total === 0) return null;
            const cfg = TIER_CFG_AGENTE[tier];
            return (
              <div key={tier} className="text-center bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-lg font-bold text-gray-800">{r.completado}<span className="text-gray-400 text-sm">/{r.total}</span></p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de pendientes */}
      {pendientes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">
              {pendientes.length} ítem{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''}
            </h3>
            {tierMasUrgente && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_CFG_AGENTE[tierMasUrgente].badgeCls}`}>
                Mayor urgencia: {TIER_CFG_AGENTE[tierMasUrgente].label}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {['CRITICA','ALTA','MEDIA','BAJA'].map(tier =>
              pendientes.filter(i => i.tier === tier).map(item => (
                <div key={item.id} className="px-5 py-2.5 flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${TIER_CFG_AGENTE[tier].dot}`} />
                  <p className="text-sm text-gray-700 flex-1">{item.label}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${TIER_CFG_AGENTE[tier].badgeCls}`}>
                    {TIER_CFG_AGENTE[tier].label}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Config recordatorios */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-brand-600" />
            <h3 className="font-semibold text-gray-900">Recordatorios al cliente</h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setConfig(c => ({ ...c, activo: !c.activo }))}
              className={`w-10 h-5 rounded-full transition-colors ${config.activo ? 'bg-brand-600' : 'bg-gray-300'}`}
            >
              <div className={`h-5 w-5 bg-white rounded-full shadow transition-transform ${config.activo ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-600">{config.activo ? 'Activos' : 'Inactivos'}</span>
          </label>
        </div>

        {config.activo && (
          <form onSubmit={handleGuardarConfig} className="space-y-3">
            <p className="text-xs text-gray-500 mb-3">
              El email se envía con la frecuencia del tier más urgente con información pendiente.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'frecuenciaCritica', label: 'Prioridad Crítica (días)' },
                { key: 'frecuenciaAlta',    label: 'Prioridad Alta (días)' },
                { key: 'frecuenciaMedia',   label: 'Prioridad Media (días)' },
                { key: 'frecuenciaBaja',    label: 'Prioridad Baja (días)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="number"
                    min={1}
                    value={config[key] || ''}
                    onChange={e => setConfig(c => ({ ...c, [key]: Number(e.target.value) }))}
                    className="input text-sm w-full"
                  />
                </div>
              ))}
            </div>
            {config.ultimoEnvio && (
              <p className="text-xs text-gray-400">
                Último recordatorio enviado: {new Date(config.ultimoEnvio).toLocaleDateString('es-PA', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={guardandoCfg} className="btn btn-primary btn-sm flex items-center gap-2">
                {guardandoCfg ? <Loader2 size={13} className="animate-spin" /> : null}
                Guardar configuración
              </button>
              <button
                type="button"
                onClick={handleEnviarManual}
                disabled={enviando || pendientes.length === 0}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                {enviando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Enviar recordatorio ahora
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── TabExpediente ────────────────────────────────────────────────────────────
const LABEL_DOC = {
  CEDULA_PASAPORTE:             'Cédula / Pasaporte',
  COMPROBANTE_DOMICILIO:        'Comprobante de domicilio',
  REFERENCIA_BANCARIA:          'Referencia bancaria',
  CERTIFICADO_REGISTRO_PUBLICO: 'Cert. Registro Público',
  CERTIFICADO_DGI:              'Cert. DGI (buena posición)',
  LICENCIA_COMERCIAL:           'Licencia comercial / Aviso de Operación',
  CERTIFICADO_ACCIONES:         'Certificado de acciones',
  ESCRITURA_PODER:              'Escritura del poder',
  OTRO:                         'Otro documento',
};

function TabExpediente({ id }) {
  const toast = useToast();
  const [docs, setDocs]               = useState([]);
  const [directores, setDirectores]   = useState([]);
  const [accionistas, setAccionistas] = useState([]);
  const [apoderados, setApoderados]   = useState([]);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showUpload, setShowUpload]   = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [uploadFile, setUploadFile]   = useState(null);
  const [uploadFecha, setUploadFecha] = useState('');
  const [uploadNotas, setUploadNotas] = useState('');
  const [saving, setSaving]           = useState(false);
  const [delDocId, setDelDocId]       = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [docsR, dirsR, accR, apodR, benfR] = await Promise.all([
      api.get(`/sociedades/${id}/expediente`),
      api.get(`/sociedades/${id}/directores`),
      api.get(`/sociedades/${id}/accionistas`),
      api.get(`/sociedades/${id}/apoderados`),
      api.get(`/sociedades/${id}/beneficiarios`),
    ]);
    setDocs(docsR.data);
    setDirectores(dirsR.data);
    setAccionistas(accR.data?.accionistas || accR.data || []);
    setApoderados(apodR.data);
    setBeneficiarios((benfR.data?.beneficiarios || benfR.data || []).filter(b => b.tipoBeneficiario === 'PERSONA_NATURAL'));
    setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function getDoc(entidadTipo, entidadId, tipo) {
    return docs.find(d => d.entidadTipo === entidadTipo && d.entidadId === entidadId && d.tipo === tipo);
  }

  function openUpload(tipo, entidadTipo, entidadId, entidadNombre) {
    setUploadTarget({ tipo, entidadTipo, entidadId, entidadNombre });
    setUploadFile(null); setUploadFecha(''); setUploadNotas('');
    setShowUpload(true);
  }

  async function handleSubir() {
    if (!uploadFile) return toast.error('Selecciona un archivo.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('archivo', uploadFile);
      fd.append('tipo', uploadTarget.tipo);
      fd.append('entidadTipo', uploadTarget.entidadTipo);
      if (uploadTarget.entidadId) fd.append('entidadId', uploadTarget.entidadId);
      fd.append('entidadNombre', uploadTarget.entidadNombre);
      if (uploadFecha) fd.append('fechaVencimiento', uploadFecha);
      if (uploadNotas) fd.append('notas', uploadNotas);
      await api.post(`/sociedades/${id}/expediente`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Documento subido'); setShowUpload(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error al subir'); }
    finally { setSaving(false); }
  }

  async function handleDescargar(doc) {
    try {
      const { data: blob } = await api.get(`/sociedades/${id}/expediente/${doc.id}/descargar`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = doc.nombreArchivo;
      a.click();
    } catch(e) { toast.error('Error al descargar'); }
  }

  async function handleEliminar() {
    try {
      await api.delete(`/sociedades/${id}/expediente/${delDocId}`);
      toast.success('Documento eliminado'); setDelDocId(null); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  const grupos = [
    {
      label: 'Sociedad',
      entidadTipo: 'SOCIEDAD',
      items: [
        { entidadId: id, entidadNombre: 'Sociedad', tipo: 'CERTIFICADO_REGISTRO_PUBLICO' },
        { entidadId: id, entidadNombre: 'Sociedad', tipo: 'CERTIFICADO_DGI' },
        { entidadId: id, entidadNombre: 'Sociedad', tipo: 'LICENCIA_COMERCIAL' },
      ],
    },
    {
      label: 'Directores',
      entidadTipo: 'DIRECTOR',
      items: directores.flatMap(d => [
        { entidadId: d.id, entidadNombre: d.nombre, tipo: 'CEDULA_PASAPORTE' },
        { entidadId: d.id, entidadNombre: d.nombre, tipo: 'COMPROBANTE_DOMICILIO' },
      ]),
    },
    {
      label: 'Accionistas',
      entidadTipo: 'ACCIONISTA',
      items: accionistas.flatMap(a => [
        { entidadId: a.id, entidadNombre: a.nombre, tipo: 'CEDULA_PASAPORTE' },
        { entidadId: a.id, entidadNombre: a.nombre, tipo: 'COMPROBANTE_DOMICILIO' },
      ]),
    },
    {
      label: 'Apoderados',
      entidadTipo: 'APODERADO',
      items: apoderados.flatMap(a => [
        { entidadId: a.id, entidadNombre: a.nombre, tipo: 'CEDULA_PASAPORTE' },
        { entidadId: a.id, entidadNombre: a.nombre, tipo: 'COMPROBANTE_DOMICILIO' },
        { entidadId: a.id, entidadNombre: a.nombre, tipo: 'ESCRITURA_PODER' },
      ]),
    },
    {
      label: 'Beneficiarios Finales',
      entidadTipo: 'BENEFICIARIO',
      items: beneficiarios.flatMap(b => [
        { entidadId: b.id, entidadNombre: b.nombre, tipo: 'CEDULA_PASAPORTE' },
        { entidadId: b.id, entidadNombre: b.nombre, tipo: 'COMPROBANTE_DOMICILIO' },
      ]),
    },
  ];

  const totalReq = grupos.reduce((s, g) => s + g.items.length, 0);
  const totalOk  = grupos.reduce((s, g) =>
    s + g.items.filter(i => getDoc(g.entidadTipo, i.entidadId, i.tipo)).length, 0);

  if (loading) return <PageSpinner />;
  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalReq}</div>
          <div className="text-xs text-gray-500 mt-1">Documentos requeridos</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{totalOk}</div>
          <div className="text-xs text-green-600 mt-1">Recibidos</div>
        </div>
        <div className={`rounded-xl border p-4 text-center ${totalReq - totalOk > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
          <div className={`text-2xl font-bold ${totalReq - totalOk > 0 ? 'text-red-700' : 'text-gray-400'}`}>{totalReq - totalOk}</div>
          <div className={`text-xs mt-1 ${totalReq - totalOk > 0 ? 'text-red-600' : 'text-gray-500'}`}>Pendientes</div>
        </div>
      </div>

      {/* Grupos */}
      {grupos.map(g => g.items.length === 0 ? null : (
        <div key={g.label} className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
            <FolderOpen size={15} className="text-gray-500"/>
            <span className="font-semibold text-sm text-gray-700">{g.label}</span>
            <span className="ml-auto text-xs text-gray-400">
              {g.items.filter(i => getDoc(g.entidadTipo, i.entidadId, i.tipo)).length} / {g.items.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {g.items.map((item, idx) => {
              const doc = getDoc(g.entidadTipo, item.entidadId, item.tipo);
              const vencido = doc?.fechaVencimiento && new Date(doc.fechaVencimiento) < new Date();
              return (
                <div key={idx} className="px-4 py-3 flex items-center gap-3">
                  {doc
                    ? <CheckCircle2 size={16} className={`shrink-0 ${vencido ? 'text-amber-400' : 'text-green-500'}`}/>
                    : <XCircle size={16} className="shrink-0 text-red-400"/>}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{LABEL_DOC[item.tipo]}</div>
                    <div className="text-xs text-gray-400 truncate">{item.entidadNombre}</div>
                  </div>
                  {doc ? (
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[140px]">{doc.nombreArchivo}</span>
                      {doc.fechaVencimiento && (
                        <span className={`text-xs ${vencido ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          Vence {formatFecha(doc.fechaVencimiento)}
                        </span>
                      )}
                      <button className="text-brand-600 hover:text-brand-800" onClick={() => handleDescargar(doc)} title="Descargar">
                        <Download size={14}/>
                      </button>
                      <button className="text-red-400 hover:text-red-600" onClick={() => setDelDocId(doc.id)} title="Eliminar">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ) : (
                    <button className="btn-secondary btn-sm flex items-center gap-1 shrink-0"
                      onClick={() => openUpload(item.tipo, g.entidadTipo, item.entidadId, item.entidadNombre)}>
                      <Upload size={12}/> Subir
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Subir documento">
        {uploadTarget && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <span className="font-medium">{LABEL_DOC[uploadTarget.tipo]}</span>
              <span className="text-gray-500"> — {uploadTarget.entidadNombre}</span>
            </div>
            <div>
              <label className="label">Archivo * <span className="text-gray-400 font-normal">(PDF, JPG, PNG, WEBP — máx. 10 MB)</span></label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="input"
                onChange={e => setUploadFile(e.target.files[0])}/>
            </div>
            <div>
              <label className="label">Fecha de vencimiento (opcional)</label>
              <input type="date" className="input" value={uploadFecha} onChange={e => setUploadFecha(e.target.value)}/>
            </div>
            <div>
              <label className="label">Notas</label>
              <input className="input" placeholder="Observaciones sobre el documento..." value={uploadNotas} onChange={e => setUploadNotas(e.target.value)}/>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowUpload(false)}>Cancelar</button>
              <button className="btn-primary flex items-center gap-2" onClick={handleSubir} disabled={saving}>
                {saving ? <Spinner size="sm"/> : <Upload size={14}/>} Subir documento
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!delDocId} onClose={() => setDelDocId(null)} onConfirm={handleEliminar}
        title="Eliminar documento" message="¿Confirmar eliminación? Se borrará el archivo del servidor."/>
    </div>
  );
}

// ─── TabNominales ─────────────────────────────────────────────────────────────
const LABEL_MEDIDA = {
  CONTRATO_BF:                'Contrato identificando BF',
  DECLARACION_JURADA_NOMINAL: 'Declaración jurada del nominal',
  SEGUIMIENTO_ANUAL:          'Seguimiento anual',
  OTRO:                       'Otro',
};

const REQS_POR_TIPO = {
  DIRECTOR:   ['CONTRATO_BF','DECLARACION_JURADA_NOMINAL','SEGUIMIENTO_ANUAL'],
  ACCIONISTA: ['CONTRATO_BF','DECLARACION_JURADA_NOMINAL','SEGUIMIENTO_ANUAL'],
  APODERADO:  ['CONTRATO_BF','SEGUIMIENTO_ANUAL'],
};

function TabNominales({ id, sociedad }) {
  const toast = useToast();
  const [medidas, setMedidas]         = useState([]);
  const [directores, setDirectores]   = useState([]);
  const [accionistas, setAccionistas] = useState([]);
  const [apoderados, setApoderados]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [uploadFile, setUploadFile]   = useState(null);
  const [uploadForm, setUploadForm]   = useState({
    tipo: 'CONTRATO_BF', entidadTipo: 'DIRECTOR', entidadId: '', entidadNombre: '',
    fechaEmision: '', fechaVencimiento: '', capacitacionHoras: '', notas: '',
  });
  const [saving, setSaving]   = useState(false);
  const [delMedId, setDelMedId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [medR, dirR, accR, apodR] = await Promise.all([
      api.get(`/sociedades/${id}/mitigadoras`),
      api.get(`/sociedades/${id}/directores`),
      api.get(`/sociedades/${id}/accionistas`),
      api.get(`/sociedades/${id}/apoderados`),
    ]);
    setMedidas(medR.data);
    setDirectores(dirR.data.filter(d => d.esNominal));
    setAccionistas((accR.data?.accionistas || accR.data || []).filter(a => a.esNominal));
    setApoderados(apodR.data);
    setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function getMedida(entidadTipo, entidadId, tipo) {
    return medidas.find(m => m.entidadTipo === entidadTipo && m.entidadId === entidadId && m.tipo === tipo);
  }

  function openUpload(tipo, entidadTipo, entidadId, entidadNombre) {
    const anios = tipo === 'SEGUIMIENTO_ANUAL' ? 1 : 3;
    const fecha = new Date(); fecha.setFullYear(fecha.getFullYear() + anios);
    setUploadForm({
      tipo, entidadTipo, entidadId, entidadNombre,
      fechaEmision: new Date().toISOString().slice(0,10),
      fechaVencimiento: fecha.toISOString().slice(0,10),
      capacitacionHoras: tipo === 'DECLARACION_JURADA_NOMINAL' ? '8' : '',
      notas: '',
    });
    setUploadFile(null);
    setShowModal(true);
  }

  async function handleGuardar() {
    if (uploadForm.tipo === 'DECLARACION_JURADA_NOMINAL') {
      const h = Number(uploadForm.capacitacionHoras);
      if (!h || h < 8) return toast.error('La declaración jurada requiere al menos 8 horas de capacitación.');
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(uploadForm).forEach(([k,v]) => { if (v !== '') fd.append(k, v); });
      if (uploadFile) fd.append('archivo', uploadFile);
      await api.post(`/sociedades/${id}/mitigadoras`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Medida registrada'); setShowModal(false); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  }

  async function handleDescargar(med) {
    if (!med.archivo) return toast.error('Sin archivo adjunto.');
    try {
      const { data: blob } = await api.get(`/sociedades/${id}/mitigadoras/${med.id}/descargar`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = med.nombreArchivo;
      a.click();
    } catch(e) { toast.error('Error al descargar'); }
  }

  async function handleEliminar() {
    try {
      await api.delete(`/sociedades/${id}/mitigadoras/${delMedId}`);
      toast.success('Medida eliminada'); setDelMedId(null); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  const grupos = [
    { label: 'Directores / Dignatarios nominales', entidadTipo: 'DIRECTOR',   items: directores },
    { label: 'Accionistas nominales',               entidadTipo: 'ACCIONISTA', items: accionistas },
    { label: 'Apoderados',                          entidadTipo: 'APODERADO',  items: apoderados },
  ].filter(g => g.items.length > 0);

  const tieneNominales = directores.length > 0 || accionistas.length > 0 || apoderados.length > 0;

  const totalReq = grupos.reduce((s, g) =>
    s + g.items.length * REQS_POR_TIPO[g.entidadTipo].length, 0);
  const totalOk = grupos.reduce((s, g) =>
    s + g.items.reduce((ss, item) =>
      ss + REQS_POR_TIPO[g.entidadTipo].filter(t => getMedida(g.entidadTipo, item.id, t)).length, 0), 0);

  const uf = (k, v) => setUploadForm(p => ({ ...p, [k]: v }));

  if (loading) return <PageSpinner />;

  if (!tieneNominales) {
    return (
      <div className="text-center py-12">
        <ShieldCheck size={32} className="mx-auto text-green-400 mb-3"/>
        <p className="text-gray-600 font-medium">No hay nominales registrados</p>
        <p className="text-sm text-gray-400 mt-1">
          Los directores y accionistas marcados como "nominal" aparecerán aquí con sus medidas mitigadoras requeridas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalReq}</div>
          <div className="text-xs text-gray-500 mt-1">Medidas requeridas</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{totalOk}</div>
          <div className="text-xs text-green-600 mt-1">Implementadas</div>
        </div>
        <div className={`rounded-xl border p-4 text-center ${totalReq - totalOk > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
          <div className={`text-2xl font-bold ${totalReq - totalOk > 0 ? 'text-red-700' : 'text-gray-400'}`}>{totalReq - totalOk}</div>
          <div className={`text-xs mt-1 ${totalReq - totalOk > 0 ? 'text-red-600' : 'text-gray-500'}`}>Pendientes</div>
        </div>
      </div>

      {/* Grupos de nominales */}
      {grupos.map(g => (
        <div key={g.entidadTipo} className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <UserCheck size={15} className="text-gray-500"/>
            <span className="font-semibold text-sm text-gray-700">{g.label}</span>
            <span className="ml-auto text-xs text-gray-400">
              {g.items.reduce((s, item) =>
                s + REQS_POR_TIPO[g.entidadTipo].filter(t => getMedida(g.entidadTipo, item.id, t)).length, 0)
              } / {g.items.length * REQS_POR_TIPO[g.entidadTipo].length}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {g.items.map(item => (
              <div key={item.id} className="px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-800">{item.nombre}</span>
                  {item.cargo && <span className="badge badge-blue">{item.cargo}</span>}
                  {item.tipoPoder && <span className="badge badge-purple">{item.tipoPoder}</span>}
                </div>
                <div className="space-y-2 pl-2">
                  {REQS_POR_TIPO[g.entidadTipo].map(tipo => {
                    const med = getMedida(g.entidadTipo, item.id, tipo);
                    const vencido = med?.fechaVencimiento && new Date(med.fechaVencimiento) < new Date();
                    return (
                      <div key={tipo} className="flex items-center gap-3">
                        {med
                          ? <CheckCircle2 size={15} className={`shrink-0 ${vencido ? 'text-amber-400' : 'text-green-500'}`}/>
                          : <XCircle size={15} className="shrink-0 text-red-400"/>}
                        <span className="text-sm text-gray-700 flex-1">{LABEL_MEDIDA[tipo]}</span>
                        {med ? (
                          <div className="flex items-center gap-2 shrink-0">
                            {tipo === 'DECLARACION_JURADA_NOMINAL' && med.capacitacionHoras && (
                              <span className="text-xs text-green-600 font-medium">{med.capacitacionHoras}h capacitación</span>
                            )}
                            {med.fechaVencimiento && (
                              <span className={`text-xs ${vencido ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                Vence {formatFecha(med.fechaVencimiento)}
                              </span>
                            )}
                            {med.archivo && (
                              <button className="text-brand-600 hover:text-brand-800" onClick={() => handleDescargar(med)} title="Descargar">
                                <Download size={13}/>
                              </button>
                            )}
                            <button className="text-red-400 hover:text-red-600" onClick={() => setDelMedId(med.id)} title="Eliminar">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        ) : (
                          <button className="btn-secondary btn-sm flex items-center gap-1 shrink-0"
                            onClick={() => openUpload(tipo, g.entidadTipo, item.id, item.nombre)}>
                            <Plus size={12}/> Registrar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal registrar medida */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar medida mitigadora" size="lg">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
            <span className="font-medium">{LABEL_MEDIDA[uploadForm.tipo]}</span>
            <span className="text-gray-500"> — {uploadForm.entidadNombre}</span>
          </div>

          {uploadForm.tipo === 'DECLARACION_JURADA_NOMINAL' && (
            <div>
              <label className="label">Horas de capacitación * <span className="text-red-500">(mínimo 8 horas — Guía JD-02-2022)</span></label>
              <input type="number" min="8" className="input" value={uploadForm.capacitacionHoras}
                onChange={e => uf('capacitacionHoras', e.target.value)}/>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha de emisión</label>
              <input type="date" className="input" value={uploadForm.fechaEmision} onChange={e => uf('fechaEmision', e.target.value)}/>
            </div>
            <div>
              <label className="label">Fecha de vencimiento</label>
              <input type="date" className="input" value={uploadForm.fechaVencimiento} onChange={e => uf('fechaVencimiento', e.target.value)}/>
            </div>
          </div>

          <div>
            <label className="label">Documento adjunto <span className="text-gray-400 font-normal">(PDF, JPG, PNG — opcional)</span></label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="input"
              onChange={e => setUploadFile(e.target.files[0])}/>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea className="input resize-none" rows={2} placeholder="Observaciones adicionales..."
              value={uploadForm.notas} onChange={e => uf('notas', e.target.value)}/>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleGuardar} disabled={saving}>
              {saving && <Spinner size="sm"/>} Guardar medida
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!delMedId} onClose={() => setDelMedId(null)} onConfirm={handleEliminar}
        title="Eliminar medida" message="¿Confirmar eliminación de esta medida mitigadora?"/>
    </div>
  );
}

// ─── TabRiesgo ────────────────────────────────────────────────────────────────
const FACTORES_RIESGO = [
  { id: 'jurisdiccion_alto',   label: 'Jurisdicción de alto riesgo (lista GAFI / lista gris)' },
  { id: 'sector_alto',         label: 'Sector económico de alto riesgo (inmuebles, activos virtuales, etc.)' },
  { id: 'estructura_compleja', label: 'Estructura de propiedad compleja o en capas' },
  { id: 'bf_pep',              label: 'Beneficiario final es PEP (persona políticamente expuesta)' },
  { id: 'servicios_nominales', label: 'Usa servicios nominales (director / accionista / apoderado nominal)' },
  { id: 'bf_extranjero',       label: 'Beneficiario final residente en el extranjero' },
  { id: 'relacion_nueva',      label: 'Relación nueva (menos de 1 año)' },
  { id: 'actividad_inusual',   label: 'Actividad inusual o inconsistente con el perfil declarado' },
  { id: 'alto_volumen',        label: 'Alto volumen de transacciones o movimientos de capital' },
  { id: 'historia_negativa',   label: 'Historial negativo: multas, investigaciones, alertas previas' },
];

const COLOR_RIESGO = {
  BAJO:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200',  icon: ShieldCheck  },
  MEDIO: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-200',  icon: AlertTriangle },
  ALTO:  { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200',    icon: ShieldAlert  },
};

function TabRiesgo({ id, sociedad, onSociedadUpdate }) {
  const toast = useToast();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [delEvalId, setDelEvalId]       = useState(null);
  const [form, setForm]                 = useState({
    nivelRiesgo: 'BAJO', justificacion: '', factoresRiesgo: [], proximaRevision: '',
  });
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/sociedades/${id}/riesgo`);
    setEvaluaciones(data); setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function toggleFactor(factorId) {
    setForm(p => ({
      ...p,
      factoresRiesgo: p.factoresRiesgo.includes(factorId)
        ? p.factoresRiesgo.filter(x => x !== factorId)
        : [...p.factoresRiesgo, factorId],
    }));
  }

  function nivelSugerido() {
    const n = form.factoresRiesgo.length;
    if (n >= 3 || form.factoresRiesgo.includes('bf_pep') || form.factoresRiesgo.includes('historia_negativa')) return 'ALTO';
    if (n >= 1) return 'MEDIO';
    return 'BAJO';
  }

  function openModal() {
    const nivel = sociedad.nivelRiesgo || 'BAJO';
    const anios = nivel === 'ALTO' ? 1 : nivel === 'MEDIO' ? 2 : 3;
    const fecha = new Date(); fecha.setFullYear(fecha.getFullYear() + anios);
    setForm({ nivelRiesgo: nivel, justificacion: '', factoresRiesgo: [], proximaRevision: fecha.toISOString().slice(0,10) });
    setShowModal(true);
  }

  function handleNivelChange(nivel) {
    const anios = nivel === 'ALTO' ? 1 : nivel === 'MEDIO' ? 2 : 3;
    const fecha = new Date(); fecha.setFullYear(fecha.getFullYear() + anios);
    setForm(p => ({ ...p, nivelRiesgo: nivel, proximaRevision: fecha.toISOString().slice(0,10) }));
  }

  async function handleGuardar() {
    if (!form.justificacion.trim()) return toast.error('La justificación es requerida.');
    setSaving(true);
    try {
      await api.post(`/sociedades/${id}/riesgo`, form);
      toast.success('Evaluación registrada'); setShowModal(false); cargar();
      onSociedadUpdate();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  }

  async function handleEliminar() {
    try {
      await api.delete(`/sociedades/${id}/riesgo/${delEvalId}`);
      toast.success('Evaluación eliminada'); setDelEvalId(null); cargar();
      onSociedadUpdate();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  const nivelActual = sociedad.nivelRiesgo || null;
  const colorActual = nivelActual ? COLOR_RIESGO[nivelActual] : null;
  const IconActual  = colorActual?.icon || ShieldCheck;
  const vencida     = sociedad.proximaRevisionRiesgo && new Date(sociedad.proximaRevisionRiesgo) < new Date();
  const sugerido    = nivelSugerido();

  if (loading) return <PageSpinner />;
  return (
    <div className="space-y-6">

      {/* Estado actual */}
      {nivelActual ? (
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${colorActual.bg} ${colorActual.border}`}>
          <IconActual size={28} className={colorActual.text}/>
          <div className="flex-1">
            <div className={`text-lg font-bold ${colorActual.text}`}>Riesgo {nivelActual}</div>
            <div className="text-sm text-gray-600 mt-0.5">
              Próxima revisión: <span className={`font-medium ${vencida ? 'text-red-700' : 'text-gray-800'}`}>
                {formatFecha(sociedad.proximaRevisionRiesgo)}{vencida && ' — VENCIDA'}
              </span>
            </div>
          </div>
          <button className="btn-primary btn-sm" onClick={openModal}><Plus size={14}/> Nueva evaluación</button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
          <ShieldAlert size={28} className="mx-auto text-gray-300 mb-2"/>
          <p className="text-sm text-gray-500 mb-4">Esta sociedad no tiene evaluación de riesgo registrada.</p>
          <button className="btn-primary" onClick={openModal}><Plus size={14}/> Registrar evaluación inicial</button>
        </div>
      )}

      {/* Alerta de revisión vencida */}
      {vencida && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-600 shrink-0"/>
          <p className="text-sm text-red-700 font-medium">
            La revisión de riesgo está vencida. La Guía JD-02-2022 exige revisión cada {nivelActual === 'ALTO' ? '1 año' : nivelActual === 'MEDIO' ? '2 años' : '3 años'} para riesgo {nivelActual?.toLowerCase()}.
          </p>
        </div>
      )}

      {/* Historial */}
      {evaluaciones.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Historial de evaluaciones</p>
          <div className="space-y-3">
            {evaluaciones.map((ev, idx) => {
              const c = COLOR_RIESGO[ev.nivelRiesgo];
              const factores = ev.factoresRiesgo ? JSON.parse(ev.factoresRiesgo) : [];
              return (
                <div key={ev.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{ev.nivelRiesgo}</span>
                    {idx === 0 && <span className="text-xs text-brand-600 font-medium">• Evaluación actual</span>}
                    <span className="text-xs text-gray-400 ml-auto">{formatFecha(ev.creadoEn)}</span>
                    {ev.evaluadoPor && <span className="text-xs text-gray-400">por {ev.evaluadoPor.nombre}</span>}
                    <button className="text-red-400 hover:text-red-600 ml-2" onClick={() => setDelEvalId(ev.id)}><Trash2 size={13}/></button>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-sm text-gray-700">{ev.justificacion}</p>
                    {factores.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {factores.map(fid => {
                          const factor = FACTORES_RIESGO.find(x => x.id === fid);
                          return factor ? (
                            <span key={fid} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{factor.label}</span>
                          ) : null;
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-400">Próxima revisión: {formatFecha(ev.proximaRevision)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal nueva evaluación */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva evaluación de riesgo" size="lg">
        <div className="space-y-5">
          {/* Nivel */}
          <div>
            <label className="label mb-2">Nivel de riesgo BC/FT *</label>
            <div className="grid grid-cols-3 gap-3">
              {['BAJO','MEDIO','ALTO'].map(nivel => {
                const c = COLOR_RIESGO[nivel];
                const Ic = c.icon;
                return (
                  <button key={nivel} type="button"
                    onClick={() => handleNivelChange(nivel)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-colors cursor-pointer
                      ${form.nivelRiesgo === nivel ? `${c.bg} ${c.border} ${c.text}` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                    <Ic size={20}/>
                    <span className="text-sm font-semibold">{nivel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Factores */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label">Factores de riesgo identificados</label>
              {form.factoresRiesgo.length > 0 && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COLOR_RIESGO[sugerido].bg} ${COLOR_RIESGO[sugerido].text}`}>
                  Sugerido: {sugerido}
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {FACTORES_RIESGO.map(factor => (
                <label key={factor.id} className="flex items-start gap-2 text-sm cursor-pointer group">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 accent-brand-600 shrink-0"
                    checked={form.factoresRiesgo.includes(factor.id)}
                    onChange={() => toggleFactor(factor.id)}/>
                  <span className="text-gray-700 group-hover:text-gray-900">{factor.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Justificación */}
          <div>
            <label className="label">Justificación * <span className="text-gray-400 font-normal">(debe documentar el criterio del agente)</span></label>
            <textarea className="input resize-none" rows={4}
              placeholder="Describa los motivos de la calificación de riesgo y el análisis realizado..."
              value={form.justificacion} onChange={e => f('justificacion', e.target.value)}/>
          </div>

          {/* Próxima revisión */}
          <div>
            <label className="label">Próxima revisión</label>
            <input type="date" className="input" value={form.proximaRevision} onChange={e => f('proximaRevision', e.target.value)}/>
            <p className="text-xs text-gray-400 mt-1">
              Guía JD-02-2022: riesgo BAJO = 3 años · MEDIO = 2 años · ALTO = 1 año
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleGuardar} disabled={saving}>
              {saving && <Spinner size="sm"/>} Guardar evaluación
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!delEvalId} onClose={() => setDelEvalId(null)} onConfirm={handleEliminar}
        title="Eliminar evaluación" message="¿Eliminar esta evaluación? El riesgo activo pasará a la evaluación anterior."/>
    </div>
  );
}

// ─── TabFlujos ────────────────────────────────────────────────────────────────
const DOCS_ENTREGA = [
  'Pacto Social / Escritura de constitución',
  'Libro de actas',
  'Libro de registro de accionistas',
  'Certificados de acciones vigentes',
  'Expediente de debida diligencia',
  'Declaración RUBF (Ley 52 de 2016)',
  'Evaluaciones de riesgo BC/FT',
  'Poderes y mandatos vigentes',
  'Obligaciones fiscales al día',
  'Contratos y acuerdos vigentes',
  'Contratos con nominales e identificación de BF',
];

const COLOR_EVENTO = {
  CAMBIO_AGENTE: { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   icon: ArrowRightLeft },
  DISOLUCION:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    icon: Clock },
  LIQUIDACION:   { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: Clock },
  FUSION:        { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: GitBranch },
  ESCISION:      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: GitBranch },
  OTRO:          { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700',   icon: File },
};

const LABEL_TIPO = {
  CAMBIO_AGENTE: 'Cambio de agente residente',
  DISOLUCION:    'Disolución',
  LIQUIDACION:   'Liquidación',
  FUSION:        'Fusión',
  ESCISION:      'Escisión',
  OTRO:          'Otro evento',
};

function TabFlujos({ id, sociedad, onSociedadUpdate }) {
  const toast = useToast();
  const [eventos, setEventos]   = useState([]);
  const [agentes, setAgentes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalTipo, setModalTipo] = useState(null); // 'CAMBIO_AGENTE' | 'DISOLUCION' | null
  const [delEveId, setDelEveId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({});
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cargar = useCallback(async () => {
    setLoading(true);
    const [eveR, agR] = await Promise.all([
      api.get(`/sociedades/${id}/eventos`),
      api.get('/agentes'),
    ]);
    setEventos(eveR.data);
    setAgentes(agR.data.filter(a => a.activo));
    setLoading(false);
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  function openCambioAgente() {
    setForm({
      tipo: 'CAMBIO_AGENTE',
      estado: 'COMPLETADO',
      fecha: new Date().toISOString().slice(0,10),
      agenteAnteriorNombre: sociedad.agente?.nombre || '',
      agenteNuevoId: '',
      agenteNuevoNombre: '',
      documentosEntregados: [],
      descripcion: '',
      notas: '',
    });
    setUploadFile(null);
    setModalTipo('CAMBIO_AGENTE');
  }

  function openDisolucion() {
    setForm({
      tipo: 'DISOLUCION',
      estado: 'COMPLETADO',
      fecha: new Date().toISOString().slice(0,10),
      motivoDisolucion: '',
      descripcion: '',
      notas: '',
    });
    setUploadFile(null);
    setModalTipo('DISOLUCION');
  }

  function toggleDoc(doc) {
    setForm(p => ({
      ...p,
      documentosEntregados: p.documentosEntregados.includes(doc)
        ? p.documentosEntregados.filter(d => d !== doc)
        : [...p.documentosEntregados, doc],
    }));
  }

  async function handleGuardar() {
    if (!form.fecha) return toast.error('La fecha es requerida.');
    if (form.tipo === 'CAMBIO_AGENTE' && form.estado === 'COMPLETADO' && !form.agenteNuevoId) {
      return toast.error('Selecciona el nuevo agente para completar el cambio.');
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('tipo', form.tipo);
      fd.append('estado', form.estado);
      fd.append('fecha', form.fecha);
      if (form.descripcion) fd.append('descripcion', form.descripcion);
      if (form.agenteAnteriorNombre) fd.append('agenteAnteriorNombre', form.agenteAnteriorNombre);
      if (form.agenteNuevoId) {
        fd.append('agenteNuevoId', form.agenteNuevoId);
        const ag = agentes.find(a => a.id === form.agenteNuevoId);
        if (ag) fd.append('agenteNuevoNombre', ag.nombre);
      }
      if (form.documentosEntregados?.length) {
        form.documentosEntregados.forEach(d => fd.append('documentosEntregados', d));
      }
      if (form.motivoDisolucion) fd.append('motivoDisolucion', form.motivoDisolucion);
      if (form.notas) fd.append('notas', form.notas);
      if (uploadFile) fd.append('archivo', uploadFile);

      await api.post(`/sociedades/${id}/eventos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Evento registrado'); setModalTipo(null); cargar(); onSociedadUpdate();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  }

  async function handleDescargar(eve) {
    try {
      const { data: blob } = await api.get(`/sociedades/${id}/eventos/${eve.id}/descargar`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = eve.nombreArchivo;
      a.click();
    } catch(e) { toast.error('Error al descargar'); }
  }

  async function handleEliminar() {
    try {
      await api.delete(`/sociedades/${id}/eventos/${delEveId}`);
      toast.success('Evento eliminado'); setDelEveId(null); cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  const esDisuelta   = sociedad.estado === 'DISUELTA';
  const retencion    = sociedad.fechaVencimientoRetension;
  const retVencida   = retencion && new Date(retencion) < new Date();
  const diasRetension = retencion
    ? Math.ceil((new Date(retencion) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">

      {/* Banner retención documental si está disuelta */}
      {esDisuelta && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${retVencida ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}`}>
          <Clock size={20} className={`shrink-0 mt-0.5 ${retVencida ? 'text-red-600' : 'text-amber-600'}`}/>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${retVencida ? 'text-red-800' : 'text-amber-800'}`}>
              Sociedad disuelta — Período de retención documental (Ley 254 de 2021)
            </p>
            {retencion ? (
              <p className={`text-sm mt-1 ${retVencida ? 'text-red-700' : 'text-amber-700'}`}>
                {retVencida
                  ? `El período de retención de 5 años venció el ${formatFecha(retencion)}. Los documentos pueden ser destruidos según protocolo.`
                  : `Los documentos deben conservarse hasta el ${formatFecha(retencion)} (${diasRetension} días restantes).`}
              </p>
            ) : (
              <p className="text-sm mt-1 text-amber-700">Registra la disolución para calcular el plazo de retención de 5 años.</p>
            )}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      {!esDisuelta && (
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={openCambioAgente}>
            <ArrowRightLeft size={15}/> Cambio de agente residente
          </button>
          <button className="btn-danger flex items-center gap-2" onClick={openDisolucion}>
            <Clock size={15}/> Registrar disolución
          </button>
        </div>
      )}

      {/* Historial de eventos */}
      {eventos.length === 0 ? (
        <EmptyState message="Sin eventos corporativos registrados." />
      ) : (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Historial de eventos</p>
          <div className="space-y-4">
            {eventos.map(eve => {
              const c = COLOR_EVENTO[eve.tipo] || COLOR_EVENTO.OTRO;
              const Ic = c.icon;
              const docs = eve.documentosEntregados ? JSON.parse(eve.documentosEntregados) : [];
              return (
                <div key={eve.id} className={`rounded-xl border ${c.border} overflow-hidden`}>
                  <div className={`px-4 py-3 flex items-center gap-3 ${c.bg}`}>
                    <Ic size={16} className={c.text}/>
                    <span className={`font-semibold text-sm ${c.text}`}>{LABEL_TIPO[eve.tipo]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto
                      ${eve.estado === 'COMPLETADO' ? 'bg-green-100 text-green-700'
                        : eve.estado === 'CANCELADO' ? 'bg-gray-100 text-gray-600'
                        : 'bg-amber-100 text-amber-700'}`}>
                      {eve.estado}
                    </span>
                    <span className="text-xs text-gray-500">{formatFecha(eve.fecha)}</span>
                    {eve.registradoPor && <span className="text-xs text-gray-400">por {eve.registradoPor.nombre}</span>}
                    <div className="flex items-center gap-2 ml-2">
                      {eve.archivo && (
                        <button className="text-brand-600 hover:text-brand-800" onClick={() => handleDescargar(eve)} title="Descargar acta">
                          <Download size={14}/>
                        </button>
                      )}
                      <button className="text-red-400 hover:text-red-600" onClick={() => setDelEveId(eve.id)} title="Eliminar">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {eve.tipo === 'CAMBIO_AGENTE' && (
                      <div className="text-sm text-gray-700">
                        <span className="text-gray-500">De:</span> <strong>{eve.agenteAnteriorNombre || '—'}</strong>
                        {' → '}
                        <span className="text-gray-500">A:</span> <strong>{eve.agenteNuevoNombre || '—'}</strong>
                      </div>
                    )}
                    {eve.tipo === 'DISOLUCION' && eve.motivoDisolucion && (
                      <p className="text-sm text-gray-700"><span className="text-gray-500">Motivo:</span> {eve.motivoDisolucion}</p>
                    )}
                    {eve.descripcion && <p className="text-sm text-gray-600">{eve.descripcion}</p>}
                    {docs.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Documentos entregados ({docs.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {docs.map(d => <span key={d} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{d}</span>)}
                        </div>
                      </div>
                    )}
                    {eve.fechaVencimientoRetension && (
                      <p className="text-xs text-gray-400">Retención hasta: <span className="font-medium">{formatFecha(eve.fechaVencimientoRetension)}</span></p>
                    )}
                    {eve.notas && <p className="text-xs text-gray-400 italic">{eve.notas}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Cambio de Agente */}
      <Modal open={modalTipo === 'CAMBIO_AGENTE'} onClose={() => setModalTipo(null)}
        title="Cambio de agente residente" size="xl">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Antes de completar el cambio, el agente saliente debe entregar todos los documentos al nuevo agente.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha del cambio *</label>
              <input type="date" className="input" value={form.fecha||''} onChange={e=>f('fecha',e.target.value)}/>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.estado||'COMPLETADO'} onChange={e=>f('estado',e.target.value)}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="COMPLETADO">Completado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Agente saliente</label>
              <input className="input" value={form.agenteAnteriorNombre||''} onChange={e=>f('agenteAnteriorNombre',e.target.value)} placeholder="Nombre del agente actual"/>
            </div>
            <div>
              <label className="label">Nuevo agente *</label>
              <select className="input" value={form.agenteNuevoId||''} onChange={e=>f('agenteNuevoId',e.target.value)}>
                <option value="">— Seleccionar —</option>
                {agentes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label mb-2">Documentos entregados</label>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              {DOCS_ENTREGA.map(doc => (
                <label key={doc} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-brand-600"
                    checked={(form.documentosEntregados||[]).includes(doc)}
                    onChange={() => toggleDoc(doc)}/>
                  <span className="text-gray-700">{doc}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">{(form.documentosEntregados||[]).length} de {DOCS_ENTREGA.length} documentos seleccionados</p>
          </div>

          <div>
            <label className="label">Acta de entrega <span className="text-gray-400 font-normal">(PDF — opcional)</span></label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input" onChange={e=>setUploadFile(e.target.files[0])}/>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea className="input resize-none" rows={2} value={form.notas||''} onChange={e=>f('notas',e.target.value)}/>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalTipo(null)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleGuardar} disabled={saving}>
              {saving && <Spinner size="sm"/>} Registrar cambio
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Disolución */}
      <Modal open={modalTipo === 'DISOLUCION'} onClose={() => setModalTipo(null)}
        title="Registrar disolución" size="lg">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
            Al registrar la disolución como completada, la sociedad cambiará a estado DISUELTA y se calculará automáticamente el plazo de retención documental de 5 años (Ley 254 de 2021).
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha de disolución *</label>
              <input type="date" className="input" value={form.fecha||''} onChange={e=>f('fecha',e.target.value)}/>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.estado||'COMPLETADO'} onChange={e=>f('estado',e.target.value)}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="COMPLETADO">Completado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Motivo de la disolución</label>
            <textarea className="input resize-none" rows={3}
              placeholder="Ej: Decisión de los accionistas, vencimiento del plazo, etc."
              value={form.motivoDisolucion||''} onChange={e=>f('motivoDisolucion',e.target.value)}/>
          </div>

          <div>
            <label className="label">Acta o constancia <span className="text-gray-400 font-normal">(PDF — opcional)</span></label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input" onChange={e=>setUploadFile(e.target.files[0])}/>
          </div>

          <div>
            <label className="label">Notas adicionales</label>
            <input className="input" value={form.notas||''} onChange={e=>f('notas',e.target.value)}/>
          </div>

          {form.fecha && form.estado === 'COMPLETADO' && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
              Retención documental hasta: <strong>
                {new Date(new Date(form.fecha).setFullYear(new Date(form.fecha).getFullYear()+5)).toLocaleDateString('es-PA')}
              </strong> (5 años desde la fecha de disolución)
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalTipo(null)}>Cancelar</button>
            <button className="btn-danger flex items-center gap-2" onClick={handleGuardar} disabled={saving}>
              {saving && <Spinner size="sm"/>} Registrar disolución
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!delEveId} onClose={() => setDelEveId(null)} onConfirm={handleEliminar}
        title="Eliminar evento" message="¿Confirmar eliminación de este evento corporativo?"/>
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
    apoderados:    () => <TabApoderados id={id} />,
    acciones:      () => <TabAcciones id={id} />,
    beneficiarios: () => <TabBeneficiarios id={id} />,
    obligaciones:  () => <TabObligaciones id={id} />,
    actas:         () => <TabActas id={id} />,
    documentos:    () => <TabDocumentos id={id} />,
    consultas:     () => <TabConsultas id={id} />,
    expediente:    () => <TabExpediente id={id} />,
    riesgo:        () => <TabRiesgo id={id} sociedad={sociedad} onSociedadUpdate={cargar} />,
    nominales:     () => <TabNominales id={id} sociedad={sociedad} />,
    flujos:        () => <TabFlujos id={id} sociedad={sociedad} onSociedadUpdate={cargar} />,
    completitud:   () => <TabCompletitud id={id} />,
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

      {/* Banner período de prueba */}
      {sociedad.planCliente === 'TRIAL' && (() => {
        const dias = sociedad.fechaVencimiento
          ? Math.ceil((new Date(sociedad.fechaVencimiento) - Date.now()) / 86400000)
          : null;
        const vencido = dias != null && dias < 0;
        return (
          <div className={`mb-4 rounded-lg border px-4 py-3 flex items-center gap-3
            ${vencido ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <AlertTriangle size={16} className={vencido ? 'text-red-500 shrink-0' : 'text-amber-500 shrink-0'} />
            <p className={`text-sm flex-1 ${vencido ? 'text-red-700' : 'text-amber-700'}`}>
              {vencido
                ? 'El período de prueba ha vencido. Active un plan para mantener el acceso.'
                : `Período de prueba — ${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}.`}
            </p>
            <Link to="/suscripciones" className={`text-xs font-semibold underline whitespace-nowrap
              ${vencido ? 'text-red-700' : 'text-amber-700'}`}>
              Activar plan →
            </Link>
          </div>
        );
      })()}

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

      <Modal open={showEdit} onClose={()=>setShowEdit(false)} title="Editar sociedad" size="xl">
        <FormSociedad initial={editForm} onSave={handleEdit} />
      </Modal>
      <ConfirmDialog open={showDel} onClose={()=>setShowDel(false)} onConfirm={handleDelete}
        loading={delLoading} title="Eliminar sociedad"
        message={`¿Eliminar "${sociedad.nombre}"? Esta acción no se puede deshacer.`} />
    </div>
  );
}
