// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import { KNOWN_RTL } from "@/i18n/locale-helpers";

const DEFAULT_LOCALE: SupportedLocale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale) || "tr";

const TENANT = (process.env.NEXT_PUBLIC_TENANT || process.env.TENANT || "ensotek").toLowerCase();

const isSupported = (x?: string | null): x is SupportedLocale =>
  !!x && (SUPPORTED_LOCALES as readonly string[]).includes(x as any);

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) statik/seo yolları (erken çık)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    /^\/sitemap(\-\w+)?\.xml$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2) locale prefix var mı?
  const hasLocalePrefix = SUPPORTED_LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (!hasLocalePrefix) {
    // 3a) prefix yok → cookie ya da default ile redirect + cookie set
    const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
    const locale: SupportedLocale = isSupported(cookieLocale) ? cookieLocale! : DEFAULT_LOCALE;

    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    url.search = search;

    const res = NextResponse.redirect(url, 307);
    res.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });
    // Önbellek davranışı için
    res.headers.set("Vary", "Cookie");
    return res;
  }

  // 3b) prefix var → locale/dir belirle
  const seg1 = (pathname.split("/")[1] || "").toLowerCase();
  const locale: SupportedLocale = isSupported(seg1) ? (seg1 as SupportedLocale) : DEFAULT_LOCALE;
  const dir = KNOWN_RTL.has(locale) ? "rtl" : "ltr";

  // 4) istek header’larına enjekte et
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set("x-dir", dir);
  requestHeaders.set("x-tenant", TENANT); // ✅ tüm isteklerde tenant başlığı

  // 5) cookie’yi taze tut
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  res.headers.set("Vary", "Cookie");

  return res;
}

export const config = {
  matcher: [
    // Not: burada zaten statik/seo yolları hariç tutuluyor; yukarıdaki guard ile uyumlu.
    "/((?!_next|api|assets|static|images|fonts|favicon.ico|robots.txt|sitemap\\.xml|sitemap-.*\\.xml).*)",
  ],
};
