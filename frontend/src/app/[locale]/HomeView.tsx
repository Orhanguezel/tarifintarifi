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
import Pagination from "@/features/common/Pagination";
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
// ⬇️ sadece createdAt (updatedAt’a bakmıyoruz)
const createdAtOnly = (r: Recipe) => ts((r as any).createdAt);
const caloriesOf = (r: Recipe) => (r as any)?.calories ?? r.nutrition?.calories ?? undefined;

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

const prettyCat = (tCats: ReturnType<typeof useTranslations>, k: string) => {
  try {
    const tx = tCats(`dynamic.${k}`);
    if (tx && typeof tx === "string") return tx;
  } catch {}
  const s = String(k || "").replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : k;
};

// benzersiz anahtar
const keyOf = (r: any, loc: SupportedLocale) =>
  r?._id || r?.slugCanonical || r?.slug?.[loc] || r?.slug?.tr || r?.slug;

/* “En yeni” için küçük fetch */
const LATEST_LIMIT = Number(process.env.NEXT_PUBLIC_HOME_LATEST_LIMIT ?? 5);
// ⬇️ id dahil, updatedAt çıkarıldı
const LATEST_FIELDS =
  "_id slug slugCanonical title createdAt totalMinutes nutrition.calories reactionTotals.like commentCount images.thumbnail images.webp";

/* “Tüm Tarifler” için sayfa başına eleman */
const PAGE_SIZE = 5;

