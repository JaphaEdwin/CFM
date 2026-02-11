import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; fullName: string; phone?: string; role?: string }) => 
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Customers API
export const customersApi = {
  getAll: () => api.get('/customers'),
  getOne: (id: number) => api.get(`/customers/${id}`),
  create: (data: { name: string; email?: string; phone: string; address?: string; notes?: string }) => 
    api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

// Poultry API
export const poultryApi = {
  // Batches
  getBatches: () => api.get('/poultry/batches'),
  getBatch: (id: number) => api.get(`/poultry/batches/${id}`),
  createBatch: (data: {
    batchName: string;
    birdType: string;
    initialCount: number;
    dateAcquired: string;
    source?: string;
    costPerBird?: number;
    notes?: string;
  }) => api.post('/poultry/batches', data),
  updateBatch: (id: number, data: any) => api.put(`/poultry/batches/${id}`, data),

  // Egg Production
  getEggs: () => api.get('/poultry/eggs'),
  createEgg: (data: {
    batchId: number;
    date: string;
    eggsCollected: number;
    brokenEggs?: number;
    notes?: string;
  }) => api.post('/poultry/eggs', data),

  // Feed Records
  getFeed: () => api.get('/poultry/feed'),
  createFeed: (data: {
    batchId: number;
    date: string;
    feedType: string;
    quantityKg: number;
    cost?: number;
    supplier?: string;
    notes?: string;
  }) => api.post('/poultry/feed', data),

  // Health Records
  getHealth: () => api.get('/poultry/health'),
  createHealth: (data: {
    batchId: number;
    date: string;
    recordType: 'vaccination' | 'medication' | 'checkup' | 'mortality' | 'other';
    description: string;
    mortalityCount?: number;
    cost?: number;
    administeredBy?: string;
    notes?: string;
  }) => api.post('/poultry/health', data),
};

// Sales API
export const salesApi = {
  getAll: () => api.get('/sales'),
  getOne: (id: number) => api.get(`/sales/${id}`),
  create: (data: {
    customerId: number;
    saleDate: string;
    saleType: 'eggs' | 'birds' | 'manure' | 'other';
    quantity: number;
    unitPrice: number;
    paymentStatus?: 'pending' | 'partial' | 'paid';
    paymentMethod?: string;
    notes?: string;
  }) => api.post('/sales', data),
  update: (id: number, data: any) => api.put(`/sales/${id}`, data),
  delete: (id: number) => api.delete(`/sales/${id}`),
  getStats: () => api.get('/sales/stats/summary'),
};

// Expenses API
export const expensesApi = {
  getAll: () => api.get('/expenses'),
  getOne: (id: number) => api.get(`/expenses/${id}`),
  create: (data: {
    date: string;
    category: string;
    description: string;
    amount: number;
    paymentMethod?: string;
    receiptNumber?: string;
    notes?: string;
  }) => api.post('/expenses', data),
  update: (id: number, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: number) => api.delete(`/expenses/${id}`),
  getStats: () => api.get('/expenses/stats/summary'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getActivities: (limit?: number) => api.get(`/dashboard/activities${limit ? `?limit=${limit}` : ''}`),
  getEggChart: (days?: number) => api.get(`/dashboard/charts/eggs${days ? `?days=${days}` : ''}`),
  getSalesChart: (days?: number) => api.get(`/dashboard/charts/sales${days ? `?days=${days}` : ''}`),
};

// Site Settings API
export const settingsApi = {
  getPublic: () => api.get('/settings'),
  getAdmin: () => api.get('/settings/admin'),
  updateOne: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
  updateMany: (settings: Record<string, string>) => api.put('/settings', settings),
};

// Media API
export const mediaApi = {
  getPublic: (params?: { category?: string; type?: string }) => 
    api.get('/media', { params }),
  getAdmin: () => api.get('/media/admin'),
  upload: (file: File, data: { category?: string; title?: string; description?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data.category) formData.append('category', data.category);
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id: number, data: { title?: string; description?: string; category?: string; is_active?: number; display_order?: number }) => 
    api.put(`/media/${id}`, data),
  delete: (id: number) => api.delete(`/media/${id}`),
  reorder: (items: { id: number; display_order: number }[]) => 
    api.post('/media/reorder', { items }),
};

// Orders API
export const ordersApi = {
  // Public - place order
  place: (data: {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    deliveryAddress?: string;
    items: { product: string; quantity: number; unit: string; unitPrice: number }[];
    notes?: string;
  }) => api.post('/orders', data),
  // Admin
  getAll: (status?: string) => api.get('/orders', { params: status ? { status } : {} }),
  getOne: (id: number) => api.get(`/orders/${id}`),
  getNewCount: () => api.get('/orders/count/new'),
  updateStatus: (id: number, status: string) => api.put(`/orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/orders/${id}`),
};

export default api;
