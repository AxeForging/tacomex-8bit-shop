import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'TacoMex 8-Bit Shop API',
        description:
          'RESTful API for the TacoMex 8-Bit Shop — a retro-themed Mexican food delivery platform.\n\n' +
          '## Authentication\n' +
          'Most endpoints require a JWT bearer token obtained via `POST /api/auth/login`.\n' +
          'Pass the token as `Authorization: Bearer <token>`.\n\n' +
          '## Demo Credentials\n' +
          '| Role | Email | Password |\n' +
          '|------|-------|----------|\n' +
          '| Admin | admin@tacomex.com | admin123 |\n' +
          '| Customer | customer@tacomex.com | pass123 |\n\n' +
          '## Promo Codes\n' +
          '`TACO20` `BURRITO10` `FIRSTORDER` `FREEDELIVERY` `8BITDEAL`',
        version: '2.0.0',
        contact: {
          name: 'TacoMex Dev Team',
        },
      },
      servers: [
        { url: 'http://localhost:3001', description: 'Local development' },
      ],
      tags: [
        { name: 'Health', description: 'Service health checks' },
        { name: 'Auth', description: 'Authentication & registration' },
        { name: 'Products', description: 'Browse and manage products' },
        { name: 'Categories', description: 'Product categories' },
        { name: 'Cart', description: 'Shopping cart (Redis-backed, 24 h TTL)' },
        { name: 'Orders', description: 'Order management' },
        { name: 'Promotions', description: 'Promo codes & discounts' },
        { name: 'Users', description: 'User management (admin)' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token from POST /api/auth/login',
          },
        },
        schemas: {
          // ── Shared ──
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string', example: 'Not found' },
            },
          },
          Pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 42 },
              totalPages: { type: 'integer', example: 3 },
            },
          },

          // ── Auth ──
          LoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email', example: 'customer@tacomex.com' },
              password: { type: 'string', example: 'pass123' },
            },
          },
          RegisterRequest: {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', format: 'email', example: 'john@example.com' },
              password: { type: 'string', minLength: 6, example: 'secret123' },
            },
          },
          AuthResponse: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Login successful' },
              user: { $ref: '#/components/schemas/User' },
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 2 },
              email: { type: 'string', example: 'customer@tacomex.com' },
              name: { type: 'string', example: 'Demo Customer' },
              role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
              avatar_url: { type: 'string', nullable: true, example: null },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          UserWithStats: {
            allOf: [
              { $ref: '#/components/schemas/User' },
              {
                type: 'object',
                properties: {
                  stats: {
                    type: 'object',
                    properties: {
                      total_orders: { type: 'integer', example: 5 },
                      total_spent: { type: 'number', example: 72.45 },
                    },
                  },
                },
              },
            ],
          },
          UserListItem: {
            allOf: [
              { $ref: '#/components/schemas/User' },
              {
                type: 'object',
                properties: {
                  order_count: { type: 'integer', example: 3 },
                },
              },
            ],
          },

          // ── Products ──
          Product: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Pixel Carne Asada Taco' },
              slug: { type: 'string', example: 'pixel-carne-asada-taco' },
              description: { type: 'string', example: 'Grilled steak with cilantro, onions, and our secret 8-bit salsa verde' },
              price: { type: 'number', example: 4.49 },
              image_url: { type: 'string', nullable: true, example: '/images/products/carne-asada-taco.png' },
              category_id: { type: 'integer', example: 1 },
              is_available: { type: 'boolean', example: true },
              is_featured: { type: 'boolean', example: true },
              spice_level: { type: 'integer', minimum: 0, maximum: 5, example: 2 },
              prep_time_minutes: { type: 'integer', example: 10 },
              calories: { type: 'integer', nullable: true, example: 280 },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              category_name: { type: 'string', example: 'Tacos' },
              category_slug: { type: 'string', example: 'tacos' },
              options: {
                type: 'array',
                items: { $ref: '#/components/schemas/ProductOption' },
              },
            },
          },
          ProductOption: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              product_id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Super Size' },
              option_type: { type: 'string', enum: ['size', 'extra', 'sauce', 'side'], example: 'size' },
              price_modifier: { type: 'number', example: 1.5 },
              is_default: { type: 'boolean', example: false },
            },
          },
          CreateProductRequest: {
            type: 'object',
            required: ['name', 'price'],
            properties: {
              name: { type: 'string', example: 'New Taco' },
              description: { type: 'string', example: 'A brand-new taco' },
              price: { type: 'number', example: 5.99 },
              categoryId: { type: 'string', example: '1' },
              spiceLevel: { type: 'integer', example: 2 },
              isAvailable: { type: 'boolean', example: true },
              isFeatured: { type: 'boolean', example: false },
            },
          },

          // ── Categories ──
          Category: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Tacos' },
              slug: { type: 'string', example: 'tacos' },
              description: { type: 'string', example: 'Classic Mexican tacos' },
              image_url: { type: 'string', nullable: true },
              display_order: { type: 'integer', example: 1 },
              created_at: { type: 'string', format: 'date-time' },
              product_count: { type: 'integer', example: 6 },
            },
          },
          CategoryWithProducts: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Tacos' },
              slug: { type: 'string', example: 'tacos' },
              description: { type: 'string', example: 'Classic Mexican tacos' },
              image_url: { type: 'string', nullable: true },
              display_order: { type: 'integer', example: 1 },
              created_at: { type: 'string', format: 'date-time' },
              products: {
                type: 'array',
                description: 'Available products in this category',
                items: { $ref: '#/components/schemas/Product' },
              },
            },
          },

          // ── Cart ──
          CartItem: {
            type: 'object',
            properties: {
              product_id: { type: 'integer', example: 1 },
              quantity: { type: 'integer', minimum: 1, example: 2 },
              options: {
                type: 'array',
                items: { type: 'integer' },
                example: [1, 3],
              },
            },
          },
          CartResponse: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/CartItem' },
              },
              item_count: { type: 'integer', example: 3 },
            },
          },

          // ── Orders ──
          CreateOrderRequest: {
            type: 'object',
            required: ['items'],
            properties: {
              items: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  required: ['product_id', 'quantity'],
                  properties: {
                    product_id: { type: 'integer', example: 1 },
                    quantity: { type: 'integer', minimum: 1, example: 2 },
                    options: {
                      type: 'array',
                      items: { type: 'integer' },
                      example: [2, 36],
                    },
                  },
                },
              },
              delivery_address: { type: 'string', example: '123 Pixel St, Austin, TX 78701' },
              delivery_notes: { type: 'string', example: 'Ring the doorbell' },
              promotion_code: { type: 'string', example: 'TACO20' },
            },
          },
          Order: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              user_id: { type: 'integer', example: 2 },
              status: {
                type: 'string',
                enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
                example: 'pending',
              },
              subtotal: { type: 'number', example: 13.47 },
              discount_amount: { type: 'number', example: 0 },
              tax_amount: { type: 'number', example: 1.11 },
              total: { type: 'number', example: 14.58 },
              promotion_id: { type: 'integer', nullable: true, example: null },
              promotion_code: { type: 'string', nullable: true, example: 'TACO20' },
              promotion_description: { type: 'string', nullable: true, description: 'Only included in single-order detail response', example: '20% off your entire order' },
              delivery_address: { type: 'string', example: '123 Pixel St, Austin, TX 78701' },
              delivery_notes: { type: 'string', nullable: true },
              estimated_delivery: { type: 'string', format: 'date-time', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              user_name: { type: 'string', example: 'Demo Customer' },
              user_email: { type: 'string', example: 'customer@tacomex.com' },
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/OrderItem' },
              },
              status_history: {
                type: 'array',
                description: 'Only included in single-order detail response',
                items: { $ref: '#/components/schemas/StatusHistoryEntry' },
              },
            },
          },
          OrderItem: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              order_id: { type: 'integer', example: 1 },
              product_id: { type: 'integer', example: 1 },
              product_name: { type: 'string', example: 'Pixel Carne Asada Taco' },
              quantity: { type: 'integer', example: 2 },
              unit_price: { type: 'number', example: 4.49 },
              subtotal: { type: 'number', example: 8.98 },
              product_image: { type: 'string', nullable: true },
              options_json: {
                type: 'object',
                nullable: true,
                description: 'Selected option IDs for this item',
                properties: {
                  option_ids: {
                    type: 'array',
                    items: { type: 'integer' },
                    example: [2, 36],
                  },
                },
              },
            },
          },
          StatusHistoryEntry: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              order_id: { type: 'integer' },
              status: { type: 'string', example: 'pending' },
              notes: { type: 'string', nullable: true, example: 'Order placed' },
              created_at: { type: 'string', format: 'date-time' },
              created_by_name: { type: 'string', nullable: true },
            },
          },
          UpdateStatusRequest: {
            type: 'object',
            required: ['status'],
            properties: {
              status: {
                type: 'string',
                enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
                example: 'confirmed',
              },
              notes: { type: 'string', example: 'Order confirmed by admin' },
            },
          },

          // ── Promotions ──
          ValidatePromoRequest: {
            type: 'object',
            required: ['code'],
            properties: {
              code: { type: 'string', example: 'TACO20' },
              order_total: { type: 'number', example: 25.0 },
            },
          },
          ValidatePromoResponse: {
            type: 'object',
            description: 'When `valid` is true, `promotion`, `discount_amount`, and `new_total` are present. When `valid` is false, `error` is present and `min_order_amount` may be included.',
            properties: {
              valid: { type: 'boolean', example: true },
              promotion: {
                type: 'object',
                description: 'Only present when valid is true',
                properties: {
                  code: { type: 'string', example: 'TACO20' },
                  description: { type: 'string', example: '20% off your entire order' },
                  discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
                  discount_value: { type: 'number', example: 20 },
                  min_order_amount: { type: 'number', example: 15 },
                  expires_at: { type: 'string', format: 'date-time' },
                },
              },
              discount_amount: { type: 'number', example: 5.0, description: 'Only present when valid is true' },
              new_total: { type: 'number', example: 20.0, description: 'Only present when valid is true' },
              error: { type: 'string', example: 'Minimum order amount of $15.00 required', description: 'Only present when valid is false' },
              min_order_amount: { type: 'number', example: 15.0, description: 'Only present when valid is false and minimum not met' },
            },
          },
          ActivePromotion: {
            type: 'object',
            description: 'Publicly visible subset of a promotion',
            properties: {
              code: { type: 'string', example: 'TACO20' },
              description: { type: 'string', example: '20% off your entire order' },
              discount_type: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
              discount_value: { type: 'number', example: 20 },
              min_order_amount: { type: 'number', example: 15 },
              expires_at: { type: 'string', format: 'date-time' },
            },
          },
          Promotion: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              code: { type: 'string', example: 'TACO20' },
              description: { type: 'string', example: '20% off your entire order' },
              discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
              discount_value: { type: 'number', example: 20 },
              min_order_amount: { type: 'number', example: 15 },
              max_uses: { type: 'integer', nullable: true, example: 500 },
              current_uses: { type: 'integer', example: 42 },
              starts_at: { type: 'string', format: 'date-time' },
              expires_at: { type: 'string', format: 'date-time' },
              is_active: { type: 'boolean', example: true },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },

    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      tryItOutEnabled: true,
    },
    staticCSP: false,
  });
}
