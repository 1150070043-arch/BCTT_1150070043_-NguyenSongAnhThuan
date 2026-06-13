import apiClient from './client.js';
import { getAuth } from '../utils/authStorage.js';

function authHeader() {
  const token = getAuth()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const providerApi = {
  packages: async () => {
    const response = await apiClient.get('/provider/packages', { headers: authHeader() });
    return response.data;
  },
  createPackage: async (payload) => {
    const response = await apiClient.post('/provider/packages', payload, { headers: authHeader() });
    return response.data;
  },
  updatePackage: async (id, payload) => {
    const response = await apiClient.put(`/provider/packages/${id}`, payload, { headers: authHeader() });
    return response.data;
  },
  adjustStock: async (id, payload) => {
    const response = await apiClient.put(`/provider/packages/${id}/stock`, payload, { headers: authHeader() });
    return response.data;
  },
  orders: async () => {
    const response = await apiClient.get('/provider/orders', { headers: authHeader() });
    return response.data;
  },
  updateOrderStatus: async (id, status) => {
    const response = await apiClient.put(`/provider/orders/${id}/status`, { status }, { headers: authHeader() });
    return response.data;
  },
  submitDelivery: async (payload) => {
    const response = await apiClient.post('/project-deliveries', payload, { headers: authHeader() });
    return response.data;
  },
};

export default providerApi;
