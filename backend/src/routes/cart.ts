import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '@/middleware/auth';
import { ValidationError } from '@/middleware/errorHandler';
import { cache } from '@/config/redis';

interface CartItem {
  product_id: number;
  quantity: number;
  options?: number[];
}

interface CartItemParams {
  productId: string;
}

const CartItemSchema = {
  type: 'object',
  properties: {
    product_id: { type: 'integer', example: 1 },
    quantity: { type: 'integer', minimum: 1, example: 2 },
    options: { type: 'array', items: { type: 'integer' }, example: [1, 3] },
  },
};

const CartResponseSchema = {
  type: 'object',
  properties: {
    items: { type: 'array', items: CartItemSchema },
    item_count: { type: 'integer', example: 3 },
  },
};

const UnauthorizedSchema = {
  type: 'object',
  properties: { error: { type: 'string', example: 'Unauthorized' } },
};

export default async function cartRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /cart - get current user's cart
  fastify.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Cart'],
        summary: 'Get cart',
        description: "Returns the current user's cart stored in Redis (24 h TTL). Returns an empty cart if none exists.",
        security: [{ bearerAuth: [] }],
        response: {
          200: { description: 'Current cart', ...CartResponseSchema },
          401: { description: 'Unauthorized', ...UnauthorizedSchema },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const items = await cache.getCart(userId) as CartItem[];
      return reply.send({
        items,
        item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      });
    }
  );

  // POST /cart/items - add or update an item in the cart
  fastify.post<{ Body: CartItem }>(
    '/items',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Cart'],
        summary: 'Add or update item',
        description: 'Adds a product to the cart. If the product is already in the cart, its quantity and options are updated.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['product_id', 'quantity'],
          properties: {
            product_id: { type: 'integer', example: 1 },
            quantity: { type: 'integer', minimum: 1, example: 2 },
            options: { type: 'array', items: { type: 'integer' }, example: [1, 3], description: 'Option IDs to apply (size, extras, etc.)' },
          },
        },
        response: {
          200: { description: 'Updated cart', ...CartResponseSchema },
          400: { description: 'Validation error', type: 'object', properties: { error: { type: 'string' } } },
          401: { description: 'Unauthorized', ...UnauthorizedSchema },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CartItem }>, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const { product_id, quantity, options } = request.body;

      if (!product_id || !quantity || quantity < 1) {
        throw new ValidationError('product_id and a positive quantity are required');
      }

      const items = await cache.getCart(userId) as CartItem[];
      const existingIdx = items.findIndex((i) => i.product_id === product_id);

      if (existingIdx >= 0) {
        items[existingIdx].quantity = quantity;
        if (options !== undefined) items[existingIdx].options = options;
      } else {
        items.push({ product_id, quantity, options: options || [] });
      }

      await cache.setCart(userId, items);
      return reply.send({
        items,
        item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      });
    }
  );

  // PATCH /cart/items/:productId - update quantity (0 removes the item)
  fastify.patch<{ Params: CartItemParams; Body: { quantity: number } }>(
    '/items/:productId',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Cart'],
        summary: 'Update item quantity',
        description: 'Updates the quantity of an existing cart item. Set quantity to `0` to remove the item.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'integer', description: 'Product ID to update', example: 1 },
          },
        },
        body: {
          type: 'object',
          required: ['quantity'],
          properties: {
            quantity: { type: 'integer', minimum: 0, example: 3, description: 'New quantity. Set to 0 to remove the item.' },
          },
        },
        response: {
          200: { description: 'Updated cart', ...CartResponseSchema },
          400: { description: 'Product not in cart or invalid quantity', type: 'object', properties: { error: { type: 'string' } } },
          401: { description: 'Unauthorized', ...UnauthorizedSchema },
        },
      },
    },
    async (request: FastifyRequest<{ Params: CartItemParams; Body: { quantity: number } }>, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const productId = parseInt(request.params.productId);
      const { quantity } = request.body;

      if (quantity === undefined || quantity < 0) {
        throw new ValidationError('quantity must be 0 or greater');
      }

      let items = await cache.getCart(userId) as CartItem[];

      if (quantity === 0) {
        items = items.filter((i) => i.product_id !== productId);
      } else {
        const idx = items.findIndex((i) => i.product_id === productId);
        if (idx >= 0) {
          items[idx].quantity = quantity;
        } else {
          throw new ValidationError(`Product ${productId} not in cart`);
        }
      }

      await cache.setCart(userId, items);
      return reply.send({
        items,
        item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      });
    }
  );

  // DELETE /cart/items/:productId - remove a single item
  fastify.delete<{ Params: CartItemParams }>(
    '/items/:productId',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Cart'],
        summary: 'Remove item',
        description: 'Removes a specific product from the cart.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'integer', description: 'Product ID to remove', example: 1 },
          },
        },
        response: {
          200: { description: 'Updated cart', ...CartResponseSchema },
          401: { description: 'Unauthorized', ...UnauthorizedSchema },
        },
      },
    },
    async (request: FastifyRequest<{ Params: CartItemParams }>, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const productId = parseInt(request.params.productId);

      const items = await cache.getCart(userId) as CartItem[];
      const updated = items.filter((i) => i.product_id !== productId);
      await cache.setCart(userId, updated);

      return reply.send({
        items: updated,
        item_count: updated.reduce((sum, i) => sum + i.quantity, 0),
      });
    }
  );

  // DELETE /cart - clear the entire cart
  fastify.delete(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Cart'],
        summary: 'Clear cart',
        description: 'Removes all items from the cart.',
        security: [{ bearerAuth: [] }],
        response: {
          200: { description: 'Cart cleared', ...CartResponseSchema },
          401: { description: 'Unauthorized', ...UnauthorizedSchema },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await cache.clearCart(request.user!.userId);
      return reply.send({ items: [], item_count: 0 });
    }
  );
}
