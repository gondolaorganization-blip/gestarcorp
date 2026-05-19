import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Building2, Bell, MessageSquare,
  BarChart3, LogOut, Menu, X, CreditCard, Users, UserCog, FileText, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { to: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/sociedades',      label: 'Sociedades',      icon: Building2 },
  { to: '/consultas',       label: 'Consultas',       icon: MessageSquare },
  { to: '/alertas',         label: 'Alertas',         icon: Bell },
  { to: '/suscripciones',   label: 'Suscripciones',   icon: CreditCard },
  { to: '/reportes',        label: 'Reportes',        icon: BarChart3 },
  { to: '/portal-usuarios', label: 'Portal clientes', icon: Users },
  { to: '/agentes',         label: 'Agentes',         icon: UserCog },
  { to: '/plantillas',      label: 'Plantillas',      icon: FileText },
  { to: '/cumplimiento',    label: 'Cumplimiento',    icon: ShieldCheck },
  { to: '/screening',       label: 'Sanciones ONU',   icon: ShieldAlert },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar overlay (mobile) */}
      {sideOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-700 flex flex-col shadow-xl transition-transform
        lg:relative lg:translate-x-0
        ${sideOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-6 py-5 border-b border-brand-600">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-brand-700 font-black text-xs">GG</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">GESTARCORP</p>
              <p className="text-brand-200 text-xs mt-0.5">Gobierno Corporativo</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-brand-100 hover:bg-white/10 hover:text-white'}
              `}
              onClick={() => setSideOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-brand-600">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-8 w-8 bg-brand-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.nombre || 'Agente'}</p>
              <p className="text-brand-200 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-brand-100 hover:bg-white/10 hover:text-white text-sm transition-colors">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            onClick={() => setSideOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
