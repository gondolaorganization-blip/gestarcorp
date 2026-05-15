import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../context/PortalContext.jsx';
import { Lock, Mail } from 'lucide-react';

export default function PortalLogin() {
  const { loginPortal } = usePortal();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await loginPortal(form.email, form.password);
      navigate('/portal/obligaciones');
    } catch(err) {
      setError(err?.response?.data?.error || 'Credenciales incorrectas');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="h-14 w-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-xl">GG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal Cliente</h1>
          <p className="text-sm text-gray-500 mt-1">GESTARGOV — Acceso para clientes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Correo electrónico</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" className="input pl-9"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@correo.com" required />
            </div>
          </div>
          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" className="input pl-9"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" required />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-gray-400">
          ¿Eres agente?{' '}
          <a href="/login" className="text-brand-600 hover:underline font-medium">Panel del agente</a>
        </p>
      </div>
    </div>
  );
}
