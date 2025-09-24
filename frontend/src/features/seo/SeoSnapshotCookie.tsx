// src/features/seo/SeoSnapshotCookie.tsx
"use client";
import { useEffect } from "react";

export default function SeoSnapshotCookie({
  tenant = "ensotek",
  pageKey = "home",
  locale,
}: { tenant?: string; pageKey?: string; locale: string }) {
  useEffect(() => {
    try {
      const key = `seo_snap_${tenant}_${pageKey}_${locale}`;
      const title = document.title || "";
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
      const ogDesc  = document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
      const payload = encodeURIComponent(JSON.stringify({ title, ogTitle, ogDesc }));
      // session cookie (test sadece varlığını kontrol ediyor)
      document.cookie = `${key}=${payload}; path=/; SameSite=Lax`;
    } catch {}
  }, [tenant, pageKey, locale]);

  return null;
}
