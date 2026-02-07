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
              phone: { type: 'string', example: '(555) 123-4567' },
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
              avatar_url: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
            },
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
              option_type: { type: 'string', example: 'size' },
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
                enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
                example: 'pending',
              },
              subtotal: { type: 'number', example: 13.47 },
              discount_amount: { type: 'number', example: 0 },
              tax_amount: { type: 'number', example: 1.11 },
              total: { type: 'number', example: 14.58 },
              delivery_address: { type: 'string', example: '123 Pixel St, Austin, TX 78701' },
              delivery_notes: { type: 'string', nullable: true },
              estimated_delivery: { type: 'string', format: 'date-time', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              user_name: { type: 'string', example: 'Demo Customer' },
              user_email: { type: 'string', example: 'customer@tacomex.com' },
              promotion_code: { type: 'string', nullable: true },
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/OrderItem' },
              },
              status_history: {
                type: 'array',
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
            properties: {
              valid: { type: 'boolean', example: true },
              promotion: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'TACO20' },
                  description: { type: 'string' },
                  discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
                  discount_value: { type: 'number', example: 20 },
                  min_order_amount: { type: 'number', example: 15 },
                },
              },
              discount_amount: { type: 'number', example: 5.0 },
              new_total: { type: 'number', example: 20.0 },
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

      // ── Path definitions ──
      paths: {
        '/health': {
          get: {
            tags: ['Health'],
            summary: 'Health check',
            description: 'Returns service status including database and Redis connectivity.',
            responses: {
              '200': {
                description: 'Service is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', format: 'date-time' },
                        service: { type: 'string', example: 'TacoMex 8-bit Shop API' },
                        version: { type: 'string', example: '2.0.0' },
                        redis: { type: 'string', example: 'connected' },
                        database: { type: 'string', example: 'connected' },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // ── Auth ──
        '/api/auth/login': {
          post: {
            tags: ['Auth'],
            summary: 'Login',
            description: 'Authenticate with email and password. Returns a JWT token.',
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
            },
            responses: {
              '200': {
                description: 'Login successful',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
              },
              '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            },
          },
        },
        '/api/auth/register': {
          post: {
            tags: ['Auth'],
            summary: 'Register',
            description: 'Create a new customer account.',
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
            },
            responses: {
              '201': {
                description: 'Registration successful',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
              },
              '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            },
          },
        },
        '/api/auth/me': {
          get: {
            tags: ['Auth'],
            summary: 'Get current user',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Current user profile',
                content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } },
              },
              '401': { description: 'Unauthorized' },
            },
          },
        },

        // ── Products ──
        '/api/products': {
          get: {
            tags: ['Products'],
            summary: 'List products',
            description: 'Get paginated products with optional filters.',
            parameters: [
              { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category ID or slug' },
              { name: 'featured', in: 'query', schema: { type: 'string', enum: ['true'] }, description: 'Only featured products' },
              { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or description' },
              { name: 'spiceLevel', in: 'query', schema: { type: 'integer' }, description: 'Filter by spice level (0-5)' },
              { name: 'minPrice', in: 'query', schema: { type: 'number' }, description: 'Minimum price' },
              { name: 'maxPrice', in: 'query', schema: { type: 'number' }, description: 'Maximum price' },
              { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['name', 'price', 'created_at', 'spice_level'] }, description: 'Sort field' },
              { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
              { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
              { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            ],
            responses: {
              '200': {
                description: 'Product list',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            tags: ['Products'],
            summary: 'Create product (admin)',
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProductRequest' } } },
            },
            responses: {
              '201': { description: 'Product created' },
              '401': { description: 'Unauthorized' },
              '403': { description: 'Admin only' },
            },
          },
        },
        '/api/products/featured': {
          get: {
            tags: ['Products'],
            summary: 'Featured products',
            description: 'Returns up to 10 featured and available products.',
            responses: {
              '200': {
                description: 'Featured product list',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { products: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } },
                  },
                },
              },
            },
          },
        },
        '/api/products/{id}': {
          get: {
            tags: ['Products'],
            summary: 'Get product by ID',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Product ID or slug' }],
            responses: {
              '200': {
                description: 'Product detail with options',
                content: { 'application/json': { schema: { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' } } } } },
              },
              '404': { description: 'Product not found' },
            },
          },
          patch: {
            tags: ['Products'],
            summary: 'Update product (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
            requestBody: {
              content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProductRequest' } } },
            },
            responses: {
              '200': { description: 'Product updated' },
              '404': { description: 'Product not found' },
            },
          },
          delete: {
            tags: ['Products'],
            summary: 'Delete product (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
            responses: {
              '200': { description: 'Product deleted' },
              '404': { description: 'Product not found' },
            },
          },
        },

        // ── Categories ──
        '/api/categories': {
          get: {
            tags: ['Categories'],
            summary: 'List categories',
            description: 'Returns all categories with product counts.',
            responses: {
              '200': {
                description: 'Category list',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } },
                  },
                },
              },
            },
          },
        },
        '/api/categories/{id}': {
          get: {
            tags: ['Categories'],
            summary: 'Get category with products',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Category ID or slug' }],
            responses: {
              '200': { description: 'Category with products' },
              '404': { description: 'Category not found' },
            },
          },
        },

        // ── Orders ──
        '/api/orders': {
          get: {
            tags: ['Orders'],
            summary: 'List orders',
            description: 'Customers see their own orders. Admins see all orders.',
            security: [{ bearerAuth: [] }],
            parameters: [
              { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
              { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
              { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            ],
            responses: {
              '200': {
                description: 'Order list',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            tags: ['Orders'],
            summary: 'Create order',
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrderRequest' } } },
            },
            responses: {
              '201': {
                description: 'Order placed',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'Order created successfully' },
                        order: { $ref: '#/components/schemas/Order' },
                      },
                    },
                  },
                },
              },
              '400': { description: 'Validation error' },
            },
          },
        },
        '/api/orders/{id}': {
          get: {
            tags: ['Orders'],
            summary: 'Get order detail',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
            responses: {
              '200': {
                description: 'Order detail with items and status history',
                content: { 'application/json': { schema: { type: 'object', properties: { order: { $ref: '#/components/schemas/Order' } } } } },
              },
              '404': { description: 'Order not found' },
            },
          },
        },
        '/api/orders/{id}/status': {
          patch: {
            tags: ['Orders'],
            summary: 'Update order status (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateStatusRequest' } } },
            },
            responses: {
              '200': { description: 'Status updated' },
              '400': { description: 'Invalid status transition' },
              '404': { description: 'Order not found' },
            },
          },
        },

        // ── Promotions ──
        '/api/promotions': {
          get: {
            tags: ['Promotions'],
            summary: 'List all promotions (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [
              { name: 'active', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
              { name: 'page', in: 'query', schema: { type: 'integer' } },
              { name: 'limit', in: 'query', schema: { type: 'integer' } },
            ],
            responses: {
              '200': {
                description: 'Promotion list',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        promotions: { type: 'array', items: { $ref: '#/components/schemas/Promotion' } },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            tags: ['Promotions'],
            summary: 'Create promotion (admin)',
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['code', 'discount_type', 'discount_value', 'starts_at', 'expires_at'],
                    properties: {
                      code: { type: 'string', example: 'SUMMER25' },
                      description: { type: 'string', example: '25% off summer menu' },
                      discount_type: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
                      discount_value: { type: 'number', example: 25 },
                      min_order_amount: { type: 'number', example: 10 },
                      max_uses: { type: 'integer', example: 100 },
                      starts_at: { type: 'string', format: 'date-time', example: '2025-06-01T00:00:00Z' },
                      expires_at: { type: 'string', format: 'date-time', example: '2025-09-01T00:00:00Z' },
                    },
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Promotion created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'Promotion created successfully' },
                        promotion: { $ref: '#/components/schemas/Promotion' },
                      },
                    },
                  },
                },
              },
              '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
              '401': { description: 'Unauthorized' },
              '403': { description: 'Admin only' },
            },
          },
        },
        '/api/promotions/active': {
          get: {
            tags: ['Promotions'],
            summary: 'List active promotions (public)',
            responses: {
              '200': {
                description: 'Active promotion list',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { promotions: { type: 'array', items: { $ref: '#/components/schemas/Promotion' } } } },
                  },
                },
              },
            },
          },
        },
        '/api/promotions/validate': {
          post: {
            tags: ['Promotions'],
            summary: 'Validate promo code',
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidatePromoRequest' } } },
            },
            responses: {
              '200': {
                description: 'Validation result',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidatePromoResponse' } } },
              },
            },
          },
        },

        '/api/promotions/{id}': {
          patch: {
            tags: ['Promotions'],
            summary: 'Update promotion (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Promotion ID' }],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      description: { type: 'string', example: 'Updated description' },
                      discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
                      discount_value: { type: 'number', example: 15 },
                      min_order_amount: { type: 'number', example: 20 },
                      max_uses: { type: 'integer', example: 200 },
                      starts_at: { type: 'string', format: 'date-time' },
                      expires_at: { type: 'string', format: 'date-time' },
                      is_active: { type: 'boolean', example: false },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Promotion updated',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'Promotion updated successfully' },
                        promotion: { $ref: '#/components/schemas/Promotion' },
                      },
                    },
                  },
                },
              },
              '400': { description: 'Validation error' },
              '404': { description: 'Promotion not found' },
            },
          },
        },

        // ── Products categories list ──
        '/api/products/categories/list': {
          get: {
            tags: ['Products'],
            summary: 'List categories (via products)',
            description: 'Returns all categories with available product counts. Alternative to /api/categories.',
            responses: {
              '200': {
                description: 'Category list',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // ── Root ──
        '/': {
          get: {
            tags: ['Health'],
            summary: 'Root endpoint',
            description: 'Returns API welcome message and available endpoint listing.',
            responses: {
              '200': {
                description: 'API info',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'Welcome to TacoMex 8-bit Shop API' },
                        version: { type: 'string', example: '2.0.0' },
                        endpoints: {
                          type: 'object',
                          example: {
                            health: '/health',
                            auth: '/api/auth',
                            products: '/api/products',
                            categories: '/api/categories',
                            orders: '/api/orders',
                            users: '/api/users',
                            promotions: '/api/promotions',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // ── Users ──
        '/api/users': {
          get: {
            tags: ['Users'],
            summary: 'List users (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [
              { name: 'role', in: 'query', schema: { type: 'string', enum: ['customer', 'admin'] } },
              { name: 'search', in: 'query', schema: { type: 'string' } },
              { name: 'page', in: 'query', schema: { type: 'integer' } },
              { name: 'limit', in: 'query', schema: { type: 'integer' } },
            ],
            responses: {
              '200': {
                description: 'User list with order counts',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/api/users/{id}': {
          get: {
            tags: ['Users'],
            summary: 'Get user detail',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
            responses: {
              '200': { description: 'User profile with order stats' },
              '404': { description: 'User not found' },
            },
          },
          patch: {
            tags: ['Users'],
            summary: 'Update user',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      role: { type: 'string', enum: ['customer', 'admin'], description: 'Admin only' },
                      password: { type: 'string', minLength: 6 },
                    },
                  },
                },
              },
            },
            responses: {
              '200': { description: 'User updated' },
              '404': { description: 'User not found' },
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
