import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, notifications } from '@/db';
import { authenticate } from '@/middleware/auth';

interface NotificationsQuery {
  channel?: 'email' | 'sms';
  page?: string;
  limit?: string;
}

interface NotificationParams {
  id: string;
}

const NotificationSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    user_id: { type: 'integer', example: 2 },
    channel: { type: 'string', enum: ['email', 'sms'], example: 'email' },
    subject: { type: 'string', nullable: true, example: 'Order #1 Confirmed - TacoMex 8-BIT' },
    body: { type: 'string', example: 'Hola! Your order has been placed successfully.' },
    from_address: { type: 'string', example: 'noreply@tacomex8bit.shop' },
    to_address: { type: 'string', example: 'customer@tacomex.com' },
    is_read: { type: 'boolean', example: false },
    metadata: { type: 'object', nullable: true },
    created_at: { type: 'string', format: 'date-time' },
  },
};

const PaginationSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 20 },
    total: { type: 'integer', example: 5 },
    totalPages: { type: 'integer', example: 1 },
  },
};

const ErrorSchema = {
  type: 'object',
  properties: { error: { type: 'string' } },
};

export default async function notificationsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /notifications - List user's notifications
  fastify.get<{ Querystring: NotificationsQuery }>(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Notifications'],
        summary: 'List notifications',
        description: 'Returns the authenticated user\'s email and SMS notifications. Filter by channel and paginate.',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            channel: { type: 'string', enum: ['email', 'sms'], description: 'Filter by channel' },
            page: { type: 'string', default: '1' },
            limit: { type: 'string', default: '20' },
          },
        },
        response: {
          200: {
            description: 'Notification list with pagination',
            type: 'object',
            properties: {
              notifications: { type: 'array', items: NotificationSchema },
              pagination: PaginationSchema,
              unread_count: { type: 'integer', example: 3 },
            },
          },
          401: { description: 'Unauthorized', ...ErrorSchema },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: NotificationsQuery }>, reply: FastifyReply) => {
      const { channel, page = '1', limit = '20' } = request.query;
      const userId = request.user!.userId;

      const conditions = [eq(notifications.userId, userId)];
      if (channel) {
        conditions.push(eq(notifications.channel, channel));
      }
      const whereClause = and(...conditions);

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(whereClause);
      const total = countResult?.count || 0;

      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      const unreadCount = unreadResult?.count || 0;

      const results = await db
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limitNum)
        .offset(offset);

      return reply.send({
        notifications: results.map((n) => ({
          id: n.id,
          user_id: n.userId,
          channel: n.channel,
          subject: n.subject,
          body: n.body,
          from_address: n.fromAddress,
          to_address: n.toAddress,
          is_read: n.isRead,
          metadata: n.metadata,
          created_at: n.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        unread_count: unreadCount,
      });
    }
  );

  // PATCH /notifications/:id/read - Mark notification as read
  fastify.patch<{ Params: NotificationParams }>(
    '/:id/read',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        description: 'Marks a single notification as read.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Notification ID' },
          },
        },
        response: {
          200: {
            description: 'Notification marked as read',
            type: 'object',
            properties: { message: { type: 'string', example: 'Notification marked as read' } },
          },
          401: { description: 'Unauthorized', ...ErrorSchema },
          404: { description: 'Notification not found', ...ErrorSchema },
        },
      },
    },
    async (request: FastifyRequest<{ Params: NotificationParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const userId = request.user!.userId;

      const [notif] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(and(eq(notifications.id, parseInt(id)), eq(notifications.userId, userId)))
        .limit(1);

      if (!notif) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, parseInt(id)));

      return reply.send({ message: 'Notification marked as read' });
    }
  );

  // POST /notifications/read-all - Mark all notifications as read
  fastify.post(
    '/read-all',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        description: 'Marks all of the user\'s notifications as read.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'All notifications marked as read',
            type: 'object',
            properties: { message: { type: 'string', example: 'All notifications marked as read' } },
          },
          401: { description: 'Unauthorized', ...ErrorSchema },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, request.user!.userId));

      return reply.send({ message: 'All notifications marked as read' });
    }
  );
}
