import { getProducts, getSales } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import SalesList from "@/components/SalesList";

export const dynamic = "force-dynamic";

export default async function SalesPage({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const [products, sales] = await Promise.all([getProducts(), getSales()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold">{dict.sales.title}</h1>
        <p className="mt-1 text-ink/55">{dict.sales.subtitle}</p>
      </header>

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
    </div>
  );
}
