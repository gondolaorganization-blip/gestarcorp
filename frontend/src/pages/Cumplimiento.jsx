import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import Spinner from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatFecha } from '../utils/format.js';
import {
  BookOpen, GraduationCap, ClipboardCheck, FileCheck,
  AlertTriangle, CheckCircle2, Plus, Trash2, Download,
} from 'lucide-react';

const ANIO_ACTUAL = new Date().getFullYear();

const TABS = [
  { id: 'capacitaciones', label: 'Capacitaciones',           icon: GraduationCap },
  { id: 'manual',         label: 'Manual de Prevención',     icon: BookOpen },
  { id: 'evaluaciones',   label: 'Evaluaciones Independientes', icon: ClipboardCheck },
  { id: 'declaraciones',  label: 'Declaraciones Juradas',    icon: FileCheck },
];

// ─── Alerta de cumplimiento ───────────────────────────────────────────────────
function AlertaCumplimiento({ ok, texto, textoOk }) {
  return ok ? (
    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
      <CheckCircle2 size={15} className="shrink-0"/>
      {textoOk}
    </div>
  ) : (
    <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <AlertTriangle size={15} className="shrink-0"/>
      {texto}
    </div>
  );
}

// ─── TabCapacitaciones ────────────────────────────────────────────────────────
function TabCapacitaciones({ horasAnio, onRefresh }) {
  const toast = useToast();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [delId, setDelId]     = useState(null);
  const [file, setFile]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    fecha: new Date().toISOString().slice(0,10),
    horas: '8', temas: '', proveedor: '', tipo: 'EXTERNA', participantes: '', notas: '',
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/cumplimiento/capacitaciones');
    setItems(data); setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function handleGuardar() {
    if (!form.fecha || !form.horas || !form.temas.trim())
      return toast.error('Fecha, horas y temas son requeridos.');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v); });
      if (file) fd.append('archivo', file);
      await api.post('/cumplimiento/capacitaciones', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Capacitación registrada'); setShowModal(false); setFile(null);
      cargar(); onRefresh();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  }

  async function handleEliminar() {
    try {
      await api.delete(`/cumplimiento/capacitaciones/${delId}`);
      toast.success('Eliminado'); setDelId(null); cargar(); onRefresh();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function handleDescargar(item) {
    try {
      const { data: blob } = await api.get(`/cumplimiento/capacitaciones/${item.id}/descargar`, { responseType: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = item.nombreArchivo; a.click();
    } catch(e) { toast.error('Error al descargar'); }
  }

  const horasAnioActual = items.filter(i => new Date(i.fecha).getFullYear() === ANIO_ACTUAL)
    .reduce((s, i) => s + i.horas, 0);

  if (loading) return <PageSpinner />;
  return (
    <div className="space-y-4">
      <AlertaCumplimiento
        ok={horasAnioActual >= 8}
        texto={`${horasAnioActual}h registradas en ${ANIO_ACTUAL}. Faltan ${8 - horasAnioActual}h para cumplir el mínimo de 8 horas (Guía JD-02-2022 Art. 23).`}
        textoOk={`${horasAnioActual}h acumuladas en ${ANIO_ACTUAL} — mínimo de 8 horas cumplido.`}
      />

      <div className="flex justify-end">
        <button className="btn-primary btn-sm flex items-center gap-1" onClick={() => { setForm({ fecha: new Date().toISOString().slice(0,10), horas:'8', temas:'', proveedor:'', tipo:'EXTERNA', participantes:'', notas:'' }); setFile(null); setShowModal(true); }}>
          <Plus size={14}/> Nueva capacitación
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Sin capacitaciones registradas</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="th">Fecha</th><th className="th">Horas</th>
              <th className="th">Temas</th><th className="th">Proveedor</th>
              <th className="th">Tipo</th><th className="th"/>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="td">{formatFecha(i.fecha)}</td>
                  <td className="td font-semibold text-brand-700">{i.horas}h</td>
                  <td className="td max-w-xs truncate">{i.temas}</td>
                  <td className="td text-gray-500">{i.proveedor || '—'}</td>
                  <td className="td"><span className="badge badge-gray">{i.tipo}</span></td>
                  <td className="td">
                    <div className="flex gap-2">
                      {i.archivo && <button className="text-brand-600 hover:text-brand-800" onClick={() => handleDescargar(i)}><Download size={14}/></button>}
                      <button className="text-red-400 hover:text-red-600" onClick={() => setDelId(i.id)}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva capacitación" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Fecha *</label><input type="date" className="input" value={form.fecha} onChange={e=>f('fecha',e.target.value)}/></div>
            <div><label className="label">Horas *</label><input type="number" min="1" className="input" value={form.horas} onChange={e=>f('horas',e.target.value)}/></div>
          </div>
          <div><label className="label">Temas cubiertos *</label><textarea className="input resize-none" rows={2} value={form.temas} onChange={e=>f('temas',e.target.value)} placeholder="Ej: BC/FT, RUBF, Ley 23, debida diligencia..."/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Proveedor / Institución</label><input className="input" value={form.proveedor} onChange={e=>f('proveedor',e.target.value)} placeholder="Ej: SSNF, CONVIASA, externo..."/></div>
            <div><label className="label">Modalidad</label>
              <select className="input" value={form.tipo} onChange={e=>f('tipo',e.target.value)}>
                {['INTERNA','EXTERNA','VIRTUAL','PRESENCIAL'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Participantes</label><input className="input" value={form.participantes} onChange={e=>f('participantes',e.target.value)} placeholder="Nombre de los asistentes..."/></div>
          <div><label className="label">Certificado / Constancia <span className="text-gray-400 font-normal">(PDF, JPG — opcional)</span></label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input" onChange={e=>setFile(e.target.files[0])}/></div>
          <div><label className="label">Notas</label><input className="input" value={form.notas} onChange={e=>f('notas',e.target.value)}/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleGuardar} disabled={saving}>
              {saving && <Spinner size="sm"/>} Guardar
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleEliminar}
        title="Eliminar capacitación" message="¿Confirmar eliminación?"/>
    </div>
  );
}

// ─── TabManual ────────────────────────────────────────────────────────────────
function TabManual({ onRefresh }) {
  const toast = useToast();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [delId, setDelId]     = useState(null);
  const [file, setFile]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    version: '', fechaAprobacion: new Date().toISOString().slice(0,10), fechaProximaRevision: '', notas: '',
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/cumplimiento/manuales');
    setItems(data); setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const manualVigente = items.find(m => m.estado === 'VIGENTE');
  const revisionVencida = manualVigente?.fechaProximaRevision && new Date(manualVigente.fechaProximaRevision) < new Date();

  async function handleGuardar() {
    if (!form.version.trim() || !form.fechaAprobacion) return toast.error('Versión y fecha de aprobación son requeridos.');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v); });
      if (file) fd.append('archivo', file);
      await api.post('/cumplimiento/manuales', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Manual registrado'); setShowModal(false); setFile(null);
      cargar(); onRefresh();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  }

  async function handleEliminar() {
    try {
      await api.delete(`/cumplimiento/manuales/${delId}`);
      toast.success('Eliminado'); setDelId(null); cargar(); onRefresh();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function handleDescargar(item) {
    try {
      const { data: blob } = await api.get(`/cumplimiento/manuales/${item.id}/descargar`, { responseType: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = item.nombreArchivo; a.click();
    } catch(e) { toast.error('Error al descargar'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div className="space-y-4">
      {!manualVigente ? (
        <AlertaCumplimiento ok={false} texto="No hay un Manual de Prevención de BC/FT vigente. La Guía JD-02-2022 exige mantener uno actualizado."/>
      ) : revisionVencida ? (
        <AlertaCumplimiento ok={false} texto={`El manual vigente (v${manualVigente.version}) debía revisarse el ${formatFecha(manualVigente.fechaProximaRevision)}. Actualízalo.`}/>
      ) : (
        <AlertaCumplimiento ok textoOk={`Manual v${manualVigente.version} vigente. ${manualVigente.fechaProximaRevision ? `Próxima revisión: ${formatFecha(manualVigente.fechaProximaRevision)}` : ''}`}/>
      )}

      <div className="flex justify-end">
        <button className="btn-primary btn-sm flex items-center gap-1" onClick={() => { setForm({ version:'', fechaAprobacion: new Date().toISOString().slice(0,10), fechaProximaRevision:'', notas:'' }); setFile(null); setShowModal(true); }}>
          <Plus size={14}/> Nueva versión
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Sin versiones registradas</div>
      ) : (
        <div className="space-y-3">
          {items.map(i => (
            <div key={i.id} className={`rounded-xl border p-4 flex items-center gap-4 ${i.estado === 'VIGENTE' ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">Versión {i.version}</span>
                  <span className={`badge ${i.estado === 'VIGENTE' ? 'badge-green' : i.estado === 'EN_REVISION' ? 'badge-amber' : 'badge-gray'}`}>{i.estado}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Aprobado: {formatFecha(i.fechaAprobacion)}
                  {i.fechaProximaRevision && ` · Revisión: ${formatFecha(i.fechaProximaRevision)}`}
                </div>
                {i.notas && <p className="text-xs text-gray-400 mt-1 italic">{i.notas}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {i.archivo && <button className="text-brand-600 hover:text-brand-800" onClick={() => handleDescargar(i)} title="Descargar"><Download size={15}/></button>}
                <button className="text-red-400 hover:text-red-600" onClick={() => setDelId(i.id)}><Trash2 size={15}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar nueva versión del Manual">
        <div className="space-y-3">
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Al guardar, la versión anterior pasará a estado DESACTUALIZADO.
          </p>
          <div><label className="label">Versión *</label><input className="input" placeholder="Ej: 2.0, 2024-1, v3..." value={form.version} onChange={e=>f('version',e.target.value)}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Fecha de aprobación *</label><input type="date" className="input" value={form.fechaAprobacion} onChange={e=>f('fechaAprobacion',e.target.value)}/></div>
            <div><label className="label">Próxima revisión</label><input type="date" className="input" value={form.fechaProximaRevision} onChange={e=>f('fechaProximaRevision',e.target.value)}/></div>
          </div>
          <div><label className="label">Documento <span className="text-gray-400 font-normal">(PDF — opcional)</span></label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input" onChange={e=>setFile(e.target.files[0])}/></div>
          <div><label className="label">Notas</label><input className="input" value={form.notas} onChange={e=>f('notas',e.target.value)}/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleGuardar} disabled={saving}>
              {saving && <Spinner size="sm"/>} Guardar
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleEliminar}
        title="Eliminar manual" message="¿Confirmar eliminación de esta versión?"/>
    </div>
  );
}

// ─── TabEvaluaciones ──────────────────────────────────────────────────────────
function TabEvaluaciones({ onRefresh }) {
  const toast = useToast();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [delId, setDelId]     = useState(null);
  const [file, setFile]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    anio: String(ANIO_ACTUAL), evaluador: '', fechaEvaluacion: new Date().toISOString().slice(0,10),
    hallazgos: '', resultado: 'SATISFACTORIO', notas: '',
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/cumplimiento/evaluaciones');
    setItems(data); setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const tieneAnioActual = items.some(i => i.anio === ANIO_ACTUAL);
  const COLOR_RES = { SATISFACTORIO: 'badge-green', CONDICIONADO: 'badge-amber', INSATISFACTORIO: 'badge-red' };

  async function handleGuardar() {
    if (!form.anio || !form.evaluador.trim() || !form.fechaEvaluacion) return toast.error('Año, evaluador y fecha son requeridos.');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v); });
      if (file) fd.append('archivo', file);
      await api.post('/cumplimiento/evaluaciones', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Evaluación registrada'); setShowModal(false); setFile(null);
      cargar(); onRefresh();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  }

  async function handleEliminar() {
    try {
      await api.delete(`/cumplimiento/evaluaciones/${delId}`);
      toast.success('Eliminada'); setDelId(null); cargar(); onRefresh();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function handleDescargar(item) {
    try {
      const { data: blob } = await api.get(`/cumplimiento/evaluaciones/${item.id}/descargar`, { responseType: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = item.nombreArchivo; a.click();
    } catch(e) { toast.error('Error al descargar'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div className="space-y-4">
      <AlertaCumplimiento
        ok={tieneAnioActual}
        texto={`Sin evaluación independiente registrada para ${ANIO_ACTUAL}. La Guía JD-02-2022 Art. 26 exige una evaluación independiente anual.`}
        textoOk={`Evaluación independiente registrada para ${ANIO_ACTUAL}.`}
      />

      <div className="flex justify-end">
        <button className="btn-primary btn-sm flex items-center gap-1" onClick={() => { setForm({ anio:String(ANIO_ACTUAL), evaluador:'', fechaEvaluacion: new Date().toISOString().slice(0,10), hallazgos:'', resultado:'SATISFACTORIO', notas:'' }); setFile(null); setShowModal(true); }}>
          <Plus size={14}/> Nueva evaluación
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Sin evaluaciones registradas</div>
      ) : (
        <div className="space-y-3">
          {items.map(i => (
            <div key={i.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-800">{i.anio}</span>
                <span className={`badge ${COLOR_RES[i.resultado]}`}>{i.resultado}</span>
                <span className="text-xs text-gray-500 ml-auto">{formatFecha(i.fechaEvaluacion)}</span>
                {i.archivo && <button className="text-brand-600 hover:text-brand-800" onClick={() => handleDescargar(i)}><Download size={14}/></button>}
                <button className="text-red-400 hover:text-red-600" onClick={() => setDelId(i.id)}><Trash2 size={14}/></button>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                <span className="text-gray-500">Evaluador:</span> {i.evaluador}
              </div>
              {i.hallazgos && <p className="text-sm text-gray-600 mt-1">{i.hallazgos}</p>}
              {i.notas && <p className="text-xs text-gray-400 italic mt-1">{i.notas}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva evaluación independiente">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Año *</label><input type="number" className="input" value={form.anio} onChange={e=>f('anio',e.target.value)}/></div>
            <div><label className="label">Fecha de evaluación *</label><input type="date" className="input" value={form.fechaEvaluacion} onChange={e=>f('fechaEvaluacion',e.target.value)}/></div>
          </div>
          <div><label className="label">Evaluador / Firma auditora *</label><input className="input" placeholder="Nombre del evaluador independiente..." value={form.evaluador} onChange={e=>f('evaluador',e.target.value)}/></div>
          <div><label className="label">Resultado</label>
            <select className="input" value={form.resultado} onChange={e=>f('resultado',e.target.value)}>
              <option value="SATISFACTORIO">Satisfactorio</option>
              <option value="CONDICIONADO">Condicionado</option>
              <option value="INSATISFACTORIO">Insatisfactorio</option>
            </select>
          </div>
          <div><label className="label">Hallazgos principales</label><textarea className="input resize-none" rows={3} value={form.hallazgos} onChange={e=>f('hallazgos',e.target.value)} placeholder="Resumen de los hallazgos y recomendaciones..."/></div>
          <div><label className="label">Informe <span className="text-gray-400 font-normal">(PDF — opcional)</span></label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input" onChange={e=>setFile(e.target.files[0])}/></div>
          <div><label className="label">Notas</label><input className="input" value={form.notas} onChange={e=>f('notas',e.target.value)}/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleGuardar} disabled={saving}>
              {saving && <Spinner size="sm"/>} Guardar
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleEliminar}
        title="Eliminar evaluación" message="¿Confirmar eliminación?"/>
    </div>
  );
}

// ─── TabDeclaraciones ─────────────────────────────────────────────────────────
function TabDeclaraciones({ onRefresh }) {
  const toast = useToast();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [delId, setDelId]     = useState(null);
  const [file, setFile]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    anio: String(ANIO_ACTUAL), fechaPresentacion: new Date().toISOString().slice(0,10),
    autoridad: 'Superintendencia de Sujetos No Financieros (SSNF)', estado: 'PRESENTADA', notas: '',
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/cumplimiento/declaraciones');
    setItems(data); setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const tieneAnioActual = items.some(i => i.anio === ANIO_ACTUAL);
  const COLOR_EST = { PRESENTADA: 'badge-blue', CONFIRMADA: 'badge-green', PENDIENTE: 'badge-amber' };

  async function handleGuardar() {
    if (!form.anio || !form.fechaPresentacion) return toast.error('Año y fecha de presentación son requeridos.');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v); });
      if (file) fd.append('archivo', file);
      await api.post('/cumplimiento/declaraciones', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Declaración registrada'); setShowModal(false); setFile(null);
      cargar(); onRefresh();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  }

  async function handleEliminar() {
    try {
      await api.delete(`/cumplimiento/declaraciones/${delId}`);
      toast.success('Eliminada'); setDelId(null); cargar(); onRefresh();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error'); }
  }

  async function handleDescargar(item) {
    try {
      const { data: blob } = await api.get(`/cumplimiento/declaraciones/${item.id}/descargar`, { responseType: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = item.nombreComprobante; a.click();
    } catch(e) { toast.error('Error al descargar'); }
  }

  if (loading) return <PageSpinner />;
  return (
    <div className="space-y-4">
      <AlertaCumplimiento
        ok={tieneAnioActual}
        texto={`Sin declaración jurada registrada para ${ANIO_ACTUAL}. Los agentes residentes deben presentar declaración jurada anual ante la autoridad competente.`}
        textoOk={`Declaración jurada registrada para ${ANIO_ACTUAL}.`}
      />

      <div className="flex justify-end">
        <button className="btn-primary btn-sm flex items-center gap-1" onClick={() => { setForm({ anio:String(ANIO_ACTUAL), fechaPresentacion: new Date().toISOString().slice(0,10), autoridad:'Superintendencia de Sujetos No Financieros (SSNF)', estado:'PRESENTADA', notas:'' }); setFile(null); setShowModal(true); }}>
          <Plus size={14}/> Registrar declaración
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Sin declaraciones registradas</div>
      ) : (
        <div className="space-y-3">
          {items.map(i => (
            <div key={i.id} className="rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-800">{i.anio}</span>
                  <span className={`badge ${COLOR_EST[i.estado]}`}>{i.estado}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Presentada: {formatFecha(i.fechaPresentacion)}
                  {i.autoridad && ` · ${i.autoridad}`}
                </div>
                {i.notas && <p className="text-xs text-gray-400 italic mt-1">{i.notas}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {i.comprobante && <button className="text-brand-600 hover:text-brand-800" onClick={() => handleDescargar(i)}><Download size={14}/></button>}
                <button className="text-red-400 hover:text-red-600" onClick={() => setDelId(i.id)}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar declaración jurada anual">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Año *</label><input type="number" className="input" value={form.anio} onChange={e=>f('anio',e.target.value)}/></div>
            <div><label className="label">Fecha de presentación *</label><input type="date" className="input" value={form.fechaPresentacion} onChange={e=>f('fechaPresentacion',e.target.value)}/></div>
          </div>
          <div><label className="label">Autoridad</label><input className="input" value={form.autoridad} onChange={e=>f('autoridad',e.target.value)}/></div>
          <div><label className="label">Estado</label>
            <select className="input" value={form.estado} onChange={e=>f('estado',e.target.value)}>
              <option value="PRESENTADA">Presentada</option>
              <option value="CONFIRMADA">Confirmada / Acusada de recibo</option>
              <option value="PENDIENTE">Pendiente</option>
            </select>
          </div>
          <div><label className="label">Comprobante <span className="text-gray-400 font-normal">(PDF — opcional)</span></label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input" onChange={e=>setFile(e.target.files[0])}/></div>
          <div><label className="label">Notas</label><input className="input" value={form.notas} onChange={e=>f('notas',e.target.value)}/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleGuardar} disabled={saving}>
              {saving && <Spinner size="sm"/>} Guardar
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleEliminar}
        title="Eliminar declaración" message="¿Confirmar eliminación?"/>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Cumplimiento() {
  const [tab, setTab]         = useState('capacitaciones');
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarResumen = useCallback(async () => {
    const { data } = await api.get('/cumplimiento');
    setResumen(data); setLoading(false);
  }, []);
  useEffect(() => { cargarResumen(); }, [cargarResumen]);

  if (loading) return <PageSpinner />;

  const pendientes = [
    !resumen.capacitaciones.cumple,
    !resumen.manual.vigente || resumen.manual.vencido,
    !resumen.evaluacion.cumple,
    !resumen.declaracion.cumple,
  ].filter(Boolean).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cumplimiento del Agente</h1>
        <p className="text-sm text-gray-500 mt-1">Requisitos propios del agente residente — Guía JD-02-2022 Arts. 22–27</p>
      </div>

      {/* Tarjetas de estado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Capacitaciones', ok: resumen.capacitaciones.cumple, sub: `${resumen.capacitaciones.horasAnio}h en ${ANIO_ACTUAL}` },
          { label: 'Manual', ok: resumen.manual.vigente && !resumen.manual.vencido, sub: resumen.manual.vigente ? (resumen.manual.vencido ? 'Vencido' : 'Vigente') : 'Sin manual' },
          { label: 'Evaluación', ok: resumen.evaluacion.cumple, sub: resumen.evaluacion.cumple ? `${ANIO_ACTUAL} registrado` : `${ANIO_ACTUAL} pendiente` },
          { label: 'Declaración', ok: resumen.declaracion.cumple, sub: resumen.declaracion.cumple ? `${ANIO_ACTUAL} presentada` : `${ANIO_ACTUAL} pendiente` },
        ].map(({ label, ok, sub }) => (
          <div key={label} className={`rounded-xl border p-4 ${ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              {ok
                ? <CheckCircle2 size={16} className="text-green-600"/>
                : <AlertTriangle size={16} className="text-red-600"/>}
              <span className={`text-sm font-semibold ${ok ? 'text-green-800' : 'text-red-800'}`}>{label}</span>
            </div>
            <p className={`text-xs ${ok ? 'text-green-600' : 'text-red-600'}`}>{sub}</p>
          </div>
        ))}
      </div>

      {pendientes > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0"/>
          <p className="text-sm text-amber-800 font-medium">
            {pendientes} {pendientes === 1 ? 'área incumplida' : 'áreas incumplidas'}. El agente residente es responsable de mantener estos registros actualizados.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <Icon size={15}/> {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="card p-6">
        {tab === 'capacitaciones' && <TabCapacitaciones horasAnio={resumen.capacitaciones.horasAnio} onRefresh={cargarResumen}/>}
        {tab === 'manual'         && <TabManual onRefresh={cargarResumen}/>}
        {tab === 'evaluaciones'   && <TabEvaluaciones onRefresh={cargarResumen}/>}
        {tab === 'declaraciones'  && <TabDeclaraciones onRefresh={cargarResumen}/>}
      </div>
    </div>
  );
}
