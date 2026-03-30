import { useState, useEffect, useCallback } from 'react';
import { User, DashboardStats } from '@/types';
import { usersApi, dashboardApi, transformUser } from '@/services/api';

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.getStats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
};

interface UseUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const useUsers = (params?: UseUsersParams) => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersApi.getAll(params);
      const data = response.data;
      const raw = data.users || data.data || [];
      setUsers(Array.isArray(raw) ? raw.map(transformUser) : []);
      setTotal(data.pagination?.total || data.total || 0);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.page, params?.limit, params?.search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, total, isLoading, error, refetch: fetchUsers };
};

export const useUser = (id: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await usersApi.getById(id);
        const raw = response.data.user || response.data.data || response.data;
        setUser(raw ? transformUser(raw) : null);
      } catch (err) {
        setError('Failed to load user');
        console.error('Error fetching user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  return { user, isLoading, error };
};
