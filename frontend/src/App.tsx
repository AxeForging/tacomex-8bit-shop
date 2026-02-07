import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
// Context providers now use Zustand internally for state management
// They are kept for backward compatibility, but components can also use stores directly
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar, CartSidebar, Footer } from './components';
import {
  Landing,
  Menu,
  ProductDetail,
  Cart,
  Checkout,
  OrderHistory,
  OrderDetail,
  Login,
  Register,
  AdminDashboard,
  AdminOrders,
  AdminProducts,
  AdminUsers,
} from './pages';
import './styles/global.css';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh' }}>
        <div className="pixel-loading"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin route component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh' }}>
        <div className="pixel-loading"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Layout wrapper for pages with navbar and footer
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">{children}</main>
      <Footer />
      <CartSidebar />
    </div>
  );
};

// Admin layout without navbar/footer
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="admin-layout">{children}</div>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes with main layout */}
      <Route
        path="/"
        element={
          <MainLayout>
            <Landing />
          </MainLayout>
        }
      />
      <Route
        path="/menu"
        element={
          <MainLayout>
            <Menu />
          </MainLayout>
        }
      />
      <Route
        path="/product/:id"
        element={
          <MainLayout>
            <ProductDetail />
          </MainLayout>
        }
      />
      <Route
        path="/cart"
        element={
          <MainLayout>
            <Cart />
          </MainLayout>
        }
      />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Checkout />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OrderHistory />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/order/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OrderDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
