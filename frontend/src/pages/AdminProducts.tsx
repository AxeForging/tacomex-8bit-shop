import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
} from 'lucide-react';
import { LoadingSpinner, PixelButton, PixelCard, SpiceMeter } from '@/components';
import { useProducts, useCategories } from '@/hooks';
import { productsApi } from '@/services/api';
import { Product } from '@/types';
import './Admin.css';
import './AdminProducts.css';

const AdminProducts: React.FC = () => {
  const { products, isLoading, error, refetch } = useProducts();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    spiceLevel: '0',
    isAvailable: true,
    isFeatured: false,
  });

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        categoryId: product.categoryId,
        spiceLevel: product.spiceLevel.toString(),
        isAvailable: product.isAvailable,
        isFeatured: product.isFeatured,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: categories[0]?.id || '',
        spiceLevel: '0',
        isAvailable: true,
        isFeatured: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        spiceLevel: parseInt(formData.spiceLevel),
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, productData);
      } else {
        await productsApi.create(productData);
      }

      handleCloseModal();
      refetch();
    } catch (err) {
      console.error('Failed to save product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsApi.delete(productId);
      refetch();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const categoryEmojis: Record<string, string> = {
    tacos: '🌮',
    burritos: '🌯',
    quesadillas: '🧀',
    nachos: '🔺',
    sides: '🍟',
    drinks: '🥤',
    desserts: '🍮',
    combos: '🎁',
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
          <Link to="/admin/products" className="admin__nav-link admin__nav-link--active">
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
            <ShoppingBag size={24} />
            Products
          </h1>
          <p className="admin__subtitle">Manage your menu items</p>
        </div>

        {/* Actions bar */}
        <div className="admin-products__actions">
          <div className="admin-products__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <PixelButton variant="accent" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            Add Product
          </PixelButton>
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div className="admin__loading" style={{ height: '400px' }}>
            <LoadingSpinner text="Loading products..." />
          </div>
        ) : error ? (
          <div className="admin__error">
            <p>{error}</p>
            <PixelButton onClick={refetch}>Retry</PixelButton>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-products__empty">
            <span>🌮</span>
            <p>No products found</p>
            <PixelButton variant="primary" onClick={() => handleOpenModal()}>
              Add First Product
            </PixelButton>
          </div>
        ) : (
          <div className="admin-products__grid">
            {filteredProducts.map((product) => (
              <PixelCard key={product.id} className="admin-products__card" hover={false}>
                <div className="admin-products__card-image">
                  {categoryEmojis[product.category?.name?.toLowerCase() || 'tacos']}
                </div>

                <div className="admin-products__card-content">
                  <h3 className="admin-products__card-name">{product.name}</h3>
                  <p className="admin-products__card-category">
                    {product.category?.name || 'Uncategorized'}
                  </p>
                  <div className="admin-products__card-price">
                    ${product.price.toFixed(2)}
                  </div>
                  {product.spiceLevel > 0 && (
                    <div className="admin-products__card-spice">
                      <SpiceMeter
                        level={product.spiceLevel as 0 | 1 | 2 | 3 | 4 | 5}
                        size="sm"
                      />
                    </div>
                  )}
                  <div className="admin-products__card-badges">
                    {!product.isAvailable && (
                      <span className="admin-products__badge admin-products__badge--unavailable">
                        Unavailable
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="admin-products__badge admin-products__badge--featured">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                <div className="admin-products__card-actions">
                  <button
                    className="admin-products__action-btn admin-products__action-btn--edit"
                    onClick={() => handleOpenModal(product)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="admin-products__action-btn admin-products__action-btn--delete"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </PixelCard>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="admin-products__modal-overlay" onClick={handleCloseModal}>
          <div
            className="admin-products__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-products__modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="admin-products__modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form className="admin-products__form" onSubmit={handleSubmit}>
              <div className="admin-products__form-field">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="admin-products__form-field">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="admin-products__form-row">
                <div className="admin-products__form-field">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-products__form-field">
                  <label>Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-products__form-field">
                <label>Spice Level</label>
                <select
                  value={formData.spiceLevel}
                  onChange={(e) => setFormData({ ...formData, spiceLevel: e.target.value })}
                >
                  <option value="0">None</option>
                  <option value="1">Mild</option>
                  <option value="2">Medium</option>
                  <option value="3">Hot</option>
                  <option value="4">Very Hot</option>
                  <option value="5">Extreme!</option>
                </select>
              </div>

              <div className="admin-products__form-checkboxes">
                <label className="admin-products__checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({ ...formData, isAvailable: e.target.checked })
                    }
                  />
                  <span>Available</span>
                </label>

                <label className="admin-products__checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                  />
                  <span>Featured</span>
                </label>
              </div>

              <div className="admin-products__form-actions">
                <PixelButton type="button" variant="ghost" onClick={handleCloseModal}>
                  Cancel
                </PixelButton>
                <PixelButton type="submit" variant="accent" isLoading={isSubmitting}>
                  {editingProduct ? 'Update' : 'Create'}
                </PixelButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
