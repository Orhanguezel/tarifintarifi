import { headers, cookies } from "next/headers";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import { KNOWN_RTL } from "@/i18n/locale-helpers";
import HtmlLangSync from "@/i18n/HtmlLangSync";

const isSupported = (x?: string | null): x is SupportedLocale =>
  !!x && (SUPPORTED_LOCALES as readonly string[]).includes(x as any);

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const c = await cookies();

  const fromCookie = c.get("NEXT_LOCALE")?.value || null;
  const fromHeader = h.get("x-locale");
  const fallback = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale) || "tr";

  const current: SupportedLocale =
    (isSupported(fromCookie) && fromCookie) ||
    (isSupported(fromHeader) && fromHeader) ||
    fallback;

  const fromDir = h.get("x-dir");
  const dir: "rtl" | "ltr" =
    fromDir === "rtl" || fromDir === "ltr"
      ? (fromDir as "rtl" | "ltr")
      : (KNOWN_RTL.has(current) ? "rtl" : "ltr");

  return (
    <html lang={current} dir={dir} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <HtmlLangSync lang={current} dir={dir} />
        {children}
      </body>
    </html>
  );
}
