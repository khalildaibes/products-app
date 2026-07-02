export type Locale = "ar" | "he";

export interface Product {
  id: number;
  sku: string;
  name: { ar: string; he: string };
  category: { ar: string; he: string };
  costPrice: number; // what it costs us (per unit)
  salePrice: number; // what we sell it for (per unit)
  stock: number;
}

export interface ProductInput {
  sku: string;
  name: { ar: string; he: string };
  category: { ar: string; he: string };
  costPrice: number;
  salePrice: number;
  stock: number;
}

export interface Sale {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number; // price at time of sale
  unitCost: number; // cost at time of sale
  date: string; // ISO date (YYYY-MM-DD)
  sellerName: string; // who sold it
  customerName: string; // to whom
  invoiceNumber: string;
}

export interface SaleInput {
  productId: number;
  quantity: number;
  unitPrice: number;
  sellerName: string;
  customerName: string;
  date?: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number; // price at time of order
  unitCost: number; // cost at time of order
}

export interface Order {
  id: number;
  orderNumber: string;
  sellerName: string; // who sold it
  customerName: string; // to whom
  date: string; // ISO date (YYYY-MM-DD)
  items: OrderItem[];
  deliveryAddress?: string; // supply address (optional)
  deliveryFee: number; // 0 when no delivery
  total: number; // items total + deliveryFee
}

export interface OrderInput {
  sellerName: string;
  customerName: string;
  items: { productId: number; quantity: number }[];
  deliveryAddress?: string;
  deliveryFee?: number;
}

export type ActivityAction = "create" | "update" | "delete" | "sale" | "stock";
export type ActivityEntity = "product" | "sale" | "customer" | "seller" | "order";

export interface ActivityLog {
  id: number;
  action: ActivityAction;
  entityType: ActivityEntity;
  entityId: string;
  summary: { ar: string; he: string };
  actor: string;
  happenedAt: string; // ISO datetime
}

export interface ProductReportRow {
  product: Product;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number; // 0..1
}

export interface PeriodPoint {
  label: string; // date or week label
  revenue: number;
  cost: number;
  profit: number;
  units: number;
}

export interface Totals {
  revenue: number;
  cost: number;
  profit: number;
  units: number;
}
