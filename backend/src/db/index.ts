import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER || 'tacomex'}:${process.env.DB_PASSWORD || 'tacomex_secret'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'tacomex'}`;

// Create the postgres client
// For query purposes (used by Drizzle)
const queryClient = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

// Create the drizzle database instance with schema
export const db = drizzle(queryClient, { schema });

// Export for direct SQL queries when needed (transactions, etc.)
export const sql = queryClient;

// Connection test function
export async function testConnection(): Promise<boolean> {
  try {
    await queryClient`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  await queryClient.end();
}

// Export schema for convenience
export * from './schema';
