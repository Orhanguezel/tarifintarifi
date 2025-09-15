"use client";

import {useEffect, useState} from "react";
import type {Recipe} from "@/lib/recipes/types";
import type {SupportedLocale} from "@/types/common";
import {getApiBase, getLangHeaders} from "@/lib/http";

export type ListMeta = {
  page: number; limit: number; total: number; totalPages: number;
  count: number; hasPrev: boolean; hasNext: boolean;
};

type Args = {
  locale: SupportedLocale;
  page: number;
  q: string;
  selectedCat: string | null;
  pageSize?: number;
  initialItems: Recipe[];
};

const absApiBase = () => {
  const base = (getApiBase() || "").replace(/\/+$/, "");
  if (/^https?:\/\//i.test(base)) return base;
  const origin =
    (process.env.NEXT_PUBLIC_API_ORIGIN || "").replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}${base}`;
};

export function usePagedRecipes({
  locale, page, q, selectedCat, pageSize = 12, initialItems
}: Args) {
  const [pageItems, setPageItems] = useState<Recipe[]>(initialItems);
  const [meta, setMeta] = useState<ListMeta>(() => {
    const total = initialItems.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
      page: Math.min(page, totalPages),
      limit: pageSize,
      total,
      totalPages,
      count: total,
      hasPrev: page > 1,
      hasNext: page < totalPages
    };
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const abs = absApiBase().replace(/\/+$/, "");
        const url = new URL(`${abs}/recipes`);
        url.searchParams.set("page", String(Math.max(1, page)));
        url.searchParams.set("limit", String(Math.max(1, pageSize)));
        if (q.trim()) url.searchParams.set("q", q.trim());
        if (selectedCat) url.searchParams.set("category", selectedCat);

        const res = await fetch(url.toString(), {
          headers: getLangHeaders(locale),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const data: Recipe[] = Array.isArray(json?.data) ? json.data : [];

        const m = json?.meta ?? {};
        const nextLimit = Number(m.limit ?? pageSize) || pageSize;
        const nextTotal = Number(m.total ?? 0);
        const nextPage = Number.isFinite(Number(m.page)) ? Number(m.page) : page;
        const nextTotalPages =
          Number(m.totalPages) || Math.max(1, Math.ceil((nextTotal || data.length) / Math.max(1, nextLimit)));
        const nextHasPrev = typeof m.hasPrev === "boolean" ? m.hasPrev : nextPage > 1;
        const nextHasNext = typeof m.hasNext === "boolean" ? m.hasNext : nextPage < nextTotalPages;

        setPageItems(data);
        setMeta({
          page: Math.min(Math.max(1, nextPage), nextTotalPages),
          limit: nextLimit,
          total: nextTotal || data.length,
          totalPages: nextTotalPages,
          count: Number(m.count ?? data.length),
          hasPrev: nextHasPrev,
          hasNext: nextHasNext
        });
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr("Liste yüklenemedi.");
        setPageItems([]);
        setMeta((m) => ({ ...m, count: 0, total: 0, totalPages: 1, hasNext: false, hasPrev: false, page: 1 }));
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [locale, page, q, selectedCat, pageSize]);

  return { pageItems, meta, loading, err };
}
