"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GAView({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined" || !window.gtag) return;

    const url = window.location.origin + pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: url,
      page_path: pathname,
      language: locale,
    });
  }, [pathname, searchParams, locale]);

  return null;
}
