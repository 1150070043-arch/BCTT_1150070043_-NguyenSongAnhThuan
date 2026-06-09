import apiClient from './client.js';
import { getAuth } from '../utils/authStorage.js';

function authHeader() {
  const token = getAuth()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const ordersApi = {
  create: async (payload) => {
    const response = await apiClient.post('/orders', payload, { headers: authHeader() });
    return response.data;
  },
  myOrders: async () => {
    const response = await apiClient.get('/orders/my-orders', { headers: authHeader() });
    return response.data;
  },
  detail: async (id) => {
    const response = await apiClient.get(`/orders/${id}`, { headers: authHeader() });
    return response.data;
  },
  cancel: async (id) => {
    const response = await apiClient.put(`/orders/${id}/cancel`, null, { headers: authHeader() });
    return response.data;
  },
  requestRevision: async (id) => {
    const response = await apiClient.put(`/orders/${id}/request-revision`, null, { headers: authHeader() });
    return response.data;
  },
  complete: async (id) => {
    const response = await apiClient.put(`/orders/${id}/complete`, null, { headers: authHeader() });
    return response.data;
  },
  reorder: async (id) => {
    const response = await apiClient.post(`/orders/${id}/reorder`, null, { headers: authHeader() });
    return response.data;
  },
  createVnpayPaymentUrl: async (id) => {
    const response = await apiClient.post(`/vnpay/orders/${id}/payment-url`, null, { headers: authHeader() });
    return response.data;
  },
  supportRequests: async (id) => {
    const response = await apiClient.get(`/orders/${id}/support-requests`, { headers: authHeader() });
    return response.data;
  },
  createSupportRequest: async (id, payload) => {
    const response = await apiClient.post(`/orders/${id}/support-requests`, payload, { headers: authHeader() });
    return response.data;
  },
};

export default ordersApi;
