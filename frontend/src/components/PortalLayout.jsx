import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePortal } from '../context/PortalContext.jsx';
import { Building2, FileText, MessageSquare, LogOut } from 'lucide-react';

const NAV = [
  { to: '/portal/sociedad',     label: 'Mi Sociedad',      icon: Building2 },
  { to: '/portal/obligaciones', label: 'Mis Obligaciones', icon: FileText },
  { to: '/portal/consultas',    label: 'Consultas',        icon: MessageSquare },
];

export default function PortalLayout() {
  const { portalUser, logoutPortal } = usePortal();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-700 text-white px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-7 w-7 bg-white rounded-md flex items-center justify-center">
            <span className="text-brand-700 font-black text-xs">GG</span>
          </div>
          <div>
            <p className="font-bold text-sm">Portal Cliente — GESTARGOV</p>
            {portalUser?.nombreSociedad && (
              <p className="text-brand-200 text-xs">{portalUser.nombreSociedad}</p>
            )}
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                 ${isActive ? 'bg-white/20 text-white' : 'text-brand-100 hover:bg-white/10'}`
              }>
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
          <button onClick={() => { logoutPortal(); navigate('/portal/login'); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-brand-100 hover:bg-white/10 text-sm ml-2">
            <LogOut size={15} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
