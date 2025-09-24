// src/layout/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import type { SupportedLocale } from "@/types/common";
import logoPng from "@/../public/logo.png";

type Props = { locale: SupportedLocale; showSearch?: boolean };

function tSafe(ns: ReturnType<typeof useTranslations>, key: string, fallback: string) {
  try {
    const v = ns(key);
    return typeof v === "string" ? v : fallback;
  } catch {
    return fallback;
  }
}

export default function Navbar({ locale, showSearch = true }: Props) {
  const tNav = useTranslations("navbar");
  const tCommon = useTranslations("common");

  const SITE_NAME = (process.env.NEXT_PUBLIC_SITE_NAME || "ensotek.de").trim();

  // Menü — deterministik ve tekrar kullanılabilir
  const items = [
    { href: `/${locale}/about`, key: "about", label: tSafe(tNav, "links.about", "About") },
    { href: `/${locale}/products`, key: "products", label: tSafe(tNav, "links.products", "Products") },
    { href: `/${locale}/spareparts`, key: "spareparts", label: tSafe(tNav, "links.spareparts", "Spare Parts") },
    { href: `/${locale}/references`, key: "references", label: tSafe(tNav, "links.references", "References") },
    { href: `/${locale}/library`, key: "library", label: tSafe(tNav, "links.library", "Library") },
    { href: `/${locale}/news`, key: "news", label: tSafe(tNav, "links.news", "News") },
    { href: `/${locale}/contact`, key: "contact", label: tSafe(tNav, "links.contact", "Contact") },
  ];

  // Arama (basit q/hl → ana sayfa)
  const [q, setQ] = useState("");
  const onSearch = (ev: React.FormEvent) => {
    ev.preventDefault();
    const raw = q.trim();
    if (!raw) return;
    const enc = encodeURIComponent(raw);
    window.location.href = `/${locale}?q=${enc}&hl=${enc}`;
  };

  // Logo fallback
  const LOGO_PRIMARY: StaticImageData = logoPng;
  const LOGO_FALLBACK = "/og.jpg";
  const [broken, setBroken] = useState(false);
  const logoAlt =
    tSafe(tNav, "brand.logoAlt", SITE_NAME) || SITE_NAME;

  return (
    <>
      <HeaderWrap>
        <HeaderInner>
          {/* Brand (logo + isim) */}
          <Brand href={`/${locale}`} aria-label={SITE_NAME}>
            <LogoBox>
              <LogoPicture>
                <Image
                  src={broken ? LOGO_FALLBACK : LOGO_PRIMARY}
                  alt={logoAlt}
                  width={132}
                  height={36}
                  priority
                  unoptimized
                  sizes="132px"
                  style={{ objectFit: "contain" }}
                  onError={() => setBroken(true)}
                />
              </LogoPicture>
            </LogoBox>
            <div className="brand-text">
              <span className="title">{SITE_NAME}</span>
              <span className="subtitle">
                {tSafe(tNav, "brand.subtitle", "Industrial Solutions")}
              </span>
            </div>
          </Brand>

          {/* Desktop nav */}
          <Nav aria-label={tSafe(tNav, "aria.mainMenu", "Main menu")}>
            {items.map((it) => (
              <NavLink key={it.key} href={it.href}>
                {it.label}
              </NavLink>
            ))}
          </Nav>

          {/* Desktop actions (örnek 2 CTA) */}
          <Actions>
            <Btn href={`/${locale}/contact`} variant="primary">
              {tSafe(tCommon, "cta.contact", "Contact")}
            </Btn>
            <Btn href={`/${locale}/about`} variant="secondary">
              {tSafe(tCommon, "cta.learnMore", "Learn More")}
            </Btn>
          </Actions>

          {/* Mobile küçük ikonlar */}
          <MobileHeaderActions>
            <IconBtn href={`/${locale}/contact`} aria-label={tSafe(tCommon, "cta.contact", "Contact")} $variant="primary">✉️</IconBtn>
            <IconBtn href={`/${locale}/about`} aria-label={tSafe(tCommon, "cta.learnMore", "Learn More")} $variant="secondary">ℹ️</IconBtn>
          </MobileHeaderActions>
        </HeaderInner>

        {/* Mobile yatay menü (scrollable) */}
        <MobileCatsWrap>
          <MobileCatsInner aria-label={tSafe(tNav, "aria.secondaryMenu", "Secondary menu")}>
            {items.map((it) => (
              <Link key={it.key} href={it.href}>
                {it.label}
              </Link>
            ))}
          </MobileCatsInner>
        </MobileCatsWrap>
      </HeaderWrap>

      {/* Opsiyonel arama */}
      {showSearch && (
        <>
          <SearchWrap>
            <SearchInner onSubmit={onSearch} role="search" aria-label={tSafe(tNav, "search.aria", "Site search")}>
              <input
                placeholder={tSafe(tNav, "search.placeholder", "Search…")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={tSafe(tNav, "search.aria", "Site search")}
              />
              <button type="submit">{tSafe(tNav, "search.button", "Search")}</button>
            </SearchInner>
          </SearchWrap>
          <Tip>
            <strong>{tSafe(tNav, "tip.label", "Tip:")}</strong>{" "}
            {tSafe(tNav, "tip.text", "Use keywords relevant to products or services.")}
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
  display: inline-flex; align-items: center; gap: 10px; text-decoration: none;

  .brand-text {
    display: inline-flex; flex-direction: column; gap: 2px;
  }
  .title {
    color: ${({ theme }) => theme.colors.primary};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-size: ${({ theme }) => theme.fontSizes.lg};
    line-height: 1.1;
  }
  .subtitle {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.regular};
  }
`;

const LogoBox = styled.span` display: inline-flex; `;
const LogoPicture = styled.span`
  display: inline-flex;
  width: 132px;
  height: 36px;
  align-items: center;
  justify-content: flex-start;
  img { filter: none; }
`;

const Nav = styled.nav`
  display: flex; align-items: center; gap: ${({ theme }) => theme.spacings.lg};
  ${({ theme }) => theme.media.mobile} { display: none; }
`;

const NavLink = styled(Link)`
  display: inline-flex; align-items: center;
  position: relative; font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
  padding: 8px 10px; border-radius: ${({ theme }) => theme.radii.md};
  text-decoration: none; transition: background ${({ theme }) => theme.transition.fast};
  &:hover { background: ${({ theme }) => theme.colors.hoverBackground}; }
  &:focus-visible { outline: none; box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
`;

const Actions = styled.div`
  display: flex; gap: ${({ theme }) => theme.spacings.sm}; justify-content: flex-end;
  ${({ theme }) => theme.media.mobile} { display: none; }
`;

const Btn = styled(Link)<{ variant?: "primary" | "secondary" }>`
  --bg: ${({ theme, variant }) => variant === "secondary"
    ? theme.buttons.secondary.background
    : theme.buttons.primary.background};
  --bgHover: ${({ theme, variant }) => variant === "secondary"
    ? theme.buttons.secondary.backgroundHover
    : theme.buttons.primary.backgroundHover};
  --text: #fff;
  padding: 8px 12px; border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  text-decoration: none; border: 1px solid transparent;
  background: var(--bg); color: var(--text);
  box-shadow: ${({ theme }) => theme.shadows.button};
  transition: background ${({ theme }) => theme.transition.fast}, color ${({ theme }) => theme.transition.fast};
  &:hover { background: var(--bgHover); color: var(--text); }
  &:focus-visible { outline: none; box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
`;

const MobileHeaderActions = styled.div`
  display: none;
  ${({ theme }) => theme.media.mobile} {
    display: inline-flex; gap: ${({ theme }) => theme.spacings.sm}; justify-content: flex-end;
  }
`;

const IconBtn = styled(Link)<{ $variant?: "primary" | "secondary" }>`
  width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme, $variant }) =>
    $variant === "secondary" ? "transparent" : theme.colors.borderBright};
  background: ${({ theme, $variant }) =>
    $variant === "secondary" ? theme.colors.secondary : theme.colors.inputBackgroundLight};
  color: ${({ theme, $variant }) =>
    $variant === "secondary" ? "#fff" : theme.colors.text};
  text-decoration: none; font-size: 18px; transition: background ${({ theme }) => theme.transition.fast};
  &:hover {
    background: ${({ theme, $variant }) =>
      $variant === "secondary" ? theme.colors.secondaryHover : theme.colors.inputBackgroundFocus};
    color: ${({ theme, $variant }) =>
      $variant === "secondary" ? "#fff" : theme.colors.text};
  }
  &:focus-visible { outline: none; box-shadow: ${({ theme }) => theme.colors.shadowHighlight}; }
`;

const MobileCatsWrap = styled.div`
  display: none;
  ${({ theme }) => theme.media.mobile} {
    display: block;
    background: ${({ theme }) => theme.colors.cardBackground};
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderBright};
  }
`;

const MobileCatsInner = styled.nav`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto; padding: 8px 12px; display: flex; gap: 8px;
  overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin;
  a {
    display: inline-flex; align-items: center;
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
    &::placeholder { color: ${({ theme }) => theme.colors.placeholder}; }
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
