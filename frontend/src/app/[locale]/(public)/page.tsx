// src/app/[locale]/(public)/page.tsx
import type { Recipe } from "@/lib/recipes/types";
import HomeView from "./(home)/HomeView";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import { getTranslations } from "next-intl/server";

export const revalidate = 60;

const isSupported = (x: unknown): x is SupportedLocale =>
  typeof x === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(x as any);

function SrOnlyH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
      overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0
    }}>
      {children}
    </h1>
  );
}

export default async function Home(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ✅ Next 15: params & searchParams await edilmeli
  const { locale } = await props.params;
  const sp = await props.searchParams;

  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);
  const limit = 12;

  const loc: SupportedLocale =
    isSupported(locale)
      ? (locale as SupportedLocale)
      : ((process.env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale) || "tr");

  const origin = (process.env.BACKEND_ORIGIN || "http://localhost:5034").replace(/\/$/, "");
  let items: Recipe[] = [];

  try {
    const res = await fetch(`${origin}/api/recipes?limit=${limit}&page=${page}`, {
      headers: { "Accept-Language": loc, "x-lang": loc },
      next: { revalidate }
    });
    if (res.ok) {
      const j = await res.json();
      items = Array.isArray(j?.data) ? j.data : [];
    } else {
      console.warn(`[home] fetch not ok: ${res.status}`);
    }
  } catch (e: any) {
    console.warn(`[home] fetch failed during build/ISR: ${e?.message || e}`);
  }

  let h1Text = process.env.NEXT_PUBLIC_SITE_NAME || "tarifintarifi.com";
  try {
    const t = await getTranslations({ locale: loc, namespace: "seo" });
    h1Text = t("homeH1", { site: process.env.NEXT_PUBLIC_SITE_NAME || "tarifintarifi.com" }) || h1Text;
  } catch {}

  return (
    <>
      <SrOnlyH1>{h1Text}</SrOnlyH1>
      <HomeView items={items} locale={loc} />
    </>
  );
}
