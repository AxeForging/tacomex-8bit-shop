import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/stores';
import SpiceMeter from '@/components/SpiceMeter';
import PixelButton from '@/components/PixelButton';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

const getCategoryEmoji = (categoryName: string): string => {
  const emojiMap: Record<string, string> = {
    tacos: '🌮',
    burritos: '🌯',
    quesadillas: '🧀',
    nachos: '🔺',
    sides: '🍟',
    drinks: '🥤',
    desserts: '🍮',
    combos: '🎁',
  };
  return emojiMap[categoryName.toLowerCase()] || '🌮';
};

const ProductCard: React.FC<ProductCardProps> = ({ product, featured = false }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [coinParticles, setCoinParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);

    // Trigger visual feedback
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 600);

    // Spawn coin particles from button position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newParticles = Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + i,
      x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 20,
      y: rect.top,
    }));
    setCoinParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setCoinParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 700);
  }, [addToCart, product]);

  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      className={`product-card ${featured ? 'product-card--featured' : ''} ${!product.isAvailable ? 'product-card--unavailable' : ''} ${addedFeedback ? 'product-card--added' : ''}`}
      onClick={handleViewDetails}
    >
      {/* Coin particles */}
      {coinParticles.map((p) => (
        <span
          key={p.id}
          className="product-card__coin-particle"
          style={{ position: 'fixed', left: p.x, top: p.y, zIndex: 9999 }}
        >
          ⭐
        </span>
      ))}

      {/* Featured badge */}
      {featured && (
        <div className="product-card__badge product-card__badge--featured">
          FEATURED
        </div>
      )}

      {/* Unavailable overlay */}
      {!product.isAvailable && (
        <div className="product-card__unavailable-overlay">
          <span>SOLD OUT</span>
        </div>
      )}

      {/* Product image placeholder */}
      <div className="product-card__image">
        <span className="product-card__emoji">
          {getCategoryEmoji(product.category?.name || 'tacos')}
        </span>
        <div className="product-card__image-bg"></div>
        <div className="product-card__image-shine"></div>
      </div>

      {/* Product info */}
      <div className="product-card__content">
        <h3 className="product-card__name">{product.name}</h3>

        <p className="product-card__description">
          {product.description.length > 60
            ? `${product.description.substring(0, 60)}...`
            : product.description}
        </p>

        {product.spiceLevel > 0 && (
          <div className="product-card__spice">
            <SpiceMeter level={product.spiceLevel as 0 | 1 | 2 | 3 | 4 | 5} size="sm" />
          </div>
        )}

        <div className="product-card__footer">
          <div className="product-card__price">
            <span className="product-card__price-symbol">$</span>
            <span className="product-card__price-value">{product.price.toFixed(2)}</span>
          </div>

          <div className="product-card__actions">
            <button
              className="product-card__action-btn product-card__action-btn--view"
              onClick={handleViewDetails}
              title="View Details"
            >
              <Eye size={16} />
            </button>
            {product.isAvailable && (
              <button
                className={`product-card__action-btn product-card__action-btn--cart ${addedFeedback ? 'product-card__action-btn--added' : ''}`}
                onClick={handleAddToCart}
                title="Add to Cart"
              >
                <ShoppingCart size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pixel corner decorations */}
      <div className="product-card__corner product-card__corner--tl"></div>
      <div className="product-card__corner product-card__corner--tr"></div>
      <div className="product-card__corner product-card__corner--bl"></div>
      <div className="product-card__corner product-card__corner--br"></div>
    </div>
  );
};

export default ProductCard;
