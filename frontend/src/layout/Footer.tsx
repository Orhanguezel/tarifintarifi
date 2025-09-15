"use client";

import Link from "next/link";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import type { SupportedLocale } from "@/types/common";
import { useTopRecipeCategories } from "@/hooks/useTopRecipeCategories";

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

  // Reçetelerde en çok geçen top-5 kategori
  const { top, loading } = useTopRecipeCategories(locale, 300, 5);

  const footerCats = (top || []).map((c) => {
    const key = normalizeCat(c.key);
    let label = "";
    try {
      const tx = tCats(`dynamic.${key}`);
      if (tx) label = tx;
    } catch {}
    if (!label) label = titleCaseFromSlug(key);
    // Ana sayfada render
    const href = `/${locale}?cat=${encodeURIComponent(key)}`;
    return { key, label, href };
  });

  return (
    <Foot>
      <Inner>
        <Grid>
          <div>
            <Title>{t("brand.name")}</Title>
            <Muted>{t("brand.tagline")}</Muted>
          </div>

          <nav aria-label={t("sections.categories")}>
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

          <nav aria-label={t("sections.help")}>
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
  aria-label={t("design.aria")}
>
  {t("design.label")}
</DesignLink>

      </Inner>
    </Foot>
  );
}

/* ---- styled ---- */

const Foot = styled.footer`
  margin-top: 40px;
  background: ${({ theme }) => theme.colors.darkGrey};
  color: ${({ theme }) => theme.colors.whiteColor};
  border-top: 1px solid rgba(255, 255, 255, 0.06);
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
  color: ${({ theme }) => theme.colors.whiteColor};
`;
const Muted = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
`;
const List = styled.ul`
  list-style: none; margin: 0; padding: 0;
  li + li { margin-top: 8px; }
  a {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;
const Copy = styled.div`
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
`;
const DesignLink = styled.a`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  margin-top: 2px;
  display: inline-block;
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  font-style: italic;
  text-align: center;
  opacity: 0.75;
  transition: color ${({ theme }) => theme.transition.fast}, opacity 0.25s;
  @media (max-width: 600px) {
    font-size: ${({ theme }) => theme.fontSizes.xsmall};
    margin-bottom: 44px;
  }
  &:hover, &:focus {
    color: ${({ theme }) => theme.colors.accent};
    opacity: 1;
    text-decoration: underline;
    outline: none;
  }
`;
