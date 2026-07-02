"use server";

import { revalidatePath } from "next/cache";
import {
  adjustStock as apiAdjustStock,
  createProduct,
  createSale,
  deleteProduct as apiDeleteProduct,
  updateProduct,
} from "./api";
import { ProductInput, SaleInput } from "./types";

/**
 * One-click operations. Each mutation writes an activity-log entry
 * (see lib/api.ts) and refreshes every page that shows the data.
 */

function revalidateAll() {
  revalidatePath("/", "layout");
}

export type ActionResult = { ok: true } | { ok: false; error: string };

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

function readProductForm(formData: FormData): ProductInput {
  const num = (k: string) => Number(formData.get(k) ?? 0);
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    sku: str("sku"),
    name: { ar: str("name_ar"), he: str("name_he") },
    category: { ar: str("category_ar"), he: str("category_he") },
    costPrice: num("costPrice"),
    salePrice: num("salePrice"),
    stock: num("stock"),
  };
}

export async function addProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const input = readProductForm(formData);
    if (!input.sku || !input.name.ar || !input.name.he) {
      return { ok: false, error: "missing-fields" };
    }
    await createProduct(input);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateProductAction(id: number, formData: FormData): Promise<ActionResult> {
  try {
    const input = readProductForm(formData);
    if (!input.sku || !input.name.ar || !input.name.he) {
      return { ok: false, error: "missing-fields" };
    }
    await updateProduct(id, input);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  try {
    await apiDeleteProduct(id);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function adjustStockAction(id: number, delta: number): Promise<ActionResult> {
  try {
    await apiAdjustStock(id, delta);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function recordSaleAction(input: SaleInput): Promise<ActionResult> {
  try {
    if (!input.productId || input.quantity <= 0 || !input.sellerName || !input.customerName) {
      return { ok: false, error: "missing-fields" };
    }
    await createSale(input);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
