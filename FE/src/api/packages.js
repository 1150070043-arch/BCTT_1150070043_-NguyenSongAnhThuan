import apiClient from './client.js';

export const packagesApi = {
  // Get all products with filters
  getPackages: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.maxDeliveryDays) params.append('maxDeliveryDays', filters.maxDeliveryDays);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.isApproved !== undefined) params.append('isApproved', filters.isApproved);

    const response = await apiClient.get(`/products?${params.toString()}`);
    return response.data;
  },

  // Get product by ID
  getPackageById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Get packages by provider
  getPackagesByProvider: async (providerId) => {
    const response = await apiClient.get(`/Packages/provider/${providerId}`);
    return response.data;
  },

  // Create package (Provider only)
  createPackage: async (packageData, token) => {
    const response = await apiClient.post('/Packages', packageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Update package (Provider only)
  updatePackage: async (id, packageData, token) => {
    const response = await apiClient.put(`/Packages/${id}`, packageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Delete package (Provider only)
  deletePackage: async (id, token) => {
    const response = await apiClient.delete(`/Packages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  }
};

export default packagesApi;
