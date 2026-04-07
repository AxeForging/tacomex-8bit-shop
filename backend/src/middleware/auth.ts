import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { JwtPayload } from '@/types';
import { cache } from '@/config/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'tacomex-8bit-secret-key-change-in-production';

// Register JWT plugin configuration
export function getJwtConfig() {
  return {
    secret: JWT_SECRET,
    sign: {
      expiresIn: '7d',
    },
  };
}

// Generate token helper
export function generateToken(fastify: FastifyInstance, payload: JwtPayload): string {
  return fastify.jwt.sign(payload);
}

// Authentication hook - verifies JWT token and checks blacklist
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  // Check if token has been blacklisted (logged out)
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) {
    const blacklisted = await cache.isTokenBlacklisted(token);
    if (blacklisted) {
      return reply.status(401).send({ error: 'Token has been revoked. Please log in again.' });
    }
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    // Token is invalid or missing - continue without user (request.user stays unset)
  }
}

// Admin requirement hook - must be called after authenticate
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  if (request.user.role !== 'admin') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
}

// Combined auth + admin check for convenience
export async function authenticateAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) {
    const blacklisted = await cache.isTokenBlacklisted(token);
    if (blacklisted) {
      return reply.status(401).send({ error: 'Token has been revoked. Please log in again.' });
    }
  }

  if (request.user?.role !== 'admin') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
}
