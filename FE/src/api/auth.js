import apiClient from './client.js';

const authApi = {
  register: async (payload) => {
    const response = await apiClient.post('/Auth/register', payload);
    return response.data;
  },

  login: async (payload) => {
    const response = await apiClient.post('/Auth/login', payload);
    return response.data;
  },

  forgotPassword: async (payload) => {
    const response = await apiClient.post('/Auth/forgot-password', payload);
    return response.data;
  },

  resetPassword: async (payload) => {
    const response = await apiClient.post('/Auth/reset-password', payload);
    return response.data;
  },

  logout: async (token) => {
    const response = await apiClient.post('/Auth/logout', null, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  },

  me: async (token) => {
    const response = await apiClient.get('/Auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  },

  updateProfile: async (payload) => {
    const response = await apiClient.put('/Auth/profile', payload);
    return response.data;
  },
  addresses: async () => (await apiClient.get('/Auth/addresses')).data,
  createAddress: async (payload) => (await apiClient.post('/Auth/addresses', payload)).data,
  updateAddress: async (id, payload) => (await apiClient.put(`/Auth/addresses/${id}`, payload)).data,
  setDefaultAddress: async (id) => (await apiClient.put(`/Auth/addresses/${id}/default`)).data,
  deleteAddress: async (id) => (await apiClient.delete(`/Auth/addresses/${id}`)).data,
};

export default authApi;
