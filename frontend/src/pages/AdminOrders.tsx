import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Tag,
  Search,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { OrderStatusBadge, LoadingSpinner, PixelButton, PixelCard } from '@/components';
import { useAllOrders, useUpdateOrderStatus } from '@/hooks';
import { OrderStatus } from '@/types';
import './Admin.css';
import './AdminOrders.css';

const statusOptions: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const AdminOrders: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { orders, isLoading, error, refetch } = useAllOrders({ status: statusFilter || undefined });
  const { updateStatus, isLoading: updating } = useUpdateOrderStatus();

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.user?.name?.toLowerCase().includes(searchLower) ||
      order.user?.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleUpdateStatus = async (orderId: string) => {
    if (!newStatus) return;
    try {
      await updateStatus(orderId, newStatus);
      setSelectedOrder(null);
      setNewStatus('');
      refetch();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
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
          <Link to="/admin" className="admin__nav-link">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link to="/admin/orders" className="admin__nav-link admin__nav-link--active">
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
            <Package size={24} />
            Orders
          </h1>
          <p className="admin__subtitle">Manage customer orders</p>
        </div>

        {/* Filters */}
        <div className="admin-orders__filters">
          <div className="admin-orders__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="admin-orders__status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>

          <PixelButton variant="secondary" onClick={refetch}>
            <RefreshCw size={14} />
            Refresh
          </PixelButton>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="admin__loading" style={{ height: '400px' }}>
            <LoadingSpinner text="Loading orders..." />
          </div>
        ) : error ? (
          <div className="admin__error">
            <p>{error}</p>
            <PixelButton onClick={refetch}>Retry</PixelButton>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-orders__empty">
            <span>📦</span>
            <p>No orders found</p>
          </div>
        ) : (
          <div className="admin-orders__list">
            {filteredOrders.map((order) => (
              <PixelCard key={order.id} className="admin-orders__card" hover={false}>
                <div className="admin-orders__card-header">
                  <div className="admin-orders__order-info">
                    <span className="admin-orders__order-id">
                      #{String(order.id).padStart(4, '0')}
                    </span>
                    <span className="admin-orders__order-date">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="admin-orders__card-body">
                  <div className="admin-orders__customer">
                    <span className="admin-orders__customer-name">
                      {order.user?.name || 'Guest'}
                    </span>
                    <span className="admin-orders__customer-email">
                      {order.user?.email || 'No email'}
                    </span>
                  </div>

                  <div className="admin-orders__items">
                    {order.items.slice(0, 3).map((item, index) => (
                      <span key={index}>
                        {item.quantity}x {item.product?.name || 'Item'}
                        {index < Math.min(order.items.length - 1, 2) && ', '}
                      </span>
                    ))}
                    {order.items.length > 3 && ` +${order.items.length - 3} more`}
                  </div>

                  <div className="admin-orders__total">
                    {formatCurrency(order.total)}
                  </div>
                </div>

                <div className="admin-orders__card-footer">
                  {selectedOrder === order.id ? (
                    <div className="admin-orders__status-update">
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      >
                        <option value="">Select status</option>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <PixelButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id)}
                        isLoading={updating}
                        disabled={!newStatus}
                      >
                        Update
                      </PixelButton>
                      <PixelButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(null);
                          setNewStatus('');
                        }}
                      >
                        Cancel
                      </PixelButton>
                    </div>
                  ) : (
                    <div className="admin-orders__actions">
                      <PixelButton
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedOrder(order.id)}
                      >
                        Update Status
                      </PixelButton>
                      <Link
                        to={`/order/${order.id}`}
                        className="admin-orders__view-link"
                      >
                        View Details
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              </PixelCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminOrders;
