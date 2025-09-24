"use client";

import styled from "styled-components";
import Link from "next/link";
import translations from "@/modules/blog/locales";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { motion } from "framer-motion";
import { useAppSelector } from "@/store/hooks";
import { Skeleton, ErrorMessage, SeeAllBtn } from "@/shared";
import Image from "next/image";
import type { SupportedLocale } from "@/types/common";
import {
  getLocaleStringFromLang,
  getTitle,
  getSummary,
} from "@/types/common";

export default function BlogSection() {
  const { i18n, t } = useI18nNamespace("blog", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;

  const { blog, loading, error } = useAppSelector((state) => state.blog);

  if (loading) {
    return (
      <Section>
        <BlogGrid>
          <Left>
            <Skeleton />
            <Skeleton />
          </Left>
          <Right>
            <Skeleton />
            <Skeleton />
          </Right>
        </BlogGrid>
      </Section>
    );
  }

  if (error) {
    return (
      <Section>
        <BlogGrid>
          <ErrorMessage message={error} />
        </BlogGrid>
      </Section>
    );
  }

  if (!Array.isArray(blog) || blog.length === 0) {
    return (
      <Section>
        <BlogGrid>
          <Left>
            <MainTitle>{t("page.blog.title", "Bizden Haberler")}</MainTitle>
            <Desc>{t("page.blog.noBlog", "Haber bulunamadı.")}</Desc>
            <SeeAllBtn href="/blog">
              {t("page.blog.all", "Tüm Haberler")}
            </SeeAllBtn>
          </Left>
        </BlogGrid>
      </Section>
    );
  }

  // Ana haber ve diğerleri
  const main = blog[0];
  const others = blog.slice(1, 4); // 3 küçük kart göster

  return (
    <Section
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.66 }}
      viewport={{ once: true }}
    >
      <BlogGrid>
        {/* SOL BLOK */}
        <Left>
          <MinorTitle>{t("page.blog.minorTitle", "NEWS")}</MinorTitle>
          <StyledLink
            href={`/blog/${main.slug}`}
            aria-label={getTitle(main, lang) || "Untitled"}
          >
            {getTitle(main, lang) || t("page.blog.title", "Bizden Haberler")}
          </StyledLink>
          <Desc>
            {getSummary(main, lang) || "—"}
          </Desc>
          {/* Ana görsel aşağıda */}
          <MainImageWrap as={Link} href={`/blog/${main.slug}`}>
            {main.images?.[0]?.url ? (
              <MainImage
                src={main.images[0].url}
                alt={getTitle(main, lang) || "Untitled"}
                width={500}
                height={210}
                style={{ objectFit: "cover" }}
                priority
              />
            ) : (
              <ImgPlaceholder />
            )}
          </MainImageWrap>
          <SeeAllBtn href="/blog">
            {t("page.blog.all", "Tüm Haberler")}
          </SeeAllBtn>
        </Left>

        {/* SAĞ BLOK - DİĞER HABERLER */}
        <Right>
          {others.map((item) => (
            <BlogCard key={item._id} as={motion.article}>
              <CardImageWrap as={Link} href={`/blog/${item.slug}`}>
                {item.images?.[0]?.url ? (
                  <CardImage
                    src={item.images[0].url}
                    alt={getTitle(item, lang)}
                    width={90}
                    height={56}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <ImgPlaceholder />
                )}
              </CardImageWrap>
              <CardBody>
                <CardTitle as={Link} href={`/blog/${item.slug}`}>
                  {getTitle(item, lang)}
                </CardTitle>
                <CardExcerpt>{getSummary(item, lang).slice(0, 72)}</CardExcerpt>
                <CardDate>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString(
                        getLocaleStringFromLang(lang),
                        { year: "numeric", month: "short", day: "2-digit" }
                      )
                    : ""}
                </CardDate>
              </CardBody>
            </BlogCard>
          ))}
        </Right>
      </BlogGrid>
    </Section>
  );
}

// --- STYLES ---

const Section = styled(motion.section)`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacings.xxxl} 0 ${({ theme }) => theme.spacings.xxl};
  width: 100%;
`;

