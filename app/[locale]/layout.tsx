import type { Metadata } from "next";
import { getDictionary, locales } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Cart from "@/components/Cart";
import { CartProvider } from "@/components/CartProvider";
import { getProducts } from "@/lib/api";
import "../globals.css";

export const metadata: Metadata = {
  title: "Products Management",
  description: "Cost, sales and profit reporting",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Heebo:wght@400;500;600;700&display=swap";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const locale = locales.includes(params.locale) ? params.locale : "ar";
  const dict = await getDictionary(locale);
  const products = await getProducts();
  const fontFamily =
    locale === "ar"
      ? "'IBM Plex Sans Arabic', system-ui, sans-serif"
      : "'Heebo', system-ui, sans-serif";

  return (
    <html lang={locale} dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_URL} />
      </head>
      <body
        className="font-sans bg-surface text-ink antialiased"
        style={{ ["--font-main" as string]: fontFamily }}
      >
        <CartProvider>
          <div className="min-h-screen lg:flex">
            <Sidebar locale={locale} dict={dict} />
            <main className="flex-1 px-4 pt-5 pb-28 lg:px-10 lg:py-8 max-w-6xl mx-auto w-full print:p-0 print:max-w-none">
              {children}
            </main>
          </div>
          <BottomNav locale={locale} nav={dict.nav} />
          <Cart products={products} locale={locale} labels={dict.cart} />
        </CartProvider>
      </body>
    </html>
  );
}
