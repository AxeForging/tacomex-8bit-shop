import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, transformNotification } from '@/services/api';
import { useAuth } from '@/stores';

export function useNotificationCount() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: async () => {
      const res = await notificationsApi.getAll({ limit: 1 });
      return res.data.unread_count || 0;
    },
    enabled: isAuthenticated,
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  });
}

export function useNotifications(channel?: 'email' | 'sms') {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['notifications', channel || 'all'],
    queryFn: async () => {
      const res = await notificationsApi.getAll({ channel, limit: 50 });
      return {
        notifications: (res.data.notifications || []).map(transformNotification),
        unreadCount: res.data.unread_count || 0,
        pagination: res.data.pagination,
      };
    },
    enabled: isAuthenticated,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
