"use client";

import { useEffect } from "react";

type Props = {
  tenant: string;      // "ensotek"
  pageKey: string;     // "home"
  locale: string;      // "tr" | "en" ...
};

export default function SeoCookieSnapshot({ tenant, pageKey, locale }: Props) {
  useEffect(() => {
    try {
      const key = `seo_snap_${tenant}_${pageKey}_${locale}`;
      const getMeta = (sel: string) =>
        (document.querySelector(sel)?.getAttribute("content") || "").trim();

      const payload = {
        ts: Date.now(),
        title: document.title || "",
        ogTitle: getMeta('meta[property="og:title"]'),
        ogDescription: getMeta('meta[property="og:description"]'),
        ogUrl: getMeta('meta[property="og:url"]'),
        ogImage: getMeta('meta[property="og:image"]'),
        locale,
      };

      // HttpOnly OLMAYACAK; path=/; SameSite=Lax yeterli
      const value = encodeURIComponent(JSON.stringify(payload));
      document.cookie = `${key}=${value}; Path=/; SameSite=Lax`;
    } catch {
      // sessiz geç
    }
  }, [tenant, pageKey, locale]);

  return null;
}
