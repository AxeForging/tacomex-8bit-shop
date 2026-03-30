import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types';
import { ordersApi, transformOrder } from '@/services/api';

export const useMyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.getMyOrders();
      const raw = response.data.orders || response.data.data || response.data || [];
      setOrders(Array.isArray(raw) ? raw.map(transformOrder) : []);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders };
};

export const useOrder = (id: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.getById(id);
      const raw = response.data.order || response.data.data || response.data;
      setOrder(raw ? transformOrder(raw) : null);
    } catch (err) {
      setError('Failed to load order');
      console.error('Error fetching order:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, isLoading, error, refetch: fetchOrder };
};

interface UseAllOrdersParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const useAllOrders = (params?: UseAllOrdersParams) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.getAll(params);
      const data = response.data;
      const raw = data.orders || data.data || [];
      setOrders(Array.isArray(raw) ? raw.map(transformOrder) : []);
      setTotal(data.pagination?.total || data.total || 0);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.status, params?.page, params?.limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, total, isLoading, error, refetch: fetchOrders };
};

export const useUpdateOrderStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (orderId: string, status: string, notes?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.updateStatus(orderId, status, notes);
      setIsLoading(false);
      return response.data;
    } catch (err) {
      setError('Failed to update order status');
      setIsLoading(false);
      throw err;
    }
  };

  return { updateStatus, isLoading, error };
};
