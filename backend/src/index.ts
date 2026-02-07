import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';

import { getJwtConfig } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { redis } from './config/redis';
import { testConnection } from './db';
import { registerSwagger } from './plugins/swagger';

// Import routes
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import categoriesRoutes from './routes/categories';
import ordersRoutes from './routes/orders';
import usersRoutes from './routes/users';
import promotionsRoutes from './routes/promotions';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
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

  // Rate limiting with Redis (high limits for dev/testing, lower in production)
  const isDev = process.env.NODE_ENV !== 'production';
  await fastify.register(rateLimit, {
    global: true,
    max: isDev ? 10000 : 100,
    timeWindow: '15 minutes',
    redis: redis,
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes',
    }),
  });

  // Health check endpoint
  fastify.get('/health', async (_request, reply) => {
    let redisStatus = 'disconnected';
    let dbStatus = 'disconnected';

    try {
      await redis.ping();
      redisStatus = 'connected';
    } catch {
      redisStatus = 'error';
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
      database: dbStatus,
    });
  });

  // Root endpoint
  fastify.get('/', async (_request, reply) => {
    return reply.send({
      message: 'Welcome to TacoMex 8-bit Shop API',
      version: '2.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        products: '/api/products',
        categories: '/api/categories',
        orders: '/api/orders',
        users: '/api/users',
        promotions: '/api/promotions',
      },
    });
  });

  // Register API routes with stricter rate limits for specific endpoints
  await fastify.register(async (api) => {
    // Auth routes with stricter rate limiting
    await api.register(async (authApi) => {
      // Apply stricter rate limit for login/register (relaxed in dev)
      await authApi.register(rateLimit, {
        max: isDev ? 1000 : 5,
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
        max: isDev ? 1000 : 10,
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
  }, { prefix: '/api' });

  return fastify;
}

async function start(): Promise<void> {
  try {
    // Connect to Redis first (before building server, since rate-limit needs it)
    await redis.connect();

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    const fastify = await buildServer();

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
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
    `);

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\nReceived ${signal}, shutting down gracefully...`);
        await fastify.close();
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
