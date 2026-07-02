"use client";

import { useMemo, useState, useTransition } from "react";
import { adjustStockAction, deleteProductAction } from "@/lib/actions";
import { money, num, pct } from "@/lib/format";
import type { Locale, Product } from "@/lib/types";
import Sheet from "./Sheet";
import ProductForm, { FormLabels } from "./ProductForm";
import SaleForm, { SaleFormLabels } from "./SaleForm";
import { CartIcon } from "./Cart";
import { useCart } from "./CartProvider";

export interface ProductStats {
  unitsSold: number;
  revenue: number;
  profit: number;
  margin: number;
}

export type ManagerLabels = {
  table: Record<string, string>;
  form: FormLabels & SaleFormLabels;
  actions: {
    addProduct: string;
    newSale: string;
    save: string;
    recordSale: string;
    edit: string;
    delete: string;
    confirmDelete: string;
    sell: string;
    error: string;
    addToCart: string;
    inCart: string;
  };
  searchPlaceholder: string;
  emptyText: string;
};

/**
 * Mobile-first product management. Every operation is one tap:
 * stock +/- steppers, quick-sell, edit sheet, delete (tap twice), FAB add.
 */
export default function ProductManager({
  products,
  stats,
  locale,
  labels,
}: {
  products: Product[];
  stats: Record<number, ProductStats>;
  locale: Locale;
  labels: ManagerLabels;
}) {
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<
    | { kind: "add" }
    | { kind: "edit"; product: Product }
    | { kind: "sell"; product: Product }
    | null
  >(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const cart = useCart();

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name.ar} ${p.name.he} ${p.sku} ${p.category.ar} ${p.category.he}`.includes(q)
    );
  }, [products, query]);

  const bumpStock = (id: number, delta: number) =>
    startTransition(async () => {
      await adjustStockAction(id, delta);
    });

  const remove = (id: number) => {
    if (confirmingDelete !== id) {
      setConfirmingDelete(id);
      setTimeout(() => setConfirmingDelete((c) => (c === id ? null : c)), 3000);
      return;
    }
    setConfirmingDelete(null);
    startTransition(async () => {
      await deleteProductAction(id);
    });
  };

  const stepperBtn =
    "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-line text-lg font-bold text-ink/60 hover:bg-surface active:scale-95 transition disabled:opacity-40";
  const chipBtn =
    "inline-flex items-center gap-1 rounded-lg px-3 h-9 text-sm font-semibold active:scale-95 transition disabled:opacity-40";

  function rowActions(p: Product) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5" dir="ltr">
          <button disabled={pending} onClick={() => bumpStock(p.id, -1)} className={stepperBtn} aria-label="-1">
            −
          </button>
          <span className="min-w-[2.5rem] text-center font-semibold tabular-nums">{num(p.stock, locale)}</span>
          <button disabled={pending} onClick={() => bumpStock(p.id, 1)} className={stepperBtn} aria-label="+1">
            +
          </button>
        </div>
        <button
          disabled={pending}
          onClick={() => setSheet({ kind: "sell", product: p })}
          className={`${chipBtn} bg-accent text-white`}
        >
          {labels.actions.sell}
        </button>
        <button
          type="button"
          onClick={() => (cart.has(p.id) ? cart.remove(p.id) : cart.add(p.id))}
          className={`${chipBtn} ${
            cart.has(p.id)
              ? "bg-ink text-white"
              : "border border-line text-ink/70 hover:bg-surface"
          }`}
        >
          <CartIcon className="h-4 w-4" />
          {cart.has(p.id) ? labels.actions.inCart : labels.actions.addToCart}
        </button>
        <button
          disabled={pending}
          onClick={() => setSheet({ kind: "edit", product: p })}
          className={`${chipBtn} border border-line text-ink/70 hover:bg-surface`}
        >
          {labels.actions.edit}
        </button>
        <button
          disabled={pending}
          onClick={() => remove(p.id)}
          className={`${chipBtn} ${
            confirmingDelete === p.id ? "bg-loss text-white" : "border border-line text-loss hover:bg-loss/5"
          }`}
        >
          {confirmingDelete === p.id ? labels.actions.confirmDelete : labels.actions.delete}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="flex-1 lg:max-w-sm rounded-xl border border-line bg-card px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
        <button
          onClick={() => setSheet({ kind: "add" })}
          className="hidden lg:inline-flex items-center gap-2 rounded-xl bg-accent text-white font-semibold px-4 hover:opacity-95 active:scale-[.99] transition"
        >
          <PlusIcon />
          {labels.actions.addProduct}
        </button>
      </div>

      {/* Mobile: cards */}
      <ul className="lg:hidden space-y-3">
        {filtered.map((p) => {
          const s = stats[p.id];
          return (
            <li key={p.id} className="rounded-2xl bg-card border border-line shadow-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{p.name[locale]}</p>
                  <p className="text-xs text-ink/45 mt-0.5">
                    <span dir="ltr">{p.sku}</span> · {p.category[locale]}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="font-bold tabular-nums">{money(p.salePrice, locale)}</p>
                  <p className="text-xs text-ink/45 tabular-nums">{money(p.costPrice, locale)}</p>
                </div>
              </div>
              {s && (
                <div className="flex gap-4 text-xs text-ink/55 tabular-nums">
                  <span>
                    {labels.table.unitsSold}: <b className="text-ink">{num(s.unitsSold, locale)}</b>
                  </span>
                  <span>
                    {labels.table.profit}: <b className="text-profit">{money(s.profit, locale)}</b>
                  </span>
                  <span>{pct(s.margin, locale)}</span>
                </div>
              )}
              {rowActions(p)}
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-2xl bg-card border border-line p-8 text-center text-ink/50">
            {labels.emptyText}
          </li>
        )}
      </ul>

      {/* Desktop: table */}
      <div className="hidden lg:block rounded-2xl bg-card border border-line shadow-card overflow-x-auto">
        <table className="w-full text-sm min-w-[960px]">
          <thead>
            <tr className="text-ink/55 border-b border-line bg-surface/60">
              <th className="text-start font-medium px-4 py-3">{labels.table.product}</th>
              <th className="text-start font-medium px-4 py-3">{labels.table.category}</th>
              <th className="text-end font-medium px-4 py-3">{labels.table.costPrice}</th>
              <th className="text-end font-medium px-4 py-3">{labels.table.salePrice}</th>
              <th className="text-end font-medium px-4 py-3">{labels.table.unitsSold}</th>
              <th className="text-end font-medium px-4 py-3">{labels.table.revenue}</th>
              <th className="text-end font-medium px-4 py-3">{labels.table.profit}</th>
              <th className="text-start font-medium px-4 py-3">{labels.table.stock}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((p) => {
              const s = stats[p.id];
              return (
                <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name[locale]}</p>
                    <p className="text-xs text-ink/45" dir="ltr">
                      {p.sku}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{p.category[locale]}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{money(p.costPrice, locale)}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{money(p.salePrice, locale)}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{s ? num(s.unitsSold, locale) : "—"}</td>
                  <td className="px-4 py-3 text-end tabular-nums font-medium">
                    {s ? money(s.revenue, locale) : "—"}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums font-medium text-profit">
                    {s ? money(s.profit, locale) : "—"}
                  </td>
                  <td className="px-4 py-3">{rowActions(p)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink/50">
                  {labels.emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setSheet({ kind: "add" })}
        aria-label={labels.actions.addProduct}
        className="lg:hidden print:hidden fixed bottom-24 end-4 z-40 h-14 w-14 rounded-full bg-accent text-white shadow-lg shadow-accent/30 inline-flex items-center justify-center active:scale-95 transition"
      >
        <PlusIcon className="h-7 w-7" />
      </button>

      <Sheet
        open={sheet?.kind === "add"}
        title={labels.actions.addProduct}
        onClose={() => setSheet(null)}
      >
        <ProductForm
          labels={labels.form}
          saveLabel={labels.actions.save}
          errorLabel={labels.actions.error}
          onDone={() => setSheet(null)}
        />
      </Sheet>

      <Sheet
        open={sheet?.kind === "edit"}
        title={labels.actions.edit}
        onClose={() => setSheet(null)}
      >
        {sheet?.kind === "edit" && (
          <ProductForm
            initial={sheet.product}
            labels={labels.form}
            saveLabel={labels.actions.save}
            errorLabel={labels.actions.error}
            onDone={() => setSheet(null)}
          />
        )}
      </Sheet>

      <Sheet
        open={sheet?.kind === "sell"}
        title={labels.actions.newSale}
        onClose={() => setSheet(null)}
      >
        {sheet?.kind === "sell" && (
          <SaleForm
            products={products}
            locale={locale}
            initialProductId={sheet.product.id}
            labels={labels.form}
            saveLabel={labels.actions.recordSale}
            errorLabel={labels.actions.error}
            onDone={() => setSheet(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

function PlusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
