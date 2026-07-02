import Link from "next/link";
import { computeTotals, dailySeries, filterByDays, getSales, weeklySeries } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { money, num, shortDate } from "@/lib/format";
import type { Locale, PeriodPoint } from "@/lib/types";
import ReportChart from "@/components/ReportChart";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { period?: string };
}) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const period = searchParams.period === "weekly" ? "weekly" : "daily";

  const allSales = await getSales();

  let series: PeriodPoint[];
  if (period === "daily") {
    series = dailySeries(filterByDays(allSales, 14), 14);
  } else {
    series = weeklySeries(filterByDays(allSales, 56), 8);
  }

  const chartData = series.map((p) => ({
    ...p,
    displayLabel:
      period === "daily" ? shortDate(p.label, locale) : shortDate(p.label, locale),
  }));

  const totals = computeTotals(
    period === "daily" ? filterByDays(allSales, 14) : filterByDays(allSales, 56)
  );

  const tabs = [
    { key: "daily", label: dict.reports.daily, href: `/${locale}/reports` },
    { key: "weekly", label: dict.reports.weekly, href: `/${locale}/reports?period=weekly` },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{dict.reports.title}</h1>
          <p className="mt-1 text-ink/55">{dict.reports.subtitle}</p>
        </div>
        <div className="inline-flex rounded-xl border border-line bg-card p-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                period === t.key ? "bg-accent text-white" : "text-ink/60 hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </header>

      <section className="rounded-2xl bg-card border border-line shadow-card p-5">
        <h2 className="font-semibold mb-4">
          {period === "daily" ? dict.reports.chartTitleDaily : dict.reports.chartTitleWeekly}
        </h2>
        <ReportChart data={chartData} locale={locale} labels={dict.legend} />
      </section>

      <section className="rounded-2xl bg-card border border-line shadow-card overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-ink/55 border-b border-line bg-surface/60">
              <th className="text-start font-medium px-4 py-3">
                {period === "daily" ? dict.reports.date : dict.reports.weekOf}
              </th>
              <th className="text-end font-medium px-4 py-3">{dict.table.unitsSold}</th>
              <th className="text-end font-medium px-4 py-3">{dict.table.revenue}</th>
              <th className="text-end font-medium px-4 py-3">{dict.table.cost}</th>
              <th className="text-end font-medium px-4 py-3">{dict.table.profit}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...series].reverse().map((p) => (
              <tr key={p.label} className="hover:bg-surface/50 transition-colors">
                <td className="px-4 py-3 font-medium">{shortDate(p.label, locale)}</td>
                <td className="px-4 py-3 text-end tabular-nums">{num(p.units, locale)}</td>
                <td className="px-4 py-3 text-end tabular-nums">{money(p.revenue, locale)}</td>
                <td className="px-4 py-3 text-end tabular-nums text-ink/70">{money(p.cost, locale)}</td>
                <td className="px-4 py-3 text-end tabular-nums font-medium text-profit">{money(p.profit, locale)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-surface/60 font-semibold">
              <td className="px-4 py-3">{dict.reports.total}</td>
              <td className="px-4 py-3 text-end tabular-nums">{num(totals.units, locale)}</td>
              <td className="px-4 py-3 text-end tabular-nums">{money(totals.revenue, locale)}</td>
              <td className="px-4 py-3 text-end tabular-nums">{money(totals.cost, locale)}</td>
              <td className="px-4 py-3 text-end tabular-nums text-profit">{money(totals.profit, locale)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}
