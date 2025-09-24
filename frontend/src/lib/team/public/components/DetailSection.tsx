"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import translations from "@/modules/team/locales";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import Link from "next/link";
import Image from "next/image";
import { Skeleton, ErrorMessage } from "@/shared";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearTeamMessages,
  fetchTeamBySlug,
  setSelectedTeam,
} from "@/modules/team/slice/teamSlice";
import { SupportedLocale } from "@/types/common";
import type { ITeam, ITeamImage } from "@/modules/team/types";

// Çok dilli alanı tek fonksiyondan getir
const getMultiLang = (
  field: Record<string, string> | undefined,
  lang: SupportedLocale
) =>
  field?.[lang] ||
  field?.en ||
  (field ? Object.values(field)[0] : "") ||
  "";

export default function TeamDetailSection() {
  const { i18n, t } = useI18nNamespace("team", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;
  const { slug } = useParams() as { slug: string };
  const dispatch = useAppDispatch();

  // Çeviri dosyası registration
  useEffect(() => {
    Object.entries(translations).forEach(([locale, resources]) => {
      if (!i18n.hasResourceBundle(locale, "team")) {
        i18n.addResourceBundle(locale, "team", resources, true, true);
      }
    });
  }, [i18n]);

  // --- Redux state
  const {
    selected: team,
    team: allTeam,
    loading,
    error,
  } = useAppSelector((state) => state.team);

  // Görsel galeri state
  const [mainIndex, setMainIndex] = useState(0);
  const images = team?.images || [];

  // Detay fetch & state temizleme
  useEffect(() => {
    if (Array.isArray(allTeam) && allTeam.length > 0) {
      const found = allTeam.find((item) => item.slug === slug);
      if (found) dispatch(setSelectedTeam(found));
      else dispatch(fetchTeamBySlug(slug));
    } else {
      dispatch(fetchTeamBySlug(slug));
    }
    setMainIndex(0);
    return () => {
      dispatch(clearTeamMessages());
    };
  }, [dispatch, allTeam, slug]);

  // Safety: Loading
  if (loading) return <Container><Skeleton /></Container>;
  if (error || !team) return <Container><ErrorMessage /></Container>;

  // Ana görsel/galeri
  const mainImage = images[mainIndex];

  // Diğer portfolyo (kısaca, sidebar yerine "Benzer Projeler" kutucuğu en alta)
  const otherTeam = (allTeam || []).filter((item: ITeam) => item.slug !== slug);

  return (
    <Container
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Başlık */}
      <Title>{getMultiLang(team.title, lang)}</Title>

      {/* Büyük görsel + Thumbnail galeri */}
      {mainImage?.url && (
        <ImageSection>
          <MainImageFrame>
            <StyledMainImage
              src={mainImage.url}
              alt={getMultiLang(team.title, lang)}
              width={820}
              height={450}
              loading="eager"
            />
          </MainImageFrame>
          {images.length > 1 && (
            <Gallery>
              {images.map((img: ITeamImage, i: number) => (
                <ThumbFrame
                  key={img.url + i}
                  $active={mainIndex === i}
                  onClick={() => setMainIndex(i)}
                  tabIndex={0}
                  aria-label={`Show image ${i + 1}`}
                >
                  <StyledThumbImage
                    src={img.url}
                    alt={`${getMultiLang(team.title, lang)} thumbnail ${i + 1}`}
                    width={140}
                    height={90}
                    $active={mainIndex === i}
                  />
                </ThumbFrame>
              ))}
            </Gallery>
          )}
        </ImageSection>
      )}

      {/* Özet (isteğe bağlı) */}
      {team.summary && getMultiLang(team.summary, lang) && (
        <SummaryBox>
          <ReactMarkdown>
            {getMultiLang(team.summary, lang)}
          </ReactMarkdown>
        </SummaryBox>
      )}

      {/* Ana içerik */}
      {team.content && getMultiLang(team.content, lang) && (
        <ContentBox>
          <ReactMarkdown>
            {getMultiLang(team.content, lang)}
          </ReactMarkdown>
        </ContentBox>
      )}

      {/* Benzer Projeler (isteğe bağlı, min.) */}
      {otherTeam?.length > 0 && (
        <OtherSection>
          <OtherTitle>{t("page.other", "Diğer Projeler")}</OtherTitle>
          <OtherGrid>
            {otherTeam.slice(0, 4).map((item: ITeam) => (
              <OtherCard key={item._id} as={motion.div} whileHover={{ y: -4, scale: 1.02 }}>
                <OtherImgWrap>
                  {item.images?.[0]?.url ? (
                    <OtherImg
                      src={item.images[0].url}
                      alt={getMultiLang(item.title, lang)}
                      width={60}
                      height={40}
                    />
                  ) : (
                    <OtherImgPlaceholder />
                  )}
                </OtherImgWrap>
                <OtherTitleMini>
                  <Link href={`/team/${item.slug}`}>
                    {getMultiLang(item.title, lang)}
                  </Link>
                </OtherTitleMini>
              </OtherCard>
            ))}
          </OtherGrid>
        </OtherSection>
      )}
    </Container>
  );
}

