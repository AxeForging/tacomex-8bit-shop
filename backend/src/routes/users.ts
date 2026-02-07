import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { eq, and, or, ilike, sql, desc, inArray } from 'drizzle-orm';
import { db, users, orders } from '../db';
import { authenticate, authenticateAdmin } from '../middleware/auth';
import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';

interface UsersQuery {
  role?: string;
  search?: string;
  page?: string;
  limit?: string;
}

interface UserParams {
  id: string;
}

interface UpdateUserBody {
  name?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  password?: string;
}

export default async function usersRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /users - List all users (admin only)
  fastify.get<{ Querystring: UsersQuery }>(
    '/',
    { preHandler: [authenticateAdmin] },
    async (request: FastifyRequest<{ Querystring: UsersQuery }>, reply: FastifyReply) => {
      const { role, search, page = '1', limit = '20' } = request.query;

      // Build conditions
      const conditions = [];

      if (role) {
        conditions.push(eq(users.role, role as 'customer' | 'admin'));
      }

      if (search) {
        conditions.push(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Pagination
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(whereClause);
      const total = countResult?.count || 0;

      // Get users (excluding password_hash)
      const usersResult = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          avatarUrl: users.avatarUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limitNum)
        .offset(offset);

      // Get order counts for each user
      const userIds = usersResult.map((u) => u.id);
      let orderCountMap: Record<number, number> = {};

      if (userIds.length > 0) {
        const orderCounts = await db
          .select({
            userId: orders.userId,
            count: sql<number>`count(*)::int`,
          })
          .from(orders)
          .where(inArray(orders.userId, userIds))
          .groupBy(orders.userId);

        orderCountMap = orderCounts.reduce((acc, row) => {
          if (row.userId) acc[row.userId] = row.count;
          return acc;
        }, {} as Record<number, number>);
      }

      const formattedUsers = usersResult.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        avatar_url: u.avatarUrl,
        created_at: u.createdAt,
        updated_at: u.updatedAt,
        order_count: orderCountMap[u.id] || 0,
      }));

      return reply.send({
        users: formattedUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  );

  // GET /users/:id - Get single user (admin or self)
  fastify.get<{ Params: UserParams }>(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const isAdmin = request.user!.role === 'admin';
      const isSelf = request.user!.userId === parseInt(id);

      if (!isAdmin && !isSelf) {
        throw new ForbiddenError('You can only view your own profile');
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(id)),
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Get order stats
      const [stats] = await db
        .select({
          totalOrders: sql<number>`count(*)::int`,
          totalSpent: sql<number>`COALESCE(SUM(${orders.total})::numeric, 0)`,
        })
        .from(orders)
        .where(and(eq(orders.userId, parseInt(id)), sql`${orders.status} != 'cancelled'`));

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar_url: user.avatarUrl,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          stats: {
            total_orders: stats?.totalOrders || 0,
            total_spent: parseFloat(String(stats?.totalSpent || 0)),
          },
        },
      });
    }
  );

  // PATCH /users/:id - Update user (admin or self)
  fastify.patch<{ Params: UserParams; Body: UpdateUserBody }>(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest<{ Params: UserParams; Body: UpdateUserBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const isAdmin = request.user!.role === 'admin';
      const isSelf = request.user!.userId === parseInt(id);

      if (!isAdmin && !isSelf) {
        throw new ForbiddenError('You can only update your own profile');
      }

      const { name, email, avatar_url, role, password } = request.body;

      // Check user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(id)),
      });

      if (!existingUser) {
        throw new NotFoundError('User');
      }

      // Build update object
      const updates: Partial<{
        name: string;
        email: string;
        avatarUrl: string | null;
        role: 'customer' | 'admin';
        passwordHash: string;
        updatedAt: Date;
      }> = {};

      if (name) {
        updates.name = name;
      }

      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new ValidationError('Invalid email format');
        }

        // Check email uniqueness
        const emailCheck = await db.query.users.findFirst({
          where: and(
            eq(users.email, email.toLowerCase()),
            sql`${users.id} != ${parseInt(id)}`
          ),
          columns: { id: true },
        });

        if (emailCheck) {
          throw new ValidationError('Email already in use');
        }

        updates.email = email.toLowerCase();
      }

      if (avatar_url !== undefined) {
        updates.avatarUrl = avatar_url || null;
      }

      // Only admins can change roles
      if (role && isAdmin) {
        if (!['customer', 'admin'].includes(role)) {
          throw new ValidationError('Role must be customer or admin');
        }
        updates.role = role as 'customer' | 'admin';
      }

      // Password change
      if (password) {
        if (password.length < 6) {
          throw new ValidationError('Password must be at least 6 characters');
        }
        const salt = await bcrypt.genSalt(10);
        updates.passwordHash = await bcrypt.hash(password, salt);
      }

      if (Object.keys(updates).length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      updates.updatedAt = new Date();

      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, parseInt(id)))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          avatarUrl: users.avatarUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      return reply.send({
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar_url: updatedUser.avatarUrl,
          created_at: updatedUser.createdAt,
          updated_at: updatedUser.updatedAt,
        },
      });
    }
  );
}
