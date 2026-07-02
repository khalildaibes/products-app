import "server-only";
import type { Locale } from "./types";

const dictionaries = {
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
  he: () => import("./dictionaries/he.json").then((m) => m.default),
};

export const locales: Locale[] = ["ar", "he"];
export const defaultLocale: Locale = "ar";

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
