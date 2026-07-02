"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/types";

type Dict = {
  appName: string;
  nav: { dashboard: string; products: string; sales: string; reports: string; admin: string };
  misc: { mockNotice: string; language: string };
};

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 3h2l2.5 12.5a1.5 1.5 0 001.5 1.2h8.6a1.5 1.5 0 001.5-1.2L21 7H6" strokeLinecap="round" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" strokeLinecap="round" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5h.1a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.5 1h.2a2 2 0 110 4h-.2a1.7 1.7 0 00-1.5 1z" />
    </svg>
  ),
};

export default function Sidebar({ locale, dict }: { locale: Locale; dict: Dict }) {
  const pathname = usePathname();
  const otherLocale: Locale = locale === "ar" ? "he" : "ar";
  const restPath = pathname.replace(/^\/(ar|he)/, "") || "";

  const items = [
    { href: `/${locale}`, label: dict.nav.dashboard, icon: icons.dashboard, exact: true },
    { href: `/${locale}/products`, label: dict.nav.products, icon: icons.products },
    { href: `/${locale}/sales`, label: dict.nav.sales, icon: icons.sales },
    { href: `/${locale}/reports`, label: dict.nav.reports, icon: icons.reports },
    { href: `/${locale}/admin`, label: dict.nav.admin, icon: icons.admin },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="print:hidden lg:w-64 lg:min-h-screen border-b lg:border-b-0 lg:border-e border-line bg-card">
      <div className="px-4 py-3 lg:px-5 lg:py-5 flex items-center justify-between lg:block">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white font-bold text-lg">
            ₪
          </span>
          <span className="font-bold text-lg">{dict.appName}</span>
        </Link>

        <Link
          href={`/${otherLocale}${restPath}`}
          className="lg:mt-4 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
          </svg>
          {dict.misc.language}
        </Link>
      </div>

      {/* Desktop nav — mobile uses the fixed BottomNav */}
      <nav className="hidden lg:flex lg:flex-col gap-1 px-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium whitespace-nowrap transition-colors ${
              isActive(item.href, item.exact)
                ? "bg-accentSoft text-accent"
                : "text-ink/70 hover:bg-surface hover:text-ink"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <p className="hidden lg:block px-5 py-5 text-xs text-ink/45 leading-relaxed">
        {dict.misc.mockNotice}
      </p>
    </aside>
  );
}
