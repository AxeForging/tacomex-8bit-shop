import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users } from '@/db';
import { authenticate, generateToken } from '@/middleware/auth';
import { ValidationError } from '@/middleware/errorHandler';
import { JwtPayload } from '@/types';
import { cache } from '@/config/redis';
import { sendWelcomeSms } from '@/services/notificationPublisher';

// Request body types
interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

const UserSchema = {
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
};

const AuthResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Login successful' },
    user: UserSchema,
    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
  },
};

const ErrorSchema = {
  type: 'object',
  properties: { error: { type: 'string' } },
};

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /auth/register
  fastify.post<{ Body: RegisterBody }>(
    '/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Register',
        description: 'Create a new customer account. Returns a JWT token.',
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 6, example: 'secret123' },
          },
        },
        response: {
          201: { description: 'Registration successful', ...AuthResponseSchema },
          400: { description: 'Validation error (missing fields, invalid email, weak password, already registered)', ...ErrorSchema },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
      const { email, password, name } = request.body;

      // Validation
      if (!email || !password || !name) {
        throw new ValidationError('Email, password, and name are required');
      }

      if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
      }

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
        columns: { id: true },
      });

      if (existingUser) {
        throw new ValidationError('Email already registered');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: 'customer',
      }).returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      });

      // Generate token
      const tokenPayload: JwtPayload = {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role as 'customer' | 'admin',
      };
      const token = generateToken(fastify, tokenPayload);

      // Send welcome SMS via RabbitMQ
      sendWelcomeSms({
        userId: newUser.id,
        name: newUser.name,
      }).catch((err) => console.error('Failed to send welcome SMS:', err));

      return reply.status(201).send({
        message: 'Registration successful',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          avatar_url: newUser.avatarUrl,
          created_at: newUser.createdAt,
        },
        token,
      });
    }
  );

  // POST /auth/login
  fastify.post<{ Body: LoginBody }>(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticate with email and password. Returns a JWT bearer token.',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'customer@tacomex.com' },
            password: { type: 'string', example: 'pass123' },
          },
        },
        response: {
          200: { description: 'Login successful', ...AuthResponseSchema },
          400: { description: 'Invalid credentials or missing fields', ...ErrorSchema },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const { email, password } = request.body;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user) {
        throw new ValidationError('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new ValidationError('Invalid email or password');
      }

      // Generate token
      const tokenPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role as 'customer' | 'admin',
      };
      const token = generateToken(fastify, tokenPayload);

      return reply.send({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar_url: user.avatarUrl,
          created_at: user.createdAt,
        },
        token,
      });
    }
  );

  // GET /auth/me
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Get current user',
        description: 'Returns the profile of the authenticated user.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Current user profile',
            type: 'object',
            properties: { user: UserSchema },
          },
          401: { description: 'Unauthorized — missing or invalid token', ...ErrorSchema },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, request.user!.userId),
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
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar_url: user.avatarUrl,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        },
      });
    }
  );

  // POST /auth/logout
  fastify.post(
    '/logout',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'Invalidates the current JWT by adding it to a Redis blacklist for the remainder of its TTL. Subsequent requests with this token will be rejected with 401.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Logged out successfully',
            type: 'object',
            properties: { message: { type: 'string', example: 'Logged out successfully' } },
          },
          401: { description: 'Unauthorized', ...ErrorSchema },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (token) {
        // Blacklist the token for its remaining TTL
        const payload = request.user as JwtPayload & { exp?: number };
        const ttl = payload.exp
          ? Math.max(payload.exp - Math.floor(Date.now() / 1000), 1)
          : 604800; // fallback: 7 days
        await cache.blacklistToken(token, ttl);
      }
      return reply.send({ message: 'Logged out successfully' });
    }
  );
}
