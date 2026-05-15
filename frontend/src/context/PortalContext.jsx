import { createContext, useContext, useState, useCallback } from 'react';
import { portalApi } from '../services/api.js';

const PortalContext = createContext(null);

export function PortalProvider({ children }) {
  const [portalUser, setPortalUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('portalUser')); } catch { return null; }
  });

  const loginPortal = useCallback(async (email, password) => {
    const { data } = await portalApi.post('/auth/portal/login', { email, password });
    localStorage.setItem('portalToken', data.token);
    localStorage.setItem('portalUser', JSON.stringify(data.usuario));
    setPortalUser(data.usuario);
    return data.usuario;
  }, []);

  const logoutPortal = useCallback(() => {
    localStorage.removeItem('portalToken');
    localStorage.removeItem('portalUser');
    setPortalUser(null);
  }, []);

  return (
    <PortalContext.Provider value={{ portalUser, loginPortal, logoutPortal, isPortalAuth: !!portalUser }}>
      {children}
    </PortalContext.Provider>
  );
}

export const usePortal = () => useContext(PortalContext);
