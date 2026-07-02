import { getStore, nextInvoiceNumber, nextOrderNumber } from "./store";
import {
  ActivityAction,
  ActivityEntity,
  ActivityLog,
  Order,
  OrderInput,
  OrderItem,
  PeriodPoint,
  Product,
  ProductInput,
  ProductReportRow,
  Sale,
  SaleInput,
  Totals,
} from "./types";

/**
 * Data source
 * -----------
 * Without STRAPI_URL: an in-memory store (lib/store.ts) — full read/write,
 * resets on server restart.
 * With STRAPI_URL + STRAPI_API_TOKEN in .env.local: the same functions read
 * and write your Strapi CMS. Build the collections per collections.md.
 *
 * Every mutation (add/update/delete product, stock change, new sale) also
 * writes an activity-log entry — in Strapi when configured.
 */

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

const useStrapi = () => Boolean(STRAPI_URL);

async function strapi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Strapi ${init?.method ?? "GET"} ${path} failed: ${res.status} ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.data as T;
}

type StrapiEntity = { id: number; attributes: any };

function mapProduct(d: StrapiEntity): Product {
  return {
    id: d.id,
    sku: d.attributes.sku,
    name: { ar: d.attributes.name_ar, he: d.attributes.name_he },
    category: { ar: d.attributes.category_ar, he: d.attributes.category_he },
    costPrice: d.attributes.costPrice,
    salePrice: d.attributes.salePrice,
    stock: d.attributes.stock,
  };
}

function productToStrapi(p: ProductInput) {
  return {
    sku: p.sku,
    name_ar: p.name.ar,
    name_he: p.name.he,
    category_ar: p.category.ar,
    category_he: p.category.he,
    costPrice: p.costPrice,
    salePrice: p.salePrice,
    stock: p.stock,
  };
}

function mapSale(d: StrapiEntity): Sale {
  return {
    id: d.id,
    productId: d.attributes.product?.data?.id ?? d.attributes.productId,
    quantity: d.attributes.quantity,
    unitPrice: d.attributes.unitPrice,
    unitCost: d.attributes.unitCost,
    date: d.attributes.date,
    sellerName: d.attributes.sellerName ?? "",
    customerName: d.attributes.customerName ?? "",
    invoiceNumber: d.attributes.invoiceNumber ?? `INV-${d.id}`,
  };
}

/* ---------- Reads ---------- */

export async function getProducts(): Promise<Product[]> {
  if (useStrapi()) {
    const data = await strapi<StrapiEntity[]>("products?pagination[pageSize]=200&sort=sku:asc");
    return data.map(mapProduct);
  }
  return getStore().products;
}

export async function getProduct(id: number): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}

export async function getSales(): Promise<Sale[]> {
  if (useStrapi()) {
    const data = await strapi<StrapiEntity[]>(
      "sales?populate=product&pagination[pageSize]=1000&sort=date:asc"
    );
    return data.map(mapSale);
  }
  return getStore().sales;
}

export async function getSale(id: number): Promise<Sale | undefined> {
  if (useStrapi()) {
    const d = await strapi<StrapiEntity>(`sales/${id}?populate=product`);
    return mapSale(d);
  }
  return getStore().sales.find((s) => s.id === id);
}

function mapOrder(d: StrapiEntity): Order {
  const lines: StrapiEntity[] = d.attributes.sales?.data ?? [];
  return {
    id: d.id,
    orderNumber: d.attributes.orderNumber,
    sellerName: d.attributes.sellerName ?? "",
    customerName: d.attributes.customerName ?? "",
    date: d.attributes.date,
    items: lines.map((l) => ({
      productId: l.attributes.product?.data?.id ?? l.attributes.productId,
      quantity: l.attributes.quantity,
      unitPrice: l.attributes.unitPrice,
      unitCost: l.attributes.unitCost,
    })),
    deliveryAddress: d.attributes.deliveryAddress ?? undefined,
    deliveryFee: d.attributes.deliveryFee ?? 0,
    total: d.attributes.total,
  };
}

