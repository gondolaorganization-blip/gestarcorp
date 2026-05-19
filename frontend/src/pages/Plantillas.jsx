import { useEffect, useState, useCallback } from 'react';
import api from '../services/api.js';
import { PageSpinner } from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Plus, Edit2, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const VARIABLES = [
  { group: 'Sociedad' },
  { var: '{{nombre_sociedad}}',    desc: 'Nombre completo de la sociedad' },
  { var: '{{ficha}}',              desc: 'Número de ficha del Registro Público' },
  { var: '{{tomo}}',               desc: 'Tomo de inscripción' },
  { var: '{{folio}}',              desc: 'Folio de inscripción' },
  { var: '{{fecha_constitucion}}', desc: 'Fecha de constitución (escrita)' },
  { var: '{{fecha_hoy}}',          desc: 'Fecha actual (escrita)' },
  { var: '{{capital}}',            desc: 'Capital social en USD' },
  { var: '{{domicilio}}',          desc: 'Domicilio de la sociedad' },
  { var: '{{duracion}}',           desc: 'Duración de la sociedad' },
  { group: 'Presidente' },
  { var: '{{presidente}}',          desc: 'Nombre del Presidente' },
  { var: '{{presidente_tipo_doc}}', desc: 'Tipo de documento (CEDULA / PASAPORTE)' },
  { var: '{{presidente_num_doc}}',  desc: 'Número de documento del Presidente' },
  { var: '{{presidente_domicilio}}',desc: 'Domicilio del Presidente' },
  { var: '{{presidente_completo}}', desc: 'Nombre, doc. y domicilio del Presidente (todo junto)' },
  { group: 'Secretario' },
  { var: '{{secretario}}',          desc: 'Nombre del Secretario' },
  { var: '{{secretario_tipo_doc}}', desc: 'Tipo de documento del Secretario' },
  { var: '{{secretario_num_doc}}',  desc: 'Número de documento del Secretario' },
  { var: '{{secretario_domicilio}}',desc: 'Domicilio del Secretario' },
  { var: '{{secretario_completo}}', desc: 'Nombre, doc. y domicilio del Secretario (todo junto)' },
  { group: 'Tesorero' },
  { var: '{{tesorero}}',            desc: 'Nombre del Tesorero' },
  { var: '{{tesorero_tipo_doc}}',   desc: 'Tipo de documento del Tesorero' },
  { var: '{{tesorero_num_doc}}',    desc: 'Número de documento del Tesorero' },
  { var: '{{tesorero_domicilio}}',  desc: 'Domicilio del Tesorero' },
  { var: '{{tesorero_completo}}',   desc: 'Nombre, doc. y domicilio del Tesorero (todo junto)' },
  { group: 'Listas' },
  { var: '{{directores}}',          desc: 'Lista de directores con cargo (formato simple)' },
  { var: '{{directores_completo}}', desc: 'Lista de directores con doc. y domicilio' },
  { var: '{{accionistas}}',         desc: 'Lista de accionistas con porcentaje' },
  { group: 'Agente residente' },
  { var: '{{agente_nombre}}',       desc: 'Nombre del agente residente' },
  { var: '{{agente_email}}',        desc: 'Email del agente residente' },
];

