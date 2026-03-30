import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { PixelButton } from '@/components';
import { useCart, useAuth } from '@/stores';
import './Cart.css';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    items,
    subtotal,
    tax,
    deliveryFee,
    discount,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const handleCheckout = () => {
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

  if (items.length === 0) {
    return (
      <div className="cart cart--empty">
        <div className="cart__empty-content">
          <span className="cart__empty-icon">🛒</span>
          <h1 className="cart__empty-title">Your Cart is Empty!</h1>
          <p className="cart__empty-text">
            Looks like you haven't added any items yet.
            <br />
            Time to fill it up with delicious tacos!
          </p>
          <PixelButton variant="primary" size="lg" onClick={() => navigate('/menu')}>
            Browse Menu
          </PixelButton>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      {/* Header */}
      <div className="cart__header">
        <button className="cart__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Continue Shopping
        </button>
        <h1 className="cart__title">
          <ShoppingBag size={24} />
          Your Cart
        </h1>
        <span className="cart__item-count">{items.length} item(s)</span>
      </div>

      <div className="cart__container">
        {/* Cart Items */}
        <div className="cart__items-section">
          <div className="cart__items">
            {items.map((item) => (
              <div key={item.id} className="cart__item">
                <div className="cart__item-image">
                  {getCategoryEmoji(item.product.category?.name || 'tacos')}
                </div>

                <div className="cart__item-details">
                  <Link
                    to={`/product/${item.product.id}`}
                    className="cart__item-name"
                  >
                    {item.product.name}
                  </Link>

                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="cart__item-options">
                      Extras: {item.selectedOptions.map((o) => o.name).join(', ')}
                    </p>
                  )}

                  {item.specialInstructions && (
                    <p className="cart__item-instructions">
                      "{item.specialInstructions}"
                    </p>
                  )}

                  <div className="cart__item-price-unit">
                    ${item.product.price.toFixed(2)} each
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <span>
                        {' '}
                        + ${item.selectedOptions.reduce((s, o) => s + o.price, 0).toFixed(2)} extras
                      </span>
                    )}
                  </div>
                </div>

                <div className="cart__item-actions">
                  <div className="cart__item-quantity">
                    <button
                      className="cart__quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="cart__quantity-value">{item.quantity}</span>
                    <button
                      className="cart__quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="cart__item-total">
                    $
                    {(
                      (item.product.price +
                        (item.selectedOptions?.reduce((s, o) => s + o.price, 0) || 0)) *
                      item.quantity
                    ).toFixed(2)}
                  </div>

                  <button
                    className="cart__remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="cart__clear" onClick={clearCart}>
            Clear All Items
          </button>
        </div>

        {/* Order Summary */}
        <div className="cart__summary-section">
          <div className="cart__summary">
            <h2 className="cart__summary-title">Order Summary</h2>

            <div className="cart__summary-rows">
              <div className="cart__summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart__summary-row">
                <span>Tax (8.25%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="cart__summary-row">
                <span>Delivery</span>
                <span>
                  {deliveryFee > 0 ? (
                    `$${deliveryFee.toFixed(2)}`
                  ) : (
                    <span className="cart__free-delivery">FREE!</span>
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="cart__summary-row cart__summary-row--discount">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="cart__summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {subtotal < 25 && (
              <div className="cart__free-delivery-info">
                <span className="cart__free-delivery-icon">🚚</span>
                <p>
                  Add ${(25 - subtotal).toFixed(2)} more for FREE delivery!
                </p>
              </div>
            )}

            <PixelButton
              variant="accent"
              size="lg"
              fullWidth
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </PixelButton>

            <Link to="/menu" className="cart__continue-link">
              &lt; Continue Shopping
            </Link>
          </div>

          {/* Promo Section */}
          <div className="cart__promo-info">
            <span className="cart__promo-icon">🎮</span>
            <p className="cart__promo-text">
              Have a promo code? Apply it at checkout!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
