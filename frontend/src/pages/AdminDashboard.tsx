import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  Tag,
} from 'lucide-react';
import { LoadingSpinner, OrderStatusBadge, PixelCard } from '@/components';
import { useDashboardStats } from '@/hooks';
import './Admin.css';

const AdminDashboard: React.FC = () => {
  const { stats, isLoading, error } = useDashboardStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="admin__loading">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin__error">
        <span className="admin__error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  // Mock data for demo
  const mockStats = {
    totalOrders: stats?.totalOrders || 156,
    totalRevenue: stats?.totalRevenue || 4523.45,
    totalCustomers: stats?.totalCustomers || 89,
    totalProducts: stats?.totalProducts || 24,
    ordersToday: stats?.ordersToday || 12,
    revenueToday: stats?.revenueToday || 345.67,
    recentOrders: stats?.recentOrders || [],
    popularProducts: stats?.popularProducts || [],
  };

  return (
    <div className="admin">
      {/* Sidebar */}
      <aside className="admin__sidebar">
        <div className="admin__sidebar-header">
          <span className="admin__sidebar-icon">🌮</span>
          <span className="admin__sidebar-title">Admin</span>
        </div>
        <nav className="admin__nav">
          <Link to="/admin" className="admin__nav-link admin__nav-link--active">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link to="/admin/orders" className="admin__nav-link">
            <Package size={18} />
            Orders
          </Link>
          <Link to="/admin/products" className="admin__nav-link">
            <ShoppingBag size={18} />
            Products
          </Link>
          <Link to="/admin/coupons" className="admin__nav-link">
            <Tag size={18} />
            Coupons
          </Link>
          <Link to="/admin/users" className="admin__nav-link">
            <Users size={18} />
            Users
          </Link>
        </nav>
        <div className="admin__sidebar-footer">
          <Link to="/" className="admin__back-link">
            &lt; Back to Shop
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin__main">
        <div className="admin__header">
          <h1 className="admin__title">
            <LayoutDashboard size={24} />
            Dashboard
          </h1>
          <p className="admin__subtitle">Overview of your taco empire!</p>
        </div>

        {/* Stats Grid */}
        <div className="admin__stats-grid">
          <PixelCard className="admin__stat-card">
            <div className="admin__stat-icon admin__stat-icon--orders">
              <Package size={24} />
            </div>
            <div className="admin__stat-info">
              <span className="admin__stat-value">{mockStats.totalOrders}</span>
              <span className="admin__stat-label">Total Orders</span>
            </div>
          </PixelCard>

          <PixelCard className="admin__stat-card">
            <div className="admin__stat-icon admin__stat-icon--revenue">
              <DollarSign size={24} />
            </div>
            <div className="admin__stat-info">
              <span className="admin__stat-value">
                {formatCurrency(mockStats.totalRevenue)}
              </span>
              <span className="admin__stat-label">Total Revenue</span>
            </div>
          </PixelCard>

          <PixelCard className="admin__stat-card">
            <div className="admin__stat-icon admin__stat-icon--customers">
              <Users size={24} />
            </div>
            <div className="admin__stat-info">
              <span className="admin__stat-value">{mockStats.totalCustomers}</span>
              <span className="admin__stat-label">Customers</span>
            </div>
          </PixelCard>

          <PixelCard className="admin__stat-card">
            <div className="admin__stat-icon admin__stat-icon--products">
              <ShoppingBag size={24} />
            </div>
            <div className="admin__stat-info">
              <span className="admin__stat-value">{mockStats.totalProducts}</span>
              <span className="admin__stat-label">Products</span>
            </div>
          </PixelCard>
        </div>

        {/* Today's Stats */}
        <div className="admin__today">
          <PixelCard className="admin__today-card">
            <div className="admin__today-header">
              <TrendingUp size={18} />
              <span>Today's Activity</span>
            </div>
            <div className="admin__today-stats">
              <div className="admin__today-stat">
                <span className="admin__today-value">{mockStats.ordersToday}</span>
                <span className="admin__today-label">Orders</span>
              </div>
              <div className="admin__today-stat">
                <span className="admin__today-value">
                  {formatCurrency(mockStats.revenueToday)}
                </span>
                <span className="admin__today-label">Revenue</span>
              </div>
            </div>
          </PixelCard>
        </div>

        {/* Content Grid */}
        <div className="admin__content-grid">
          {/* Recent Orders */}
          <PixelCard className="admin__recent-orders" hover={false}>
            <div className="admin__card-header">
              <h2 className="admin__card-title">
                <Clock size={18} />
                Recent Orders
              </h2>
              <Link to="/admin/orders" className="admin__view-all">
                View All
              </Link>
            </div>
            <div className="admin__orders-list">
              {mockStats.recentOrders.length > 0 ? (
                mockStats.recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="admin__order-item">
                    <div className="admin__order-info">
                      <span className="admin__order-id">
                        #{String(order.id).padStart(4, '0')}
                      </span>
                      <span className="admin__order-customer">
                        {order.user?.name || 'Customer'}
                      </span>
                    </div>
                    <div className="admin__order-details">
                      <OrderStatusBadge status={order.status} size="sm" />
                      <span className="admin__order-total">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin__empty-list">
                  <span>📦</span>
                  <p>No recent orders</p>
                </div>
              )}
            </div>
          </PixelCard>

          {/* Quick Actions */}
          <PixelCard className="admin__quick-actions" hover={false}>
            <h2 className="admin__card-title">Quick Actions</h2>
            <div className="admin__actions-grid">
              <Link to="/admin/orders" className="admin__action-btn">
                <Package size={24} />
                <span>Manage Orders</span>
              </Link>
              <Link to="/admin/products" className="admin__action-btn">
                <ShoppingBag size={24} />
                <span>Add Product</span>
              </Link>
              <Link to="/admin/users" className="admin__action-btn">
                <Users size={24} />
                <span>View Users</span>
              </Link>
              <Link to="/admin/coupons" className="admin__action-btn">
                <Tag size={24} />
                <span>Manage Coupons</span>
              </Link>
              <Link to="/menu" className="admin__action-btn">
                <span className="admin__action-emoji">🌮</span>
                <span>View Menu</span>
              </Link>
            </div>
          </PixelCard>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
