import { computeTotals, dailySeries, filterByDays, getProducts, getSales, perProductReport } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { money, num, pct, shortDate } from "@/lib/format";
import type { Locale } from "@/lib/types";
import KpiCard from "@/components/KpiCard";
import ReportChart from "@/components/ReportChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const [products, allSales] = await Promise.all([getProducts(), getSales()]);

  const sales30 = filterByDays(allSales, 30);
  const totals = computeTotals(sales30);
  const top = perProductReport(products, sales30).slice(0, 5);
  const trend = dailySeries(filterByDays(allSales, 14), 14).map((p) => ({
    ...p,
    displayLabel: shortDate(p.label, locale),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold">{dict.dashboard.title}</h1>
        <p className="mt-1 text-ink/55">{dict.dashboard.subtitle}</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label={dict.kpi.revenue} value={money(totals.revenue, locale)} hint={dict.kpi.last30} tone="accent" />
        <KpiCard label={dict.kpi.cost} value={money(totals.cost, locale)} hint={dict.kpi.last30} />
        <KpiCard label={dict.kpi.profit} value={money(totals.profit, locale)} hint={dict.kpi.last30} tone="profit" />
        <KpiCard label={dict.kpi.units} value={num(totals.units, locale)} hint={dict.kpi.last30} />
      </section>

      <section className="rounded-2xl bg-card border border-line shadow-card p-5">
        <h2 className="font-semibold mb-4">{dict.dashboard.dailyTrend}</h2>
        <ReportChart data={trend} locale={locale} labels={dict.legend} />
      </section>

      <section className="rounded-2xl bg-card border border-line shadow-card p-5">
        <h2 className="font-semibold mb-4">{dict.dashboard.topProducts}</h2>
        <ul className="divide-y divide-line">
          {top.map((row, i) => (
            <li key={row.product.id} className="flex items-center gap-4 py-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accentSoft text-accent text-sm font-bold">
                {num(i + 1, locale)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{row.product.name[locale]}</p>
                <p className="text-xs text-ink/50">
                  {num(row.unitsSold, locale)} · {dict.table.unitsSold}
                </p>
              </div>
              <div className="text-end">
                <p className="font-semibold tabular-nums">{money(row.revenue, locale)}</p>
                <p className="text-xs text-profit tabular-nums">
                  {money(row.profit, locale)} ({pct(row.margin, locale)})
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
