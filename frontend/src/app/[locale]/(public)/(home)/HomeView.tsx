// src/app/[locale]/(home)/HomeView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Recipe } from "@/lib/recipes/types";
import type { SupportedLocale } from "@/types/common";
import RecipeGrid from "@/features/recipes/components/RecipeGrid";
import Pagination from "@/components/common/Pagination";
import QuickCategories from "@/features/recipes/components/QuickCategories";
import { usePagedRecipes } from "@/hooks/usePagedRecipes";
import RecipeList from "@/features/recipes/components/RecipeList";
import { getCategoryIcon, normalizeCategoryKey } from "@/lib/recipes/categories";
import { getApiBase, getLangHeaders } from "@/lib/http";

/* ---------- helpers ---------- */
const ts = (d?: string | Date | null) => {
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : 0;
};

// tarih: publishedAt > createdAt > updatedAt (yalnız FE’de gösterim amaçlı)
const publishedTs = (r: Recipe) =>
  ts((r as any).publishedAt) || ts((r as any).createdAt) || ts((r as any).updatedAt);

// isim kararı (locale öncelikli)
const titleOf = (r: Recipe, locale: string) =>
  (r.title as any)?.[locale] || r.title?.tr || r.title?.en || (r as any).slugCanonical || "Tarif";

// sayfa başına
const PAGE_SIZE = 5;

/* “En yeni” fetch alanları (küçük payload) */
const LATEST_LIMIT = Number(process.env.NEXT_PUBLIC_HOME_LATEST_LIMIT ?? 5);
const LATEST_FIELDS =
  "_id slug slugCanonical title publishedAt createdAt updatedAt totalMinutes nutrition.calories reactionTotals.like commentCount images.thumbnail images.webp";

