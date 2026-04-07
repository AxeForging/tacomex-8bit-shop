import { FastifyRequest } from 'fastify';

// JWT Payload interface
export interface JwtPayload {
  userId: number;
  email: string;
  role: 'customer' | 'admin';
}

// Extended FastifyRequest with user
export interface AuthRequest extends FastifyRequest {
  user: JwtPayload;
}

// API Error interface
export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

// Pagination params
export interface PaginationParams {
  page?: string;
  limit?: string;
}

// Common response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Order item input for creating orders
export interface OrderItemInput {
  product_id: number;
  quantity: number;
  options?: number[];
}

// Declare module augmentation for Fastify
declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
