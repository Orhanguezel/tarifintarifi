// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const SUPPORTED = ["tr","en","fr","de","it","pt","ar","ru","zh","hi"] as const;
const DEFAULT_LOCALE = "tr";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Statik/SEO yollarını atla
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/static") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Locale prefix zaten varsa devam
  const hasLocale = SUPPORTED.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  // Yoksa cookie veya varsayılan ile ekle (RELATIVE/aynı host)
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  const locale = (SUPPORTED as readonly string[]).includes(cookieLocale || "")
    ? (cookieLocale as typeof SUPPORTED[number])
    : DEFAULT_LOCALE;

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  url.search = search;
  // 307 = method-preserving temporary redirect
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets|static|robots.txt|sitemap.xml).*)"],
};
