import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  DraftItem,
  OrderItem,
  OrderListRow,
  OrderStatus,
  OrderWithItems,
  ProductSummaryRow,
  Unit,
} from '@/types';
import { isUnit } from '@/types';
import { newId, nowIso } from '@/utils/ids';

interface OrderRow {
  id: string;
  shopName: string;
  location: string;
  phone: string | null;
  note: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemRow {
  id: string;
  orderId: string;
  productId: string | null;
  productTitle: string;
  quantity: number;
  unit: string;
  price: number;
  catalogUnit: string | null;
  createdAt: string;
}

function toItem(row: ItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    productTitle: row.productTitle,
    quantity: row.quantity,
    unit: isUnit(row.unit) ? row.unit : 'piece',
    price: row.price,
    catalogUnit: row.catalogUnit && isUnit(row.catalogUnit) ? row.catalogUnit : null,
    createdAt: row.createdAt,
  };
}

export function orderTotal(items: Pick<OrderItem, 'quantity' | 'price'>[]): number {
  return items.reduce((sum, it) => sum + it.quantity * it.price, 0);
}

export function validateOrderHeader(shopName: string, location: string): string | null {
  if (!shopName.trim()) return 'Shop name is required.';
  if (!location.trim()) return 'Location is required.';
  return null;
}

export async function listOrdersWithTotals(
  db: SQLiteDatabase,
  status: OrderStatus,
  search?: string
): Promise<OrderListRow[]> {
  const q = (search ?? '').trim();
  const params: (string | number)[] = [status];
  let sql = `
SELECT o.*,
  COALESCE((SELECT SUM(quantity * price) FROM order_items WHERE orderId = o.id), 0) AS total,
  COALESCE((SELECT COUNT(*) FROM order_items WHERE orderId = o.id), 0) AS productCount
FROM orders o WHERE o.status = ?`;
  if (q) {
    sql += ` AND (o.shopName LIKE ? OR o.location LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY o.updatedAt DESC`;
  const rows = await db.getAllAsync<OrderRow & { total: number; productCount: number }>(
    sql,
    params
  );
  return rows.map((r) => ({
    id: r.id,
    shopName: r.shopName,
    location: r.location,
    phone: r.phone,
    note: r.note ?? null,
    status: (r.status === 'previous' ? 'previous' : 'active') as OrderStatus,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    total: r.total,
    productCount: r.productCount,
  }));
}

export async function getOrderWithItems(
  db: SQLiteDatabase,
  id: string
): Promise<OrderWithItems | null> {
  const row = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, [id]);
  if (!row) return null;
  const items = await db.getAllAsync<ItemRow>(
    `SELECT * FROM order_items WHERE orderId = ? ORDER BY createdAt ASC`,
    [id]
  );
  const mapped = items.map(toItem);
  return {
    id: row.id,
    shopName: row.shopName,
    location: row.location,
    phone: row.phone,
    note: row.note ?? null,
    status: (row.status === 'previous' ? 'previous' : 'active') as OrderStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: mapped,
    total: orderTotal(mapped),
    productCount: mapped.length,
  };
}

export interface CreateOrderInput {
  shopName: string;
  location: string;
  phone?: string | null;
  note?: string | null;
  items: DraftItem[];
}

export async function createOrder(db: SQLiteDatabase, input: CreateOrderInput): Promise<string> {
  const now = nowIso();
  const id = newId();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO orders (id, shopName, location, phone, note, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        id,
        input.shopName.trim(),
        input.location.trim(),
        input.phone?.trim() || null,
        input.note?.trim() || null,
        now,
        now,
      ]
    );
    for (const it of input.items) {
      await db.runAsync(
        `INSERT INTO order_items (id, orderId, productId, productTitle, quantity, unit, price, catalogUnit, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          id,
          it.productId ?? null,
          it.productTitle,
          it.quantity,
          it.unit,
          it.price,
          it.catalogUnit ?? null,
          now,
        ]
      );
    }
  });
  return id;
}

export async function updateOrder(
  db: SQLiteDatabase,
  id: string,
  input: CreateOrderInput
): Promise<void> {
  const now = nowIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE orders SET shopName = ?, location = ?, phone = ?, note = ?, updatedAt = ? WHERE id = ?`,
      [
        input.shopName.trim(),
        input.location.trim(),
        input.phone?.trim() || null,
        input.note?.trim() || null,
        now,
        id,
      ]
    );
    await db.runAsync(`DELETE FROM order_items WHERE orderId = ?`, [id]);
    for (const it of input.items) {
      await db.runAsync(
        `INSERT INTO order_items (id, orderId, productId, productTitle, quantity, unit, price, catalogUnit, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          id,
          it.productId ?? null,
          it.productTitle,
          it.quantity,
          it.unit,
          it.price,
          it.catalogUnit ?? null,
          now,
        ]
      );
    }
  });
}

export async function deleteOrder(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM order_items WHERE orderId = ?`, [id]);
    await db.runAsync(`DELETE FROM orders WHERE id = ?`, [id]);
  });
}

export async function archiveOrder(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`UPDATE orders SET status = 'previous', updatedAt = ? WHERE id = ?`, [
    nowIso(),
    id,
  ]);
}

export async function getActiveValue(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ value: number }>(
    `SELECT COALESCE(SUM(oi.quantity * oi.price), 0) AS value
     FROM order_items oi JOIN orders o ON o.id = oi.orderId WHERE o.status = 'active'`
  );
  return row?.value ?? 0;
}

export async function getProductSummary(db: SQLiteDatabase): Promise<ProductSummaryRow[]> {
  const rows = await db.getAllAsync<{
    productTitle: string;
    unit: string;
    unitPrice: number;
    totalQty: number;
    totalValue: number;
  }>(
    `SELECT oi.productTitle AS productTitle, oi.unit AS unit, oi.price AS unitPrice,
      SUM(oi.quantity) AS totalQty, SUM(oi.quantity * oi.price) AS totalValue
     FROM order_items oi JOIN orders o ON o.id = oi.orderId
     WHERE o.status = 'active'
     GROUP BY oi.productTitle, oi.unit, oi.price
     ORDER BY oi.productTitle COLLATE NOCASE ASC`
  );
  return rows.map((r) => ({
    productTitle: r.productTitle,
    unit: (isUnit(r.unit) ? r.unit : 'piece') as Unit,
    unitPrice: r.unitPrice,
    totalQty: r.totalQty,
    totalValue: r.totalValue,
  }));
}
