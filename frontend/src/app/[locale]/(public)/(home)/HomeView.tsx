"use client";

import Link from "next/link";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import type { SupportedLocale } from "@/types/common";

type Props = {
  locale: SupportedLocale;
};

export default function HomeView({ locale }: Props) {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  // Tek H1 (i18n fallback'lı)
  const pageH1 =
    safeT(t, "hero.h1") ??
    safeT(t, "h1") ??
    "Ensotek — endüstriyel çözümler";

  const pageLead =
    safeT(t, "hero.lead") ??
    "Yangın güvenliği, endüstriyel tesisler ve yedek parça çözümleri.";

  return (
    <Container as="main">
      <Hero>
        <HeroTitle id="page-title">{pageH1}</HeroTitle>
        <HeroLead>{pageLead}</HeroLead>
        <Ctas>
          <CTA href={`/${locale}/about`} className="primary">
            {safeT(tc, "cta.learnMore") ?? "Daha Fazla Bilgi"}
          </CTA>
          <CTA href={`/${locale}/contact`} className="secondary">
            {safeT(tc, "cta.contact") ?? "İletişime Geç"}
          </CTA>
        </Ctas>
      </Hero>

      <Section>
        <SectionTitle>{safeT(t, "sections.services.title") ?? "Hizmetlerimiz"}</SectionTitle>
        <Grid>
          <Card as={Link} href={`/${locale}/services`}>
            <CardTitle>{safeT(t, "cards.services.title") ?? "Mühendislik & Proje"}</CardTitle>
            <CardText>
              {safeT(t, "cards.services.desc") ??
                "Yangın algılama, söndürme ve bakım hizmetleri."}
            </CardText>
          </Card>

          <Card as={Link} href={`/${locale}/products`}>
            <CardTitle>{safeT(t, "cards.products.title") ?? "Ürünler"}</CardTitle>
            <CardText>
              {safeT(t, "cards.products.desc") ??
                "Endüstriyel ekipman ve bileşenler."}
            </CardText>
          </Card>

          <Card as={Link} href={`/${locale}/spare-parts`}>
            <CardTitle>{safeT(t, "cards.spareparts.title") ?? "Yedek Parça"}</CardTitle>
            <CardText>
              {safeT(t, "cards.spareparts.desc") ??
                "Orijinal ve uyumlu yedek parça tedariki."}
            </CardText>
          </Card>

          <Card as={Link} href={`/${locale}/references`}>
            <CardTitle>{safeT(t, "cards.references.title") ?? "Referanslar"}</CardTitle>
            <CardText>
              {safeT(t, "cards.references.desc") ??
                "Tamamlanan projelerimizden örnekler."}
            </CardText>
          </Card>
        </Grid>
      </Section>

      <Section>
        <SectionTitle>{safeT(t, "sections.news.title") ?? "Güncel Haberler"}</SectionTitle>
        <Muted>
          {safeT(t, "sections.news.placeholder") ??
            "Yakında buraya haber ve duyurular eklenecek."}
        </Muted>
        <CTAInline href={`/${locale}/news`}>
          {safeT(tc, "cta.viewAll") ?? "Tümünü Gör"}
        </CTAInline>
      </Section>
    </Container>
  );
}

/* ---------------- helpers ---------------- */
function safeT(t: ReturnType<typeof useTranslations>, key: string) {
  try {
    const val = t(key);
    return typeof val === "string" ? val : undefined;
  } catch {
    return undefined;
  }
}

/* ---------------- styled ---------------- */
const Container = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 24px auto 48px;
  padding: 0 20px;
`;

const Hero = styled.section`
  background: ${({ theme }) => theme.colors.sectionBackground};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 28px 24px;
`;

const HeroTitle = styled.h1`
  margin: 6px 0 12px;
  font-size: ${({ theme }) => theme.fontSizes.h2};
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
`;

const HeroLead = styled.p`
  margin: 0 0 16px 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const Ctas = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const CTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radii.lg};
  font-weight: 600;
  border: 1px solid transparent;
  transition: background ${({ theme }) => theme.durations.fast} ease;

  &.primary {
    background: ${({ theme }) => theme.buttons.primary.background};
    color: ${({ theme }) => theme.buttons.primary.text};
  }
  &.primary:hover {
    background: ${({ theme }) => theme.buttons.primary.backgroundHover};
  }

  &.secondary {
    background: ${({ theme }) => theme.buttons.secondary.background};
    color: ${({ theme }) => theme.buttons.secondary.text};
  }
  &.secondary:hover {
    background: ${({ theme }) => theme.buttons.secondary.backgroundHover};
  }
`;

const Section = styled.section`
  margin: 28px 0 12px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 12px 0;
  font-size: ${({ theme }) => theme.fontSizes.h3};
  font-weight: 700;
  position: relative;
  color: ${({ theme }) => theme.colors.text};
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

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${({ theme }) => theme.media.desktop} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Card = styled.a`
  display: block;
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 16px;
  min-height: 120px;
  color: ${({ theme }) => theme.colors.textLight};
  text-decoration: none;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: transform ${({ theme }) => theme.durations.fast} ease,
    box-shadow ${({ theme }) => theme.durations.fast} ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const CardTitle = styled.h3`
  margin: 0 0 6px 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.title};
`;

const CardText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const CTAInline = styled(Link)`
  display: inline-block;
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.link};
  &:hover { text-decoration: underline; }
`;
