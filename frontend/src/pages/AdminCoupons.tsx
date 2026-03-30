import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Tag,
  Plus,
  Edit,
  Search,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { LoadingSpinner, PixelButton } from '@/components';
import { promotionsApi } from '@/services/api';
import './Admin.css';
import './AdminCoupons.css';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    starts_at: '',
    expires_at: '',
    is_active: true,
  });

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 100 };
      if (statusFilter === 'active') params.active = true;
      if (statusFilter === 'inactive') params.active = false;
      const res = await promotionsApi.getAll(params);
      const data = res.data.promotions || res.data || [];
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      setError('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const getCouponStatus = (coupon: Coupon): 'active' | 'expired' | 'disabled' | 'scheduled' => {
    if (!coupon.is_active) return 'disabled';
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) return 'scheduled';
    if (coupon.expires_at && new Date(coupon.expires_at) < now) return 'expired';
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) return 'expired';
    return 'active';
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coupon.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: String(coupon.discount_value),
        min_order_amount: coupon.min_order_amount ? String(coupon.min_order_amount) : '',
        max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
        starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
        expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
        is_active: coupon.is_active,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        max_uses: '',
        starts_at: '',
        expires_at: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        is_active: formData.is_active,
      };

      if (formData.min_order_amount) {
        payload.min_order_amount = parseFloat(formData.min_order_amount);
      }
      if (formData.max_uses) {
        payload.max_uses = parseInt(formData.max_uses);
      }
      if (formData.starts_at) {
        payload.starts_at = new Date(formData.starts_at).toISOString();
      }
      if (formData.expires_at) {
        payload.expires_at = new Date(formData.expires_at).toISOString();
      }

      if (editingCoupon) {
        await promotionsApi.update(editingCoupon.id, payload);
      } else {
        await promotionsApi.create(payload);
      }

      handleCloseModal();
      fetchCoupons();
    } catch (err) {
      console.error('Failed to save coupon:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await promotionsApi.update(coupon.id, { is_active: !coupon.is_active });
      fetchCoupons();
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `$${Number(coupon.discount_value).toFixed(2)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getUsagePercent = (coupon: Coupon) => {
    if (!coupon.max_uses) return 0;
    return Math.min(100, (coupon.current_uses / coupon.max_uses) * 100);
  };

  const getUsageFillClass = (percent: number) => {
    if (percent >= 100) return 'admin-coupons__usage-fill admin-coupons__usage-fill--full';
    if (percent >= 75) return 'admin-coupons__usage-fill admin-coupons__usage-fill--warning';
    return 'admin-coupons__usage-fill';
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
          <Link to="/admin/coupons" className="admin__nav-link admin__nav-link--active">
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
            <Tag size={24} />
            Coupons
          </h1>
          <p className="admin__subtitle">Manage promotions and discount codes</p>
        </div>

        {/* Actions bar */}
        <div className="admin-coupons__actions">
          <div className="admin-coupons__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="admin-coupons__filter">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <PixelButton variant="accent" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            Add Coupon
          </PixelButton>
        </div>

        {/* Coupons table */}
        {isLoading ? (
          <div className="admin__loading" style={{ height: '400px' }}>
            <LoadingSpinner text="Loading coupons..." />
          </div>
        ) : error ? (
          <div className="admin__error">
            <p>{error}</p>
            <PixelButton onClick={fetchCoupons}>Retry</PixelButton>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="admin-coupons__empty">
            <span>🏷️</span>
            <p>No coupons found</p>
            <PixelButton variant="primary" onClick={() => handleOpenModal()}>
              Create First Coupon
            </PixelButton>
          </div>
        ) : (
          <div className="admin-coupons__table-wrap">
            <table className="admin-coupons__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  const usagePercent = getUsagePercent(coupon);
                  return (
                    <tr key={coupon.id}>
                      <td>
                        <span className="admin-coupons__code">{coupon.code}</span>
                      </td>
                      <td>
                        <span className="admin-coupons__desc">
                          {coupon.description || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="admin-coupons__discount">
                          {formatDiscount(coupon)}
                        </span>
                      </td>
                      <td>
                        {coupon.min_order_amount
                          ? `$${Number(coupon.min_order_amount).toFixed(2)}`
                          : '-'}
                      </td>
                      <td>
                        <div className="admin-coupons__usage">
                          {coupon.max_uses ? (
                            <>
                              <div className="admin-coupons__usage-bar">
                                <div
                                  className={getUsageFillClass(usagePercent)}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                              <span className="admin-coupons__usage-text">
                                {coupon.current_uses}/{coupon.max_uses}
                              </span>
                            </>
                          ) : (
                            <span className="admin-coupons__usage-text">
                              {coupon.current_uses} (no limit)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-coupons__dates">
                          {formatDate(coupon.starts_at)} - {formatDate(coupon.expires_at)}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-coupons__status admin-coupons__status--${status}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-coupons__table-actions">
                          <button
                            className="admin-coupons__action-btn admin-coupons__action-btn--edit"
                            onClick={() => handleOpenModal(coupon)}
                            title="Edit coupon"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className={`admin-coupons__action-btn admin-coupons__action-btn--toggle ${
                              !coupon.is_active ? 'admin-coupons__action-btn--inactive' : ''
                            }`}
                            onClick={() => handleToggleActive(coupon)}
                            title={coupon.is_active ? 'Disable coupon' : 'Enable coupon'}
                          >
                            {coupon.is_active ? (
                              <ToggleRight size={14} />
                            ) : (
                              <ToggleLeft size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="admin-coupons__modal-overlay" onClick={handleCloseModal}>
          <div
            className="admin-coupons__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-coupons__modal-header">
              <h2>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button className="admin-coupons__modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form className="admin-coupons__form" onSubmit={handleSubmit}>
              <div className="admin-coupons__form-field">
                <label>Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. TACO20"
                  required
                />
              </div>

              <div className="admin-coupons__form-field">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Coupon description..."
                />
              </div>

              <div className="admin-coupons__form-row">
                <div className="admin-coupons__form-field">
                  <label>Discount Type *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>

                <div className="admin-coupons__form-field">
                  <label>
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    placeholder={formData.discount_type === 'percentage' ? '20' : '5.00'}
                    required
                  />
                </div>
              </div>

              <div className="admin-coupons__form-row">
                <div className="admin-coupons__form-field">
                  <label>Min Order Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_order_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order_amount: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="admin-coupons__form-field">
                  <label>Max Uses</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_uses}
                    onChange={(e) =>
                      setFormData({ ...formData, max_uses: e.target.value })
                    }
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="admin-coupons__form-row">
                <div className="admin-coupons__form-field">
                  <label>Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) =>
                      setFormData({ ...formData, starts_at: e.target.value })
                    }
                  />
                </div>

                <div className="admin-coupons__form-field">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                  />
                </div>
              </div>

              {editingCoupon && (
                <div className="admin-coupons__form-checkboxes">
                  <label className="admin-coupons__checkbox">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                    />
                    <span>Active</span>
                  </label>
                </div>
              )}

              <div className="admin-coupons__form-actions">
                <PixelButton type="button" variant="ghost" onClick={handleCloseModal}>
                  Cancel
                </PixelButton>
                <PixelButton type="submit" variant="accent" isLoading={isSubmitting}>
                  {editingCoupon ? 'Update' : 'Create'}
                </PixelButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
