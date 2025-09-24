// features/analytics/SeoSnap.tsx
'use client';
import { useEffect } from 'react';
export default function SeoSnap({ tenant='ensotek', pageKey='home', locale }: {tenant?:string;pageKey?:string;locale:string}) {
  useEffect(() => {
    try {
      const key = `seo_snap_${tenant}_${pageKey}_${locale}`;
      // minimalist payload
      const val = JSON.stringify({ t: document.title, ts: Date.now() });
      document.cookie = `${key}=${encodeURIComponent(val)}; path=/; max-age=86400`;
    } catch {}
  }, [tenant, pageKey, locale]);
  return null;
}
