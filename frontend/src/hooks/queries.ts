import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category, Order } from '../types';
import {
  productsApi,
  categoriesApi,
  ordersApi,
  promoApi,
  usersApi,
  transformProduct,
  transformCategory,
  transformOrder,
  transformUser,
} from '../services/api';

// ============================
// Query Keys
// ============================
export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params?: Record<string, unknown>) => ['products', 'list', params] as const,
    featured: ['products', 'featured'] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (params?: Record<string, unknown>) => ['orders', 'list', params] as const,
    my: ['orders', 'my'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
};

// ============================
// Product Queries
// ============================
export function useProductsQuery(params?: { category?: string; search?: string; spiceLevel?: number; featured?: boolean }) {
  return useQuery<Product[]>({
    queryKey: queryKeys.products.list(params as Record<string, unknown>),
    queryFn: async () => {
      const response = await productsApi.getAll(params);
      const raw = response.data.products || response.data.data || response.data || [];
      return Array.isArray(raw) ? raw.map(transformProduct) : [];
    },
  });
}

export function useFeaturedProductsQuery() {
  return useQuery<Product[]>({
    queryKey: queryKeys.products.featured,
    queryFn: async () => {
      const response = await productsApi.getFeatured();
      const raw = response.data.products || response.data.data || response.data || [];
      return Array.isArray(raw) ? raw.map(transformProduct) : [];
    },
  });
}

export function useProductQuery(id: string) {
  return useQuery<Product | null>({
    queryKey: queryKeys.products.detail(id),
    queryFn: async () => {
      const response = await productsApi.getById(id);
      const raw = response.data.product || response.data.data || response.data;
      return raw ? transformProduct(raw) : null;
    },
    enabled: !!id,
  });
}

// ============================
// Category Queries
// ============================
export function useCategoriesQuery() {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      const raw = response.data.categories || response.data.data || response.data || [];
      return Array.isArray(raw) ? raw.map(transformCategory) : [];
    },
  });
}

// ============================
// Order Queries
// ============================
export function useMyOrdersQuery() {
  return useQuery<Order[]>({
    queryKey: queryKeys.orders.my,
    queryFn: async () => {
      const response = await ordersApi.getMyOrders();
      const raw = response.data.orders || response.data.data || response.data || [];
      return Array.isArray(raw) ? raw.map(transformOrder) : [];
    },
  });
}

export function useOrderQuery(id: string) {
  return useQuery<Order | null>({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async () => {
      const response = await ordersApi.getById(id);
      const raw = response.data.order || response.data.data || response.data;
      return raw ? transformOrder(raw) : null;
    },
    enabled: !!id,
  });
}

export function useAllOrdersQuery(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.orders.list(params as Record<string, unknown>),
    queryFn: async () => {
      const response = await ordersApi.getAll(params);
      const data = response.data;
      const raw = data.orders || data.data || [];
      return {
        orders: Array.isArray(raw) ? raw.map(transformOrder) : [],
        total: data.pagination?.total || data.total || 0,
      };
    },
  });
}

// ============================
// Mutations
// ============================
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof ordersApi.create>[0]) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      ordersApi.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useValidatePromoMutation() {
  return useMutation({
    mutationFn: ({ code, orderTotal }: { code: string; orderTotal: number }) =>
      promoApi.validate(code, orderTotal),
  });
}

// ============================
// User Queries (Admin)
// ============================
export function useUsersQuery(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: async () => {
      const response = await usersApi.getAll(params);
      const data = response.data;
      const raw = data.users || data.data || [];
      return {
        users: Array.isArray(raw) ? raw.map(transformUser) : [],
        total: data.pagination?.total || data.total || 0,
      };
    },
  });
}
