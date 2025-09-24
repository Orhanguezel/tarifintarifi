// src/layout/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import type { SupportedLocale } from "@/types/common";
import logoPng from "@/../public/logo.png";

// Güvenli çeviri yardımcıları (fallback'li)
function tSafe(
  ns: ReturnType<typeof useTranslations>,
  key: string,
  fallback: string
) {
  try {
    const v = ns(key);
    return typeof v === "string" ? v : fallback;
  } catch {
    return fallback;
  }
}

export default function Footer({
  locale = "tr" as SupportedLocale,
}: {
  locale?: SupportedLocale;
}) {
  const t = useTranslations("footer");
  const base = `/${locale}`;
  const year = new Date().getFullYear();

  // ---- Logo kaynakları ----
  const LOGO_PRIMARY: StaticImageData = logoPng;
  const LOGO_FALLBACK = "/og.jpg"; // dilediğinde değiştir
  const brandName =
    (tSafe(t, "brand.name", process.env.NEXT_PUBLIC_SITE_NAME || "ensotek.de") ||
      process.env.NEXT_PUBLIC_SITE_NAME ||
      "ensotek.de").trim();
  const logoAlt = tSafe(t, "brand.logoAlt", brandName);
  const tagline = tSafe(t, "brand.tagline", "Industrial Solutions & Services");

  // Bölüm başlıkları (çeviri yoksa fallback)
  const titleSite = tSafe(t, "sections.site", "Site");
  const titleHelp = tSafe(t, "sections.help", "Help");
  const titleLegal = tSafe(t, "sections.legal", "Legal");

  // Link etiketleri
  const lAbout = tSafe(t, "links.about", "About");
  const lContact = tSafe(t, "links.contact", "Contact");
  const lPrivacy = tSafe(t, "links.privacy", "Privacy");
  const lTerms = tSafe(t, "links.terms", "Terms");
  const lProducts = tSafe(t, "links.products", "Products");
  const lReferences = tSafe(t, "links.references", "References");
  const lLibrary = tSafe(t, "links.library", "Library");
  const lNews = tSafe(t, "links.news", "News");

  // Telif & tasarım
  const copyright = tSafe(
    t,
    "copyright",
    `© ${year} ${brandName}. All rights reserved.`
  ).replace("{year}", String(year)).replace("{brand}", brandName);
  const designAria = tSafe(t, "design.aria", "Opened by guezelwebdesign.com");
  const designLabel = tSafe(t, "design.label", "Design: GUEZEL Webdesign");

  const [broken, setBroken] = React.useState(false);

  return (
    <Foot>
      <Inner>
        <Grid>
          {/* Brand sütunu */}
          <div>
            <LogoBox>
              <Link href={base} aria-label={brandName}>
                <LogoPicture>
                  <Image
                    src={broken ? LOGO_FALLBACK : LOGO_PRIMARY}
                    alt={logoAlt}
                    width={160}
                    height={44}
                    priority
                    unoptimized
                    sizes="160px"
                    style={{ objectFit: "contain" }}
                    onError={() => setBroken(true)}
                  />
                </LogoPicture>
              </Link>
            </LogoBox>
            <Title>{brandName}</Title>
            <Muted>{tagline}</Muted>
          </div>

          {/* Site menüsü (deterministik) */}
          <nav aria-label={titleSite}>
            <Title>{titleSite}</Title>
            <List>
              <li><Link href={`${base}/about`}>{lAbout}</Link></li>
              <li><Link href={`${base}/products`}>{lProducts}</Link></li>
              <li><Link href={`${base}/references`}>{lReferences}</Link></li>
              <li><Link href={`${base}/library`}>{lLibrary}</Link></li>
              <li><Link href={`${base}/news`}>{lNews}</Link></li>
              <li><Link href={`${base}/contact`}>{lContact}</Link></li>
            </List>
          </nav>

          {/* Legal / Yardım */}
          <nav aria-label={titleLegal}>
            <Title>{titleLegal}</Title>
            <List>
              <li><Link href={`${base}/privacy`}>{lPrivacy}</Link></li>
              <li><Link href={`${base}/terms`}>{lTerms}</Link></li>
            </List>

            <Title style={{ marginTop: 16 }}>{titleHelp}</Title>
            <List>
              <li><Link href={`${base}/contact`}>{lContact}</Link></li>
              <li><Link href={`${base}/about`}>{lAbout}</Link></li>
            </List>
          </nav>
        </Grid>

        {/* --- Social (test beklentisi) --- */}
<nav aria-label="Social">
  <List>
    <li><a href="https://facebook.com/Ensotek" target="_blank" rel="noopener noreferrer">Facebook</a></li>
    <li><a href="https://instagram.com/ensotek_tr" target="_blank" rel="noopener noreferrer">Instagram</a></li>
    <li><a href="https://x.com/Ensotek_Cooling" target="_blank" rel="noopener noreferrer">X</a></li>
    <li><a href="https://linkedin.com/company/ensotek-su-so-utma-kuleleri-ltd-ti-" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
    <li><a href="https://youtube.com/channel/UCX22ErWzyT4wDqDRGN9zYmg" target="_blank" rel="noopener noreferrer">YouTube</a></li>
  </List>
</nav>


        <Copy dangerouslySetInnerHTML={{ __html: copyright }} />

        <DesignLink
          href="https://www.guezelwebdesign.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={designAria}
        >
          {designLabel}
        </DesignLink>
      </Inner>
    </Foot>
  );
}

/* ===== styled ===== */

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
  width: 160px;
  height: 44px;
  align-items: center;
  justify-content: flex-start;
  img { filter: none; }
`;

const Muted = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.6;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  li + li { margin-top: 8px; }

  a {
    color: rgba(255, 255, 255, 0.96);
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
  color: rgba(255, 255, 255, 0.80);
  text-align: center;
`;

const DesignLink = styled.a`
  display: inline-block;
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.90);
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-style: italic;
  text-align: center;
  text-decoration: underline;
  transition: opacity ${({ theme }) => theme.transition.fast};

  @media (max-width: 600px) {
    margin-bottom: 44px;
  }

  &:hover { opacity: 1; }
  &:focus-visible {
    outline: 2px solid rgba(255,255,255,0.95);
    outline-offset: 2px;
  }
`;
