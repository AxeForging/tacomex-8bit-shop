import amqp from 'amqplib';
import type { Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://tacomex:tacomex_secret@localhost:5672';

// Queue names
export const QUEUES = {
  EMAIL: 'notifications.email',
  SMS: 'notifications.sms',
} as const;

// Exchange
const EXCHANGE = 'tacomex.notifications';

let connection: Awaited<ReturnType<typeof amqp.connect>> | null = null;
let publishChannel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  let retries = 0;
  const maxRetries = 10;

  while (retries < maxRetries) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      connection = conn;
      const ch = await conn.createChannel();
      publishChannel = ch;

      // Declare exchange and queues
      await ch.assertExchange(EXCHANGE, 'direct', { durable: true });
      await ch.assertQueue(QUEUES.EMAIL, { durable: true });
      await ch.assertQueue(QUEUES.SMS, { durable: true });
      await ch.bindQueue(QUEUES.EMAIL, EXCHANGE, 'email');
      await ch.bindQueue(QUEUES.SMS, EXCHANGE, 'sms');

      console.log('RabbitMQ connected and queues initialized');

      conn.on('error', (err: Error) => {
        console.error('RabbitMQ connection error:', err);
      });

      conn.on('close', () => {
        console.warn('RabbitMQ connection closed');
        publishChannel = null;
        connection = null;
      });

      return;
    } catch (error) {
      retries++;
      console.warn(`RabbitMQ connection attempt ${retries}/${maxRetries} failed, retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.error('Failed to connect to RabbitMQ after max retries');
}

export async function publishMessage(routingKey: 'email' | 'sms', message: Record<string, unknown>): Promise<boolean> {
  if (!publishChannel) {
    console.error('RabbitMQ publish channel not available');
    return false;
  }

  try {
    publishChannel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
    );
    return true;
  } catch (error) {
    console.error('Failed to publish message:', error);
    return false;
  }
}

export async function getChannel(): Promise<Channel | null> {
  if (!connection) return null;
  return connection.createChannel();
}

export async function testRabbitMQ(): Promise<boolean> {
  try {
    if (!connection) return false;
    const ch = await connection.createChannel();
    await ch.close();
    return true;
  } catch {
    return false;
  }
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    if (publishChannel) await publishChannel.close();
    if (connection) await connection.close();
  } catch {
    // Ignore close errors
  }
  publishChannel = null;
  connection = null;
}
