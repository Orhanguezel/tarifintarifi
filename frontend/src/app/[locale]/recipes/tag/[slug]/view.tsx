"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SupportedLocale } from "@/types/common";
import type { Recipe } from "@/lib/recipes/types";
import RecipeGrid from "@/features/recipes/components/RecipeGrid";
import Pagination from "@/features/common/Pagination";
import { getApiBase, getLangHeaders } from "@/lib/http";

/* ---------- helpers ---------- */
const ts = (d?: string | Date | null) => (d ? new Date(d).getTime() : 0);
const pretty = (k: string) => {
  const s = String(k || "").replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : k;
};
const PAGE_SIZE = Number(process.env.NEXT_PUBLIC_TAG_PAGE_SIZE ?? 12);
const TAG_VIEW_FIELDS =
  "slug slugCanonical title images.url images.thumbnail images.webp totalMinutes servings " +
  "nutrition.calories difficulty dietFlags allergenFlags reactionTotals.like commentCount ratingAvg " +
  "createdAt updatedAt";

/** Güvenli çeviri */
function makeTx(t: ReturnType<typeof useTranslations>) {
  return (key: string, fallback: string, values?: Record<string, any>) => {
    try {
      const res = t(key, values as any);
      if (typeof res === "string" && res.trim()) return res;
    } catch {}
    if (values && typeof fallback === "string") {
      return fallback.replace(/\{(\w+)\}/g, (_m, k) => String(values?.[k] ?? ""));
    }
    return fallback;
  };
}

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  count: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export default function TagView({
  locale,
  tagKey,
  displayLabel,
  initialItems,
  initialMeta,
}: {
  locale: SupportedLocale;
  tagKey: string;
  displayLabel?: string;
  initialItems: Recipe[];
  initialMeta: Meta;
}) {
  const t = useTranslations("tagPage");
  const tx = makeTx(t);

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const pageFromUrl = (() => {
    const n = parseInt(params.get("page") || "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();
  const [page, setPage] = useState(pageFromUrl);

  // fetched state
  const [list, setList] = useState<Recipe[]>(initialItems);
  const [meta, setMeta] = useState<Meta>(initialMeta);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Etiket değiştiğinde başlangıca dön
  useEffect(() => {
    setPage(1);
    setList(initialItems);
    setMeta(initialMeta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagKey]);

  // URL -> state
  useEffect(() => setPage(pageFromUrl), [pageFromUrl]);

  // state -> URL (page değişince)
  useEffect(() => {
    const usp = new URLSearchParams(params.toString());
    if (page > 1) usp.set("page", String(page));
    else usp.delete("page");
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // sayfalı fetch
  useEffect(() => {
    let alive = true;
    const run = async () => {
      // 1. sayfa ve elimizde initial varsa ekstra fetch’e gerek yok
      if (page === 1 && initialItems.length === initialMeta.count) return;
      setLoading(true);
      setErr(null);
      try {
        const base = (getApiBase() || "/api").replace(/\/+$/, "");
        const qs = new URLSearchParams();
        qs.set("limit", String(PAGE_SIZE));
        qs.set("page", String(page));
        if (displayLabel) qs.set("hl", displayLabel);
        qs.set("tag", tagKey);
        qs.set("fields", TAG_VIEW_FIELDS);
        const href = `${base}/recipes?${qs.toString()}`;
        const r = await fetch(href, {
          headers: getLangHeaders(locale),
          credentials: "include",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as { success: boolean; data: Recipe[]; meta: Meta };
        if (!alive) return;
        setList(j?.data ?? []);
        setMeta(
          j?.meta ?? {
            page,
            limit: PAGE_SIZE,
            total: (j?.data ?? []).length,
            totalPages: 1,
            count: (j?.data ?? []).length,
            hasPrev: page > 1,
            hasNext: false,
          }
        );
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e?.message || e || "Fetch error"));
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tagKey, locale, displayLabel]);

  const heading = displayLabel || pretty(tagKey);

  const sorted = useMemo(
    () =>
      [...list].sort(
        (a, b) => ts(b.createdAt || b.updatedAt) - ts(a.createdAt || a.updatedAt)
      ),
    [list]
  );

  const go = (p: number) => {
    const max = Math.max(1, Number(meta?.totalPages || 1));
    setPage(Math.min(Math.max(1, p), max));
  };

  return (
    <Wrap>
      <Head>
        <h1>{heading}</h1>
        <p>{tx("count", "{count} tarif", { count: meta?.total ?? list.length })}</p>
      </Head>

      {!loading && !err && (meta?.total ?? list.length) === 0 && (
        <Empty>{tx("empty", "Bu etiketle tarif bulunamadı.")}</Empty>
      )}

      {loading && <Empty>{tx("loading", "Yükleniyor...")}</Empty>}
      {err && <Empty>{String(err)}</Empty>}

      {!!sorted.length && !loading && !err && (
        <GridWrap>
          <RecipeGrid items={sorted} locale={locale} />
        </GridWrap>
      )}

      {(meta?.totalPages ?? 1) > 1 && (
        <Pagination
          ariaLabel={tx("pagination.aria", "Sayfalama")}
          page={meta?.page ?? page}
          totalPages={meta?.totalPages ?? 1}
          hasPrev={meta?.hasPrev ?? page > 1}
          hasNext={meta?.hasNext ?? page < (meta?.totalPages ?? 1)}
          prevLabel={tx("pagination.prev", "Önceki")}
          nextLabel={tx("pagination.next", "Sonraki")}
          onChange={go}
        />
      )}
    </Wrap>
  );
}

/* ---------- styled ---------- */
const Wrap = styled.main`
  padding: 6px 0 24px;
`;
const Head = styled.header`
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 8px 0 16px;
  h1 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.h2};
  }
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;
const Empty = styled.div`
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 14px;
  border-radius: ${({ theme }) => theme.radii.lg};
`;
const GridWrap = styled.div`
  margin-top: 8px;
`;