// kategori normalize
const normalizeCat = (v: string) =>
  normalizeCategoryKey(v) ??
  String(v || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

// görünür kategori adı
const prettyCat = (tCats: ReturnType<typeof useTranslations>, k: string) => {
  try {
    const tx = tCats(`dynamic.${k}`);
    if (tx && typeof tx === "string") return tx;
  } catch { }
  const s = String(k || "").replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : k;
};

// benzersiz anahtar
const keyOf = (r: any, loc: SupportedLocale) =>
  r?._id || r?.slugCanonical || r?.slug?.[loc] || r?.slug?.tr || r?.slug;

/* ---------- sıralama anahtarları ---------- */
type SortKey =
  | "date_desc"    // yeni → eski (varsayılan)
  | "date_asc"     // eski → yeni
  | "name_asc"     // A → Z
  | "name_desc"    // Z → A
  | "likes_desc"   // beğeni çok → az
  | "comments_desc"// yorum çok → az
  | "rating_desc"; // puan yüksek → düşük

// FE->BE sort query map (backend ile uyumlu tutulmalı)
function mapSortToQuery(key: SortKey): string {
  switch (key) {
    case "date_desc": return "-publishedAt,-createdAt";
    case "date_asc": return "publishedAt,createdAt";
    case "name_asc": return "title";          // BE title için uygun alanı mapliyor
    case "name_desc": return "-title";
    case "likes_desc": return "-likes";
    case "comments_desc": return "-comments";
    case "rating_desc": return "-rating";
    default: return "-publishedAt,-createdAt";
  }
}

type Props = {
  items: Recipe[];
  locale: SupportedLocale;
  showLocalSearch?: boolean;
  h1Text?: string;
};

export default function HomeView({
  items,
  locale,
  showLocalSearch = false,
  h1Text,
}: Props) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const trc = useTranslations("recipes");
  const tCats = useTranslations("categories");

  // ---- SEO: Tek H1 ----
  const pageH1 = h1Text ?? (() => {
    try { const v = t("hero.h1"); if (typeof v === "string") return v; } catch { }
    try { return t("h1"); } catch { }
    try { return trc("listTitle"); } catch { }
    return "Tarifler";
  })();

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const qFromUrl = (params.get("q") || "").trim();
  const hlFromUrl = (params.get("hl") || qFromUrl).trim();
  const catFromUrl = normalizeCat((params.get("cat") || "").trim());

  // sort parametresi (varsayılan yeni→eski)
  const sortFromUrl = ((): SortKey => {
    const s = (params.get("sort") || "date_desc").trim() as SortKey;
    const allowed: SortKey[] = ["date_desc", "date_asc", "name_asc", "name_desc", "likes_desc", "comments_desc", "rating_desc"];
    return allowed.includes(s) ? s : "date_desc";
  })();

  const pageFromUrl = (() => {
    const n = parseInt(params.get("page") || "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  const [q, setQ] = useState(qFromUrl);
  const [selectedCat, setSelectedCat] = useState<string | null>(catFromUrl || null);
  const [page, setPage] = useState(pageFromUrl);
  const [sortKey, setSortKey] = useState<SortKey>(sortFromUrl);

  /* URL -> state */
  useEffect(() => setQ(qFromUrl), [qFromUrl]);
  useEffect(() => setPage(pageFromUrl), [pageFromUrl]);
  useEffect(() => setSelectedCat(catFromUrl || null), [catFromUrl]);
  useEffect(() => setSortKey(sortFromUrl), [sortFromUrl]);

  /* state -> URL (q/cat/sort değişince page=1) */
  useEffect(() => {
    const usp = new URLSearchParams(params.toString());
    usp.delete("page");
    if (q) { usp.set("q", q); usp.set("hl", q); } else { usp.delete("q"); usp.delete("hl"); }
    if (selectedCat) usp.set("cat", normalizeCat(selectedCat)); else usp.delete("cat");
    if (sortKey) usp.set("sort", sortKey); else usp.delete("sort");
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, selectedCat, sortKey]);

  /* fetch + meta (liste) — sort’u BE’ye gönder */
  const { pageItems, meta, loading, err } = usePagedRecipes({
    locale,
    page,
    q,
    selectedCat,
    initialItems: items,
    pageSize: PAGE_SIZE,
    sort: mapSortToQuery(sortKey),
  });

  // BE’den gelen sırayı kullan
  const pageItemsSorted = pageItems;

  /* meta güncellemesi (url dışı overflow düzelt) */
  useEffect(() => {
    const total = Number(meta?.totalPages || 1);
    if (page > total) {
      const usp = new URLSearchParams(params.toString());
      if (total > 1) usp.set("page", String(total)); else usp.delete("page");
      setPage(total);
      router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.totalPages]);

  /* pager */
  const pager = useMemo(() => {
    const totalPages = Number(meta?.totalPages) || 1;
    const current = Number(meta?.page) || page;
    return {
      page: current,
      totalPages,
      hasPrev: meta?.hasPrev ?? current > 1,
      hasNext: meta?.hasNext ?? current < totalPages,
    };
  }, [meta?.page, meta?.totalPages, meta?.hasPrev, meta?.hasNext, page]);

  const go = (p: number) => {
    const max = Math.max(1, pager.totalPages || 1);
    const next = Math.min(Math.max(1, p), max);
    if (next === page) return;
    setPage(next);
    const usp = new URLSearchParams(params.toString());
    if (next > 1) usp.set("page", String(next)); else usp.delete("page");
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
  };

  // highlight (opsiyonel)
  const highlight = (text: string) => {
    const needle = hlFromUrl.trim();
    if (!needle) return text;
    const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${esc})`, "ig");
    return String(text)
      .split(re)
      .map((p, i) =>
        i % 2 === 1 ? <mark key={i} style={{ padding: 0 }}>{p}</mark> : <span key={i}>{p}</span>
      );
  };

  /* popular (SSR setinden) */
  const popular = useMemo(() => {
    const score = (r: Recipe) =>
      (r.reactionTotals?.like ?? 0) * 3 +
      (r.ratingCount ?? 0) * 2 +
      Math.round((r.ratingAvg ?? 0) * 10);
    return [...items].sort((a, b) => score(b) - score(a)).slice(0, 3);
  }, [items]);

  /* latest — BE’den -publishedAt,-createdAt */
  type LatestView = {
    id: string;
    title: string;
    href: string;
    minutes: number;
    calories?: number;
    likes: number;
    comments: number;
    createdAt: number;
  };
  const mapLatest = (r: Recipe): LatestView => {
    const title =
      (r.title as any)?.[locale] || r.title?.tr || (r as any).slugCanonical || "Tarif";
    const slug = (r.slug as any)?.[locale] || (r as any).slugCanonical;
    return {
      id: (r as any)._id || slug,
      title,
      href: `/${locale}/recipes/${slug}`,
      minutes: r.totalMinutes ?? 30,
      calories: (r as any)?.calories ?? r.nutrition?.calories ?? 280,
      likes: r.reactionTotals?.like ?? 0,
      comments: r.commentCount ?? 0,
      createdAt: publishedTs(r),
    };
  };

  const [latest, setLatest] = useState<LatestView[]>(
    [...items].sort((a, b) => publishedTs(b) - publishedTs(a)).slice(0, LATEST_LIMIT).map(mapLatest)
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const base = (getApiBase() || "/api").replace(/\/+$/, "");
        const qs = new URLSearchParams();
        qs.set("limit", String(LATEST_LIMIT));
        qs.set("fields", LATEST_FIELDS);
        qs.set("sort", "-publishedAt,-createdAt");
        qs.set("_ts", String(Math.floor(Date.now() / 60000)));
        const r = await fetch(`${base}/recipes?${qs.toString()}`, {
          headers: { ...getLangHeaders(locale), "Cache-Control": "no-cache" },
          credentials: "include",
          cache: "no-store",
        });
        if (!r.ok) return;
        const j = (await r.json()) as { data?: Recipe[] };
        if (!alive || !j?.data) return;
        setLatest(j.data.map(mapLatest));
      } catch { }
    })();
    return () => { alive = false; };
  }, [locale]);

  const hasFilters = !!selectedCat || !!q.trim();

  /* --------- DEDUP + FILL (Tüm tarifler) --------- */
  const latestKeys = useMemo(() => new Set(latest.map((x) => x.id)), [latest]);
  const [allListFinal, setAllListFinal] = useState<Recipe[]>([...pageItemsSorted]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (hasFilters || (pager.page ?? 1) !== 1) {
        if (!cancelled) setAllListFinal(pageItemsSorted);
        return;
      }

      // 1. sayfadaysak “En Yeni” ile çakışanı çıkar
      const baseDedup = pageItemsSorted.filter(
        (r) => !latestKeys.has(keyOf(r as any, locale))
      );

      if (baseDedup.length >= 1 || (meta?.totalPages ?? 1) <= 1) {
        if (!cancelled) setAllListFinal(baseDedup);
        return;
      }

      try {
        const nextPage = (meta?.page || 1) + 1;
        if (nextPage > (meta?.totalPages || 1)) {
          if (!cancelled) setAllListFinal(baseDedup);
          return;
        }

        const base = (getApiBase() || "/api").replace(/\/+$/, "");
        const qs = new URLSearchParams();
        qs.set("page", String(nextPage));
        qs.set("limit", String(PAGE_SIZE));
        qs.set("sort", mapSortToQuery(sortKey));
        const r = await fetch(`${base}/recipes?${qs.toString()}`, {
          headers: getLangHeaders(locale),
          credentials: "include",
        });
        const j = (await r.json()) as { data?: Recipe[] };
        const extra = (j?.data ?? []).filter((x) => !latestKeys.has(keyOf(x as any, locale)));

        if (!cancelled) {
          const merged = [...baseDedup, ...extra].slice(0, PAGE_SIZE);
          setAllListFinal(merged);
        }
      } catch {
        if (!cancelled) setAllListFinal(baseDedup);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [
    pageItemsSorted,
    hasFilters,
    pager.page,
    latestKeys,
    locale,
    meta?.page,
    meta?.totalPages,
    sortKey,
  ]);

  /* ---------- i18n sort label builder ---------- */
  const sortLabels = useMemo(() => ({
    date_desc: t("sort.options.date_desc", { default: "📅 Yeni → Eski" }),
    date_asc: t("sort.options.date_asc", { default: "📅 Eski → Yeni" }),
    name_asc: t("sort.options.name_asc", { default: "🔤 A → Z" }),
    name_desc: t("sort.options.name_desc", { default: "🔤 Z → A" }),
    likes_desc: t("sort.options.likes_desc", { default: "❤️ Beğeni" }),
    comments_desc: t("sort.options.comments_desc", { default: "💬 Yorum" }),
    rating_desc: t("sort.options.rating_desc", { default: "⭐ Puan" }),
  }), [t]);

  /* ---------- render ---------- */
  return (
    <Container>
      {/* Tek H1 */}
      <HeroTitle>{pageH1}</HeroTitle>

      {showLocalSearch && (
        <>
          <SearchWrap role="search" onSubmit={(e) => e.preventDefault()}>
            <input
              placeholder={t("search.placeholder", { default: "Tarif ara..." })}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <SearchButton type="submit">
              {t("search.button", { default: "Ara" })}
            </SearchButton>
          </SearchWrap>
          <Hint>
            <strong>{t("hint.label", { default: "İpucu:" })}</strong>{" "}
            {t("hint.text", { default: "Anahtar kelimeleri deneyin; örn. “mercimek çorbası”" })}
          </Hint>
        </>
      )}

      <QuickCategories
        locale={locale}
        selected={selectedCat}
        onPick={(k) => setSelectedCat(normalizeCat(k))}
        onClear={() => setSelectedCat(null)}
        sampleSize={200}
      />

      {/* FİLTRELİ LİSTE */}
      {hasFilters && (
        <>
          <SectionHeader>
            {selectedCat
              ? `${getCategoryIcon(selectedCat)} ${prettyCat(tCats, selectedCat)}`
              : t("results.title", { default: "Sonuçlar" })}
          </SectionHeader>

          {/* sıralama seçici */}
          <SortRow>
            <label htmlFor="sortSel">
              {t("sort.label", { default: "Sırala" })}
            </label>
            <select
              id="sortSel"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label={t("sort.aria", { default: "Sıralama seç" })}
            >
              {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                <option key={k} value={k}>{(sortLabels as any)[k]}</option>
              ))}
            </select>
          </SortRow>

          {loading && <Muted>{t("loading", { default: "Yükleniyor..." })}</Muted>}
          {err && <ErrorNote>{String(err)}</ErrorNote>}
          {!loading && !err && pageItemsSorted.length === 0 && (
            <Muted>{t("empty", { default: "Kayıt bulunamadı." })}</Muted>
          )}

          {!!pageItemsSorted.length && <RecipeList items={pageItemsSorted} locale={locale} />}

          <Pagination
            ariaLabel={t("pagination.aria", { default: "Sayfalandırma" })}
            page={pager.page}
            totalPages={pager.totalPages}
            hasPrev={pager.hasPrev}
            hasNext={pager.hasNext}
            prevLabel={t("pagination.prev", { default: "Önceki" })}
            nextLabel={t("pagination.next", { default: "Sonraki" })}
            onChange={go}
          />
        </>
      )}

      {/* FİLTRESİZ HOME */}
      {!hasFilters && (
        <>
          <SectionHeader>{t("popular.title", { default: "Popüler" })}</SectionHeader>
          <RecipeGrid items={popular} locale={locale} />

          <SectionHeader>{trc("latest", { default: "En Yeni Tarifler" })}</SectionHeader>
          <List>
            {latest.map((r) => (
              <ListItem key={r.id}>
                <NextLink prefetch={false} href={r.href}>{r.title}</NextLink>
                <ListMeta>
                  <span>⏱ {r.minutes} {tc("unit.minutesShort", { default: "dk" })}</span>
                  <span>🔥 {r.calories} {tc("unit.kcal", { default: "kcal" })}</span>
                  <span>❤️ {r.likes}</span>
                  <span>💬 {r.comments}</span>
                </ListMeta>
              </ListItem>
            ))}
          </List>

          <SectionHeader>{t("all.title", { default: "Tüm Tarifler" })}</SectionHeader>

          {/* sıralama seçici */}
          <SortRow>
            <label htmlFor="sortSel2">
              {t("sort.label", { default: "Sırala" })}
            </label>
            <select
              id="sortSel2"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label={t("sort.aria", { default: "Sıralama seç" })}
            >
              {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                <option key={k} value={k}>{(sortLabels as any)[k]}</option>
              ))}
            </select>
          </SortRow>

          <RecipeList items={allListFinal} locale={locale} />

          <Pagination
            ariaLabel={t("pagination.aria", { default: "Sayfalandırma" })}
            page={pager.page}
            totalPages={pager.totalPages}
            hasPrev={pager.hasPrev}
            hasNext={pager.hasNext}
            prevLabel={t("pagination.prev", { default: "Önceki" })}
            nextLabel={t("pagination.next", { default: "Sonraki" })}
            onChange={go}
          />
        </>
      )}
    </Container>
  );
}

/* ---------- styled ---------- */
const Container = styled.main`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 24px auto 48px;
  padding: 0 20px;
`;

// Tek H1
const HeroTitle = styled.h1`
  margin: 6px 0 18px;
  font-size: ${({ theme }) => theme.fontSizes.h2};
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
`;

const SearchWrap = styled.form`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  background: ${({ theme }) => theme.colors.sectionBackground};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 10px;
  input {
    width: 100%;
    border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.inputBorder};
    border-radius: ${({ theme }) => theme.radii.lg};
    background: ${({ theme }) => theme.colors.inputBackground};
    padding: 12px 14px;
    font-size: ${({ theme }) => theme.fontSizes.md};
    outline: none;
    transition: border-color ${({ theme }) => theme.durations.normal} ease;
    &:focus {
      border-color: ${({ theme }) => theme.colors.inputBorderFocus};
      box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
      background: ${({ theme }) => theme.colors.inputBackgroundFocus};
    }
  }
`;
const SearchButton = styled.button`
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 0 18px;
  font-weight: 600;
  background: ${({ theme }) => theme.buttons.danger.background};
  color: #fff;
  cursor: pointer;
  transition: background ${({ theme }) => theme.durations.fast} ease;
  &:hover { background: ${({ theme }) => theme.buttons.danger.backgroundHover}; }
`;
const Hint = styled.div`
  margin-top: 10px;
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  b { color: ${({ theme }) => theme.colors.primary}; }
`;

const SectionHeader = styled.h2`
  margin: 28px 0 14px;
  font-size: ${({ theme }) => theme.fontSizes.h3};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  position: relative;
  &:before {
    content: "";
    position: absolute;
    left: 0;
    bottom: -6px;
    width: 48px;
    height: 3px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 2px;
  }
`;

const SortRow = styled.div`
  display: flex; align-items: center; gap: 10px;
  margin: 6px 0 10px;
  select {
    height: 36px; border-radius: ${({ theme }) => theme.radii.lg};
    border: 1px solid ${({ theme }) => theme.inputs.border};
    background: ${({ theme }) => theme.inputs.background};
    color: ${({ theme }) => theme.inputs.text};
    padding: 0 10px;
  }
`;

const List = styled.div`display: grid; gap: 10px; margin-top: 10px;`;
const ListItem = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 10px 12px;
  display: flex; justify-content: space-between; align-items: center;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  min-height: 52px;
`;
const ListMeta = styled.div`display: flex; gap: 14px; color: ${({ theme }) => theme.colors.textSecondary};`;
const NextLink = styled(Link)`color: ${({ theme }) => theme.colors.link}; &:hover { text-decoration: underline; }`;
const Muted = styled.p`color: ${({ theme }) => theme.colors.textSecondary}; font-size: ${({ theme }) => theme.fontSizes.sm};`;
const ErrorNote = styled.p`color: ${({ theme }) => theme.colors.danger}; font-size: ${({ theme }) => theme.fontSizes.sm};`;
