import { filterByDays, getProducts, getSales, perProductReport } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import ProductManager, { ProductStats } from "@/components/ProductManager";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const [products, allSales] = await Promise.all([getProducts(), getSales()]);
  const report = perProductReport(products, filterByDays(allSales, 30));

  const stats: Record<number, ProductStats> = {};
  for (const r of report) {
    stats[r.product.id] = {
      unitsSold: r.unitsSold,
      revenue: r.revenue,
      profit: r.profit,
      margin: r.margin,
    };
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold">{dict.products.title}</h1>
        <p className="mt-1 text-ink/55">{dict.products.subtitle}</p>
      </header>

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
    </div>
  );
}