// --- STYLED COMPONENTS ---

const Container = styled(motion.section)`
  max-width: 900px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xxl} ${({ theme }) => theme.spacings.md};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  margin-bottom: ${({ theme }) => theme.spacings.lg};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const ImageSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings.xl};
`;

const MainImageFrame = styled.div`
  width: 100%;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  position: relative;
`;

const StyledMainImage = styled(Image)`
  width: 100% !important;
  height: auto !important;
  max-height: 100%;
  object-fit: contain !important;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  display: block;
`;


const Gallery = styled.div`
  margin-top: 1.1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

// Thumbnail galeri (contain!)
const ThumbFrame = styled.button<{ $active?: boolean }>`
  border: 2px solid ${({ $active, theme }) => ($active ? theme.colors.primary : "#e1e8ef")};
  background: ${({ theme, $active }) => $active ? theme.colors.primaryTransparent : theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
  width: 140px;
  height: 90px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.15s, border 0.16s;
  outline: none;
`;

const StyledThumbImage = styled(Image)<{ $active?: boolean }>`
  width: 100% !important;
  height: auto !important;
  object-fit: cover;
  display: block;
`;

const SummaryBox = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-left: 4px solid ${({ theme }) => theme.colors.accent};
  padding: ${({ theme }) => theme.spacings.xl} ${({ theme }) => theme.spacings.lg};
  margin-bottom: ${({ theme }) => theme.spacings.xl};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

const ContentBox = styled.div`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  padding: ${({ theme }) => theme.spacings.xl};
  margin-bottom: ${({ theme }) => theme.spacings.xl};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border-left: 5px solid ${({ theme }) => theme.colors.primary};
  line-height: 1.72;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text};

  h3 {
    margin-bottom: ${({ theme }) => theme.spacings.md};
    color: ${({ theme }) => theme.colors.primary};
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
  p, div {
    margin-bottom: ${({ theme }) => theme.spacings.sm};
  }
`;

const OtherSection = styled.div`
  margin-top: ${({ theme }) => theme.spacings.xxl};
  border-top: 1.5px solid ${({ theme }) => theme.colors.borderLight};
  padding-top: ${({ theme }) => theme.spacings.lg};
`;

const OtherTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.large};
  margin-bottom: ${({ theme }) => theme.spacings.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;

const OtherGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.15rem 1.6rem;
  margin-top: 0.7rem;
`;

const OtherCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.xs};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding: 0.95rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 1.05rem;
  transition: box-shadow 0.18s, border 0.18s, transform 0.13s;
  cursor: pointer;
  min-height: 64px;

  &:hover, &:focus-visible {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-3px) scale(1.02);
    z-index: 2;
  }
`;

// OtherGrid kartlar (minik görsel)
const OtherImgWrap = styled.div`
  flex-shrink: 0;
  width: 52px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OtherImg = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: contain !important;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
`;

const OtherImgPlaceholder = styled.div`
  width: 52px;
  height: 34px;
  background: ${({ theme }) => theme.colors.skeleton};
  opacity: 0.34;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const OtherTitleMini = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: ${({ theme }) => theme.colors.primary};

  a {
    color: inherit;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;
