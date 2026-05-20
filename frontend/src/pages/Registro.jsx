import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export default function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');

  const [yaConfigurado, setYaConfigurado] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/setup/status').then(({ data }) => {
      setYaConfigurado(data.configurado);
      setCheckDone(true);
    }).catch(() => setCheckDone(true));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');

    setLoading(true);
    try {
      await api.post('/auth/setup', {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      await login(form.email.trim().toLowerCase(), form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (!checkDone) return null;

  if (yaConfigurado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="h-14 w-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-xl">GC</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">GestarCorp</h1>
          <p className="text-sm text-gray-500 mb-6">
            Esta instalación ya tiene una cuenta registrada.<br />
            Ingresa con tus credenciales o contacta al administrador.
          </p>
          <a href="/login" className="btn-primary w-full justify-center py-2.5 block text-center">
            Iniciar sesión →
          </a>
          <p className="text-xs text-gray-400 mt-4">
            ¿Necesitas ayuda?{' '}
            <a href="https://wa.me/50765143637?text=Hola, necesito acceso a GestarCorp"
              target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
              Contactar soporte
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="h-14 w-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-xl">GC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GestarCorp</h1>
          <p className="text-sm text-gray-500 mt-1">Crear cuenta — 14 días gratis</p>
          {planParam && (
            <span className="inline-block mt-2 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              Plan seleccionado: {planParam.toUpperCase()}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tu nombre completo</label>
            <input type="text" className="input" required autoFocus
              value={form.nombre} onChange={set('nombre')} placeholder="Ana García" />
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input type="email" className="input" required
              value={form.email} onChange={set('email')} placeholder="ana@agente.com.pa" />
          </div>
          <div>
            <label className="label">Contraseña (mín. 8 caracteres)</label>
            <input type="password" className="input" required
              value={form.password} onChange={set('password')} placeholder="••••••••" />
          </div>
          <div>
            <label className="label">Confirmar contraseña</label>
            <input type="password" className="input" required
              value={form.confirm} onChange={set('confirm')} placeholder="••••••••" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Comenzar prueba gratis →'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Al registrarte aceptas nuestros{' '}
            <a href="https://gestarsoft.com/terminos" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Términos</a>
            {' '}y{' '}
            <a href="https://gestarsoft.com/privacidad" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Privacidad</a>.
          </p>
        </form>

        <p className="text-center mt-6 text-xs text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-brand-600 hover:underline font-medium">Iniciar sesión →</a>
        </p>
      </div>
    </div>
  );
}
