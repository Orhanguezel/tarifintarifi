// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const SUPPORTED = ["tr","en","fr","de","it","pt","ar","ru","zh","hi"] as const;
const DEFAULT_LOCALE = "tr";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/static")
  ) return NextResponse.next();

  const hasLocale = SUPPORTED.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  const locale = SUPPORTED.includes(cookieLocale as any) ? cookieLocale! : DEFAULT_LOCALE;

  const url = new URL(`/${locale}${pathname}`, req.url); // absolute host, localhost YOK
  return NextResponse.redirect(url, { status: 307 });
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets|static).*)"],
};
