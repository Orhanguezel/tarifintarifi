// src/app/[locale]/.well-known/appspecific/com.chrome.devtools.json/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-static"; // cache’lenebilir
export const revalidate = 86400;       // 1 gün (opsiyonel)

export async function GET() {
  // Buraya Chrome’un beklediği JSON’u koyun
  const payload = {
    // örnek/placeholder — kendi içeriğinizle değiştirin
    ok: true,
    name: "tarifintarifi devtools",
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