export async function getOrders(): Promise<Order[]> {
  if (useStrapi()) {
    const data = await strapi<StrapiEntity[]>(
      "orders?populate[sales][populate]=product&pagination[pageSize]=500&sort=date:desc"
    );
    return data.map(mapOrder);
  }
  return [...getStore().orders].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export async function getOrder(id: number): Promise<Order | undefined> {
  if (useStrapi()) {
    const d = await strapi<StrapiEntity>(`orders/${id}?populate[sales][populate]=product`);
    return mapOrder(d);
  }
  return getStore().orders.find((o) => o.id === id);
}

export async function getActivityLogs(limit = 100): Promise<ActivityLog[]> {
  if (useStrapi()) {
    const data = await strapi<StrapiEntity[]>(
      `activity-logs?pagination[pageSize]=${limit}&sort=happenedAt:desc`
    );
    return data.map((d) => ({
      id: d.id,
      action: d.attributes.action,
      entityType: d.attributes.entityType,
      entityId: d.attributes.entityId,
      summary: { ar: d.attributes.summary_ar, he: d.attributes.summary_he },
      actor: d.attributes.actor,
      happenedAt: d.attributes.happenedAt,
    }));
  }
  return [...getStore().logs].sort((a, b) => b.happenedAt.localeCompare(a.happenedAt)).slice(0, limit);
}

/* ---------- Activity logging (every add/change goes through here) ---------- */

export async function logActivity(entry: {
  action: ActivityAction;
  entityType: ActivityEntity;
  entityId: string | number;
  summary: { ar: string; he: string };
  actor?: string;
  payload?: unknown;
}): Promise<void> {
  const happenedAt = new Date().toISOString();
  const actor = entry.actor ?? "admin";
  if (useStrapi()) {
    await strapi("activity-logs", {
      method: "POST",
      body: JSON.stringify({
        data: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: String(entry.entityId),
          summary_ar: entry.summary.ar,
          summary_he: entry.summary.he,
          payload: entry.payload ?? null,
          actor,
          happenedAt,
        },
      }),
    });
    return;
  }
  const store = getStore();
  store.logs.push({
    id: store.nextLogId++,
    action: entry.action,
    entityType: entry.entityType,
    entityId: String(entry.entityId),
    summary: entry.summary,
    actor,
    happenedAt,
  });
}

/* ---------- Writes ---------- */

export async function createProduct(input: ProductInput): Promise<Product> {
  let product: Product;
  if (useStrapi()) {
    const d = await strapi<StrapiEntity>("products", {
      method: "POST",
      body: JSON.stringify({ data: productToStrapi(input) }),
    });
    product = mapProduct(d);
  } else {
    const store = getStore();
    product = { id: store.nextProductId++, ...input };
    store.products.push(product);
  }
  await logActivity({
    action: "create",
    entityType: "product",
    entityId: product.id,
    summary: {
      ar: `إضافة منتج جديد: ${input.name.ar} (${input.sku})`,
      he: `נוסף מוצר חדש: ${input.name.he} (${input.sku})`,
    },
    payload: input,
  });
  return product;
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  const before = await getProduct(id);
  let product: Product;
  if (useStrapi()) {
    const d = await strapi<StrapiEntity>(`products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ data: productToStrapi(input) }),
    });
    product = mapProduct(d);
  } else {
    const store = getStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Product ${id} not found`);
    product = { id, ...input };
    store.products[idx] = product;
  }
  await logActivity({
    action: "update",
    entityType: "product",
    entityId: id,
    summary: {
      ar: `تعديل المنتج: ${input.name.ar} (${input.sku})`,
      he: `עודכן המוצר: ${input.name.he} (${input.sku})`,
    },
    payload: { before, after: input },
  });
  return product;
}

export async function deleteProduct(id: number): Promise<void> {
  const before = await getProduct(id);
  if (useStrapi()) {
    await strapi(`products/${id}`, { method: "DELETE" });
  } else {
    const store = getStore();
    store.products = store.products.filter((p) => p.id !== id);
  }
  await logActivity({
    action: "delete",
    entityType: "product",
    entityId: id,
    summary: {
      ar: `حذف المنتج: ${before?.name.ar ?? id}`,
      he: `נמחק המוצר: ${before?.name.he ?? id}`,
    },
    payload: { before },
  });
}

