import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users } from '../db';
import { authenticate, generateToken } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';
import { JwtPayload } from '../types';

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

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /auth/register
  fastify.post<{ Body: RegisterBody }>(
    '/register',
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
    { preHandler: [authenticate] },
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
}
