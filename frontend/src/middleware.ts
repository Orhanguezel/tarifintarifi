// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const SUPPORTED = ["tr","en","fr","de","it","pt","ar","ru","zh","hi"] as const;
const DEFAULT_LOCALE = "tr";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) Statik ve SEO yollarını net dışla
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    /^\/sitemap(\-\w+)?\.xml$/.test(pathname) // /sitemap.xml, /sitemap-index.xml, /sitemap-1.xml
  ) {
    return NextResponse.next();
  }

  // 2) Zaten locale prefix varsa geç
  const hasLocale = SUPPORTED.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  // 3) Locale cookie -> yoksa DEFAULT
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  const locale = (SUPPORTED as readonly string[]).includes(cookieLocale || "")
    ? (cookieLocale as typeof SUPPORTED[number])
    : DEFAULT_LOCALE;

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  url.search = search;
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Aynı dışlama mantığını matcher’da da uygula (performans)
  matcher: [
    // her şeyi yakala fakat şu desenleri hariç tut
    "/((?!_next|api|assets|static|images|fonts|favicon.ico|robots.txt|sitemap\\.xml|sitemap-.*\\.xml).*)",
  ],
};
