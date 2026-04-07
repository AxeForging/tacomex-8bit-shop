import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';

import { getJwtConfig } from '@/middleware/auth';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { redis } from '@/config/redis';
import { connectRabbitMQ, closeRabbitMQ, testRabbitMQ } from '@/config/rabbitmq';
import { testConnection, runMigrations } from '@/db';
import { registerSwagger } from '@/plugins/swagger';
import { startConsumers } from '@/services/notificationConsumer';

// Import routes
import authRoutes from '@/routes/auth';
import productsRoutes from '@/routes/products';
import categoriesRoutes from '@/routes/categories';
import ordersRoutes from '@/routes/orders';
import usersRoutes from '@/routes/users';
import promotionsRoutes from '@/routes/promotions';
import cartRoutes from '@/routes/cart';
import notificationsRoutes from '@/routes/notifications';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

// Rate limit env vars — set high in dev/testing, restrictive in production.
// Override via environment variables to simulate throttling at any time.
const RATE_LIMIT_GLOBAL = parseInt(process.env.RATE_LIMIT_GLOBAL || (process.env.NODE_ENV === 'production' ? '100' : '10000'));
const RATE_LIMIT_AUTH   = parseInt(process.env.RATE_LIMIT_AUTH   || (process.env.NODE_ENV === 'production' ? '5'   : '1000'));
const RATE_LIMIT_ORDERS = parseInt(process.env.RATE_LIMIT_ORDERS || (process.env.NODE_ENV === 'production' ? '10'  : '1000'));

async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    ajv: {
      customOptions: {
        strict: false, // allow OpenAPI keywords like `example`, `description` in schemas
      },
    },
    logger: process.env.NODE_ENV !== 'production' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    } : true,
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Register 404 handler
  fastify.setNotFoundHandler(notFoundHandler);

  // Register plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger docs
  await registerSwagger(fastify);

  await fastify.register(jwt, getJwtConfig());

  // Rate limiting with Redis as distributed store.
  // Defaults are permissive in dev so testing is easy.
  // Set RATE_LIMIT_GLOBAL / RATE_LIMIT_AUTH / RATE_LIMIT_ORDERS env vars to simulate throttling.
  await fastify.register(rateLimit, {
    global: true,
    max: RATE_LIMIT_GLOBAL,
    timeWindow: '15 minutes',
    redis: redis,
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes',
    }),
  });

  // Health check endpoint
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Returns service status including database and Redis connectivity.',
      response: {
        200: {
          description: 'Service is healthy',
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            service: { type: 'string', example: 'TacoMex 8-bit Shop API' },
            version: { type: 'string', example: '2.0.0' },
            redis: { type: 'string', enum: ['connected', 'disconnected', 'error'], example: 'connected' },
            rabbitmq: { type: 'string', enum: ['connected', 'disconnected', 'error'], example: 'connected' },
            database: { type: 'string', enum: ['connected', 'disconnected', 'error'], example: 'connected' },
          },
        },
      },
    },
  }, async (_request, reply) => {
    let redisStatus = 'disconnected';
    let rabbitmqStatus = 'disconnected';
    let dbStatus = 'disconnected';

    try {
      await redis.ping();
      redisStatus = 'connected';
    } catch {
      redisStatus = 'error';
    }

    try {
      const rmqOk = await testRabbitMQ();
      rabbitmqStatus = rmqOk ? 'connected' : 'error';
    } catch {
      rabbitmqStatus = 'error';
    }

    try {
      const connected = await testConnection();
      dbStatus = connected ? 'connected' : 'error';
    } catch {
      dbStatus = 'error';
    }

    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'TacoMex 8-bit Shop API',
      version: '2.0.0',
      redis: redisStatus,
      rabbitmq: rabbitmqStatus,
      database: dbStatus,
    });
  });

  // Root endpoint
  fastify.get('/', {
    schema: {
      tags: ['Health'],
      summary: 'API info',
      description: 'Returns welcome message and available endpoint listing.',
      response: {
        200: {
          description: 'API info',
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Welcome to TacoMex 8-bit Shop API' },
            version: { type: 'string', example: '2.0.0' },
            endpoints: { type: 'object' },
          },
        },
      },
    },
  }, async (_request, reply) => {
    return reply.send({
      message: 'Welcome to TacoMex 8-bit Shop API',
      version: '2.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        products: '/api/products',
        categories: '/api/categories',
        orders: '/api/orders',
        cart: '/api/cart',
        users: '/api/users',
        promotions: '/api/promotions',
        notifications: '/api/notifications',
      },
    });
  });

  // Register API routes with stricter rate limits for specific endpoints
  await fastify.register(async (api) => {
    // Auth routes with stricter rate limiting
    await api.register(async (authApi) => {
      await authApi.register(rateLimit, {
        max: RATE_LIMIT_AUTH,
        timeWindow: '15 minutes',
        redis: redis,
        keyGenerator: (request) => request.ip,
        errorResponseBuilder: () => ({
          error: 'Too many login attempts, please try again later.',
          retryAfter: '15 minutes',
        }),
      });
      await authApi.register(authRoutes);
    }, { prefix: '/auth' });

    // Products routes
    await api.register(productsRoutes, { prefix: '/products' });

    // Categories routes
    await api.register(categoriesRoutes, { prefix: '/categories' });

    // Orders routes with rate limiting
    await api.register(async (ordersApi) => {
      await ordersApi.register(rateLimit, {
        max: RATE_LIMIT_ORDERS,
        timeWindow: '1 hour',
        redis: redis,
        keyGenerator: (request) => request.ip,
        errorResponseBuilder: () => ({
          error: 'Too many orders placed, please try again later.',
          retryAfter: '1 hour',
        }),
      });
      await ordersApi.register(ordersRoutes);
    }, { prefix: '/orders' });

    // Users routes
    await api.register(usersRoutes, { prefix: '/users' });

    // Promotions routes
    await api.register(promotionsRoutes, { prefix: '/promotions' });

    // Cart routes (Redis-backed, per user)
    await api.register(cartRoutes, { prefix: '/cart' });

    // Notifications routes
    await api.register(notificationsRoutes, { prefix: '/notifications' });
  }, { prefix: '/api' });

  return fastify;
}

async function start(): Promise<void> {
  try {
    // Connect to Redis first (before building server, since rate-limit needs it)
    await redis.connect();

    // Connect to RabbitMQ
    await connectRabbitMQ();

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Run idempotent migrations before starting the server
    await runMigrations();

    const fastify = await buildServer();

    // Start notification queue consumers
    await startConsumers();

    // Start server
    await fastify.listen({ port: PORT, host: HOST });

    console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   TacoMex 8-bit Shop API v2.0                        ║
  ║   Fastify + Drizzle ORM                              ║
  ║   Server running on port ${PORT}                        ║
  ║                                                       ║
  ║   Health: http://localhost:${PORT}/health               ║
  ║   API:    http://localhost:${PORT}/api                  ║
  ║   Docs:   http://localhost:${PORT}/docs                 ║
  ║   Rabbit: http://localhost:15672              ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
    `);

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\nReceived ${signal}, shutting down gracefully...`);
        await fastify.close();
        await closeRabbitMQ();
        await redis.quit();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
