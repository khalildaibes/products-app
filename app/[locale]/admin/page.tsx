import Link from "next/link";
import {
  computeTotals,
  filterByDays,
  getActivityLogs,
  getOrders,
  getProducts,
  getSales,
  perProductReport,
} from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { intlLocaleOf, money, num } from "@/lib/format";
import type { ActivityLog, Locale } from "@/lib/types";
import KpiCard from "@/components/KpiCard";
import OrdersTable from "@/components/OrdersTable";
import ProductManager, { ProductStats } from "@/components/ProductManager";
import SalesList from "@/components/SalesList";

export const dynamic = "force-dynamic";

type Tab = "products" | "sales" | "orders" | "activity";

/** Admin panel: every operation in one place — products CRUD, sales,
 *  activity log of all changes, and PDF exports. */
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { tab?: string };
}) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const tab: Tab =
    searchParams.tab === "sales"
      ? "sales"
      : searchParams.tab === "orders"
      ? "orders"
      : searchParams.tab === "activity"
      ? "activity"
      : "products";

  const [products, sales, orders, logs] = await Promise.all([
    getProducts(),
    getSales(),
    getOrders(),
    getActivityLogs(100),
  ]);
  const totals = computeTotals(filterByDays(sales, 30));

  const stats: Record<number, ProductStats> = {};
  for (const r of perProductReport(products, filterByDays(sales, 30))) {
    stats[r.product.id] = {
      unitsSold: r.unitsSold,
      revenue: r.revenue,
      profit: r.profit,
      margin: r.margin,
    };
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "products", label: dict.admin.productsTab },
    { key: "sales", label: dict.admin.salesTab },
    { key: "orders", label: dict.admin.ordersTab },
    { key: "activity", label: dict.admin.activityTab },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{dict.admin.title}</h1>
          <p className="mt-1 text-ink/55">{dict.admin.subtitle}</p>
        </div>
        <Link
          href={`/${locale}/print/sales-report?days=30`}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-surface transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" />
            <path d="M14 3v6h6" />
          </svg>
          {dict.admin.reportPdf}
        </Link>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label={dict.kpi.revenue} value={money(totals.revenue, locale)} hint={dict.kpi.last30} tone="accent" />
        <KpiCard label={dict.kpi.cost} value={money(totals.cost, locale)} hint={dict.kpi.last30} />
        <KpiCard label={dict.kpi.profit} value={money(totals.profit, locale)} hint={dict.kpi.last30} tone="profit" />
        <KpiCard label={dict.kpi.units} value={num(totals.units, locale)} hint={dict.kpi.last30} />
      </section>

      <div className="inline-flex rounded-xl border border-line bg-card p-1 overflow-x-auto max-w-full">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/${locale}/admin${t.key === "products" ? "" : `?tab=${t.key}`}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? "bg-accent text-white" : "text-ink/60 hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "products" && (
        <ProductManager
          products={products}
          stats={stats}
          locale={locale}
          labels={{
            table: dict.table,
            form: { ...dict.form },
            actions: dict.actions,
            searchPlaceholder: dict.products.search,
            emptyText: dict.products.empty,
          }}
        />
      )}

      {tab === "sales" && (
        <SalesList
          sales={sales}
          products={products}
          locale={locale}
          labels={{
            form: dict.form,
            actions: {
              newSale: dict.actions.newSale,
              recordSale: dict.actions.recordSale,
              error: dict.actions.error,
              invoicePdf: dict.actions.invoicePdf,
            },
            cols: {
              seller: dict.sales.seller,
              customer: dict.sales.customer,
              date: dict.sales.date,
              quantity: dict.form.quantity,
              unitPrice: dict.form.unitPrice,
              total: dict.form.total,
              product: dict.form.product,
              invoice: dict.sales.invoice,
            },
            searchPlaceholder: dict.sales.search,
            emptyText: dict.sales.empty,
          }}
        />
      )}

      {tab === "orders" && (
        <OrdersTable
          orders={orders}
          products={products}
          locale={locale}
          labels={{
            order: dict.orders.order,
            date: dict.sales.date,
            seller: dict.sales.seller,
            customer: dict.sales.customer,
            items: dict.orders.items,
            delivery: dict.orders.delivery,
            total: dict.form.total,
            invoicePdf: dict.actions.invoicePdf,
            empty: dict.orders.empty,
          }}
        />
      )}

      {tab === "activity" && <ActivityFeed logs={logs} locale={locale} dict={dict} />}
    </div>
  );
}

const actionTone: Record<ActivityLog["action"], string> = {
  create: "bg-accentSoft text-accent",
  update: "bg-gold/10 text-gold",
  delete: "bg-loss/10 text-loss",
  sale: "bg-profit/10 text-profit",
  stock: "bg-ink/5 text-ink/70",
};

function ActivityFeed({
  logs,
  locale,
  dict,
}: {
  logs: ActivityLog[];
  locale: Locale;
  dict: any;
}) {
  const fmt = new Intl.DateTimeFormat(intlLocaleOf(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <section className="rounded-2xl bg-card border border-line shadow-card divide-y divide-line">
      {logs.length === 0 && (
        <p className="px-5 py-10 text-center text-ink/50">{dict.activity.empty}</p>
      )}
      {logs.map((log) => (
        <div key={log.id} className="px-4 lg:px-5 py-3.5 flex items-start gap-3">
          <span
            className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${actionTone[log.action]}`}
          >
            {dict.activity.actions[log.action]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">{log.summary[locale]}</p>
            <p className="mt-0.5 text-xs text-ink/45">
              {log.actor} · {fmt.format(new Date(log.happenedAt))}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
