import { publishMessage } from '@/config/rabbitmq';

// ========================================
// Email Notifications
// ========================================

export async function sendOrderConfirmationEmail(params: {
  userId: number;
  email: string;
  orderId: number;
  total: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryAddress: string | null;
  estimatedDelivery: string | null;
}): Promise<void> {
  const itemsList = params.items
    .map((i) => `  ${i.quantity}x ${i.name} - $${i.price.toFixed(2)}`)
    .join('\n');

  const eta = params.estimatedDelivery
    ? new Date(params.estimatedDelivery).toLocaleString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : 'ASAP';

  await publishMessage('email', {
    userId: params.userId,
    toEmail: params.email,
    subject: `Order #${params.orderId} Confirmed - TacoMex 8-BIT`,
    body: [
      `Hola! Your order has been placed successfully.`,
      ``,
      `ORDER #${params.orderId}`,
      `${'='.repeat(40)}`,
      itemsList,
      `${'='.repeat(40)}`,
      `Total: $${params.total}`,
      ``,
      params.deliveryAddress ? `Delivery to: ${params.deliveryAddress}` : '',
      `Estimated delivery: ${eta}`,
      ``,
      `Track your order at TacoMex 8-BIT Shop.`,
      ``,
      `- The TacoMex Crew`,
    ].filter(Boolean).join('\n'),
    metadata: { type: 'order_confirmation', orderId: params.orderId },
  });
}

export async function sendOrderStatusEmail(params: {
  userId: number;
  email: string;
  orderId: number;
  status: string;
  notes?: string | null;
}): Promise<void> {
  const statusEmoji: Record<string, string> = {
    confirmed: 'Your order has been confirmed!',
    preparing: 'Our chefs are preparing your food!',
    ready: 'Your order is ready for pickup/delivery!',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
  };

  const message = statusEmoji[params.status] || `Order status updated to: ${params.status}`;

  await publishMessage('email', {
    userId: params.userId,
    toEmail: params.email,
    subject: `Order #${params.orderId} - ${params.status.charAt(0).toUpperCase() + params.status.slice(1)}`,
    body: [
      message,
      ``,
      `Order #${params.orderId}`,
      `Status: ${params.status.toUpperCase()}`,
      params.notes ? `Note: ${params.notes}` : '',
      ``,
      `View your order details at TacoMex 8-BIT Shop.`,
      ``,
      `- The TacoMex Crew`,
    ].filter(Boolean).join('\n'),
    metadata: { type: 'order_status', orderId: params.orderId, status: params.status },
  });
}

// ========================================
// SMS Notifications
// ========================================

export async function sendWelcomeSms(params: {
  userId: number;
  name: string;
  phone?: string;
}): Promise<void> {
  await publishMessage('sms', {
    userId: params.userId,
    toPhone: params.phone || '+1-555-TACOMEX',
    body: `Welcome to TacoMex 8-BIT, ${params.name}! Your account is ready. Browse our pixel-perfect menu and place your first order. Use code FIRSTORDER for 15% off!`,
    metadata: { type: 'welcome' },
  });
}

export async function sendOrderStatusSms(params: {
  userId: number;
  orderId: number;
  status: string;
}): Promise<void> {
  const messages: Record<string, string> = {
    ready: `TacoMex 8-BIT: Your order #${params.orderId} is READY for pickup/delivery! Get those taste buds ready!`,
    delivered: `TacoMex 8-BIT: Your order #${params.orderId} has been DELIVERED! Enjoy your meal and thanks for choosing TacoMex!`,
  };

  const body = messages[params.status];
  if (!body) return;

  await publishMessage('sms', {
    userId: params.userId,
    toPhone: '+1-555-TACOMEX',
    body,
    metadata: { type: 'order_status_sms', orderId: params.orderId, status: params.status },
  });
}
