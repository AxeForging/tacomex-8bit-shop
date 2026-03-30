import React from 'react';
import { OrderStatus } from '@/types';
import './OrderStatusBadge.css';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: '#B8B8D0', icon: '...' },
  confirmed: { label: 'Confirmed', color: '#FFD700', icon: '!' },
  preparing: { label: 'Preparing', color: '#FF6B35', icon: '*' },
  ready: { label: 'Ready', color: '#00A86B', icon: '+' },
  out_for_delivery: { label: 'Delivering', color: '#9B59B6', icon: '>' },
  delivered: { label: 'Delivered', color: '#00A86B', icon: 'OK' },
  cancelled: { label: 'Cancelled', color: '#DC143C', icon: 'X' },
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = 'md',
  animated = true,
}) => {
  const config = statusConfig[status];

  return (
    <span
      className={`order-status-badge order-status-badge--${size} ${animated && status !== 'delivered' && status !== 'cancelled' ? 'order-status-badge--animated' : ''}`}
      style={{
        backgroundColor: config.color,
        color: ['pending', 'confirmed', 'ready', 'delivered'].includes(status) ? '#1a1a2e' : '#FFFFFF',
      }}
    >
      <span className="order-status-badge__icon">[{config.icon}]</span>
      <span className="order-status-badge__label">{config.label}</span>
    </span>
  );
};

export default OrderStatusBadge;
