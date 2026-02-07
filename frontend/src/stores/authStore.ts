import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';
import { authApi, transformUser } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  initAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const { token } = response.data;
          const rawUser = response.data.user;
          const user = rawUser ? transformUser(rawUser) : null;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: { name: string; email: string; password: string; phone?: string }) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { token } = response.data;
          const rawUser = response.data.user;
          const user = rawUser ? transformUser(rawUser) : null;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (user: User) => {
        set({ user });
      },

      initAuth: async () => {
        const { token, user } = get();

        if (token && user) {
          try {
            // Verify token is still valid
            const response = await authApi.getProfile();
            const rawUser = response.data.user || response.data;
            set({
              user: rawUser ? transformUser(rawUser) : null,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch {
            // Token invalid - clear auth
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'tacomex-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for convenience
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateUser: store.updateUser,
  };
};
