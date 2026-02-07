import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { PixelButton, SpiceMeter, LoadingSpinner } from '../components';
import { useProduct } from '../hooks';
import { useCart } from '../stores';
import { ProductOption } from '../types';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, isLoading, error } = useProduct(id || '');
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<ProductOption[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [added, setAdded] = useState(false);

  const handleOptionToggle = (option: ProductOption) => {
    setSelectedOptions((prev) =>
      prev.find((o) => o.id === option.id)
        ? prev.filter((o) => o.id !== option.id)
        : [...prev, option]
    );
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity, selectedOptions, specialInstructions);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.price, 0);
    return (product.price + optionsTotal) * quantity;
  };

  // Category emoji map
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

  if (isLoading) {
    return (
      <div className="product-detail__loading">
        <LoadingSpinner size="lg" text="Loading product..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail__error">
        <span className="product-detail__error-icon">⚠️</span>
        <p className="product-detail__error-text">
          {error || 'Product not found'}
        </p>
        <PixelButton variant="primary" onClick={() => navigate('/menu')}>
          Back to Menu
        </PixelButton>
      </div>
    );
  }

  return (
    <div className="product-detail">
      {/* Back button */}
      <button className="product-detail__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="product-detail__container">
        {/* Product image */}
        <div className="product-detail__image-section">
          <div className="product-detail__image">
            <span className="product-detail__emoji">
              {categoryEmojis[product.category?.name?.toLowerCase() || 'tacos']}
            </span>
            <div className="product-detail__image-bg"></div>
          </div>

          {product.isFeatured && (
            <div className="product-detail__featured-badge">
              FEATURED ITEM!
            </div>
          )}

          {!product.isAvailable && (
            <div className="product-detail__unavailable">
              CURRENTLY UNAVAILABLE
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="product-detail__info">
          <div className="product-detail__category">
            {product.category?.name || 'Menu Item'}
          </div>

          <h1 className="product-detail__name">{product.name}</h1>

          <div className="product-detail__price">
            ${product.price.toFixed(2)}
          </div>

          {product.spiceLevel > 0 && (
            <div className="product-detail__spice">
              <span className="product-detail__spice-label">Spice Level:</span>
              <SpiceMeter
                level={product.spiceLevel as 0 | 1 | 2 | 3 | 4 | 5}
                size="md"
                showLabel
              />
            </div>
          )}

          <p className="product-detail__description">
            {product.description}
          </p>

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <div className="product-detail__options">
              <h3 className="product-detail__options-title">Add-ons</h3>
              <div className="product-detail__options-list">
                {product.options.map((option) => (
                  <button
                    key={option.id}
                    className={`product-detail__option ${
                      selectedOptions.find((o) => o.id === option.id)
                        ? 'product-detail__option--selected'
                        : ''
                    }`}
                    onClick={() => handleOptionToggle(option)}
                  >
                    <span className="product-detail__option-check">
                      {selectedOptions.find((o) => o.id === option.id) ? (
                        <Check size={14} />
                      ) : (
                        <Plus size={14} />
                      )}
                    </span>
                    <span className="product-detail__option-name">
                      {option.name}
                    </span>
                    <span className="product-detail__option-price">
                      +${option.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div className="product-detail__instructions">
            <label className="product-detail__instructions-label">
              Special Instructions
            </label>
            <textarea
              className="product-detail__instructions-input"
              placeholder="Any special requests? (e.g., no onions, extra sauce)"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="product-detail__actions">
            <div className="product-detail__quantity">
              <button
                className="product-detail__quantity-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={18} />
              </button>
              <span className="product-detail__quantity-value">{quantity}</span>
              <button
                className="product-detail__quantity-btn"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus size={18} />
              </button>
            </div>

            <PixelButton
              variant={added ? 'secondary' : 'accent'}
              size="lg"
              onClick={handleAddToCart}
              disabled={!product.isAvailable || added}
            >
              {added ? (
                <>
                  <Check size={20} />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  Add to Cart - ${calculateTotal().toFixed(2)}
                </>
              )}
            </PixelButton>
          </div>

          {/* Pixel decoration */}
          <div className="product-detail__decoration">
            <div className="product-detail__pixel-row">
              {[...Array(8)].map((_, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor:
                      i % 4 === 0
                        ? '#FF6B35'
                        : i % 4 === 1
                        ? '#FFD700'
                        : i % 4 === 2
                        ? '#00A86B'
                        : '#DC143C',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
