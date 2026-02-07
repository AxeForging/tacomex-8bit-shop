import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { db, promotions } from '../db';
import { authenticate, authenticateAdmin } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

interface PromotionsQuery {
  active?: string;
  page?: string;
  limit?: string;
}

interface PromotionParams {
  id: string;
}

interface ValidateBody {
  code: string;
  order_total?: number;
}

interface CreatePromotionBody {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_uses?: number;
  starts_at: string;
  expires_at: string;
}

interface UpdatePromotionBody {
  description?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  min_order_amount?: number;
  max_uses?: number;
  starts_at?: string;
  expires_at?: string;
  is_active?: boolean;
}

export default async function promotionsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /promotions - List all promotions (admin only)
  fastify.get<{ Querystring: PromotionsQuery }>(
    '/',
    { preHandler: [authenticateAdmin] },
    async (request: FastifyRequest<{ Querystring: PromotionsQuery }>, reply: FastifyReply) => {
      const { active, page = '1', limit = '20' } = request.query;

      // Build conditions
      const conditions = [];

      if (active !== undefined) {
        conditions.push(eq(promotions.isActive, active === 'true'));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Pagination
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(promotions)
        .where(whereClause);
      const total = countResult?.count || 0;

      // Get promotions
      const result = await db
        .select()
        .from(promotions)
        .where(whereClause)
        .orderBy(desc(promotions.createdAt))
        .limit(limitNum)
        .offset(offset);

      const formattedPromotions = result.map((p) => ({
        id: p.id,
        code: p.code,
        description: p.description,
        discount_type: p.discountType,
        discount_value: parseFloat(p.discountValue),
        min_order_amount: parseFloat(p.minOrderAmount || '0'),
        max_uses: p.maxUses,
        current_uses: p.currentUses,
        starts_at: p.startsAt,
        expires_at: p.expiresAt,
        is_active: p.isActive,
        created_at: p.createdAt,
      }));

      return reply.send({
        promotions: formattedPromotions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  );

  // GET /promotions/active - List active promotions (public)
  fastify.get(
    '/active',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const now = new Date();

      const result = await db
        .select({
          code: promotions.code,
          description: promotions.description,
          discountType: promotions.discountType,
          discountValue: promotions.discountValue,
          minOrderAmount: promotions.minOrderAmount,
          expiresAt: promotions.expiresAt,
        })
        .from(promotions)
        .where(
          and(
            eq(promotions.isActive, true),
            lte(promotions.startsAt, now),
            gte(promotions.expiresAt, now),
            sql`(${promotions.maxUses} IS NULL OR ${promotions.currentUses} < ${promotions.maxUses})`
          )
        )
        .orderBy(desc(promotions.discountValue));

      const formattedPromotions = result.map((p) => ({
        code: p.code,
        description: p.description,
        discount_type: p.discountType,
        discount_value: parseFloat(p.discountValue),
        min_order_amount: parseFloat(p.minOrderAmount || '0'),
        expires_at: p.expiresAt,
      }));

      return reply.send({ promotions: formattedPromotions });
    }
  );

  // POST /promotions/validate - Validate a promotion code
  fastify.post<{ Body: ValidateBody }>(
    '/validate',
    async (request: FastifyRequest<{ Body: ValidateBody }>, reply: FastifyReply) => {
      const { code, order_total } = request.body;

      if (!code) {
        throw new ValidationError('Promotion code is required');
      }

      const now = new Date();

      const promo = await db.query.promotions.findFirst({
        where: and(
          eq(promotions.code, code.toUpperCase()),
          eq(promotions.isActive, true),
          lte(promotions.startsAt, now),
          gte(promotions.expiresAt, now)
        ),
      });

      if (!promo) {
        return reply.send({
          valid: false,
          error: 'Invalid or expired promotion code',
        });
      }

      // Check usage limit
      if (promo.maxUses !== null && promo.currentUses !== null && promo.currentUses >= promo.maxUses) {
        return reply.send({
          valid: false,
          error: 'This promotion has reached its usage limit',
        });
      }

      // Check minimum order amount
      const minOrderAmount = parseFloat(promo.minOrderAmount || '0');
      const orderTotal = parseFloat(String(order_total)) || 0;

      if (orderTotal < minOrderAmount) {
        return reply.send({
          valid: false,
          error: `Minimum order amount of $${minOrderAmount.toFixed(2)} required`,
          min_order_amount: minOrderAmount,
        });
      }

      // Calculate discount
      const discountValue = parseFloat(promo.discountValue);
      let discountAmount = 0;

      if (promo.discountType === 'percentage') {
        discountAmount = orderTotal * (discountValue / 100);
      } else {
        discountAmount = Math.min(discountValue, orderTotal);
      }

      return reply.send({
        valid: true,
        promotion: {
          code: promo.code,
          description: promo.description,
          discount_type: promo.discountType,
          discount_value: discountValue,
          min_order_amount: minOrderAmount,
          expires_at: promo.expiresAt,
        },
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        new_total: parseFloat((orderTotal - discountAmount).toFixed(2)),
      });
    }
  );

  // POST /promotions - Create a new promotion (admin only)
  fastify.post<{ Body: CreatePromotionBody }>(
    '/',
    { preHandler: [authenticateAdmin] },
    async (request: FastifyRequest<{ Body: CreatePromotionBody }>, reply: FastifyReply) => {
      const {
        code,
        description,
        discount_type,
        discount_value,
        min_order_amount = 0,
        max_uses,
        starts_at,
        expires_at,
      } = request.body;

      // Validation
      if (!code || !discount_type || discount_value === undefined || !starts_at || !expires_at) {
        throw new ValidationError('Code, discount_type, discount_value, starts_at, and expires_at are required');
      }

      if (!['percentage', 'fixed'].includes(discount_type)) {
        throw new ValidationError('discount_type must be percentage or fixed');
      }

      if (discount_value <= 0) {
        throw new ValidationError('discount_value must be positive');
      }

      if (discount_type === 'percentage' && discount_value > 100) {
        throw new ValidationError('Percentage discount cannot exceed 100%');
      }

      const [newPromotion] = await db.insert(promotions).values({
        code: code.toUpperCase(),
        description: description || null,
        discountType: discount_type,
        discountValue: discount_value.toString(),
        minOrderAmount: min_order_amount.toString(),
        maxUses: max_uses || null,
        startsAt: new Date(starts_at),
        expiresAt: new Date(expires_at),
        isActive: true,
      }).returning();

      return reply.status(201).send({
        message: 'Promotion created successfully',
        promotion: {
          id: newPromotion.id,
          code: newPromotion.code,
          description: newPromotion.description,
          discount_type: newPromotion.discountType,
          discount_value: parseFloat(newPromotion.discountValue),
          min_order_amount: parseFloat(newPromotion.minOrderAmount || '0'),
          max_uses: newPromotion.maxUses,
          current_uses: newPromotion.currentUses,
          starts_at: newPromotion.startsAt,
          expires_at: newPromotion.expiresAt,
          is_active: newPromotion.isActive,
          created_at: newPromotion.createdAt,
        },
      });
    }
  );

  // PATCH /promotions/:id - Update a promotion (admin only)
  fastify.patch<{ Params: PromotionParams; Body: UpdatePromotionBody }>(
    '/:id',
    { preHandler: [authenticateAdmin] },
    async (request: FastifyRequest<{ Params: PromotionParams; Body: UpdatePromotionBody }>, reply: FastifyReply) => {
      const { id } = request.params;

      // Check promotion exists
      const existing = await db.query.promotions.findFirst({
        where: eq(promotions.id, parseInt(id)),
      });

      if (!existing) {
        throw new NotFoundError('Promotion');
      }

      const {
        description,
        discount_type,
        discount_value,
        min_order_amount,
        max_uses,
        starts_at,
        expires_at,
        is_active,
      } = request.body;

      // Build update object
      const updates: Partial<{
        description: string | null;
        discountType: 'percentage' | 'fixed';
        discountValue: string;
        minOrderAmount: string;
        maxUses: number | null;
        startsAt: Date;
        expiresAt: Date;
        isActive: boolean;
      }> = {};

      if (description !== undefined) {
        updates.description = description || null;
      }

      if (discount_type) {
        if (!['percentage', 'fixed'].includes(discount_type)) {
          throw new ValidationError('discount_type must be percentage or fixed');
        }
        updates.discountType = discount_type;
      }

      if (discount_value !== undefined) {
        if (discount_value <= 0) {
          throw new ValidationError('discount_value must be positive');
        }
        updates.discountValue = discount_value.toString();
      }

      if (min_order_amount !== undefined) {
        updates.minOrderAmount = min_order_amount.toString();
      }

      if (max_uses !== undefined) {
        updates.maxUses = max_uses;
      }

      if (starts_at) {
        updates.startsAt = new Date(starts_at);
      }

      if (expires_at) {
        updates.expiresAt = new Date(expires_at);
      }

      if (is_active !== undefined) {
        updates.isActive = is_active;
      }

      if (Object.keys(updates).length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      const [updatedPromotion] = await db
        .update(promotions)
        .set(updates)
        .where(eq(promotions.id, parseInt(id)))
        .returning();

      return reply.send({
        message: 'Promotion updated successfully',
        promotion: {
          id: updatedPromotion.id,
          code: updatedPromotion.code,
          description: updatedPromotion.description,
          discount_type: updatedPromotion.discountType,
          discount_value: parseFloat(updatedPromotion.discountValue),
          min_order_amount: parseFloat(updatedPromotion.minOrderAmount || '0'),
          max_uses: updatedPromotion.maxUses,
          current_uses: updatedPromotion.currentUses,
          starts_at: updatedPromotion.startsAt,
          expires_at: updatedPromotion.expiresAt,
          is_active: updatedPromotion.isActive,
          created_at: updatedPromotion.createdAt,
        },
      });
    }
  );
}
