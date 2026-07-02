import { ActivityLog, Product, Sale } from "./types";
import { generateMockSales, mockProducts } from "./mock-data";

/**
 * In-memory store used when STRAPI_URL is not configured.
 * Lives on globalThis so it survives Next.js dev-server HMR reloads and is
 * shared between pages and server actions. Data resets when the server
 * restarts — Strapi is the real persistence layer (see collections.md).
 */

interface Store {
  products: Product[];
  sales: Sale[];
  logs: ActivityLog[];
  nextProductId: number;
  nextSaleId: number;
  nextLogId: number;
  nextInvoiceSeq: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __productsAppStore: Store | undefined;
}

export function getStore(): Store {
  if (!globalThis.__productsAppStore) {
    globalThis.__productsAppStore = {
      products: mockProducts.map((p) => ({ ...p })),
      sales: generateMockSales(60),
      logs: [],
      nextProductId: 1000,
      nextSaleId: 100000,
      nextLogId: 1,
      nextInvoiceSeq: 10000,
    };
  }
  return globalThis.__productsAppStore;
}

export function nextInvoiceNumber(): string {
  const store = getStore();
  return `INV-${String(store.nextInvoiceSeq++).padStart(5, "0")}`;
}
