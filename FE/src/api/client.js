import axios from 'axios';
import { clearAuth, getAuthToken } from '../utils/authStorage.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5194/api',
});

function removeContentType(headers) {
  if (!headers) return;
  if (typeof headers.delete === 'function') {
    headers.delete('Content-Type');
    headers.delete('content-type');
    return;
  }

  delete headers['Content-Type'];
  delete headers['content-type'];
}

function isAuthRequest(url = '') {
  return url.includes('/Auth/login') ||
    url.includes('/Auth/register') ||
    url.includes('/Auth/forgot-password') ||
    url.includes('/Auth/reset-password');
}

function shouldStayOnCurrentAuthPage() {
  const hash = window.location.hash || '#/';
  return hash.startsWith('#/login') || hash.startsWith('#/register') || hash.startsWith('#/forgot-password');
}

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  config.headers = config.headers || {};

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    removeContentType(config.headers);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if ((status === 401 || status === 403) && !isAuthRequest(url)) {
      clearAuth();
      if (!shouldStayOnCurrentAuthPage()) {
        const currentRoute = (window.location.hash || '#/').replace(/^#/, '') || '/';
        window.location.hash = `/login?from=${encodeURIComponent(currentRoute)}`;
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error, fallback = 'Không thể xử lý yêu cầu. Vui lòng thử lại.') {
  return error?.response?.data?.message || error?.message || fallback;
}

export default apiClient;