const BlogGrid = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  display: flex;
  gap: ${({ theme }) => theme.spacings.xl};
  align-items: flex-start;
  padding: 0 ${({ theme }) => theme.spacings.xl};
  flex-wrap: wrap;

  ${({ theme }) => theme.media.medium} {
    padding: 0 ${({ theme }) => theme.spacings.md};
    gap: ${({ theme }) => theme.spacings.lg};
  }
  ${({ theme }) => theme.media.small} {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacings.xl};
    padding: 0 ${({ theme }) => theme.spacings.sm};
    align-items: center;
  }
`;

const Left = styled.div`
  flex: 1.2 1 390px;
  min-width: 320px;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.12rem;
  justify-content: flex-start;
  ${({ theme }) => theme.media.small} {
    max-width: 100%;
    align-items: center;
    text-align: center;
    gap: 2rem;
  }
`;

const MinorTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const MainTitle = styled.h2`
  font-size: clamp(2.2rem, 3.3vw, 2.7rem);
  color: ${({ theme }) => theme.colors.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.extraBold};
  margin: 0 0 0.45em 0;
  letter-spacing: -0.01em;
  line-height: 1.13;
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(2.2rem, 3.3vw, 2.7rem);
  font-weight: ${({ theme }) => theme.fontWeights.extraBold};
  letter-spacing: -0.01em;
  line-height: 1.13;
  text-decoration: none;
  margin: 0 0 0.45em 0;
  display: inline-block;
  transition: color 0.2s;
  &:hover, &:focus-visible {
    color: ${({ theme }) => theme.colors.accent};
    text-decoration: underline;
  }
`;

const Desc = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: 1.7;
  margin-bottom: 0.7rem;
`;

const MainImageWrap = styled(Link)`
  width: 100%;
  max-width: 520px;
  min-height: 190px;
  max-height: 270px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  overflow: hidden;
  box-shadow: 0 8px 30px 0 rgba(40,117,194,0.16), ${({ theme }) => theme.shadows.lg};
  margin-bottom: 1.2rem;
  position: relative;
  isolation: isolate;
  cursor: pointer;
  display: block;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(120deg, rgba(40,117,194,0.07) 12%, rgba(11,182,214,0.06) 100%);
    z-index: 1;
  }

  &:hover, &:focus-visible {
    box-shadow: 0 12px 38px 0 rgba(40,117,194,0.25), ${({ theme }) => theme.shadows.xl};
    transform: scale(1.025);
  }

  ${({ theme }) => theme.media.small} {
    width: 100%;
    min-width: 140px;
    min-height: 110px;
    height: auto;
    margin: 0 auto 0.6rem auto;
  }
`;

const MainImage = styled(Image)`
  width: 100%;
  object-fit: cover;
  display: block;
  position: relative;
  z-index: 2;
`;

const ImgPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  min-height: 170px;
  background: ${({ theme }) => theme.colors.skeleton};
  opacity: 0.36;
`;

const Right = styled.div`
  flex: 1.1 1 320px;
  min-width: 270px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacings.md};

  ${({ theme }) => theme.media.small} {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    flex-direction: column;
    align-items: center;
    gap: ${({ theme }) => theme.spacings.sm};
  }
`;

const BlogCard = styled(motion.div)`
  width: 100%;
  background: ${({ theme }) => theme.cards.background};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  overflow: hidden;
  display: flex;
  flex-direction: row;
  min-height: 86px;
  max-width: 490px;
  border: 1px solid ${({ theme }) => theme.cards.border};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: box-shadow ${({ theme }) => theme.transition.normal}, transform ${({ theme }) => theme.transition.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.xl};
    transform: scale(1.024) translateY(-2px);
  }
`;

const CardImageWrap = styled(Link)`
  width: 100%;
  aspect-ratio: 200 / 116; 
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
`;



const CardImage = styled(Image)`
  width: auto;
  height: 100%;
  object-fit: cover;
  display: block;
`;


const CardBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md} ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.sm};
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacings.xs};
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardExcerpt = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacings.xs};
  opacity: 0.98;
  line-height: 1.37;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  min-height: 2em;
`;

const CardDate = styled.span`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.primary} 50%,
    ${({ theme }) => theme.colors.accent} 100%
  );
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.91em;
  padding: 0.13em 0.62em;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 600;
  box-shadow: 0 3px 8px 0 ${({ theme }) => theme.colors.shadowHighlight};
  letter-spacing: 0.01em;
  margin-top: auto;
  margin-right: 7px;
`;