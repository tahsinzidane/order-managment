export type Unit = 'piece' | 'dozen' | 'box';

export type OrderStatus = 'active' | 'previous';

export interface Product {
  id: string;
  title: string;
  price: number;
  unit: Unit;
  quantity?: number | null;
  imageUri?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  title: string;
  price: number;
  unit: Unit;
  quantity?: number | null;
  imageUri?: string | null;
}

export interface Order {
  id: string;
  shopName: string;
  location: string;
  phone?: string | null;
  note?: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  productTitle: string;
  quantity: number;
  unit: Unit;
  price: number;
  /** Catalog unit of the product at order time (e.g. 'dozen' for piece-ordered dozen items). */
  catalogUnit?: Unit | null;
  createdAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  total: number;
  productCount: number;
}

export interface OrderListRow extends Order {
  total: number;
  productCount: number;
}

export interface ProductSummaryRow {
  productTitle: string;
  unit: Unit;
  unitPrice: number;
  totalQty: number;
  totalValue: number;
}

export interface DraftItem {
  key: string;
  productId?: string | null;
  productTitle: string;
  quantity: number;
  unit: Unit;
  price: number;
  catalogUnit?: Unit | null;
}

export function isUnit(value: string): value is Unit {
  return value === 'piece' || value === 'dozen' || value === 'box';
}
