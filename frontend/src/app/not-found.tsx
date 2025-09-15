// app/not-found.tsx  (Server Component)
import Link from "next/link";
import {getTranslations} from "next-intl/server";
import AutoHome from "@/components/AutoHome";
import {defaultLocale} from "@/i18n/routing";
import {SUPPORTED_LOCALES, type SupportedLocale} from "@/types/common";

function isLocale(x: unknown): x is SupportedLocale {
  return typeof x === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export default async function RootNotFound() {
  // 1) Locale tespiti (varsa requestLocale, yoksa default)
  let locale: SupportedLocale = defaultLocale as SupportedLocale;
  try {
    const mod: any = await import("next-intl/server");
    const rl = mod.requestLocale;
    const detected =
      typeof rl === "function" ? await rl() :
      rl && typeof rl.then === "function" ? await rl :
      rl;
    if (isLocale(detected)) locale = detected;
  } catch {
    /* ignore */
  }

  // 2) Çeviri nesnesi
  const t = await getTranslations({locale, namespace: "notFound"});

  // 3) Minimal UI + otomatik yönlendirme
  return (
    <main style={{minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24}}>
      <AutoHome to={`/${locale}`} />
      <section style={{textAlign: "center", padding: 20, border: "1px solid #eee", borderRadius: 14}}>
        <div style={{fontSize: 56, fontWeight: 800, letterSpacing: 1}}>404</div>
        <h1 style={{margin: "6px 0 8px", fontSize: 18, fontWeight: 800}}>{t("title")}</h1>
        <p style={{color: "#64748b", margin: "0 0 14px"}}>{t("desc")}</p>

        <div style={{display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "center"}}>
          <Link
            href={`/${locale}`}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#0ea5e9",
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            {t("actions.home")}
          </Link>
          <Link
            href={`/${locale}/recipes`}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
              color: "#0f172a",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            {t("actions.browse")}
          </Link>
        </div>

        <p style={{color: "#94a3b8", fontSize: 12, marginTop: 10}}>
          {t("note")}
        </p>
      </section>
    </main>
  );
}
