import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Search,
  Mail,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { LoadingSpinner, PixelButton, PixelCard } from '../components';
import { useUsers } from '../hooks';
import { usersApi } from '../services/api';
import './Admin.css';
import './AdminUsers.css';

const AdminUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, isLoading, error, refetch } = useUsers({ search: searchTerm || undefined });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await usersApi.update(userId, { role: newRole });
      refetch();
    } catch (err) {
      console.error('Failed to update user role:', err);
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
          <Link to="/admin/orders" className="admin__nav-link">
            <Package size={18} />
            Orders
          </Link>
          <Link to="/admin/products" className="admin__nav-link">
            <ShoppingBag size={18} />
            Products
          </Link>
          <Link to="/admin/users" className="admin__nav-link admin__nav-link--active">
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
            <Users size={24} />
            Users
          </h1>
          <p className="admin__subtitle">Manage customer accounts</p>
        </div>

        {/* Search */}
        <div className="admin-users__search-bar">
          <div className="admin-users__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users list */}
        {isLoading ? (
          <div className="admin__loading" style={{ height: '400px' }}>
            <LoadingSpinner text="Loading users..." />
          </div>
        ) : error ? (
          <div className="admin__error">
            <p>{error}</p>
            <PixelButton onClick={refetch}>Retry</PixelButton>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-users__empty">
            <span>👥</span>
            <p>No users found</p>
          </div>
        ) : (
          <div className="admin-users__list">
            {users.map((user) => (
              <PixelCard key={user.id} className="admin-users__card" hover={false}>
                <div className="admin-users__avatar">
                  <UserIcon size={32} />
                </div>

                <div className="admin-users__info">
                  <div className="admin-users__name">{user.name}</div>
                  <div className="admin-users__email">
                    <Mail size={12} />
                    {user.email}
                  </div>
                  <div className="admin-users__joined">
                    Joined {formatDate(user.createdAt)}
                  </div>
                </div>

                <div className="admin-users__role">
                  <div className={`admin-users__role-badge admin-users__role-badge--${user.role}`}>
                    <Shield size={12} />
                    {user.role}
                  </div>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="admin-users__role-select"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </PixelCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsers;
