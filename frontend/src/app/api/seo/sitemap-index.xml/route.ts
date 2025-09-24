// src/app/api/seo/sitemap-index.xml/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
const RAW = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const API = RAW.replace(/\/+$/,"");
const UPSTREAM = `${API}/seo/sitemap-index.xml`;

export async function GET() {
  try {
    const res = await fetch(UPSTREAM, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });
    const xml = await res.text();
    return new NextResponse(xml, {
      status: 200,
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "fetch-failed" }, { status: 502 });
  }
}
