"use client";

import styled from "styled-components";
import { useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/team/locales";
import { Skeleton, ErrorMessage } from "@/shared";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import type { SupportedLocale } from "@/types/common";
import type { ITeam } from "@/modules/team/types";

export default function TeamPage() {
  const { i18n, t } = useI18nNamespace("team", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;
  const { team, loading, error } = useAppSelector((state) => state.team);

  // SSR hydration için
  Object.entries(translations).forEach(([lng, resources]) => {
    if (!i18n.hasResourceBundle(lng, "team")) {
      i18n.addResourceBundle(lng, "team", resources, true, true);
    }
  });

  // --- Loading ---
  if (loading) {
    return (
      <PageWrapper>
        <ListGrid>
          {[...Array(2)].map((_, i) => <Skeleton key={i} />)}
        </ListGrid>
      </PageWrapper>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <PageWrapper>
        <ErrorMessage message={error} />
      </PageWrapper>
    );
  }

  // --- Empty state ---
  if (!Array.isArray(team) || team.length === 0) {
    return (
      <PageWrapper>
        <NoTeam>{t("page.noTeam", "Hiç proje bulunamadı.")}</NoTeam>
      </PageWrapper>
    );
  }

  // --- Main ---
  return (
    <PageWrapper>
      <ListGrid>
        {[...team]
          .sort(
            (a, b) =>
              new Date(b.publishedAt || b.createdAt).getTime() -
              new Date(a.publishedAt || a.createdAt).getTime()
          )
          .map((item: ITeam) => (
            <TeamItem key={item._id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
              {item.images?.[0]?.url && (
                <MainImageWrap>
                  <RatioBox>
                    <StyledImage
                      src={item.images[0].url}
                      alt={item.title?.[lang] || "Team Image"}
                      fill
                      sizes="(max-width: 900px) 100vw, 780px"
                      priority={false}
                    />
                  </RatioBox>
                </MainImageWrap>
              )}
              <TeamTitle>
                <Link href={`/team/${item.slug}`}>
                  {item.title?.[lang] || "Untitled"}
                </Link>
              </TeamTitle>
              <TeamMeta>
                <span>
                  {new Date(item.publishedAt || item.createdAt).toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <span>
                    {item.tags.map((tag) => (
                      <CategoryLabel key={tag}>{tag}</CategoryLabel>
                    ))}
                  </span>
                )}
              </TeamMeta>
              <TeamSummary>
                {item.summary?.[lang] ||
                  (item.content?.[lang]
                    ? item.content?.[lang].substring(0, 180) + "..."
                    : "")}
              </TeamSummary>
              <ReadMoreBtn href={`/team/${item.slug}`}>
                {t("readMore", "Devamını Oku")}
              </ReadMoreBtn>
            </TeamItem>
          ))}
      </ListGrid>
    </PageWrapper>
  );
}

// --- Styled Components ---

const PageWrapper = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xxl} ${({ theme }) => theme.spacings.md};
  background: ${({ theme }) => theme.colors.sectionBackground};
  min-height: 90vh;
`;

const ListGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.xxl};
`;

const TeamItem = styled(motion.article)`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: ${({ theme }) => theme.spacings.xl} ${({ theme }) => theme.spacings.xl} ${({ theme }) => theme.spacings.lg} ${({ theme }) => theme.spacings.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.lg};
  margin-bottom: ${({ theme }) => theme.spacings.sm};

  ${({ theme }) => theme.media.mobile} {
    padding: ${({ theme }) => theme.spacings.md};
  }
`;

const MainImageWrap = styled.div`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacings.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

// --- Responsive aspect ratio box for image ---
const RatioBox = styled.div`
  position: relative;
  width: 100%;
  padding-top: 56.4%; /* 16:9 ratio. Adjust as needed */
  overflow: hidden;
`;

const StyledImage = styled(Image)`
  position: absolute !important;
  top: 0; left: 0; width: 100% !important; height: 100% !important;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radii.lg};
  display: block;
  background: ${({ theme }) => theme.colors.skeletonBackground};
`;

const TeamTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: 0.23rem;
  line-height: 1.18;
  font-family: ${({ theme }) => theme.fonts.heading};

  a {
    color: inherit;
    text-decoration: none;
    transition: color ${({ theme }) => theme.transition.fast};
    &:hover {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`;

const TeamMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  gap: ${({ theme }) => theme.spacings.lg};
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
`;

const CategoryLabel = styled.span`
  background: ${({ theme }) => theme.colors.primaryTransparent};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.9em;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 1px 8px;
  margin-left: 0.32em;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const TeamSummary = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin: 0.22em 0 1.22em 0;
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const ReadMoreBtn = styled(Link)`
  align-self: flex-start;
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  padding: 0.46em 1.35em;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  box-shadow: ${({ theme }) => theme.shadows.button};
  text-decoration: none;
  transition: background ${({ theme }) => theme.transition.normal}, color ${({ theme }) => theme.transition.fast}, transform ${({ theme }) => theme.transition.fast};

  &:hover, &:focus-visible {
    background: ${({ theme }) => theme.buttons.primary.backgroundHover};
    color: ${({ theme }) => theme.buttons.primary.textHover};
    transform: translateY(-2px) scale(1.04);
  }
`;

const NoTeam = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  padding: ${({ theme }) => theme.spacings.xl} 0 ${({ theme }) => theme.spacings.xxl} 0;
  opacity: 0.86;
  text-align: center;
`;

