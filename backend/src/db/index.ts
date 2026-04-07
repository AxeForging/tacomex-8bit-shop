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

// Idempotent DDL migrations — safe to run on every startup.
// All statements use IF NOT EXISTS so they are no-ops on an up-to-date DB
// and automatically apply missing schema to stale volumes.
// Keep in sync with scripts/init-db.sql when adding new tables/indexes.
export async function runMigrations(): Promise<void> {
  console.log('Running migrations...');

  await queryClient`CREATE TABLE IF NOT EXISTS _seed_history (
    id SERIAL PRIMARY KEY,
    seed_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    spice_level INT DEFAULT 0 CHECK (spice_level >= 0 AND spice_level <= 5),
    prep_time_minutes INT DEFAULT 15,
    calories INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS product_options (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    option_type VARCHAR(50) NOT NULL CHECK (option_type IN ('size', 'extra', 'sauce', 'side')),
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    is_default BOOLEAN DEFAULT false
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_uses INT,
    current_uses INT DEFAULT 0,
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    promotion_id INT REFERENCES promotions(id) ON DELETE SET NULL,
    delivery_address TEXT,
    delivery_notes TEXT,
    estimated_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    options_json JSONB,
    subtotal DECIMAL(10, 2) NOT NULL
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(id) ON DELETE SET NULL
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS user_favorites (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
  )`;

  await queryClient`CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms')),
    subject VARCHAR(500),
    body TEXT NOT NULL,
    from_address VARCHAR(255),
    to_address VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  await queryClient`CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category_id)`;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_products_featured     ON products(is_featured) WHERE is_featured = true`;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_orders_user           ON orders(user_id)`;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status)`;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_order_items_order     ON order_items(order_id)`;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_promotions_code       ON promotions(code)`;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_promotions_active     ON promotions(is_active) WHERE is_active = true`;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id)`;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(user_id, channel)`;

  console.log('Migrations complete.');
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  await queryClient.end();
}

// Export schema for convenience
export * from './schema';
