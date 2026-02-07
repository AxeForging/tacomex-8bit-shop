import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, DollarSign, Check } from 'lucide-react';
import { OrderStatusBadge, LoadingSpinner, PixelButton } from '../components';
import { useOrder } from '../hooks';
import { OrderStatus } from '../types';
import './OrderDetail.css';

const statusSteps: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
];

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusIcons: Record<OrderStatus, string> = {
  pending: '📝',
  confirmed: '✅',
  preparing: '👨‍🍳',
  ready: '🔔',
  out_for_delivery: '🚗',
  delivered: '🎉',
  cancelled: '❌',
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = location.state?.isNew;
  const { order, isLoading, error } = useOrder(id || '');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === 'cancelled') return -1;
    return statusSteps.indexOf(order.status);
  };

  if (isLoading) {
    return (
      <div className="order-detail__loading">
        <LoadingSpinner size="lg" text="Loading order..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail__error">
        <span className="order-detail__error-icon">⚠️</span>
        <p className="order-detail__error-text">
          {error || 'Order not found'}
        </p>
        <PixelButton variant="primary" onClick={() => navigate('/orders')}>
          View All Orders
        </PixelButton>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="order-detail">
      {/* Success banner for new orders */}
      {isNew && (
        <div className="order-detail__success">
          <span className="order-detail__success-icon">🎉</span>
          <div className="order-detail__success-content">
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for your order. We're preparing your delicious food!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="order-detail__header">
        <button className="order-detail__back" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} />
          All Orders
        </button>
        <div className="order-detail__header-info">
          <h1 className="order-detail__title">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <OrderStatusBadge status={order.status} size="lg" />
        </div>
        <p className="order-detail__date">
          Placed on {formatDate(order.createdAt)}
        </p>
      </div>

      <div className="order-detail__container">
        {/* Status Timeline */}
        <div className="order-detail__timeline-section">
          <h2 className="order-detail__section-title">Order Status</h2>

          {order.status === 'cancelled' ? (
            <div className="order-detail__cancelled">
              <span className="order-detail__cancelled-icon">❌</span>
              <p>This order has been cancelled</p>
            </div>
          ) : (
            <div className="order-detail__timeline">
              {statusSteps.map((status, index) => (
                <div
                  key={status}
                  className={`order-detail__step ${
                    index <= currentStep
                      ? 'order-detail__step--completed'
                      : ''
                  } ${index === currentStep ? 'order-detail__step--current' : ''}`}
                >
                  <div className="order-detail__step-icon">
                    {index < currentStep ? (
                      <Check size={16} />
                    ) : (
                      <span>{statusIcons[status]}</span>
                    )}
                  </div>
                  <div className="order-detail__step-info">
                    <span className="order-detail__step-label">
                      {statusLabels[status]}
                    </span>
                    {order.statusHistory?.find((h) => h.status === status) && (
                      <span className="order-detail__step-time">
                        {formatDate(
                          order.statusHistory.find((h) => h.status === status)!.timestamp
                        )}
                      </span>
                    )}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`order-detail__step-line ${
                        index < currentStep ? 'order-detail__step-line--completed' : ''
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="order-detail__items-section">
          <h2 className="order-detail__section-title">Order Items</h2>
          <div className="order-detail__items">
            {order.items.map((item, index) => (
              <div key={index} className="order-detail__item">
                <span className="order-detail__item-qty">{item.quantity}x</span>
                <div className="order-detail__item-info">
                  <span className="order-detail__item-name">
                    {item.product?.name || 'Item'}
                  </span>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <span className="order-detail__item-options">
                      + {item.selectedOptions.map((o) => o.name).join(', ')}
                    </span>
                  )}
                  {item.specialInstructions && (
                    <span className="order-detail__item-instructions">
                      "{item.specialInstructions}"
                    </span>
                  )}
                </div>
                <span className="order-detail__item-price">
                  ${item.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="order-detail__address-section">
          <h2 className="order-detail__section-title">
            <MapPin size={18} />
            Delivery Address
          </h2>
          <div className="order-detail__address">
            <p>{order.deliveryAddress.street}</p>
            <p>
              {order.deliveryAddress.city}, {order.deliveryAddress.state}{' '}
              {order.deliveryAddress.zipCode}
            </p>
          </div>
          {order.specialInstructions && (
            <div className="order-detail__instructions">
              <span className="order-detail__instructions-label">
                Delivery Instructions:
              </span>
              <p>{order.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-detail__summary-section">
          <h2 className="order-detail__section-title">
            <DollarSign size={18} />
            Order Summary
          </h2>
          <div className="order-detail__summary">
            <div className="order-detail__summary-row">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="order-detail__summary-row">
              <span>Tax</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="order-detail__summary-row">
              <span>Delivery</span>
              <span>
                {order.deliveryFee > 0 ? `$${order.deliveryFee.toFixed(2)}` : 'FREE'}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="order-detail__summary-row order-detail__summary-row--discount">
                <span>Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="order-detail__summary-row order-detail__summary-row--total">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Estimated delivery */}
        {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="order-detail__eta">
            <Clock size={18} />
            <span>Estimated delivery: {formatDate(order.estimatedDelivery)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="order-detail__actions">
          <PixelButton variant="primary" onClick={() => navigate('/menu')}>
            Order Again
          </PixelButton>
          <PixelButton variant="ghost" onClick={() => navigate('/orders')}>
            View All Orders
          </PixelButton>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
