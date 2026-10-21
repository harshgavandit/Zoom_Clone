import axios from 'axios';
import server from '../environment';
export const api = axios.create({ baseURL: `${server}/api/v1`, timeout: 20000 });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
let refreshRequest;
api.interceptors.response.use(response => response, async error => {
  const config = error.config;
  if (error.response?.status === 401 && config && !config._retried && !config.url.startsWith('/auth/')) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      config._retried = true;
      try {
        if (!refreshRequest) refreshRequest = axios.post(`${server}/api/v1/auth/refresh`, { refreshToken }, { timeout: 20000 })
          .then(({ data }) => { localStorage.setItem('token', data.accessToken); localStorage.setItem('refreshToken', data.refreshToken); })
          .finally(() => { refreshRequest = null; });
        await refreshRequest;
        return api(config);
      } catch { ['token','refreshToken','user'].forEach(key => localStorage.removeItem(key)); }
    }
  }
  return Promise.reject(error);
});
export const errorMessage = error => error.response?.data?.message || 'Unable to reach the service. Please try again.';
