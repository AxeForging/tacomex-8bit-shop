import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Calendar, DollarSign } from 'lucide-react';
import { OrderStatusBadge, LoadingSpinner, PixelButton } from '@/components';
import { useMyOrders } from '@/hooks';
import './OrderHistory.css';

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const { orders, isLoading, error } = useMyOrders();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="order-history__loading">
        <LoadingSpinner size="lg" text="Loading orders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history__error">
        <span className="order-history__error-icon">⚠️</span>
        <p className="order-history__error-text">{error}</p>
        <PixelButton variant="primary" onClick={() => window.location.reload()}>
          Retry
        </PixelButton>
      </div>
    );
  }

  return (
    <div className="order-history">
      {/* Header */}
      <div className="order-history__header">
        <h1 className="order-history__title">
          <Package size={24} />
          My Orders
        </h1>
        <p className="order-history__subtitle">
          Track your order history and status
        </p>
      </div>

      <div className="order-history__container">
        {orders.length === 0 ? (
          <div className="order-history__empty">
            <span className="order-history__empty-icon">📦</span>
            <h2 className="order-history__empty-title">No Orders Yet!</h2>
            <p className="order-history__empty-text">
              You haven't placed any orders yet.
              <br />
              Time to order some delicious tacos!
            </p>
            <PixelButton variant="primary" onClick={() => navigate('/menu')}>
              Browse Menu
            </PixelButton>
          </div>
        ) : (
          <div className="order-history__list">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className="order-history__card"
              >
                <div className="order-history__card-header">
                  <div className="order-history__order-id">
                    Order #{String(order.id).padStart(4, '0')}
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="order-history__card-body">
                  <div className="order-history__info">
                    <div className="order-history__info-item">
                      <Calendar size={14} />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="order-history__info-item">
                      <DollarSign size={14} />
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="order-history__items-preview">
                    {order.items.slice(0, 3).map((item, index) => (
                      <span key={index} className="order-history__item-name">
                        {item.quantity}x {item.product?.name || 'Item'}
                        {index < Math.min(order.items.length - 1, 2) && ', '}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="order-history__more-items">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="order-history__card-footer">
                  <span className="order-history__view-link">
                    View Details
                    <ChevronRight size={14} />
                  </span>
                </div>

                {/* Corner decorations */}
                <div className="order-history__corner order-history__corner--tl"></div>
                <div className="order-history__corner order-history__corner--tr"></div>
                <div className="order-history__corner order-history__corner--bl"></div>
                <div className="order-history__corner order-history__corner--br"></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
