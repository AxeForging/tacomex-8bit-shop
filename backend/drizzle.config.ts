import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ||
      `postgres://${process.env.DB_USER || 'tacomex'}:${process.env.DB_PASSWORD || 'tacomex_secret'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'tacomex'}`,
  },
  verbose: true,
  strict: true,
});
