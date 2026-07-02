"use client";

import { useMemo, useState, useTransition } from "react";
import { recordSaleAction } from "@/lib/actions";
import { intlLocaleOf } from "@/lib/format";
import type { Locale, Product } from "@/lib/types";

export type SaleFormLabels = {
  product: string;
  quantity: string;
  unitPrice: string;
  seller: string;
  customer: string;
  total: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent";

/**
 * Record a sale in one tap: who sold (seller), to whom (customer),
 * what (product) and at what price. Price prefills from the product.
 */
export default function SaleForm({
  products,
  locale,
  initialProductId,
  labels,
  saveLabel,
  errorLabel,
  onDone,
}: {
  products: Product[];
  locale: Locale;
  initialProductId?: number;
  labels: SaleFormLabels;
  saveLabel: string;
  errorLabel: string;
  onDone: () => void;
}) {
  const first = initialProductId ?? products[0]?.id;
  const [productId, setProductId] = useState<number>(first);
  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(product?.salePrice ?? 0);
  const [sellerName, setSellerName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function pickProduct(id: number) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) setUnitPrice(p.salePrice);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await recordSaleAction({
        productId,
        quantity,
        unitPrice,
        sellerName: sellerName.trim(),
        customerName: customerName.trim(),
      });
      if (result.ok) onDone();
      else setError(true);
    });
  }

  const total = quantity * unitPrice;
  const fmt = new Intl.NumberFormat(intlLocaleOf(locale), {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink/70">{labels.product}</span>
        <select
          value={productId}
          onChange={(e) => pickProduct(Number(e.target.value))}
          className={inputCls}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name[locale]} — {p.sku}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/70">{labels.quantity}</span>
          <div className="flex items-stretch rounded-xl border border-line overflow-hidden" dir="ltr">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-4 text-xl font-bold text-ink/60 hover:bg-surface"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full text-center py-3 outline-none tabular-nums"
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-4 text-xl font-bold text-ink/60 hover:bg-surface"
            >
              +
            </button>
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/70">{labels.unitPrice}</span>
          <input
            type="number"
            min={0}
            step="0.5"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            className={inputCls}
            inputMode="decimal"
            dir="ltr"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/70">{labels.seller}</span>
          <input
            required
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/70">{labels.customer}</span>
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-accentSoft px-4 py-3">
        <span className="text-sm font-medium text-ink/70">{labels.total}</span>
        <span className="text-lg font-bold text-accent tabular-nums">{fmt.format(total)}</span>
      </div>

      {error && <p className="text-sm text-loss">{errorLabel}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent text-white font-semibold py-3.5 text-[15px] hover:opacity-95 active:scale-[.99] transition disabled:opacity-60"
      >
        {pending ? "…" : saveLabel}
      </button>
    </form>
  );
}
