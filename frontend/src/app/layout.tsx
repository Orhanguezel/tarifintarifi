import { headers } from "next/headers";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";

const RTL_SET = new Set(["ar","fa","he","ur","ckb","ps","sd","ug","yi","dv"]);
const isSupported = (x?: string | null): x is SupportedLocale =>
  !!x && (SUPPORTED_LOCALES as readonly string[]).includes(x as any);

/**
 * ÖNEMLİ:
 * reCAPTCHA script’i artık burada YÜKLENMİYOR.
 * Sadece gerektiği yerde (CommentForm) dil parametresiyle yüklenir.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const fromHeader = h.get("x-locale");
  const fallback = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale) || "tr";
  const current: SupportedLocale = isSupported(fromHeader) ? fromHeader : fallback;

  const dir = (h.get("x-dir") as "rtl" | "ltr") ?? (RTL_SET.has(current) ? "rtl" : "ltr");

  return (
    <html lang={current} dir={dir} suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
