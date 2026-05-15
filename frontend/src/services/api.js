import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Portal API (token separado)
export const portalApi = axios.create({ baseURL: '/api' });

portalApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem('portalToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

portalApi.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('portalToken');
      localStorage.removeItem('portalUser');
      window.location.href = '/portal/login';
    }
    return Promise.reject(err);
  }
);
