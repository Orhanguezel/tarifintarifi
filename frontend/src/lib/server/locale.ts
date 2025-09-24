import { Locale } from "@/lib/strings";
import { getEnvDefaultLocale, getEnvLocales } from "@/lib/config";

/** .env’deki dillerle normalize et; yoksa default’a düş */
export function normalizeLocale(input?: string): Locale {
  const list = getEnvLocales();
  const def = getEnvDefaultLocale();
  const lc = (input || def).split("-")[0].toLowerCase() as Locale;
  return (list as string[]).includes(lc) ? lc : def;
}
