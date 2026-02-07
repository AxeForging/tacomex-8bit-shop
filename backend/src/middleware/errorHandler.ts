import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

// Custom error classes
export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

// Fastify error handler
export function errorHandler(
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
  });

  // Handle our custom errors
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.message,
      details: error.details,
    });
    return;
  }

  // Handle PostgreSQL errors (from postgres.js or drizzle)
  const pgError = error as { code?: string; detail?: string; column?: string };
  if (pgError.code) {
    switch (pgError.code) {
      case '23505': // unique_violation
        reply.status(409).send({
          error: 'A record with this value already exists',
          details: pgError.detail,
        });
        return;
      case '23503': // foreign_key_violation
        reply.status(400).send({
          error: 'Referenced record does not exist',
          details: pgError.detail,
        });
        return;
      case '23502': // not_null_violation
        reply.status(400).send({
          error: 'Required field is missing',
          details: pgError.column,
        });
        return;
    }
  }

  // Handle Fastify validation errors
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation error',
      details: error.validation,
    });
    return;
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message,
  });
}

// Not found handler for unmatched routes
export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  reply.status(404).send({
    error: `Route ${request.method} ${request.url} not found`,
  });
}
