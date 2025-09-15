"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import type { SupportedLocale } from "@/types/common";
import { useTopRecipeCategories } from "@/hooks/useTopRecipeCategories";

/* -------- helpers -------- */
// FE tarafında kategori normalize — BE validator ile uyumlu
const normalizeCat = (v: string) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const titleCaseFromSlug = (slug: string) => {
  const s = String(slug || "").replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : slug;
};

type Props = { locale: SupportedLocale; showSearch?: boolean };

export default function Navbar({ locale, showSearch = true }: Props) {
  const router = useRouter();

  const t = useTranslations("navbar");
  const tCats = useTranslations("categories");

  // Arama
  const [q, setQ] = useState("");

  // Top-5 kategori (reçetelerde en çok geçen)
  const { top, loading } = useTopRecipeCategories(locale, 300, 5);

  // Nav’da kullanılacak {key,label,href}
  const navCats = useMemo(() => {
    const keys = top.map((c) => normalizeCat(c.key));
    return keys.map((key) => {
      let label = "";
      try {
        const tx = tCats(`dynamic.${key}`);
        if (tx) label = tx;
      } catch {}
      if (!label) label = titleCaseFromSlug(key);
      // Ana sayfada render (HomeView URL paramına bakıyor)
      const href = `/${locale}?cat=${encodeURIComponent(key)}`;
      return { key, label, href };
    });
  }, [top, locale, tCats]);

  const navCatsDesktop = navCats.slice(0, 4); // sadece 4
  const navCatsMobile = navCats.slice(0, 5);  // en fazla 5

  // Arama submit
  const onSearch = (ev: React.FormEvent) => {
    ev.preventDefault();
    const raw = q.trim();
    if (!raw) return;
    const enc = encodeURIComponent(raw);
    router.push(`/${locale}?q=${enc}&hl=${enc}`);
  };

  return (
    <>
      <HeaderWrap>
        <HeaderInner>
          {/* brand */}
          <Brand href={`/${locale}`}>
            <span className="title">tarifintarifi.com</span>
            <span className="subtitle">{t("brand.subtitle")}</span>
          </Brand>

          {/* desktop nav (top-5 içinden sadece 4’ü) */}
          <Nav aria-label={t("aria.mainMenu")}>
            {loading && navCatsDesktop.length === 0 ? (
              <SkeletonRow aria-hidden>
                <i /><i /><i /><i /><i />
              </SkeletonRow>
            ) : (
              navCatsDesktop.map((c) => (
                <NavLink key={c.key} href={c.href}>{c.label}</NavLink>
              ))
            )}
          </Nav>

          {/* desktop actions */}
          <Actions>
            <Btn href={`/${locale}/ai/recipe`} variant="primary">{t("actions.ai")}</Btn>
            <Btn href={`/${locale}/recipes/submit`} variant="secondary">{t("actions.submit")}</Btn>
          </Actions>

          {/* mobile tiny actions */}
          <MobileHeaderActions>
            <IconBtn href={`/${locale}/ai/recipe`} aria-label={t("actions.aiShort")} $variant="primary">🧠</IconBtn>
            <IconBtn href={`/${locale}/recipes/submit`} aria-label={t("actions.submitShort")} $variant="secondary">🍽️</IconBtn>
          </MobileHeaderActions>
        </HeaderInner>

        {/* mobile horizontal categories — top 5 */}
        <MobileCatsWrap>
          <MobileCatsInner aria-label={t("aria.categories")}>
            {loading && navCatsMobile.length === 0 ? (
              <>
                <a style={{ pointerEvents: "none" }}>•••</a>
                <a style={{ pointerEvents: "none" }}>•••</a>
                <a style={{ pointerEvents: "none" }}>•••</a>
              </>
            ) : (
              navCatsMobile.map((c) => (
                <Link key={c.key} href={c.href}>{c.label}</Link>
              ))
            )}
          </MobileCatsInner>
        </MobileCatsWrap>
      </HeaderWrap>

      {/* search (optional) */}
      {showSearch && (
        <>
          <SearchWrap>
            <SearchInner onSubmit={onSearch} role="search">
              <input
                placeholder={t("search.placeholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t("search.aria")}
              />
              <button type="submit">{t("search.button")}</button>
            </SearchInner>
          </SearchWrap>
          <Tip>
            <strong>{t("tip.label")}</strong> {t("tip.text")}
          </Tip>
        </>
      )}
    </>
  );
}

/* ====== styled ====== */

const HeaderWrap = styled.header`
  position: sticky; top: 0; z-index: ${({ theme }) => theme.zIndex.overlay};
  background: ${({ theme }) => theme.colors.cardBackground};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderBright};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  backdrop-filter: saturate(140%) blur(6px);
`;

const HeaderInner = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto; padding: 10px 16px;
  display: grid; grid-template-columns: auto 1fr auto; align-items: center;
  gap: ${({ theme }) => theme.spacings.md};
  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: auto 1fr auto; gap: ${({ theme }) => theme.spacings.sm};
  }
`;

const Brand = styled(Link)`
  display: inline-flex; flex-direction: column; gap: 2px; text-decoration: none;
  .title { color: ${({ theme }) => theme.colors.primary}; font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.fontWeights.bold}; font-size: ${({ theme }) => theme.fontSizes.lg}; line-height: 1.1; }
  .subtitle { color: ${({ theme }) => theme.colors.textSecondary}; font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.regular}; }
`;

const Nav = styled.nav`
  display: flex; align-items: center; gap: ${({ theme }) => theme.spacings.lg};
  ${({ theme }) => theme.media.mobile} { display: none; }
