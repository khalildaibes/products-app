import Link from "next/link";
import {
  computeTotals,
  dailySeries,
  filterByDays,
  getProducts,
  getSales,
  perProductReport,
} from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { intlLocaleOf, money, num, pct, shortDate } from "@/lib/format";
import type { Locale } from "@/lib/types";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

/** Sales report — print-to-PDF document (default: last 30 days). */
export default async function SalesReportPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { days?: string };
}) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const days = Math.min(365, Math.max(1, Number(searchParams.days) || 30));

  const [products, allSales] = await Promise.all([getProducts(), getSales()]);
  const sales = filterByDays(allSales, days);
  const totals = computeTotals(sales);
  const perProduct = perProductReport(products, sales).filter((r) => r.unitsSold > 0);
  const daily = dailySeries(sales, Math.min(days, 31)).filter((p) => p.units > 0);

  const today = new Intl.DateTimeFormat(intlLocaleOf(locale), {
    dateStyle: "long",
  }).format(new Date());

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href={`/${locale}/admin`} className="text-sm font-medium text-accent hover:underline">
          ← {dict.nav.admin}
        </Link>
        <PrintButton label={dict.actions.downloadPdf} />
      </div>

      <div className="rounded-2xl print:rounded-none bg-card border border-line print:border-0 shadow-card print:shadow-none p-8 space-y-8">
        <header className="flex items-start justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white font-bold text-xl">
              ₪
            </span>
            <div>
              <p className="font-bold text-lg">{dict.appName}</p>
              <p className="text-sm text-ink/55">
                {dict.report.docTitle} — {dict.report.lastDays.replace("{n}", num(days, locale))}
              </p>
            </div>
          </div>
          <p className="text-sm text-ink/55">{today}</p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: dict.kpi.revenue, value: money(totals.revenue, locale), cls: "text-accent" },
            { label: dict.kpi.cost, value: money(totals.cost, locale), cls: "text-ink" },
            { label: dict.kpi.profit, value: money(totals.profit, locale), cls: "text-profit" },
            { label: dict.kpi.units, value: num(totals.units, locale), cls: "text-ink" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-line p-4">
              <p className="text-xs text-ink/55">{k.label}</p>
              <p className={`mt-1 font-bold tabular-nums ${k.cls}`}>{k.value}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="font-semibold mb-3">{dict.report.byProduct}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink/55 border-b-2 border-line">
                <th className="text-start font-medium py-2">{dict.table.product}</th>
                <th className="text-end font-medium py-2">{dict.table.unitsSold}</th>
                <th className="text-end font-medium py-2">{dict.table.revenue}</th>
                <th className="text-end font-medium py-2">{dict.table.profit}</th>
                <th className="text-end font-medium py-2">{dict.table.margin}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {perProduct.map((r) => (
                <tr key={r.product.id}>
                  <td className="py-2.5 font-medium">{r.product.name[locale]}</td>
                  <td className="py-2.5 text-end tabular-nums">{num(r.unitsSold, locale)}</td>
                  <td className="py-2.5 text-end tabular-nums">{money(r.revenue, locale)}</td>
                  <td className="py-2.5 text-end tabular-nums text-profit">{money(r.profit, locale)}</td>
                  <td className="py-2.5 text-end tabular-nums">{pct(r.margin, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-semibold mb-3">{dict.report.byDay}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink/55 border-b-2 border-line">
                <th className="text-start font-medium py-2">{dict.reports.date}</th>
                <th className="text-end font-medium py-2">{dict.table.unitsSold}</th>
                <th className="text-end font-medium py-2">{dict.table.revenue}</th>
                <th className="text-end font-medium py-2">{dict.table.profit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...daily].reverse().map((p) => (
                <tr key={p.label}>
                  <td className="py-2.5 font-medium">{shortDate(p.label, locale)}</td>
                  <td className="py-2.5 text-end tabular-nums">{num(p.units, locale)}</td>
                  <td className="py-2.5 text-end tabular-nums">{money(p.revenue, locale)}</td>
                  <td className="py-2.5 text-end tabular-nums text-profit">{money(p.profit, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <p className="text-xs text-ink/45 text-center print:hidden">{dict.invoice.printHint}</p>
    </div>
  );
}
