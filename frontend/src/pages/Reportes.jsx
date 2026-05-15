import { useState, useEffect } from 'react';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';
import { Download, FileText, BarChart3, ClipboardList, MessageSquare } from 'lucide-react';

function ReporteCard({ icon: Icon, title, description, actions }) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-brand-50 rounded-xl">
          <Icon size={22} className="text-brand-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          <div className="flex flex-wrap gap-2 mt-4">{actions}</div>
        </div>
      </div>
    </div>
  );
}

export default function Reportes() {
  const toast = useToast();
  const [loadingMap, setLoadingMap] = useState({});
  const [anio, setAnio] = useState(new Date().getFullYear());

  function setLoading(key, val) {
    setLoadingMap(m => ({ ...m, [key]: val }));
  }

  async function descargar(key, url, filename) {
    setLoading(key, true);
    try {
      const { data: blob } = await api.get(url, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    } catch(e) {
      toast.error('Error al generar reporte');
    } finally {
      setLoading(key, false);
    }
  }

  function BtnDescarga({ keyId, url, filename, label, fmt }) {
    const loading = loadingMap[keyId];
    return (
      <button className="btn-secondary btn-sm" disabled={loading}
        onClick={() => descargar(keyId, url, filename)}>
        {loading ? <Spinner size="sm" /> : <Download size={13} />}
        {label || fmt}
      </button>
    );
  }

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-1">Descarga reportes de tu cartera en PDF o Word</p>
      </div>

      <div className="space-y-4">
        {/* Ficha de sociedad */}
        <ReporteCard
          icon={FileText}
          title="Ficha Corporativa Completa"
          description="Reporte individual con todos los datos de una sociedad: directores, accionistas, beneficiarios, obligaciones y actas. Busca la sociedad desde su página de detalle."
          actions={
            <p className="text-xs text-gray-400 italic">
              Accede desde la página de cada sociedad → botón PDF / DOCX
            </p>
          }
        />

        {/* Cartera */}
        <ReporteCard
          icon={BarChart3}
          title="Reporte de Cartera Corporativa"
          description="Listado completo de todas las sociedades con estado, health score y alertas. Ordenado por riesgo."
          actions={<>
            <BtnDescarga keyId="cartera-pdf" url="/reportes/cartera/pdf"
              filename={`cartera_${hoy}.pdf`} fmt="PDF" />
            <BtnDescarga keyId="cartera-docx" url="/reportes/cartera/docx"
              filename={`cartera_${hoy}.docx`} fmt="Word" />
          </>}
        />

        {/* Cumplimiento fiscal */}
        <ReporteCard
          icon={ClipboardList}
          title="Reporte de Cumplimiento Fiscal"
          description="Todas las obligaciones fiscales del año agrupadas por sociedad, con estado y fechas de vencimiento."
          actions={<>
            <div className="flex items-center gap-2 w-full mb-2">
              <label className="text-xs text-gray-500 font-medium">Año:</label>
              <input type="number" className="input w-24 text-sm py-1"
                value={anio} onChange={e => setAnio(Number(e.target.value))} />
            </div>
            <BtnDescarga keyId="cumplimiento-pdf"
              url={`/reportes/cumplimiento/pdf?anio=${anio}`}
              filename={`cumplimiento_${anio}.pdf`} fmt="PDF" />
          </>}
        />

        {/* Historial consultas */}
        <ReporteCard
          icon={MessageSquare}
          title="Historial de Consultas"
          description="Todas las consultas de la cartera con respuestas, tiempos promedio y estadísticas."
          actions={<>
            <BtnDescarga keyId="consultas-pdf" url="/reportes/consultas/pdf"
              filename={`consultas_${hoy}.pdf`} fmt="PDF" />
          </>}
        />
      </div>
    </div>
  );
}
