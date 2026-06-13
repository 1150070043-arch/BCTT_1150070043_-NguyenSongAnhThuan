import apiClient from './client.js';
import { getAuth } from '../utils/authStorage.js';

function authHeader() {
  const token = getAuth()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const adminApi = {
  dashboard: async () => (await apiClient.get('/admin/dashboard', { headers: authHeader() })).data,
  users: async () => (await apiClient.get('/admin/users', { headers: authHeader() })).data,
  createUser: async (payload) => (
    await apiClient.post('/admin/users', payload, { headers: authHeader() })
  ).data,
  setUserStatus: async (id, isActive) => (
    await apiClient.put(`/admin/users/${id}/status`, { isActive }, { headers: authHeader() })
  ).data,
  resetUserPassword: async (id) => (
    await apiClient.put(`/admin/users/${id}/password/default`, null, { headers: authHeader() })
  ).data,
  pendingProviders: async () => (await apiClient.get('/admin/providers/pending', { headers: authHeader() })).data,
  providers: async () => (await apiClient.get('/admin/providers', { headers: authHeader() })).data,
  verifyProvider: async (id) => (await apiClient.put(`/admin/providers/${id}/verify`, null, { headers: authHeader() })).data,
  pendingPackages: async () => (await apiClient.get('/admin/packages/pending', { headers: authHeader() })).data,
  packages: async (filters = {}) => (await apiClient.get('/admin/packages', { params: filters, headers: authHeader() })).data,
  createPackage: async (payload) => (await apiClient.post('/admin/packages', payload, { headers: authHeader() })).data,
  updatePackage: async (id, payload) => (await apiClient.put(`/admin/packages/${id}`, payload, { headers: authHeader() })).data,
  hidePackage: async (id) => (await apiClient.delete(`/admin/packages/${id}`, { headers: authHeader() })).data,
  uploadProductImage: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await apiClient.post(`/admin/packages/${id}/images`, formData, {
      headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
    })).data;
  },
  setPrimaryProductImage: async (id, imageId) => (
    await apiClient.put(`/admin/packages/${id}/images/${imageId}/primary`, null, { headers: authHeader() })
  ).data,
  deleteProductImage: async (id, imageId) => (
    await apiClient.delete(`/admin/packages/${id}/images/${imageId}`, { headers: authHeader() })
  ).data,
  approvePackage: async (id) => (await apiClient.put(`/admin/packages/${id}/approve`, null, { headers: authHeader() })).data,
  rejectPackage: async (id) => (await apiClient.put(`/admin/packages/${id}/reject`, null, { headers: authHeader() })).data,
  orders: async (params = {}) => (await apiClient.get('/admin/orders', { params, headers: authHeader() })).data,
  orderDetail: async (id) => (await apiClient.get(`/admin/orders/${id}`, { headers: authHeader() })).data,
  updateOrderStatus: async (id, statusOrPayload) => {
    const payload = typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload;
    return (await apiClient.put(`/admin/orders/${id}/status`, payload, { headers: authHeader() })).data;
  },
  confirmOrderPayment: async (id, payload = {}) => (
    await apiClient.put(`/admin/orders/${id}/payment/confirm`, payload, { headers: authHeader() })
  ).data,
  inventorySummary: async () => (await apiClient.get('/admin/inventory/summary', { headers: authHeader() })).data,
  inventoryTransactions: async (params = {}) => (
    await apiClient.get('/admin/inventory/transactions', { params, headers: authHeader() })
  ).data,
  createInventoryAdjustment: async (payload) => (
    await apiClient.post('/admin/inventory/adjustments', payload, { headers: authHeader() })
  ).data,
  supportRequests: async (params = {}) => (
    await apiClient.get('/admin/support-requests', { params, headers: authHeader() })
  ).data,
  updateSupportRequest: async (id, payload) => (
    await apiClient.put(`/admin/support-requests/${id}`, payload, { headers: authHeader() })
  ).data,
  reports: async (params = {}) => (await apiClient.get('/admin/reports', { params, headers: authHeader() })).data,
  exportReportsCsv: async (params = {}) => (
    await apiClient.get('/admin/reports/export', { params, headers: authHeader(), responseType: 'blob' })
  ),
  exportReportsExcel: async (params = {}) => (
    await apiClient.get('/admin/reports/export-excel', { params, headers: authHeader(), responseType: 'blob' })
  ),
  auditLogs: async (params = {}) => (
    await apiClient.get('/admin/audit-logs', { params, headers: authHeader() })
  ).data,
  auditLogDetail: async (id) => (
    await apiClient.get(`/admin/audit-logs/${id}`, { headers: authHeader() })
  ).data,
};

export default adminApi;
