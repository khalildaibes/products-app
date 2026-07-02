import type { Locale } from "./types";

// -u-nu-latn: always Western digits (0-9), even in the Arabic UI
const intlLocale: Record<Locale, string> = { ar: "ar-EG-u-nu-latn", he: "he-IL" };

export function intlLocaleOf(locale: Locale): string {
  return intlLocale[locale];
}

export function money(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function num(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale]).format(value);
}

export function pct(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function shortDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "numeric",
    month: "short",
  }).format(new Date(iso + "T00:00:00"));
}
