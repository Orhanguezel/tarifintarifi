// src/layout/Footer.tsx
"use client";
import React from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import type { SupportedLocale } from "@/types/common";
import { useTopRecipeCategories } from "@/hooks/useTopRecipeCategories";

// ✅ Statik import (public/ altında olmalı)
import logoPng from "@/../public/logo.png"; // <= public/logo.png

/* ---- helpers ---- */
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

export default function Footer({ locale = "tr" as SupportedLocale }: { locale?: SupportedLocale }) {
  const t = useTranslations("footer");
  const tCats = useTranslations("categories");
  const base = `/${locale}`;
  const year = new Date().getFullYear();

  const { top, loading } = useTopRecipeCategories(locale, 300, 5);

  const footerCats = (top || []).map((c) => {
    const key = normalizeCat(c.key);
    let label = "";
    try { label = tCats(`dynamic.${key}`) as string; } catch {}
    if (!label) label = titleCaseFromSlug(key);
    return { key, label, href: `/${locale}?cat=${encodeURIComponent(key)}` };
  });

  // ---- Logo kaynakları ----
  const LOGO_PRIMARY: StaticImageData = logoPng;       // import’tan geliyor
  const LOGO_FALLBACK = "/og-recipe-default.jpg";      // public/og-recipe-default.jpg
  const alt = (() => {
    try { return (t("brand.logoAlt") as string) || (t("brand.name") as string); }
    catch { return "Logo"; }
  })();

  // onError’da src değiştirmek yerine state ile switch
  const [broken, setBroken] = React.useState(false);

  return (
    <Foot>
      <Inner>
        <Grid>
          <div>
            <LogoBox>
              <Link href={base} aria-label={t("brand.name") as string}>
                <LogoPicture>
  <Image
    src={broken ? LOGO_FALLBACK : LOGO_PRIMARY}
    alt={alt}
    width={140}
    height={40}
    priority
    unoptimized                // ← _next/image kullanmaz, direkt /logo.png döner
    sizes="140px"
    style={{ objectFit: "contain" }}
    onError={() => setBroken(true)}
  />
</LogoPicture>

              </Link>
            </LogoBox>
            <Title>{t("brand.name")}</Title>
            <Muted>{t("brand.tagline")}</Muted>
          </div>

          <nav aria-label={t("sections.categories") as string}>
            <Title>{t("sections.categories")}</Title>
            <List>
              {loading && footerCats.length === 0 ? (
                <>
                  <li><span aria-hidden>•••</span></li>
                  <li><span aria-hidden>•••</span></li>
                  <li><span aria-hidden>•••</span></li>
                </>
              ) : (
                footerCats.map((c) => (
                  <li key={c.key}>
                    <Link href={c.href}>{c.label}</Link>
                  </li>
                ))
              )}
            </List>
          </nav>

          <nav aria-label={t("sections.help") as string}>
            <Title>{t("sections.help")}</Title>
            <List>
              <li><Link href={`${base}/about`}>{t("links.about")}</Link></li>
              <li><Link href={`${base}/contact`}>{t("links.contact")}</Link></li>
              <li><Link href={`${base}/privacy`}>{t("links.privacy")}</Link></li>
              <li><Link href={`${base}/terms`}>{t("links.terms")}</Link></li>
            </List>
          </nav>
        </Grid>

        <Copy>{t("copyright", { year, brand: t("brand.name") })}</Copy>

        <DesignLink
          href="https://www.guezelwebdesign.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("design.aria") as string}
        >
          {t("design.label")}
        </DesignLink>
      </Inner>
    </Foot>
  );
}

const Foot = styled.footer`
  margin-top: 40px;
  background: ${({ theme }) => theme.colors.footerBackground};
  color: #ffffff;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  padding: 28px 16px 18px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 24px;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`;

const Title = styled.h4`
  margin: 0 0 8px;
  color: #ffffff;
`;

const LogoBox = styled.div` margin: 6px 0 10px; `;
const LogoPicture = styled.span`
  display: inline-flex;
  width: 140px;
  height: 40px;
  align-items: center;          /* ortala */
  justify-content: flex-start;
  img { filter: none; }
`;


const Muted = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.88); /* ↑ kontrast */
  line-height: 1.6;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  li + li { margin-top: 8px; }

  a {
    color: rgba(255, 255, 255, 0.96); /* ↑ kontrast */
    text-decoration: none;
    &:hover { text-decoration: underline; }

    &:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.95);
      outline-offset: 2px;
      border-radius: 4px;
      text-decoration: underline;
    }
  }
`;

const Copy = styled.div`
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.80); /* ↑ kontrast */
  text-align: center;
`;

const DesignLink = styled.a`
  display: inline-block;
  margin-top: 6px;

  color: rgba(255, 255, 255, 0.90);   /* ↑ kontrast */
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-style: italic;
  text-align: center;
  text-decoration: underline;         /* altı çizgili baştan */
  transition: opacity ${({ theme }) => theme.transition.fast};

  @media (max-width: 600px) {
    margin-bottom: 44px;
  }

  &:hover {
    opacity: 1;
  }
  &:focus-visible {
    outline: 2px solid rgba(255,255,255,0.95);
    outline-offset: 2px;
  }
`;