`;

const NavLink = styled(Link)`
  position: relative; font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textLight};
  padding: 8px 10px; border-radius: ${({ theme }) => theme.radii.md}; text-decoration: none;
  transition: background ${({ theme }) => theme.transition.fast};
  &:hover { background: ${({ theme }) => theme.colors.hoverBackground}; }
  &:focus-visible { outline: none; box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
`;

const SkeletonRow = styled.div`
  display: inline-flex; gap: 14px;
  i { display: inline-block; width: 64px; height: 14px; border-radius: 6px;
    background: linear-gradient(90deg, rgba(0,0,0,.06), rgba(0,0,0,.12), rgba(0,0,0,.06));
    animation: shine 1.2s linear infinite; background-size: 200% 100%; }
  @keyframes shine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const Actions = styled.div`
  display: flex; gap: ${({ theme }) => theme.spacings.sm}; justify-content: flex-end;
  ${({ theme }) => theme.media.mobile} { display: none; }
`;

const Btn = styled(Link)<{ variant?: "primary" | "secondary" }>`
  --bg: ${({ theme, variant }) => variant === "secondary" ? theme.buttons.secondary.background : theme.buttons.primary.background};
  --bgHover: ${({ theme, variant }) => variant === "secondary" ? theme.buttons.secondary.backgroundHover : theme.buttons.primary.backgroundHover};
  --text: #fff;
  padding: 8px 12px; border-radius: ${({ theme }) => theme.radii.md}; font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  text-decoration: none; border: 1px solid transparent; background: var(--bg); color: var(--text);
  box-shadow: ${({ theme }) => theme.shadows.button};
  transition: background ${({ theme }) => theme.transition.fast}, color ${({ theme }) => theme.transition.fast};
  &:hover { background: var(--bgHover); color: var(--text); }
  &:focus-visible { outline: none; box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
`;

const MobileHeaderActions = styled.div`
  display: none;
  ${({ theme }) => theme.media.mobile} { display: inline-flex; gap: ${({ theme }) => theme.spacings.sm}; justify-content: flex-end; }
`;

const IconBtn = styled(Link)<{ $variant?: "primary" | "secondary" }>`
  width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme, $variant }) => ($variant === "secondary" ? "transparent" : theme.colors.borderBright)};
  background: ${({ theme, $variant }) => ($variant === "secondary" ? theme.colors.secondary : theme.colors.inputBackgroundLight)};
  color: ${({ theme, $variant }) => ($variant === "secondary" ? "#fff" : theme.colors.text)};
  text-decoration: none; font-size: 18px; transition: background ${({ theme }) => theme.transition.fast};
  &:hover {
    background: ${({ theme, $variant }) => ($variant === "secondary" ? theme.colors.secondaryHover : theme.colors.inputBackgroundFocus)};
    color: ${({ theme, $variant }) => ($variant === "secondary" ? "#fff" : theme.colors.text)};
  }
  &:focus-visible { outline: none; box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
`;

const MobileCatsWrap = styled.div`
  display: none;
  ${({ theme }) => theme.media.mobile} {
    display: block; background: ${({ theme }) => theme.colors.cardBackground};
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderBright};
  }
`;

const MobileCatsInner = styled.nav`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto; padding: 8px 12px; display: flex; gap: 8px;
  overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin;
  a {
    white-space: nowrap; padding: 6px 10px; font-size: ${({ theme }) => theme.fontSizes.xs};
    border-radius: ${({ theme }) => theme.radii.pill};
    background: ${({ theme }) => theme.colors.inputBackgroundLight};
    border: 1px solid ${({ theme }) => theme.colors.borderBright};
    color: ${({ theme }) => theme.colors.textSecondary};
    text-decoration: none;
  }
  a:hover { background: ${({ theme }) => theme.colors.inputBackgroundFocus}; }
`;

const SearchWrap = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.borderBright};
  background: ${({ theme }) => theme.colors.cardBackground};
`;

const SearchInner = styled.form`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto; padding: 10px 16px 12px;
  display: grid; grid-template-columns: 1fr auto; gap: ${({ theme }) => theme.spacings.sm};
  input {
    width: 100%; height: 40px; border-radius: ${({ theme }) => theme.radii.lg}; padding: 0 14px;
    border: 1px solid ${({ theme }) => theme.colors.inputBorder};
    background: ${({ theme }) => theme.colors.inputBackground};
    color: ${({ theme }) => theme.colors.text}; outline: none;
    transition: border-color ${({ theme }) => theme.transition.fast};
    &::placeholder { color: ${({ theme }) => theme.colors.placeholder }; }
    &:focus {
      border-color: ${({ theme }) => theme.colors.inputBorderFocus};
      box-shadow: ${({ theme }) => theme.colors.shadowHighlight};
      background: ${({ theme }) => theme.colors.inputBackgroundFocus};
    }
  }
  button {
    height: 40px; border: 1px solid transparent; padding: 0 16px; border-radius: ${({ theme }) => theme.radii.lg};
    background: ${({ theme }) => theme.buttons.secondary.background}; color: #fff;
    font-weight: ${({ theme }) => theme.fontWeights.semiBold}; cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};
    &:hover { background: ${({ theme }) => theme.buttons.secondary.backgroundHover}; }
    &:focus-visible { outline: none; box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
  }
`;

const Tip = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 6px auto 12px; padding: 8px 14px; font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textOnWarning};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.warningBackground};
  border-radius: ${({ theme }) => theme.radii.md};
`;