export default function HomeView({
  items,
  locale,
  showLocalSearch = false,
}: {
  items: Recipe[];
  locale: SupportedLocale;
  showLocalSearch?: boolean;
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const trc = useTranslations("recipes");
  const tCats = useTranslations("categories");

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const qFromUrl = (params.get("q") || "").trim();
  const hlFromUrl = (params.get("hl") || qFromUrl).trim();
  const catFromUrl = normalizeCat((params.get("cat") || "").trim());
  const pageFromUrl = (() => {
    const n = parseInt(params.get("page") || "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  const [q, setQ] = useState(qFromUrl);
  const [selectedCat, setSelectedCat] = useState<string | null>(catFromUrl || null);
  const [page, setPage] = useState(pageFromUrl);

  /* URL -> state */
  useEffect(() => setQ(qFromUrl), [qFromUrl]);
  useEffect(() => setPage(pageFromUrl), [pageFromUrl]);
  useEffect(() => setSelectedCat(catFromUrl || null), [catFromUrl]);

  /* state -> URL (q/cat değişince page=1) */
  useEffect(() => {
    const usp = new URLSearchParams(params.toString());
    usp.delete("page");
    if (q) { usp.set("q", q); usp.set("hl", q); } else { usp.delete("q"); usp.delete("hl"); }
    if (selectedCat) usp.set("cat", normalizeCat(selectedCat)); else usp.delete("cat");
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, selectedCat]);

  /* fetch + meta (liste) */
  const { pageItems, meta, loading, err } = usePagedRecipes({
    locale,
    page,
    q,
    selectedCat,
    initialItems: items,
    pageSize: PAGE_SIZE
  });

  /* “Tüm Tarifler”i yeni → eski sıraya getir (her durumda) */
  const pageItemsSortedDesc = useMemo(
    () => [...pageItems].sort((a, b) => createdAtOnly(b) - createdAtOnly(a)),
    [pageItems]
  );

  /* meta güncellemesi */
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

  /* tekil pager */
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
    return String(text).split(re).map((p, i) =>
      (i % 2 === 1 ? <mark key={i} style={{ padding: 0 }}>{p}</mark> : <span key={i}>{p}</span>)
    );
  };

  /* popular (SSR setinden hesaplanıyor) */
  const popular = useMemo(() => {
    const score = (r: Recipe) =>
      (r.reactionTotals?.like ?? 0) * 3 + (r.ratingCount ?? 0) * 2 + Math.round((r.ratingAvg ?? 0) * 10);
    return [...items].sort((a, b) => score(b) - score(a)).slice(0, 3);
  }, [items]);

  /* latest — önce SSR fallback, sonra API’den kesin veri */
  type LatestView = {
    id: string; title: string; href: string; minutes: number;
    calories?: number; likes: number; comments: number; createdAt: number;
  };
  const mapLatest = (r: Recipe): LatestView => {
    const title = (r.title as any)?.[locale] || r.title?.tr || (r as any).slugCanonical || "Tarif";
    const slug  = (r.slug  as any)?.[locale] || (r as any).slugCanonical;
    return {
      id: (r as any)._id || slug,
      title,
      href: `/${locale}/recipes/${slug}`,
      minutes: r.totalMinutes ?? 30,
      calories: (r as any)?.calories ?? r.nutrition?.calories ?? 280,
      likes: r.reactionTotals?.like ?? 0,
      comments: r.commentCount ?? 0,
      createdAt: createdAtOnly(r), // ⬅️ yalnız createdAt
    };
  };

  // SSR fallback (yeni → eski, yalnız createdAt)
  const [latest, setLatest] = useState<LatestView[]>(
    [...items].sort((a, b) => createdAtOnly(b) - createdAtOnly(a)).slice(0, LATEST_LIMIT).map(mapLatest)
  );

  // Hydration sonrası kesin “en yeni” (yeni → eski)
  // ... useEffect içindeki "kesin en yeni" fetch’i
useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const base = (getApiBase() || "/api").replace(/\/+$/, "");
      const qs = new URLSearchParams();
      qs.set("limit", String(LATEST_LIMIT));
      qs.set("fields", LATEST_FIELDS);
      qs.set("sort", "-createdAt");           // yeni -> eski
      // ⬇️ cache-buster (dakika başına değişir; aşırı istek yapmaz)
      qs.set("_ts", String(Math.floor(Date.now() / 60000)));

      const r = await fetch(`${base}/recipes?${qs.toString()}`, {
        headers: {
          ...getLangHeaders(locale),
          "Cache-Control": "no-cache"        // tarayıcı revalidate etsin
        },
        credentials: "include",
        cache: "no-store"                    // browser caching’i kapat
      });
      if (!r.ok) return;
      const j = (await r.json()) as { data?: Recipe[] };
      if (!alive || !j?.data) return;
      setLatest(j.data.map(mapLatest));      // mapLatest createdAtOnly kullanıyor
    } catch {}
  })();
  return () => { alive = false; };
}, [locale]);


  const hasFilters = !!selectedCat || !!q.trim();

  /* --------- DEDUP + FILL: 1. sayfada “En Yeni”de olanları çıkar, eksik kalırsa bir sonraki sayfadan doldur --------- */
  const latestKeys = useMemo(() => new Set(latest.map((x) => x.id)), [latest]);
  const [allListFinal, setAllListFinal] = useState<Recipe[]>(pageItemsSortedDesc);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Filtre varsa veya 1. sayfa değilse: sadece yeni -> eski sırayı uygula
      if (hasFilters || (pager.page ?? 1) !== 1) {
        if (!cancelled) setAllListFinal(pageItemsSortedDesc);
        return;
      }

      // 1) En yenilerde olanları çıkar (temel liste zaten yeni -> eski)
      const baseDedup = pageItemsSortedDesc.filter((r) => !latestKeys.has(keyOf(r as any, locale)));

      // 2) Yeterliyse direkt kullan
      if (baseDedup.length >= 1 || (meta?.totalPages ?? 1) <= 1) {
        if (!cancelled) setAllListFinal(baseDedup);
        return;
      }

      // 3) Eksik — bir SONRAKİ sayfayı yeni -> eski çekip doldur
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
        qs.set("sort", "-createdAt"); // yeni -> eski
        const r = await fetch(`${base}/recipes?${qs.toString()}`, {
          headers: getLangHeaders(locale),
          credentials: "include"
        });
        const j = await r.json() as { data?: Recipe[] };
        const extra = (j?.data ?? [])
          .sort((a, b) => createdAtOnly(b) - createdAtOnly(a))
          .filter((x) => !latestKeys.has(keyOf(x as any, locale)));

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
    pageItemsSortedDesc, hasFilters, pager.page, latestKeys, locale,
    meta?.page, meta?.totalPages
  ]);

  /* ---------- render ---------- */
  return (
    <Container>
      {showLocalSearch && (
        <>
          <SearchWrap role="search" onSubmit={(e) => { e.preventDefault(); }}>
            <input placeholder={t("search.placeholder")} value={q} onChange={(e) => setQ(e.target.value)} />
            <SearchButton type="submit">{t("search.button")}</SearchButton>
          </SearchWrap>
          <Hint>
            <strong>{t("hint.label")}</strong> {t("hint.text")}
          </Hint>
        </>
      )}

      <QuickCategories
        locale={locale}
        selected={selectedCat}
        onPick={(k) => setSelectedCat(normalizeCat(k))}
        onClear={() => { setSelectedCat(null); }}
        sampleSize={200}
      />

      {/* FİLTRELİ */}
      {hasFilters && (
        <>
          <SectionHeader>
            {selectedCat
              ? `${getCategoryIcon(selectedCat)} ${prettyCat(tCats, selectedCat)}`
              : t("results.title")}
          </SectionHeader>

          {loading && <Muted>{t("loading")}</Muted>}
          {err && <ErrorNote>{String(err)}</ErrorNote>}
          {!loading && !err && pageItemsSortedDesc.length === 0 && <Muted>{t("empty")}</Muted>}

          {!!pageItemsSortedDesc.length && <RecipeList items={pageItemsSortedDesc} locale={locale} />}

          <Pagination
            ariaLabel={t("pagination.aria")}
            page={pager.page}
            totalPages={pager.totalPages}
            hasPrev={pager.hasPrev}
            hasNext={pager.hasNext}
            prevLabel={t("pagination.prev")}
            nextLabel={t("pagination.next")}
            onChange={go}
          />
        </>
      )}

      {/* FİLTRESİZ */}
      {!hasFilters && (
        <>
          <SectionHeader>{t("popular.title")}</SectionHeader>
          <RecipeGrid items={popular} locale={locale} />

          <SectionHeader>{trc("latest")}</SectionHeader>
          <List>
            {latest.map((r) => (
              <ListItem key={r.id}>
                <NextLink prefetch={false} href={r.href}>{r.title}</NextLink>
                <ListMeta>
                  <span>⏱ {r.minutes} {tc("unit.minutesShort")}</span>
                  <span>🔥 {r.calories} {tc("unit.kcal")}</span>
                  <span>❤️ {r.likes}</span>
                  <span>💬 {r.comments}</span>
                </ListMeta>
              </ListItem>
            ))}
          </List>

          <SectionHeader>{t("all.title")}</SectionHeader>
          <RecipeList items={allListFinal} locale={locale} />

          <Pagination
            ariaLabel={t("pagination.aria")}
            page={pager.page}
            totalPages={pager.totalPages}
            hasPrev={pager.hasPrev}
            hasNext={pager.hasNext}
            prevLabel={t("pagination.prev")}
            nextLabel={t("pagination.next")}
            onChange={go}
          />
        </>
      )}
    </Container>
  );
}

