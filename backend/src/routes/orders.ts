import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db, sql as pgSql, orders, orderItems, orderStatusHistory, products, productOptions, users, promotions } from '../db';
import { authenticate, authenticateAdmin } from '../middleware/auth';
import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';

const TAX_RATE = 0.0825; // 8.25% tax rate

interface OrdersQuery {
  status?: string;
  page?: string;
  limit?: string;
}

interface OrderParams {
  id: string;
}

interface CreateOrderBody {
  items: Array<{
    product_id: number;
    quantity: number;
    options?: number[];
  }>;
  delivery_address?: string;
  delivery_notes?: string;
  promotion_code?: string;
}

interface UpdateStatusBody {
  status: string;
  notes?: string;
}

export default async function ordersRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /orders - List orders (users see their own, admins see all)
  fastify.get<{ Querystring: OrdersQuery }>(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest<{ Querystring: OrdersQuery }>, reply: FastifyReply) => {
      const { status, page = '1', limit = '20' } = request.query;
      const isAdmin = request.user!.role === 'admin';

      // Build conditions
      const conditions = [];

      // Non-admin users only see their own orders
      if (!isAdmin) {
        conditions.push(eq(orders.userId, request.user!.userId));
      }

      // Filter by status
      if (status) {
        conditions.push(eq(orders.status, status as typeof orders.status.dataType));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Pagination
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(whereClause);
      const total = countResult?.count || 0;

      // Get orders with user and promotion info
      const ordersResult = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
          subtotal: orders.subtotal,
          discountAmount: orders.discountAmount,
          taxAmount: orders.taxAmount,
          total: orders.total,
          promotionId: orders.promotionId,
          deliveryAddress: orders.deliveryAddress,
          deliveryNotes: orders.deliveryNotes,
          estimatedDelivery: orders.estimatedDelivery,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          userName: users.name,
          userEmail: users.email,
          promotionCode: promotions.code,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(promotions, eq(orders.promotionId, promotions.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limitNum)
        .offset(offset);

      // Get items for each order
      const orderIds = ordersResult.map((o) => o.id);
      let itemsMap: Record<number, typeof orderItems.$inferSelect[]> = {};

      if (orderIds.length > 0) {
        const itemsResult = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            productName: orderItems.productName,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            optionsJson: orderItems.optionsJson,
            subtotal: orderItems.subtotal,
            productImage: products.imageUrl,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(inArray(orderItems.orderId, orderIds));

        itemsMap = itemsResult.reduce((acc, item) => {
          const oid = item.orderId!;
          if (!acc[oid]) acc[oid] = [];
          acc[oid].push(item as typeof orderItems.$inferSelect);
          return acc;
        }, {} as Record<number, typeof orderItems.$inferSelect[]>);
      }

      const formattedOrders = ordersResult.map((o) => ({
        id: o.id,
        user_id: o.userId,
        status: o.status,
        subtotal: parseFloat(o.subtotal),
        discount_amount: parseFloat(o.discountAmount || '0'),
        tax_amount: parseFloat(o.taxAmount || '0'),
        total: parseFloat(o.total),
        promotion_id: o.promotionId,
        delivery_address: o.deliveryAddress,
        delivery_notes: o.deliveryNotes,
        estimated_delivery: o.estimatedDelivery,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
        user_name: o.userName,
        user_email: o.userEmail,
        promotion_code: o.promotionCode,
        items: (itemsMap[o.id] || []).map((item: Record<string, unknown>) => ({
          id: item.id,
          order_id: item.orderId,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: parseFloat(item.unitPrice as string),
          options_json: item.optionsJson,
          subtotal: parseFloat(item.subtotal as string),
          product_image: item.productImage,
        })),
      }));

      return reply.send({
        orders: formattedOrders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  );

  // GET /orders/:id - Get single order
  fastify.get<{ Params: OrderParams }>(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const isAdmin = request.user!.role === 'admin';

      const [order] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
          subtotal: orders.subtotal,
          discountAmount: orders.discountAmount,
          taxAmount: orders.taxAmount,
          total: orders.total,
          promotionId: orders.promotionId,
          deliveryAddress: orders.deliveryAddress,
          deliveryNotes: orders.deliveryNotes,
          estimatedDelivery: orders.estimatedDelivery,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          userName: users.name,
          userEmail: users.email,
          promotionCode: promotions.code,
          promotionDescription: promotions.description,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(promotions, eq(orders.promotionId, promotions.id))
        .where(eq(orders.id, parseInt(id)))
        .limit(1);

      if (!order) {
        throw new NotFoundError('Order');
      }

      // Check access
      if (!isAdmin && order.userId !== request.user!.userId) {
        throw new ForbiddenError('You do not have access to this order');
      }

      // Get items
      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          productName: orderItems.productName,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          optionsJson: orderItems.optionsJson,
          subtotal: orderItems.subtotal,
          productImage: products.imageUrl,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, parseInt(id)));

      // Get status history
      const history = await db
        .select({
          id: orderStatusHistory.id,
          orderId: orderStatusHistory.orderId,
          status: orderStatusHistory.status,
          notes: orderStatusHistory.notes,
          createdAt: orderStatusHistory.createdAt,
          createdBy: orderStatusHistory.createdBy,
          createdByName: users.name,
        })
        .from(orderStatusHistory)
        .leftJoin(users, eq(orderStatusHistory.createdBy, users.id))
        .where(eq(orderStatusHistory.orderId, parseInt(id)))
        .orderBy(desc(orderStatusHistory.createdAt));

      return reply.send({
        order: {
          id: order.id,
          user_id: order.userId,
          status: order.status,
          subtotal: parseFloat(order.subtotal),
          discount_amount: parseFloat(order.discountAmount || '0'),
          tax_amount: parseFloat(order.taxAmount || '0'),
          total: parseFloat(order.total),
          promotion_id: order.promotionId,
          delivery_address: order.deliveryAddress,
          delivery_notes: order.deliveryNotes,
          estimated_delivery: order.estimatedDelivery,
          created_at: order.createdAt,
          updated_at: order.updatedAt,
          user_name: order.userName,
          user_email: order.userEmail,
          promotion_code: order.promotionCode,
          promotion_description: order.promotionDescription,
          items: items.map((item) => ({
            id: item.id,
            order_id: item.orderId,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: parseFloat(item.unitPrice),
            options_json: item.optionsJson,
            subtotal: parseFloat(item.subtotal),
            product_image: item.productImage,
          })),
          status_history: history.map((h) => ({
            id: h.id,
            order_id: h.orderId,
            status: h.status,
            notes: h.notes,
            created_at: h.createdAt,
            created_by: h.createdBy,
            created_by_name: h.createdByName,
          })),
        },
      });
    }
  );

  // POST /orders - Create new order
  fastify.post<{ Body: CreateOrderBody }>(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest<{ Body: CreateOrderBody }>, reply: FastifyReply) => {
      const { items, delivery_address, delivery_notes, promotion_code } = request.body;

      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Order must have at least one item');
      }

      // Use a transaction
      const result = await pgSql.begin(async (tx) => {
        // Validate and calculate item subtotals
        let subtotal = 0;
        const orderItemsData: Array<{
          product_id: number;
          product_name: string;
          quantity: number;
          unit_price: number;
          options_json: { option_ids: number[] } | null;
          subtotal: number;
        }> = [];

        for (const item of items) {
          if (!item.product_id || !item.quantity || item.quantity < 1) {
            throw new ValidationError('Each item must have product_id and quantity');
          }

          const [product] = await tx`
            SELECT id, name, price, is_available FROM products WHERE id = ${item.product_id}
          `;

          if (!product) {
            throw new ValidationError(`Product ${item.product_id} not found`);
          }

          if (!product.is_available) {
            throw new ValidationError(`Product "${product.name}" is not available`);
          }

          let itemPrice = parseFloat(product.price);

          // Apply options price modifiers
          if (item.options && Array.isArray(item.options)) {
            for (const optionId of item.options) {
              const [option] = await tx`
                SELECT price_modifier FROM product_options
                WHERE id = ${optionId} AND product_id = ${item.product_id}
              `;
              if (option) {
                itemPrice += parseFloat(option.price_modifier);
              }
            }
          }

          const itemSubtotal = itemPrice * item.quantity;
          subtotal += itemSubtotal;

          orderItemsData.push({
            product_id: product.id,
            product_name: product.name,
            quantity: item.quantity,
            unit_price: itemPrice,
            options_json: item.options ? { option_ids: item.options } : null,
            subtotal: itemSubtotal,
          });
        }

        // Apply promotion if provided
        let discountAmount = 0;
        let promotionId: number | null = null;

        if (promotion_code) {
          const [promo] = await tx`
            SELECT * FROM promotions
            WHERE code = ${promotion_code.toUpperCase()}
            AND is_active = true
            AND starts_at <= NOW()
            AND expires_at >= NOW()
            AND (max_uses IS NULL OR current_uses < max_uses)
          `;

          if (promo && subtotal >= parseFloat(promo.min_order_amount)) {
            promotionId = promo.id;

            if (promo.discount_type === 'percentage') {
              discountAmount = subtotal * (parseFloat(promo.discount_value) / 100);
            } else {
              discountAmount = Math.min(parseFloat(promo.discount_value), subtotal);
            }

            // Update promotion usage
            await tx`
              UPDATE promotions SET current_uses = current_uses + 1 WHERE id = ${promo.id}
            `;
          }
        }

        // Calculate totals
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * TAX_RATE;
        const total = taxableAmount + taxAmount;

        // Estimate delivery time (30-45 minutes from now)
        const estimatedDelivery = new Date();
        estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 35);
        const estimatedDeliveryStr = estimatedDelivery.toISOString();

        // Create order
        const [order] = await tx`
          INSERT INTO orders (user_id, status, subtotal, discount_amount, tax_amount, total,
                              promotion_id, delivery_address, delivery_notes, estimated_delivery)
          VALUES (${request.user!.userId}, 'pending', ${subtotal.toFixed(2)}, ${discountAmount.toFixed(2)},
                  ${taxAmount.toFixed(2)}, ${total.toFixed(2)}, ${promotionId},
                  ${delivery_address || null}, ${delivery_notes || null}, ${estimatedDeliveryStr})
          RETURNING *
        `;

        // Create order items
        for (const item of orderItemsData) {
          await tx`
            INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, options_json, subtotal)
            VALUES (${order.id}, ${item.product_id}, ${item.product_name}, ${item.quantity},
                    ${item.unit_price}, ${item.options_json ? JSON.stringify(item.options_json) : null}, ${item.subtotal})
          `;
        }

        // Create initial status history
        await tx`
          INSERT INTO order_status_history (order_id, status, notes, created_by)
          VALUES (${order.id}, 'pending', 'Order placed', ${request.user!.userId})
        `;

        return { order, items: orderItemsData };
      });

      return reply.status(201).send({
        message: 'Order created successfully',
        order: {
          id: result.order.id,
          user_id: result.order.user_id,
          status: result.order.status,
          subtotal: parseFloat(result.order.subtotal),
          discount_amount: parseFloat(result.order.discount_amount),
          tax_amount: parseFloat(result.order.tax_amount),
          total: parseFloat(result.order.total),
          promotion_id: result.order.promotion_id,
          delivery_address: result.order.delivery_address,
          delivery_notes: result.order.delivery_notes,
          estimated_delivery: result.order.estimated_delivery,
          created_at: result.order.created_at,
          updated_at: result.order.updated_at,
          items: result.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            options_json: item.options_json,
            subtotal: item.subtotal,
          })),
        },
      });
    }
  );

  // PATCH /orders/:id/status - Update order status (admin only)
  fastify.patch<{ Params: OrderParams; Body: UpdateStatusBody }>(
    '/:id/status',
    { preHandler: [authenticateAdmin] },
    async (request: FastifyRequest<{ Params: OrderParams; Body: UpdateStatusBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { status, notes } = request.body;

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
      if (!status || !validStatuses.includes(status)) {
        throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
      }

      // Check order exists
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parseInt(id)))
        .limit(1);

      if (!order) {
        throw new NotFoundError('Order');
      }

      // Prevent status changes on cancelled/delivered orders
      if (order.status === 'cancelled' || order.status === 'delivered') {
        throw new ValidationError(`Cannot change status of ${order.status} orders`);
      }

      // Update order status
      await db
        .update(orders)
        .set({ status: status as typeof orders.status.dataType, updatedAt: new Date() })
        .where(eq(orders.id, parseInt(id)));

      // Add to status history
      await db.insert(orderStatusHistory).values({
        orderId: parseInt(id),
        status,
        notes: notes || null,
        createdBy: request.user!.userId,
      });

      return reply.send({
        message: 'Order status updated',
        order: {
          id: parseInt(id),
          status,
          updated_at: new Date(),
        },
      });
    }
  );
}
