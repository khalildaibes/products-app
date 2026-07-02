"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createOrderAction } from "@/lib/actions";
import { intlLocaleOf, money, num } from "@/lib/format";
import type { Locale, Product } from "@/lib/types";
import Sheet from "./Sheet";
import { useCart } from "./CartProvider";

export type CartLabels = {
  title: string;
  empty: string;
  seller: string;
  customer: string;
  deliveryAddress: string;
  deliveryFee: string;
  itemsTotal: string;
  total: string;
  checkout: string;
  error: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent";

/**
 * Floating cart button + checkout sheet. The cart holds many products
 * (each product enters once; its quantity is chosen here). Checkout
 * creates one order with an optional supply address and delivery fee.
 */
export default function Cart({
  products,
  locale,
  labels,
}: {
  products: Product[];
  locale: Locale;
  labels: CartLabels;
}) {
  const cart = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  // hide on PDF/print documents
  if (pathname.includes("/print/")) return null;

  const lines = cart.items
    .map((it) => ({ item: it, product: products.find((p) => p.id === it.productId) }))
    .filter((l): l is { item: (typeof cart.items)[number]; product: Product } => Boolean(l.product));

  const itemsTotal = lines.reduce((sum, l) => sum + l.product.salePrice * l.item.quantity, 0);
  const fee = deliveryAddress.trim() ? Math.max(0, deliveryFee) : 0;
  const grandTotal = itemsTotal + fee;

  const fmt = new Intl.NumberFormat(intlLocaleOf(locale), {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  });

  function checkout(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createOrderAction({
        sellerName: sellerName.trim(),
        customerName: customerName.trim(),
        items: cart.items,
        deliveryAddress: deliveryAddress.trim() || undefined,
        deliveryFee: fee,
      });
      if (result.ok) {
        cart.clear();
        setOpen(false);
        setError(false);
        router.push(`/${locale}/print/order/${result.orderId}`);
      } else {
        setError(true);
      }
    });
  }

  const stepperBtn =
    "h-8 w-8 inline-flex items-center justify-center rounded-lg border border-line text-lg font-bold text-ink/60 hover:bg-surface active:scale-95 transition";

  return (
    <>
      {cart.count > 0 && (
        <button
          onClick={() => setOpen(true)}
          aria-label={labels.title}
          className="print:hidden fixed bottom-24 start-4 lg:bottom-8 lg:start-auto lg:end-8 z-40 h-14 w-14 rounded-full bg-ink text-white shadow-lg shadow-ink/30 inline-flex items-center justify-center active:scale-95 transition"
        >
          <CartIcon className="h-6 w-6" />
          <span className="absolute -top-1 -end-1 h-6 min-w-[1.5rem] px-1 rounded-full bg-loss text-white text-xs font-bold inline-flex items-center justify-center tabular-nums">
            {num(cart.count, locale)}
          </span>
        </button>
      )}

      <Sheet open={open} title={labels.title} onClose={() => setOpen(false)}>
        {lines.length === 0 ? (
          <p className="py-8 text-center text-ink/50">{labels.empty}</p>
        ) : (
          <form onSubmit={checkout} className="space-y-4">
            <ul className="divide-y divide-line">
              {lines.map(({ item, product }) => (
                <li key={product.id} className="py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{product.name[locale]}</p>
                    <p className="text-xs text-ink/45 tabular-nums">
                      {money(product.salePrice, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(product.id, item.quantity - 1)}
                      className={stepperBtn}
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold tabular-nums">
                      {num(item.quantity, locale)}
                    </span>
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(product.id, item.quantity + 1)}
                      className={stepperBtn}
                    >
                      +
                    </button>
                  </div>
                  <p className="w-20 text-end font-semibold tabular-nums shrink-0">
                    {money(product.salePrice * item.quantity, locale)}
                  </p>
                  <button
                    type="button"
                    onClick={() => cart.remove(product.id)}
                    aria-label="remove"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-loss hover:bg-loss/10 active:scale-95 transition"
                  >
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 6h18M8 6V4h8v2m1 0l-1 14H8L7 6M10 11v6M14 11v6" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink/70">{labels.seller}</span>
                <input required value={sellerName} onChange={(e) => setSellerName(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink/70">{labels.customer}</span>
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/70">{labels.deliveryAddress}</span>
              <input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className={inputCls}
              />
            </label>

            {deliveryAddress.trim() && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink/70">{labels.deliveryFee}</span>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className={inputCls}
                  inputMode="decimal"
                  dir="ltr"
                />
              </label>
            )}

            <div className="rounded-xl bg-accentSoft px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm text-ink/70">
                <span>{labels.itemsTotal}</span>
                <span className="tabular-nums">{fmt.format(itemsTotal)}</span>
              </div>
              {fee > 0 && (
                <div className="flex items-center justify-between text-sm text-ink/70">
                  <span>{labels.deliveryFee}</span>
                  <span className="tabular-nums">{fmt.format(fee)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-accent/20 pt-1.5">
                <span className="text-sm font-medium text-ink/70">{labels.total}</span>
                <span className="text-lg font-bold text-accent tabular-nums">{fmt.format(grandTotal)}</span>
              </div>
            </div>

            {error && <p className="text-sm text-loss">{labels.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-accent text-white font-semibold py-3.5 text-[15px] hover:opacity-95 active:scale-[.99] transition disabled:opacity-60"
            >
              {pending ? "…" : labels.checkout}
            </button>
          </form>
        )}
      </Sheet>
    </>
  );
}

export function CartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 3h2l2.5 12.5a1.5 1.5 0 001.5 1.2h8.6a1.5 1.5 0 001.5-1.2L21 7H6" strokeLinecap="round" />
    </svg>
  );
}
