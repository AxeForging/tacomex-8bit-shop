import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { useAuthStore } from '@/stores';

// Re-export types for backward compatibility
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    store.initAuth();
  }, []);

  const value: AuthContextType = {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateUser: store.updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// For backward compatibility, this hook works the same as before
// but now uses Zustand under the hood
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // If used outside AuthProvider, fallback to direct store usage
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
  }
  return context;
};

export default AuthContext;
