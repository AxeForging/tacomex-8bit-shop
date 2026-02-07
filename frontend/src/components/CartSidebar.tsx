import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, Tag, ShoppingBag } from 'lucide-react';
import { useCart, useAuth } from '../stores';
import PixelButton from './PixelButton';
import './CartSidebar.css';

const CartSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    items,
    subtotal,
    tax,
    deliveryFee,
    discount,
    total,
    promoCode,
    isCartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
    applyPromoCode,
    removePromoCode,
    clearCart,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    const success = await applyPromoCode(promoInput.trim());
    if (!success) {
      setPromoError('Invalid or expired promo code');
    } else {
      setPromoInput('');
    }
    setPromoLoading(false);
  };

  const handleCheckout = () => {
    setCartOpen(false);
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

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
    return emojiMap[categoryName?.toLowerCase()] || '🌮';
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="cart-sidebar__overlay" onClick={() => setCartOpen(false)} />

      {/* Sidebar */}
      <div className="cart-sidebar">
        {/* Header */}
        <div className="cart-sidebar__header">
          <h2 className="cart-sidebar__title">
            <ShoppingBag size={20} />
            Your Cart
          </h2>
          <button
            className="cart-sidebar__close"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="cart-sidebar__empty">
            <span className="cart-sidebar__empty-icon">🌮</span>
            <p className="cart-sidebar__empty-text">Your cart is empty!</p>
            <p className="cart-sidebar__empty-subtext">Add some delicious items from our menu</p>
            <PixelButton
              variant="primary"
              onClick={() => {
                setCartOpen(false);
                navigate('/menu');
              }}
            >
              Browse Menu
            </PixelButton>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="cart-sidebar__items">
              {items.map((item) => (
                <div key={item.id} className="cart-sidebar__item">
                  <div className="cart-sidebar__item-image">
                    {getCategoryEmoji(item.product.category?.name || 'tacos')}
                  </div>

                  <div className="cart-sidebar__item-info">
                    <h4 className="cart-sidebar__item-name">{item.product.name}</h4>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="cart-sidebar__item-options">
                        + {item.selectedOptions.map(o => o.name).join(', ')}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="cart-sidebar__item-instructions">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                    <p className="cart-sidebar__item-price">
                      ${(
                        (item.product.price +
                          (item.selectedOptions?.reduce((sum, o) => sum + o.price, 0) || 0)) *
                        item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="cart-sidebar__item-actions">
                    <div className="cart-sidebar__quantity">
                      <button
                        className="cart-sidebar__quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-sidebar__quantity-value">{item.quantity}</span>
                      <button
                        className="cart-sidebar__quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className="cart-sidebar__remove-btn"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div className="cart-sidebar__promo">
              {promoCode ? (
                <div className="cart-sidebar__promo-applied">
                  <Tag size={16} />
                  <span>Code "{promoCode}" applied!</span>
                  <button onClick={removePromoCode}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-sidebar__promo-input">
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                    />
                    <PixelButton
                      variant="secondary"
                      size="sm"
                      onClick={handleApplyPromo}
                      isLoading={promoLoading}
                    >
                      Apply
                    </PixelButton>
                  </div>
                  {promoError && (
                    <p className="cart-sidebar__promo-error">{promoError}</p>
                  )}
                </>
              )}
            </div>

            {/* Summary */}
            <div className="cart-sidebar__summary">
              <div className="cart-sidebar__summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-sidebar__summary-row">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="cart-sidebar__summary-row">
                <span>Delivery</span>
                <span>{deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'FREE'}</span>
              </div>
              {discount > 0 && (
                <div className="cart-sidebar__summary-row cart-sidebar__summary-row--discount">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="cart-sidebar__summary-row cart-sidebar__summary-row--total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer actions */}
            <div className="cart-sidebar__footer">
              <PixelButton variant="accent" fullWidth onClick={handleCheckout}>
                Checkout
              </PixelButton>
              <button className="cart-sidebar__clear" onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
