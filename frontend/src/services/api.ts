import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Product, Category, ProductOption, User, Order, OrderItem, OrderStatusHistory } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth token from Zustand persisted state
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const raw = localStorage.getItem('tacomex-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth
      try {
        const raw = localStorage.getItem('tacomex-auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.state = { ...parsed.state, token: null, user: null, isAuthenticated: false };
          localStorage.setItem('tacomex-auth', JSON.stringify(parsed));
        }
      } catch {
        // Ignore
      }
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================
// Response Transformers
// ============================

export function transformProduct(raw: Record<string, unknown>): Product {
  return {
    id: String(raw.id),
    name: (raw.name as string) || '',
    description: (raw.description as string) || '',
    price: typeof raw.price === 'string' ? parseFloat(raw.price) : (raw.price as number) || 0,
    image: (raw.image_url || raw.imageUrl) as string | undefined,
    category: {
      id: String(raw.category_id || raw.categoryId || ''),
      name: (raw.category_name || raw.categoryName || '') as string,
      description: '',
    },
    categoryId: String(raw.category_id || raw.categoryId || ''),
    spiceLevel: ((raw.spice_level ?? raw.spiceLevel ?? 0) as 0 | 1 | 2 | 3 | 4 | 5),
    isAvailable: (raw.is_available ?? raw.isAvailable ?? true) as boolean,
    isFeatured: (raw.is_featured ?? raw.isFeatured ?? false) as boolean,
    options: Array.isArray(raw.options) ? raw.options.map(transformOption) : [],
    createdAt: ((raw.created_at || raw.createdAt || '') as string),
  };
}

export function transformOption(raw: Record<string, unknown>): ProductOption {
  return {
    id: String(raw.id),
    name: (raw.name as string) || '',
    price: typeof raw.price_modifier === 'string'
      ? parseFloat(raw.price_modifier)
      : (raw.price_modifier as number) ?? (raw.price as number) ?? 0,
  };
}

export function transformCategory(raw: Record<string, unknown>): Category {
  return {
    id: String(raw.id),
    name: (raw.name as string) || '',
    description: (raw.description as string) || undefined,
    icon: (raw.image_url || raw.imageUrl) as string | undefined,
  };
}

export function transformUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id),
    email: (raw.email as string) || '',
    name: (raw.name as string) || '',
    role: (raw.role as 'customer' | 'admin') || 'customer',
    createdAt: ((raw.created_at || raw.createdAt || '') as string),
  };
}

export function transformOrder(raw: Record<string, unknown>): Order {
  const rawItems = (raw.items || []) as Record<string, unknown>[];
  const rawHistory = (raw.status_history || raw.statusHistory || []) as Record<string, unknown>[];

  const userName = (raw.user_name || raw.userName) as string | undefined;
  const userEmail = (raw.user_email || raw.userEmail) as string | undefined;

  return {
    id: String(raw.id),
    userId: String(raw.user_id || raw.userId || ''),
    user: userName ? {
      id: String(raw.user_id || raw.userId || ''),
      email: userEmail || '',
      name: userName,
      role: 'customer' as const,
      createdAt: '',
    } : undefined,
    items: rawItems.map(transformOrderItem),
    status: (raw.status as Order['status']) || 'pending',
    subtotal: typeof raw.subtotal === 'string' ? parseFloat(raw.subtotal) : (raw.subtotal as number) || 0,
    tax: typeof raw.tax_amount === 'string' ? parseFloat(raw.tax_amount) : (raw.tax_amount as number) ?? (raw.tax as number) ?? 0,
    deliveryFee: 0,
    discount: typeof raw.discount_amount === 'string' ? parseFloat(raw.discount_amount) : (raw.discount_amount as number) ?? (raw.discount as number) ?? 0,
    total: typeof raw.total === 'string' ? parseFloat(raw.total) : (raw.total as number) || 0,
    promoCode: (raw.promotion_code || raw.promoCode) as string | undefined,
    deliveryAddress: {
      id: '1',
      street: ((raw.delivery_address || raw.deliveryAddress || '') as string),
      city: '',
      state: '',
      zipCode: '',
    },
    statusHistory: rawHistory.map(transformStatusHistory),
    estimatedDelivery: ((raw.estimated_delivery || raw.estimatedDelivery || '') as string) || undefined,
    createdAt: ((raw.created_at || raw.createdAt || '') as string),
    updatedAt: ((raw.updated_at || raw.updatedAt || '') as string),
  };
}

