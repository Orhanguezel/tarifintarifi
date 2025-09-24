import { Locale } from "./strings";

/** .env’den tenant al (client ve server tarafında güvenli) */
export function getEnvTenant(): string {
  return (process.env.TENANT || "ensotek").toLowerCase();
}

/** .env’den destekli dilleri oku (ör. NEXT_PUBLIC_LOCALES="de,en,tr") */
export function getEnvLocales(): Locale[] {
  const raw = (process.env.NEXT_PUBLIC_LOCALES || "de,en,tr")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return (raw.length ? raw : ["de"]) as Locale[];
}

/** .env’den varsayılan dil (örn. NEXT_PUBLIC_DEFAULT_LOCALE="de") */
export function getEnvDefaultLocale(): Locale {
  const def = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "").trim().toLowerCase();
  const list = getEnvLocales();
  return (def && list.includes(def as Locale) ? def : list[0]) as Locale;
}
