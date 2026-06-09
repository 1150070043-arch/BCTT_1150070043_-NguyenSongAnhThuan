import apiClient from './client.js';
import { getAuth } from '../utils/authStorage.js';

function authHeader() {
  const token = getAuth()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const interactionsApi = {
  messages: async (orderId) => (
    await apiClient.get(`/messages/order/${orderId}`, { headers: authHeader() })
  ).data,
  sendMessage: async (payload) => (
    await apiClient.post('/messages', payload, { headers: authHeader() })
  ).data,
  createReview: async (payload) => (
    await apiClient.post('/reviews', payload, { headers: authHeader() })
  ).data,
  providerReviews: async (providerId) => (
    await apiClient.get(`/reviews/provider/${providerId}`)
  ).data,
  notifications: async () => (
    await apiClient.get('/notifications', { headers: authHeader() })
  ).data,
  markNotificationRead: async (id) => (
    await apiClient.put(`/notifications/${id}/read`, null, { headers: authHeader() })
  ).data,
};

export default interactionsApi;
