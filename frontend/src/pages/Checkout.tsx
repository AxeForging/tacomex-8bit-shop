import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Tag, Check, X } from 'lucide-react';
import { PixelButton, LoadingSpinner } from '../components';
import { useCart } from '../stores';
import { ordersApi } from '../services/api';
import './Checkout.css';

interface DeliveryForm {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  instructions: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    tax,
    deliveryFee,
    discount,
    total,
    promoCode,
    applyPromoCode,
    removePromoCode,
    clearCart,
  } = useCart();

  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    instructions: '',
  });

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDeliveryForm((prev) => ({ ...prev, [name]: value }));
  };

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

  const validateForm = (): boolean => {
    if (!deliveryForm.street || !deliveryForm.city || !deliveryForm.state || !deliveryForm.zipCode || !deliveryForm.phone) {
      setError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const deliveryAddress = `${deliveryForm.street}, ${deliveryForm.city}, ${deliveryForm.state} ${deliveryForm.zipCode}`;
      const orderData = {
        items: items.map((item) => ({
          product_id: parseInt(item.product.id),
          quantity: item.quantity,
          options: item.selectedOptions?.map((o) => parseInt(o.id)),
        })),
        delivery_address: deliveryAddress,
        delivery_notes: deliveryForm.instructions || undefined,
        promotion_code: promoCode || undefined,
      };

      const response = await ordersApi.create(orderData);
      const order = response.data.order || response.data.data || response.data;

      clearCart();
      navigate(`/order/${order.id}`, { state: { isNew: true } });
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout checkout--empty">
        <div className="checkout__empty-content">
          <span className="checkout__empty-icon">🛒</span>
          <h1 className="checkout__empty-title">Cart is Empty!</h1>
          <p className="checkout__empty-text">
            Add some items before checking out.
          </p>
          <PixelButton variant="primary" onClick={() => navigate('/menu')}>
            Browse Menu
          </PixelButton>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      {/* Header */}
      <div className="checkout__header">
        <button className="checkout__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back to Cart
        </button>
        <h1 className="checkout__title">Checkout</h1>
      </div>

      <form className="checkout__container" onSubmit={handleSubmit}>
        {/* Left column - Forms */}
        <div className="checkout__forms">
          {/* Delivery Address */}
          <div className="checkout__section">
            <h2 className="checkout__section-title">
              <MapPin size={18} />
              Delivery Address
            </h2>

            <div className="checkout__form-grid">
              <div className="checkout__field checkout__field--full">
                <label className="checkout__label">Street Address *</label>
                <input
                  type="text"
                  name="street"
                  value={deliveryForm.street}
                  onChange={handleInputChange}
                  className="checkout__input"
                  placeholder="123 Taco Street"
                  required
                />
              </div>

              <div className="checkout__field">
                <label className="checkout__label">City *</label>
                <input
                  type="text"
                  name="city"
                  value={deliveryForm.city}
                  onChange={handleInputChange}
                  className="checkout__input"
                  placeholder="Austin"
                  required
                />
              </div>

              <div className="checkout__field">
                <label className="checkout__label">State *</label>
                <input
                  type="text"
                  name="state"
                  value={deliveryForm.state}
                  onChange={handleInputChange}
                  className="checkout__input"
                  placeholder="TX"
                  maxLength={2}
                  required
                />
              </div>

              <div className="checkout__field">
                <label className="checkout__label">ZIP Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={deliveryForm.zipCode}
                  onChange={handleInputChange}
                  className="checkout__input"
                  placeholder="78701"
                  maxLength={10}
                  required
                />
              </div>

              <div className="checkout__field">
                <label className="checkout__label">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={deliveryForm.phone}
                  onChange={handleInputChange}
                  className="checkout__input"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div className="checkout__field checkout__field--full">
                <label className="checkout__label">Delivery Instructions</label>
                <textarea
                  name="instructions"
                  value={deliveryForm.instructions}
                  onChange={handleInputChange}
                  className="checkout__textarea"
                  placeholder="Ring doorbell, leave at door, etc."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Promo Code */}
          <div className="checkout__section">
            <h2 className="checkout__section-title">
              <Tag size={18} />
              Promo Code
            </h2>

            {promoCode ? (
              <div className="checkout__promo-applied">
                <Check size={16} />
                <span>Code "{promoCode}" applied!</span>
                <button
                  type="button"
                  onClick={removePromoCode}
                  className="checkout__promo-remove"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="checkout__promo-input">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="checkout__input"
                  placeholder="Enter promo code"
                />
                <PixelButton
                  type="button"
                  variant="secondary"
                  onClick={handleApplyPromo}
                  isLoading={promoLoading}
                >
                  Apply
                </PixelButton>
              </div>
            )}
            {promoError && <p className="checkout__promo-error">{promoError}</p>}
          </div>

          {/* Payment notice */}
          <div className="checkout__section">
            <h2 className="checkout__section-title">
              <CreditCard size={18} />
              Payment
            </h2>
            <div className="checkout__payment-notice">
              <span className="checkout__payment-icon">💰</span>
              <p>Cash on Delivery - Pay when your order arrives!</p>
            </div>
          </div>
        </div>

        {/* Right column - Order Summary */}
        <div className="checkout__summary-column">
          <div className="checkout__summary">
            <h2 className="checkout__summary-title">Order Summary</h2>

            <div className="checkout__items">
              {items.map((item) => (
                <div key={item.id} className="checkout__item">
                  <span className="checkout__item-qty">{item.quantity}x</span>
                  <span className="checkout__item-name">{item.product.name}</span>
                  <span className="checkout__item-price">
                    $
                    {(
                      (item.product.price +
                        (item.selectedOptions?.reduce((s, o) => s + o.price, 0) || 0)) *
                      item.quantity
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="checkout__totals">
              <div className="checkout__total-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="checkout__total-row">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="checkout__total-row">
                <span>Delivery</span>
                <span>{deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'FREE'}</span>
              </div>
              {discount > 0 && (
                <div className="checkout__total-row checkout__total-row--discount">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="checkout__total-row checkout__total-row--final">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="checkout__error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <PixelButton
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </PixelButton>

            <p className="checkout__terms">
              By placing this order, you agree to our terms and conditions.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
