"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { money, num, shortDate } from "@/lib/format";
import type { Locale, Product, Sale } from "@/lib/types";
import Sheet from "./Sheet";
import SaleForm, { SaleFormLabels } from "./SaleForm";

export type SalesLabels = {
  form: SaleFormLabels;
  actions: { newSale: string; recordSale: string; error: string; invoicePdf: string };
  cols: { seller: string; customer: string; date: string; quantity: string; unitPrice: string; total: string; product: string; invoice: string };
  searchPlaceholder: string;
  emptyText: string;
};

/**
 * Every sale: who sold it (seller), to whom (customer), what was sold
 * (product) and at what price. One-tap new sale via the FAB / button;
 * each sale links to its PDF invoice.
 */
export default function SalesList({
  sales,
  products,
  locale,
  labels,
}: {
  sales: Sale[];
  products: Product[];
  locale: Locale;
  labels: SalesLabels;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const productById = useMemo(() => {
    const m = new Map<number, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const rows = useMemo(() => {
    const sorted = [...sales].sort(
      (a, b) => b.date.localeCompare(a.date) || b.id - a.id
    );
    const q = query.trim();
    if (!q) return sorted;
    return sorted.filter((s) => {
      const p = productById.get(s.productId);
      return `${s.sellerName} ${s.customerName} ${s.invoiceNumber} ${p?.name.ar ?? ""} ${p?.name.he ?? ""} ${p?.sku ?? ""}`.includes(q);
    });
  }, [sales, query, productById]);

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
          onClick={() => setOpen(true)}
          className="hidden lg:inline-flex items-center gap-2 rounded-xl bg-accent text-white font-semibold px-4 hover:opacity-95 active:scale-[.99] transition"
        >
          <PlusIcon />
          {labels.actions.newSale}
        </button>
      </div>

      {/* Mobile: cards */}
      <ul className="lg:hidden space-y-3">
        {rows.slice(0, 100).map((s) => {
          const p = productById.get(s.productId);
          return (
            <li key={s.id} className="rounded-2xl bg-card border border-line shadow-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{p?.name[locale] ?? `#${s.productId}`}</p>
                  <p className="text-xs text-ink/45 mt-0.5">
                    {shortDate(s.date, locale)} · <span dir="ltr">{s.invoiceNumber}</span>
                  </p>
                </div>
                <p className="font-bold tabular-nums text-accent shrink-0">
                  {money(s.unitPrice * s.quantity, locale)}
                </p>
              </div>
              <div className="text-sm text-ink/70 space-y-0.5">
                <p>
                  {labels.cols.seller}: <b className="text-ink">{s.sellerName}</b>
                </p>
                <p>
                  {labels.cols.customer}: <b className="text-ink">{s.customerName}</b>
                </p>
                <p className="tabular-nums">
                  {num(s.quantity, locale)} × {money(s.unitPrice, locale)}
                </p>
              </div>
              <Link
                href={`/${locale}/print/invoice/${s.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 h-9 text-sm font-semibold text-ink/70 hover:bg-surface active:scale-95 transition"
              >
                <PdfIcon />
                {labels.actions.invoicePdf}
              </Link>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="rounded-2xl bg-card border border-line p-8 text-center text-ink/50">
            {labels.emptyText}
          </li>
        )}
      </ul>

      {/* Desktop: table */}
      <div className="hidden lg:block rounded-2xl bg-card border border-line shadow-card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-ink/55 border-b border-line bg-surface/60">
              <th className="text-start font-medium px-4 py-3">{labels.cols.date}</th>
              <th className="text-start font-medium px-4 py-3">{labels.cols.product}</th>
              <th className="text-start font-medium px-4 py-3">{labels.cols.seller}</th>
              <th className="text-start font-medium px-4 py-3">{labels.cols.customer}</th>
              <th className="text-end font-medium px-4 py-3">{labels.cols.quantity}</th>
              <th className="text-end font-medium px-4 py-3">{labels.cols.unitPrice}</th>
              <th className="text-end font-medium px-4 py-3">{labels.cols.total}</th>
              <th className="text-start font-medium px-4 py-3">{labels.cols.invoice}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.slice(0, 200).map((s) => {
              const p = productById.get(s.productId);
              return (
                <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">{shortDate(s.date, locale)}</td>
                  <td className="px-4 py-3 font-medium">{p?.name[locale] ?? `#${s.productId}`}</td>
                  <td className="px-4 py-3">{s.sellerName}</td>
                  <td className="px-4 py-3">{s.customerName}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{num(s.quantity, locale)}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{money(s.unitPrice, locale)}</td>
                  <td className="px-4 py-3 text-end tabular-nums font-semibold">
                    {money(s.unitPrice * s.quantity, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/print/invoice/${s.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink/70 hover:bg-surface transition"
                    >
                      <PdfIcon />
                      {labels.actions.invoicePdf}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
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
        onClick={() => setOpen(true)}
        aria-label={labels.actions.newSale}
        className="lg:hidden print:hidden fixed bottom-24 end-4 z-40 h-14 w-14 rounded-full bg-accent text-white shadow-lg shadow-accent/30 inline-flex items-center justify-center active:scale-95 transition"
      >
        <PlusIcon className="h-7 w-7" />
      </button>

      <Sheet open={open} title={labels.actions.newSale} onClose={() => setOpen(false)}>
        <SaleForm
          products={products}
          locale={locale}
          labels={labels.form}
          saveLabel={labels.actions.recordSale}
          errorLabel={labels.actions.error}
          onDone={() => setOpen(false)}
        />
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

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" />
      <path d="M14 3v6h6" />
    </svg>
  );
}
