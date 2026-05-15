import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { PortalProvider, usePortal } from './context/PortalContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Layout from './components/Layout.jsx';
import PortalLayout from './components/PortalLayout.jsx';

import Login             from './pages/Login.jsx';
import Dashboard         from './pages/Dashboard.jsx';
import Sociedades        from './pages/Sociedades.jsx';
import SociedadDetalle   from './pages/SociedadDetalle.jsx';
import Consultas         from './pages/Consultas.jsx';
import Alertas           from './pages/Alertas.jsx';
import Reportes          from './pages/Reportes.jsx';
import Suscripciones     from './pages/Suscripciones.jsx';
import UsuariosPortal    from './pages/UsuariosPortal.jsx';

import Agentes           from './pages/Agentes.jsx';
import PortalLogin       from './pages/portal/PortalLogin.jsx';
import PortalObligaciones from './pages/portal/PortalObligaciones.jsx';
import PortalConsultas   from './pages/portal/PortalConsultas.jsx';
import PortalSociedad    from './pages/portal/PortalSociedad.jsx';

function RequireAuth({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" replace />;
}

function RequirePortal({ children }) {
  const { isPortalAuth } = usePortal();
  return isPortalAuth ? children : <Navigate to="/portal/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <PortalProvider>
        <ToastProvider>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<Login />} />

            {/* Portal cliente */}
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal" element={
              <RequirePortal><PortalLayout /></RequirePortal>
            }>
              <Route index element={<Navigate to="/portal/sociedad" replace />} />
              <Route path="sociedad"     element={<PortalSociedad />} />
              <Route path="obligaciones" element={<PortalObligaciones />} />
              <Route path="consultas"    element={<PortalConsultas />} />
            </Route>

            {/* Panel agente */}
            <Route path="/" element={
              <RequireAuth><Layout /></RequireAuth>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"          element={<Dashboard />} />
              <Route path="sociedades"         element={<Sociedades />} />
              <Route path="sociedades/:id"     element={<SociedadDetalle />} />
              <Route path="consultas"          element={<Consultas />} />
              <Route path="alertas"            element={<Alertas />} />
              <Route path="reportes"           element={<Reportes />} />
              <Route path="suscripciones"      element={<Suscripciones />} />
              <Route path="portal-usuarios"    element={<UsuariosPortal />} />
              <Route path="agentes"            element={<Agentes />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </PortalProvider>
    </AuthProvider>
  );
}
