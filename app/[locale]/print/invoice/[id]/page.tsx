import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getSale } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { intlLocaleOf, money, num } from "@/lib/format";
import type { Locale } from "@/lib/types";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

/** Order / sale invoice — print-to-PDF document. */
export default async function InvoicePage({
  params,
}: {
  params: { locale: Locale; id: string };
}) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const sale = await getSale(Number(params.id));
  if (!sale) notFound();
  const product = await getProduct(sale.productId);

  const longDate = new Intl.DateTimeFormat(intlLocaleOf(locale), {
    dateStyle: "long",
  }).format(new Date(sale.date + "T00:00:00"));

  const total = sale.unitPrice * sale.quantity;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href={`/${locale}/sales`} className="text-sm font-medium text-accent hover:underline">
          ← {dict.nav.sales}
        </Link>
        <PrintButton label={dict.actions.downloadPdf} />
      </div>

      {/* The document */}
      <div className="rounded-2xl print:rounded-none bg-card border border-line print:border-0 shadow-card print:shadow-none p-8 space-y-8">
        <header className="flex items-start justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white font-bold text-xl">
              ₪
            </span>
            <div>
              <p className="font-bold text-lg">{dict.appName}</p>
              <p className="text-sm text-ink/55">{dict.invoice.docTitle}</p>
            </div>
          </div>
          <div className="text-end">
            <p className="font-bold text-lg tabular-nums" dir="ltr">
              {sale.invoiceNumber}
            </p>
            <p className="text-sm text-ink/55">{longDate}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-ink/45 uppercase mb-1">{dict.invoice.seller}</p>
            <p className="font-semibold">{sale.sellerName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink/45 uppercase mb-1">{dict.invoice.customer}</p>
            <p className="font-semibold">{sale.customerName}</p>
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink/55 border-b-2 border-line">
              <th className="text-start font-medium py-2.5">{dict.invoice.product}</th>
              <th className="text-end font-medium py-2.5">{dict.invoice.quantity}</th>
              <th className="text-end font-medium py-2.5">{dict.invoice.unitPrice}</th>
              <th className="text-end font-medium py-2.5">{dict.invoice.lineTotal}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="py-3">
                <p className="font-medium">{product?.name[locale] ?? `#${sale.productId}`}</p>
                {product && (
                  <p className="text-xs text-ink/45" dir="ltr">
                    {product.sku}
                  </p>
                )}
              </td>
              <td className="py-3 text-end tabular-nums">{num(sale.quantity, locale)}</td>
              <td className="py-3 text-end tabular-nums">{money(sale.unitPrice, locale)}</td>
              <td className="py-3 text-end tabular-nums font-medium">{money(total, locale)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-4 text-end font-semibold">
                {dict.invoice.total}
              </td>
              <td className="py-4 text-end tabular-nums text-xl font-bold text-accent">
                {money(total, locale)}
              </td>
            </tr>
          </tfoot>
        </table>

        <footer className="border-t border-line pt-5 text-center text-sm text-ink/50">
          {dict.invoice.thanks}
        </footer>
      </div>

      <p className="text-xs text-ink/45 text-center print:hidden">{dict.invoice.printHint}</p>
    </div>
  );
}