export default function Plantillas() {
  const toast = useToast();
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [delId, setDelId]           = useState(null);
  const [showVars, setShowVars]     = useState(false);
  const [form, setForm]             = useState({ nombre: '', descripcion: '', contenido: '' });

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/plantillas');
    setPlantillas(data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirNueva() {
    setEditing(null);
    setForm({ nombre: '', descripcion: '', contenido: '' });
    setShowModal(true);
  }

  function abrirEditar(p) {
    setEditing(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', contenido: p.contenido });
    setShowModal(true);
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.contenido.trim())
      return toast.error('Nombre y contenido son requeridos.');
    try {
      if (editing) await api.put(`/plantillas/${editing.id}`, form);
      else         await api.post('/plantillas', form);
      toast.success('Plantilla guardada');
      setShowModal(false);
      cargar();
    } catch(e) { toast.error(e?.response?.data?.error || 'Error al guardar'); }
  }

  async function eliminar() {
    try {
      await api.delete(`/plantillas/${delId}`);
      toast.success('Plantilla eliminada');
      setDelId(null);
      cargar();
    } catch(e) { toast.error('Error al eliminar'); }
  }

  function insertarVariable(v) {
    setForm(f => ({ ...f, contenido: f.contenido + v }));
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de documentos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea y edita tus propias plantillas. Usa variables para insertar datos de la sociedad automáticamente.
          </p>
        </div>
        <button className="btn-primary" onClick={abrirNueva}>
          <Plus size={16}/> Nueva plantilla
        </button>
      </div>

      {/* Referencia de variables */}
      <div className="card mb-6">
        <button
          className="w-full px-5 py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50"
          onClick={() => setShowVars(v => !v)}
        >
          Variables disponibles
          {showVars ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
        {showVars && (
          <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-3">
            {VARIABLES.reduce((acc, v) => {
              if (v.group) { acc.push({ type: 'group', label: v.group, items: [] }); }
              else { acc[acc.length - 1]?.items.push(v); }
              return acc;
            }, []).map(g => (
              <div key={g.label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{g.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {g.items.map(v => (
                    <div key={v.var} className="flex items-start gap-2 text-sm">
                      <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap">{v.var}</code>
                      <span className="text-gray-500">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista */}
      {plantillas.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 font-medium">Sin plantillas todavía</p>
          <p className="text-sm text-gray-400 mt-1">Crea tu primera plantilla para empezar a generar documentos personalizados.</p>
          <button className="btn-primary mt-4" onClick={abrirNueva}><Plus size={16}/> Nueva plantilla</button>
        </div>
      ) : (
        <div className="space-y-3">
          {plantillas.map(p => (
            <div key={p.id} className="card px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{p.nombre}</p>
                {p.descripcion && <p className="text-sm text-gray-500 mt-0.5">{p.descripcion}</p>}
                <p className="text-xs text-gray-400 mt-1 truncate">{p.contenido.slice(0, 120)}…</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn-secondary btn-sm" onClick={() => abrirEditar(p)}>
                  <Edit2 size={14}/> Editar
                </button>
                <button className="text-red-500 hover:text-red-700 p-2" onClick={() => setDelId(p.id)}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal edición */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar plantilla' : 'Nueva plantilla'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre de la plantilla *</label>
              <input className="input" placeholder="Ej: Poder General, Renuncia Director..."
                value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))}/>
            </div>
            <div>
              <label className="label">Descripción (opcional)</label>
              <input className="input" placeholder="Breve descripción del documento"
                value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))}/>
            </div>
          </div>

          {/* Insertar variable rápida */}
          <div>
            <label className="label">Insertar variable rápida</label>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.filter(v => v.var).map(v => (
                <button key={v.var} type="button"
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 font-mono"
                  onClick={() => insertarVariable(v.var)}
                  title={v.desc}
                >
                  {v.var}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Contenido de la plantilla *</label>
            <textarea
              className="input font-mono text-sm resize-y"
              rows={16}
              placeholder={`Escribe el texto del documento aquí.\n\nUsa las variables de arriba para insertar datos automáticos.\n\nEjemplo:\nYo, {{presidente}}, en mi calidad de Presidente de {{nombre_sociedad}}, sociedad inscrita en el Registro Público de Panamá, Ficha {{ficha}}, declaro...`}
              value={form.contenido}
              onChange={e => setForm(f => ({...f, contenido: e.target.value}))}
            />
            <p className="text-xs text-gray-400 mt-1">Cada línea en blanco separa párrafos en el documento Word generado.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={guardar}>Guardar plantilla</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={eliminar}
        title="Eliminar plantilla" message="¿Confirmar eliminación de esta plantilla?" />
    </div>
  );
}