export async function adjustStock(id: number, delta: number): Promise<Product> {
  const before = await getProduct(id);
  if (!before) throw new Error(`Product ${id} not found`);
  const oldStock = before.stock;
  const newStock = Math.max(0, oldStock + delta);
  let product: Product;
  if (useStrapi()) {
    const d = await strapi<StrapiEntity>(`products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ data: { stock: newStock } }),
    });
    product = mapProduct(d);
  } else {
    before.stock = newStock;
    product = before;
  }
  await logActivity({
    action: "stock",
    entityType: "product",
    entityId: id,
    summary: {
      ar: `تحديث مخزون ${before.name.ar}: ${oldStock} → ${newStock}`,
      he: `עדכון מלאי ${before.name.he}: ${oldStock} → ${newStock}`,
    },
    payload: { delta, oldStock, newStock },
  });
  return product;
}

export async function createSale(input: SaleInput): Promise<Sale> {
  const product = await getProduct(input.productId);
  if (!product) throw new Error(`Product ${input.productId} not found`);
  const date = input.date ?? new Date().toISOString().slice(0, 10);
  // Strapi mode: time-based so numbers stay unique across server restarts.
  const invoiceNumber = useStrapi()
    ? `INV-${date.replace(/-/g, "")}-${String(Date.now() % 100000).padStart(5, "0")}`
    : nextInvoiceNumber();

  let sale: Sale;
  if (useStrapi()) {
    const d = await strapi<StrapiEntity>("sales", {
      method: "POST",
      body: JSON.stringify({
        data: {
          product: input.productId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          unitCost: product.costPrice,
          date,
          sellerName: input.sellerName,
          customerName: input.customerName,
          invoiceNumber,
        },
      }),
    });
    sale = mapSale(d);
    // keep stock in sync
    await strapi(`products/${input.productId}`, {
      method: "PUT",
      body: JSON.stringify({ data: { stock: Math.max(0, product.stock - input.quantity) } }),
    });
  } else {
    const store = getStore();
    sale = {
      id: store.nextSaleId++,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      unitCost: product.costPrice,
      date,
      sellerName: input.sellerName,
      customerName: input.customerName,
      invoiceNumber,
    };
    store.sales.push(sale);
    product.stock = Math.max(0, product.stock - input.quantity);
  }

  await logActivity({
    action: "sale",
    entityType: "sale",
    entityId: sale.id,
    actor: input.sellerName,
    summary: {
      ar: `بيع ${input.quantity} × ${product.name.ar} إلى ${input.customerName} بسعر ${input.unitPrice}₪ (البائع: ${input.sellerName})`,
      he: `נמכרו ${input.quantity} × ${product.name.he} ל-${input.customerName} במחיר ₪${input.unitPrice} (מוכר: ${input.sellerName})`,
    },
    payload: { sale },
  });
  return sale;
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const products = await getProducts();
  const items: OrderItem[] = input.items.map((it) => {
    const p = products.find((x) => x.id === it.productId);
    if (!p) throw new Error(`Product ${it.productId} not found`);
    return {
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: p.salePrice,
      unitCost: p.costPrice,
    };
  });
  if (items.length === 0) throw new Error("Order has no items");

  const date = new Date().toISOString().slice(0, 10);
  const deliveryFee = Math.max(0, input.deliveryFee ?? 0);
  const itemsTotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const total = itemsTotal + deliveryFee;
  const orderNumber = useStrapi()
    ? `ORD-${date.replace(/-/g, "")}-${String(Date.now() % 100000).padStart(5, "0")}`
    : nextOrderNumber();

  let order: Order;
  if (useStrapi()) {
    const d = await strapi<StrapiEntity>("orders", {
      method: "POST",
      body: JSON.stringify({
        data: {
          orderNumber,
          sellerName: input.sellerName,
          customerName: input.customerName,
          status: "confirmed",
          date,
          deliveryAddress: input.deliveryAddress || null,
          deliveryFee,
          total,
        },
      }),
    });
    // one sale line per item, linked to the order
    for (const it of items) {
      await strapi("sales", {
        method: "POST",
        body: JSON.stringify({
          data: {
            product: it.productId,
            order: d.id,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            unitCost: it.unitCost,
            date,
            sellerName: input.sellerName,
            customerName: input.customerName,
            invoiceNumber: orderNumber,
          },
        }),
      });
      const p = products.find((x) => x.id === it.productId)!;
      await strapi(`products/${it.productId}`, {
        method: "PUT",
        body: JSON.stringify({ data: { stock: Math.max(0, p.stock - it.quantity) } }),
      });
    }
    order = { ...mapOrder(d), items };
  } else {
    const store = getStore();
    order = {
      id: store.nextOrderId++,
      orderNumber,
      sellerName: input.sellerName,
      customerName: input.customerName,
      date,
      items,
      deliveryAddress: input.deliveryAddress || undefined,
      deliveryFee,
      total,
    };
    store.orders.push(order);
    for (const it of items) {
      store.sales.push({
        id: store.nextSaleId++,
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unitCost: it.unitCost,
        date,
        sellerName: input.sellerName,
        customerName: input.customerName,
        invoiceNumber: orderNumber,
      });
      const p = store.products.find((x) => x.id === it.productId);
      if (p) p.stock = Math.max(0, p.stock - it.quantity);
    }
  }

  await logActivity({
    action: "create",
    entityType: "order",
    entityId: order.id,
    actor: input.sellerName,
    summary: {
      ar: `طلبية ${orderNumber}: ${items.length} منتجات إلى ${input.customerName} بمجموع ${total}₪${deliveryFee > 0 ? ` (توصيل ${deliveryFee}₪)` : ""}`,
      he: `הזמנה ${orderNumber}: ${items.length} מוצרים ל-${input.customerName} בסך ₪${total}${deliveryFee > 0 ? ` (משלוח ₪${deliveryFee})` : ""}`,
    },
    payload: { order },
  });
  return order;
}

/* ---------- Aggregation helpers ---------- */

export function filterByDays(sales: Sale[], days: number): Sale[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const c = cutoff.toISOString().slice(0, 10);
  return sales.filter((s) => s.date >= c);
}

export function computeTotals(sales: Sale[]): Totals {
  return sales.reduce(
    (acc, s) => {
      acc.revenue += s.unitPrice * s.quantity;
      acc.cost += s.unitCost * s.quantity;
      acc.profit += (s.unitPrice - s.unitCost) * s.quantity;
      acc.units += s.quantity;
      return acc;
    },
    { revenue: 0, cost: 0, profit: 0, units: 0 }
  );
}

export function perProductReport(products: Product[], sales: Sale[]): ProductReportRow[] {
  const map = new Map<number, ProductReportRow>();
  for (const p of products) {
    map.set(p.id, { product: p, unitsSold: 0, revenue: 0, cost: 0, profit: 0, margin: 0 });
  }
  for (const s of sales) {
    const row = map.get(s.productId);
    if (!row) continue;
    row.unitsSold += s.quantity;
    row.revenue += s.unitPrice * s.quantity;
    row.cost += s.unitCost * s.quantity;
    row.profit += (s.unitPrice - s.unitCost) * s.quantity;
  }
  const rows = Array.from(map.values());
  for (const r of rows) r.margin = r.revenue > 0 ? r.profit / r.revenue : 0;
  return rows.sort((a, b) => b.revenue - a.revenue);
}

export function dailySeries(sales: Sale[], days: number): PeriodPoint[] {
  const points = new Map<string, PeriodPoint>();
  const today = new Date();
  for (let back = days - 1; back >= 0; back--) {
    const d = new Date(today);
    d.setDate(today.getDate() - back);
    const key = d.toISOString().slice(0, 10);
    points.set(key, { label: key, revenue: 0, cost: 0, profit: 0, units: 0 });
  }
  for (const s of sales) {
    const p = points.get(s.date);
    if (!p) continue;
    p.revenue += s.unitPrice * s.quantity;
    p.cost += s.unitCost * s.quantity;
    p.profit += (s.unitPrice - s.unitCost) * s.quantity;
    p.units += s.quantity;
  }
  return Array.from(points.values());
}

function weekKey(dateStr: string): string {
  // ISO week: label by the Monday of that week
  const d = new Date(dateStr + "T00:00:00");
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function weeklySeries(sales: Sale[], weeks: number): PeriodPoint[] {
  const points = new Map<string, PeriodPoint>();
  const today = new Date();
  for (let back = weeks - 1; back >= 0; back--) {
    const d = new Date(today);
    d.setDate(today.getDate() - back * 7);
    const key = weekKey(d.toISOString().slice(0, 10));
    points.set(key, { label: key, revenue: 0, cost: 0, profit: 0, units: 0 });
  }
  for (const s of sales) {
    const p = points.get(weekKey(s.date));
    if (!p) continue;
    p.revenue += s.unitPrice * s.quantity;
    p.cost += s.unitCost * s.quantity;
    p.profit += (s.unitPrice - s.unitCost) * s.quantity;
    p.units += s.quantity;
  }
  return Array.from(points.values()).sort((a, b) => a.label.localeCompare(b.label));
}
