import type { SQLiteDatabase } from 'expo-sqlite';

export const DB_NAME = 'order-manager.db';
const DATABASE_VERSION = 2;

async function addColumnIfMissing(
  db: SQLiteDatabase,
  table: string,
  column: string,
  type: string
): Promise<void> {
  const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!info.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
  }
}

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = 'wal';`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  unit TEXT NOT NULL,
  quantity REAL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  shopName TEXT NOT NULL,
  location TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY NOT NULL,
  orderId TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  productId TEXT REFERENCES products(id) ON DELETE SET NULL,
  productTitle TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  price REAL NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(orderId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);
`);

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentDbVersion = result?.user_version ?? 0;

  // v2: optional product image, optional order note, catalog-unit snapshot on items.
  // Additive only — existing rows and historical data are preserved.
  // Column-existence checks make the migration safe to re-run.
  if (currentDbVersion < 2) {
    await addColumnIfMissing(db, 'products', 'imageUri', 'TEXT');
    await addColumnIfMissing(db, 'orders', 'note', 'TEXT');
    await addColumnIfMissing(db, 'order_items', 'catalogUnit', 'TEXT');
  }

  if (currentDbVersion < DATABASE_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}
