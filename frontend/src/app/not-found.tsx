// app/not-found.tsx  (Server Component)
import Link from "next/link";
import { headers, cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import AutoHome from "@/components/AutoHome";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";

const DEFAULT_LOCALE: SupportedLocale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale) || "tr";

function isLocale(x: unknown): x is SupportedLocale {
  return typeof x === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(x as any);
}

export default async function RootNotFound() {
  // 1) Header → Cookie → Default sırası ile locale bul
  const h = await headers();
  const c = await cookies();
  const fromHeader = h.get("x-locale");
  const fromCookie = c.get("NEXT_LOCALE")?.value;

  const locale: SupportedLocale =
    (isLocale(fromHeader) && fromHeader) ||
    (isLocale(fromCookie) && fromCookie) ||
    DEFAULT_LOCALE;


  // 3) UI
  return (
    <main style={{minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24}}>
      <AutoHome to={`/${locale}`} />
      <section style={{textAlign: "center", padding: 20, border: "1px solid #eee", borderRadius: 14}}>
        <div style={{fontSize: 156, fontWeight: 800, letterSpacing: 1}}>404</div>

        <div style={{display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "center"}}>
          <Link
            href={`/${locale}`}
          >
          </Link>
        </div>
      </section>
    </main>
  );
}
