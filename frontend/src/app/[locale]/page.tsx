// app/[locale]/page.tsx
import type { Recipe } from "@/lib/recipes/types";
import HomeView from "./HomeView";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";

export const revalidate = 60;

const isSupported = (x: unknown): x is SupportedLocale =>
  typeof x === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(x as any);

export default async function Home(
  { params, searchParams }: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const { locale } = await params;
  const sp = await searchParams;
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

  return <HomeView items={items} locale={loc} />;
}
