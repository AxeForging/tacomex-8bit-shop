import { eq } from 'drizzle-orm';
import { getChannel, QUEUES } from '@/config/rabbitmq';
import { db, notifications, users } from '@/db';

interface EmailMessage {
  userId: number;
  toEmail: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

interface SmsMessage {
  userId: number;
  toPhone: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export async function startConsumers(): Promise<void> {
  // Email consumer
  const emailChannel = await getChannel();
  if (emailChannel) {
    await emailChannel.prefetch(5);
    await emailChannel.consume(QUEUES.EMAIL, async (msg) => {
      if (!msg) return;
      try {
        const data: EmailMessage = JSON.parse(msg.content.toString());
        const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, data.userId)).limit(1);
        if (!user) { emailChannel.ack(msg); return; }
        await db.insert(notifications).values({
          userId: data.userId,
          channel: 'email',
          subject: data.subject,
          body: data.body,
          fromAddress: 'noreply@tacomex8bit.shop',
          toAddress: data.toEmail,
          metadata: data.metadata || null,
        });
        emailChannel.ack(msg);
      } catch (error) {
        console.error('Failed to process email message:', error);
        emailChannel.nack(msg, false, false);
      }
    });
    console.log('Email consumer started');
  }

  // SMS consumer
  const smsChannel = await getChannel();
  if (smsChannel) {
    await smsChannel.prefetch(5);
    await smsChannel.consume(QUEUES.SMS, async (msg) => {
      if (!msg) return;
      try {
        const data: SmsMessage = JSON.parse(msg.content.toString());
        const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, data.userId)).limit(1);
        if (!user) { smsChannel.ack(msg); return; }
        await db.insert(notifications).values({
          userId: data.userId,
          channel: 'sms',
          subject: null,
          body: data.body,
          fromAddress: '+1-800-TACOMEX',
          toAddress: data.toPhone,
          metadata: data.metadata || null,
        });
        smsChannel.ack(msg);
      } catch (error) {
        console.error('Failed to process SMS message:', error);
        smsChannel.nack(msg, false, false);
      }
    });
    console.log('SMS consumer started');
  }
}
