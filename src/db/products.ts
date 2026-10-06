import type { SQLiteDatabase } from 'expo-sqlite';
import type { Product, ProductInput, Unit } from '@/types';
import { isUnit } from '@/types';
import { newId, nowIso } from '@/utils/ids';

interface ProductRow {
  id: string;
  title: string;
  price: number;
  unit: string;
  quantity: number | null;
  imageUri: string | null;
  createdAt: string;
  updatedAt: string;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    unit: isUnit(row.unit) ? row.unit : 'piece',
    quantity: row.quantity,
    imageUri: row.imageUri ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function validateProductInput(input: ProductInput): string | null {
  if (!input.title.trim()) return 'Product title is required.';
  if (!Number.isFinite(input.price)) return 'Price is required.';
  if (input.price < 0) return 'Price must be 0 or greater.';
  if (!input.unit) return 'Unit is required.';
  if (input.quantity !== undefined && input.quantity !== null) {
    if (!Number.isFinite(input.quantity)) return 'Quantity must be a valid number.';
    if (input.quantity < 0) return 'Quantity must be 0 or greater.';
  }
  return null;
}

export async function listProducts(db: SQLiteDatabase, search?: string): Promise<Product[]> {
  const q = (search ?? '').trim();
  const rows = q
    ? await db.getAllAsync<ProductRow>(
        `SELECT * FROM products WHERE title LIKE ? ORDER BY title COLLATE NOCASE ASC`,
        [`%${q}%`]
      )
    : await db.getAllAsync<ProductRow>(
        `SELECT * FROM products ORDER BY title COLLATE NOCASE ASC`
      );
  return rows.map(toProduct);
}

export async function getProduct(db: SQLiteDatabase, id: string): Promise<Product | null> {
  const row = await db.getFirstAsync<ProductRow>(`SELECT * FROM products WHERE id = ?`, [id]);
  return row ? toProduct(row) : null;
}

export async function createProduct(db: SQLiteDatabase, input: ProductInput): Promise<Product> {
  const now = nowIso();
  const product: Product = {
    id: newId(),
    title: input.title.trim(),
    price: input.price,
    unit: input.unit as Unit,
    quantity: input.quantity ?? null,
    imageUri: input.imageUri ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.runAsync(
    `INSERT INTO products (id, title, price, unit, quantity, imageUri, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.id,
      product.title,
      product.price,
      product.unit,
      product.quantity ?? null,
      product.imageUri ?? null,
      now,
      now,
    ]
  );
  return product;
}

export async function updateProduct(
  db: SQLiteDatabase,
  id: string,
  input: ProductInput
): Promise<void> {
  const now = nowIso();
  await db.runAsync(
    `UPDATE products SET title = ?, price = ?, unit = ?, quantity = ?, imageUri = ?, updatedAt = ? WHERE id = ?`,
    [
      input.title.trim(),
      input.price,
      input.unit,
      input.quantity ?? null,
      input.imageUri ?? null,
      now,
      id,
    ]
  );
}

export async function deleteProduct(db: SQLiteDatabase, id: string): Promise<void> {
  // Historical order_items keep their snapshot (productTitle/unit/price).
  // productId is SET NULL automatically via FK; also null it explicitly for safety.
  await db.runAsync(`UPDATE order_items SET productId = NULL WHERE productId = ?`, [id]);
  await db.runAsync(`DELETE FROM products WHERE id = ?`, [id]);
}