export function transformOrderItem(raw: Record<string, unknown>): OrderItem {
  const unitPrice = typeof raw.unit_price === 'string' ? parseFloat(raw.unit_price) : (raw.unit_price as number) ?? (raw.price as number) ?? 0;
  return {
    id: String(raw.id || ''),
    productId: String(raw.product_id || raw.productId || ''),
    product: {
      id: String(raw.product_id || raw.productId || ''),
      name: ((raw.product_name || raw.productName || '') as string),
      description: '',
      price: unitPrice,
      image: (raw.product_image || raw.productImage) as string | undefined,
      category: { id: '', name: '' },
      categoryId: '',
      spiceLevel: 0,
      isAvailable: true,
      isFeatured: false,
      createdAt: '',
    },
    quantity: (raw.quantity as number) || 1,
    price: unitPrice,
  };
}

export function transformStatusHistory(raw: Record<string, unknown>): OrderStatusHistory {
  return {
    status: (raw.status as OrderStatusHistory['status']) || 'pending',
    timestamp: ((raw.created_at || raw.createdAt || raw.timestamp || '') as string),
    note: (raw.notes || raw.note) as string | undefined,
  };
}

// ============================
// Auth API
// ============================
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),

  getProfile: () =>
    api.get('/auth/me'),
};

// ============================
// Products API
// ============================
export const productsApi = {
  getAll: (params?: { category?: string; search?: string; spiceLevel?: number; featured?: boolean }) =>
    api.get('/products', { params }),

  getById: (id: string) =>
    api.get(`/products/${id}`),

  getCategories: () =>
    api.get('/categories'),

  getFeatured: () =>
    api.get('/products/featured'),

  create: (data: Record<string, unknown>) =>
    api.post('/products', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),
};

// ============================
// Categories API
// ============================
export const categoriesApi = {
  getAll: () =>
    api.get('/categories'),
};

// ============================
// Orders API
// ============================
export const ordersApi = {
  create: (data: {
    items: Array<{ product_id: number; quantity: number; options?: number[] }>;
    delivery_address?: string;
    delivery_notes?: string;
    promotion_code?: string;
  }) =>
    api.post('/orders', data),

  getMyOrders: () =>
    api.get('/orders'),

  getById: (id: string) =>
    api.get(`/orders/${id}`),

  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/orders', { params }),

  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/orders/${id}/status`, { status, notes }),
};

// ============================
// Promotions API
// ============================
export const promoApi = {
  validate: (code: string, orderTotal: number) =>
    api.post('/promotions/validate', { code, order_total: orderTotal }),

  getActive: () =>
    api.get('/promotions/active'),
};

// ============================
// Users API (Admin)
// ============================
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/users', { params }),

  getById: (id: string) =>
    api.get(`/users/${id}`),

  update: (id: string, data: { name?: string; email?: string; role?: string }) =>
    api.patch(`/users/${id}`, data),
};

// ============================
// Dashboard API (derived from existing endpoints)
// ============================
export const dashboardApi = {
  getStats: async () => {
    // Build stats from available endpoints
    const [ordersRes, productsRes, usersRes] = await Promise.all([
      api.get('/orders', { params: { limit: 100 } }).catch(() => ({ data: { orders: [], pagination: { total: 0 } } })),
      api.get('/products', { params: { limit: 100 } }).catch(() => ({ data: { products: [], pagination: { total: 0 } } })),
      api.get('/users', { params: { limit: 1 } }).catch(() => ({ data: { users: [], pagination: { total: 0 } } })),
    ]);

    const orders = (ordersRes.data.orders || []) as Record<string, unknown>[];
    const totalRevenue = orders.reduce((sum: number, o: Record<string, unknown>) => sum + (parseFloat(String(o.total)) || 0), 0);

    return {
      data: {
        totalOrders: ordersRes.data.pagination?.total || orders.length,
        totalRevenue,
        totalCustomers: usersRes.data.pagination?.total || 0,
        totalProducts: productsRes.data.pagination?.total || 0,
        ordersToday: 0,
        revenueToday: 0,
        popularProducts: [],
        recentOrders: orders.slice(0, 5).map(transformOrder),
        ordersByStatus: [],
      },
    };
  },
};

export default api;
