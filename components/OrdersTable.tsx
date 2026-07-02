import Link from "next/link";
import { money, num, shortDate } from "@/lib/format";
import type { Locale, Order, Product } from "@/lib/types";

export type OrdersLabels = {
  order: string;
  date: string;
  seller: string;
  customer: string;
  items: string;
  delivery: string;
  total: string;
  invoicePdf: string;
  empty: string;
};

/** Orders created from the cart — server-rendered list with PDF links. */
export default function OrdersTable({
  orders,
  products,
  locale,
  labels,
}: {
  orders: Order[];
  products: Product[];
  locale: Locale;
  labels: OrdersLabels;
}) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const itemsSummary = (o: Order) =>
    o.items
      .map((it) => `${num(it.quantity, locale)} × ${productById.get(it.productId)?.name[locale] ?? `#${it.productId}`}`)
      .join(" · ");

  if (orders.length === 0) {
    return (
      <p className="rounded-2xl bg-card border border-line p-8 text-center text-ink/50">
        {labels.empty}
      </p>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="lg:hidden space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="rounded-2xl bg-card border border-line shadow-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold tabular-nums" dir="ltr">
                  {o.orderNumber}
                </p>
                <p className="text-xs text-ink/45 mt-0.5">{shortDate(o.date, locale)}</p>
              </div>
              <p className="font-bold tabular-nums text-accent shrink-0">{money(o.total, locale)}</p>
            </div>
            <p className="text-sm text-ink/70">{itemsSummary(o)}</p>
            <div className="text-sm text-ink/70 space-y-0.5">
              <p>
                {labels.seller}: <b className="text-ink">{o.sellerName}</b>
              </p>
              <p>
                {labels.customer}: <b className="text-ink">{o.customerName}</b>
              </p>
              {o.deliveryAddress && (
                <p>
                  {labels.delivery}: <b className="text-ink">{o.deliveryAddress}</b>
                  {o.deliveryFee > 0 && <span className="tabular-nums"> ({money(o.deliveryFee, locale)})</span>}
                </p>
              )}
            </div>
            <Link
              href={`/${locale}/print/order/${o.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 h-9 text-sm font-semibold text-ink/70 hover:bg-surface active:scale-95 transition"
            >
              {labels.invoicePdf}
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden lg:block rounded-2xl bg-card border border-line shadow-card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-ink/55 border-b border-line bg-surface/60">
              <th className="text-start font-medium px-4 py-3">{labels.order}</th>
              <th className="text-start font-medium px-4 py-3">{labels.date}</th>
              <th className="text-start font-medium px-4 py-3">{labels.seller}</th>
              <th className="text-start font-medium px-4 py-3">{labels.customer}</th>
              <th className="text-start font-medium px-4 py-3">{labels.items}</th>
              <th className="text-start font-medium px-4 py-3">{labels.delivery}</th>
              <th className="text-end font-medium px-4 py-3">{labels.total}</th>
              <th className="text-start font-medium px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface/50 transition-colors">
                <td className="px-4 py-3 font-medium tabular-nums" dir="ltr">
                  {o.orderNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{shortDate(o.date, locale)}</td>
                <td className="px-4 py-3">{o.sellerName}</td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3 text-ink/70 max-w-[280px] truncate" title={itemsSummary(o)}>
                  {itemsSummary(o)}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {o.deliveryAddress ? (
                    <>
                      {o.deliveryAddress}
                      {o.deliveryFee > 0 && (
                        <span className="tabular-nums text-ink/45"> · {money(o.deliveryFee, locale)}</span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-end tabular-nums font-semibold">{money(o.total, locale)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${locale}/print/order/${o.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink/70 hover:bg-surface transition"
                  >
                    {labels.invoicePdf}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