/* ---------- styled ---------- */
const Container = styled.main`
  max-width:${({theme})=>theme.layout.containerWidth};
  margin:24px auto 48px;
  padding:0 20px;
`;
const SearchWrap = styled.form`
  display:grid;grid-template-columns:1fr auto;gap:8px;
  background:${({theme})=>theme.colors.sectionBackground};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.borderLight};
  border-radius:${({theme})=>theme.radii.lg};
  padding:10px;
  input{
    width:100%;
    border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
    border-radius:${({theme})=>theme.radii.lg};
    background:${({theme})=>theme.colors.inputBackground};
    padding:12px 14px;
    font-size:${({theme})=>theme.fontSizes.md};
    outline:none;
    transition:border-color ${({theme})=>theme.durations.normal} ease;
    &:focus{
      border-color:${({theme})=>theme.colors.inputBorderFocus};
      box-shadow:${({theme})=>theme.colors.shadowHighlight};
      background:${({theme})=>theme.colors.inputBackgroundFocus};
    }
  }
`;
const SearchButton = styled.button`
  border:none;border-radius:${({theme})=>theme.radii.lg};
  padding:0 18px;font-weight:600;
  background:${({theme})=>theme.buttons.danger.background};color:#fff;
  cursor:pointer;transition:background ${({theme})=>theme.durations.fast} ease;
  &:hover{background:${({theme})=>theme.buttons.danger.backgroundHover};}
`;
const Hint = styled.div`
  margin-top:10px;
  background:${({theme})=>theme.colors.inputBackgroundLight};
  border:1px solid ${({theme})=>theme.colors.borderLight};
  color:${({theme})=>theme.colors.textSecondary};
  border-radius:${({theme})=>theme.radii.lg};
  padding:10px 12px;font-size:${({theme})=>theme.fontSizes.sm};
  b{color:${({theme})=>theme.colors.primary};}
`;
const SectionHeader = styled.h2`
  margin:28px 0 14px;
  font-size:${({theme})=>theme.fontSizes.h3};
  font-weight:700;color:${({theme})=>theme.colors.text};
  position:relative;
  &:before{
    content:"";
    position:absolute;left:0;bottom:-6px;
    width:48px;height:3px;background:${({theme})=>theme.colors.primary};
    border-radius:2px;
  }
`;
const List = styled.div`display:grid;gap:10px;margin-top:10px;`;
const ListItem = styled.div`
  background:${({theme})=>theme.colors.cardBackground};
  border:1px solid ${({theme})=>theme.colors.borderBright};
  border-radius:${({theme})=>theme.radii.lg};
  padding:10px 12px;display:flex;justify-content:space-between;align-items:center;
  color:${({theme})=>theme.colors.textLight};font-size:${({theme})=>theme.fontSizes.sm};
  min-height:52px;
`;
const ListMeta = styled.div`display:flex;gap:14px;color:${({theme})=>theme.colors.textSecondary};`;
const NextLink = styled(Link)`color:${({theme})=>theme.colors.link};&:hover{text-decoration:underline;}`;
const Muted = styled.p`color:${({theme})=>theme.colors.textSecondary};font-size:${({theme})=>theme.fontSizes.sm};`;
const ErrorNote = styled.p`color:${({theme})=>theme.colors.danger};font-size:${({theme})=>theme.fontSizes.sm};`;
