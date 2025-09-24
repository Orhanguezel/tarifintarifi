"use client";
import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import translations from "@/modules/blog/locales";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import Link from "next/link";
import Image from "next/image";
import { Skeleton, ErrorMessage } from "@/shared";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearBlogMessages,
  fetchBlogBySlug,
  setSelectedBlog,
} from "@/modules/blog/slice/blogSlice";
import { CommentForm, CommentList } from "@/modules/comment";
import type { IBlog } from "@/modules/blog";
import { SupportedLocale } from "@/types/common";
import { SocialLinks } from "@/modules/shared";
import Modal from "@/modules/home/public/components/Modal";
import BlogReactions from "./BlogReactions";

export default function BlogDetailSection() {
  const { i18n, t } = useI18nNamespace("blog", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;
  const { slug } = useParams() as { slug: string };
  const dispatch = useAppDispatch();

  Object.entries(translations).forEach(([locale, resources]) => {
    if (!i18n.hasResourceBundle(locale, "blog")) {
      i18n.addResourceBundle(locale, "blog", resources, true, true);
    }
  });

  const {
    selected: blog,
    blog: allBlog,
    loading,
    error,
  } = useAppSelector((state) => state.blog);

  const [mainIndex, setMainIndex] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const images = blog?.images || [];
  const totalImages = images.length;

  const goNext = useCallback(() => {
    setMainIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const goPrev = useCallback(() => {
    setMainIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const handleModalKey = useCallback(
    (e: KeyboardEvent) => {
      if (!openModal) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") setOpenModal(false);
    },
    [openModal, goNext, goPrev]
  );

  useEffect(() => {
    if (!openModal) return;
    window.addEventListener("keydown", handleModalKey);
    return () => window.removeEventListener("keydown", handleModalKey);
  }, [openModal, handleModalKey]);

  useEffect(() => {
    if (allBlog && allBlog.length > 0) {
      const found = allBlog.find((item: IBlog) => item.slug === slug);
      if (found) {
        dispatch(setSelectedBlog(found));
      } else {
        dispatch(fetchBlogBySlug(slug));
      }
    } else {
      dispatch(fetchBlogBySlug(slug));
    }
    setMainIndex(0);
    return () => {
      dispatch(clearBlogMessages());
    };
  }, [dispatch, allBlog, slug]);

  if (loading) {
    return (
      <Container>
        <Skeleton />
      </Container>
    );
  }

  if (error || !blog) {
    return (
      <Container>
        <ErrorMessage />
      </Container>
    );
  }

  function formatText(txt: string | undefined) {
    if (!txt) return "";
    return txt.replace(/\\n/g, "\n");
  }

  const mainImage = images[mainIndex];
  const otherBlog = allBlog.filter((item: IBlog) => item.slug !== slug);

  return (
    <Container
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Başlık */}
      <Title>{blog.title[lang]}</Title>

      {/* Büyük görsel + thumb */}
      {mainImage?.url && (
        <ImageSection>
         <MainImageFrame>
 <StyledMainImage
  src={mainImage.url}
  alt={blog.title[lang] || "Blog Title"}
  fill
  priority
  sizes="(max-width: 768px) 100vw, 950px"   // 👈 eklendi
  style={{ cursor: "zoom-in" }}
  onClick={() => setOpenModal(true)}
  tabIndex={0}
  role="button"
  aria-label={t("detail.openImage", "Büyüt")}
/>

</MainImageFrame>

          {openModal && (
            <Modal
              isOpen={openModal}
              onClose={() => setOpenModal(false)}
              onNext={totalImages > 1 ? goNext : undefined}
              onPrev={totalImages > 1 ? goPrev : undefined}
            >
              <div style={{ textAlign: "center", padding: 0 }}>
                <Image
                  src={mainImage.url}
                  alt={blog.title[lang] + "-big"}
                  width={1280}
                  height={720}
                  style={{
                    maxWidth: "94vw",
                    maxHeight: "80vh",
                    borderRadius: 14,
                    boxShadow: "0 6px 42px #2226",
                    background: "#111",
                    width: "auto",
                    height: "auto"
                  }}
                  sizes="(max-width: 800px) 90vw, 1280px"
                />
                <div style={{ marginTop: 10, color: "#666", fontSize: 16 }}>
                  {blog.title[lang]}
                </div>
              </div>
            </Modal>
          )}
          {images.length > 1 && (
            <Gallery>
              {images.map((img, i) => (
                <ThumbFrame
                  key={img.url + i}
                  $active={mainIndex === i}
                  onClick={() => setMainIndex(i)}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setMainIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                >
                  <StyledThumbImage
                    src={img.url}
                    alt={`${blog.title[lang]} thumbnail ${i + 1}`}
                    width={168}
                    height={96}
                    $active={mainIndex === i}
                  />
                </ThumbFrame>
              ))}
            </Gallery>
          )}
        </ImageSection>
      )}

      {/* Sosyal medya paylaşım */}
      <SocialShareBox>
        <ShareLabel>{t("page.share", "Paylaş")}:</ShareLabel>
        <SocialLinks />
      </SocialShareBox>

      {/* Özet */}
      {blog.summary && blog.summary[lang] && (
        <SummaryBox>
          <ReactMarkdown>
            {formatText(blog.summary[lang])}
          </ReactMarkdown>
        </SummaryBox>
      )}
 {/* Ana içerik */}
      {blog.content && blog.content[lang] && (
        <ContentBox>
          <ReactMarkdown>
            {formatText(blog.content[lang])}
          </ReactMarkdown>
        </ContentBox>
      )}

      {/* Reactions */}
      <BlogReactions blogId={blog._id} />

      {/* Diğer içerikler */}
      {otherBlog?.length > 0 && (
        <OtherSection>
          <OtherTitle>{t("page.other", "Diğer Bloglar")}</OtherTitle>
          <OtherGrid>
            {otherBlog.map((item: IBlog) => (
              <OtherCard key={item._id} as={motion.div} whileHover={{ y: -6, scale: 1.025 }}>
                <OtherImgWrap>
                  {item.images?.[0]?.url ? (
                    <OtherImg
                      src={item.images[0].url}
                      alt={item.title[lang] || "Blog Image"}
                      width={60}
                      height={40}
                    />
                  ) : (
                    <OtherImgPlaceholder />
                  )}
                </OtherImgWrap>
                <OtherTitleMini>
                  <Link href={`/blog/${item.slug}`}>
                    {item.title[lang] || "Blog Title"}
                  </Link>
                </OtherTitleMini>
              </OtherCard>
            ))}
          </OtherGrid>
        </OtherSection>
      )}

      <CommentForm contentId={blog._id} contentType="blog" />
      <CommentList contentId={blog._id} contentType="blog" />
    </Container>
  );
}

// --- Styled Components ---

const Container = styled(motion.section)`
  max-width: 950px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xxl} ${({ theme }) => theme.spacings.md};
  background: ${({ theme }) => theme.colors.sectionBackground};

  @media (max-width: 900px) {
    padding: ${({ theme }) => theme.spacings.xl} ${({ theme }) => theme.spacings.sm};
  }
  @media (max-width: 600px) {
    padding: ${({ theme }) => theme.spacings.xl} ${({ theme }) => theme.spacings.sm};
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  color: ${({ theme }) => theme.colors.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.extraBold};
  margin-bottom: ${({ theme }) => theme.spacings.xl};

  @media (max-width: 600px) {
    font-size: 1.35rem;
    margin-bottom: ${({ theme }) => theme.spacings.lg};
  }
`;

const ImageSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings.xl};

  @media (max-width: 600px) {
    margin-bottom: ${({ theme }) => theme.spacings.md};
  }
`;

const MainImageFrame = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
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
  max-width: 100%;
  height: auto;
  object-fit: contain !important;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  display: block;
`;


const Gallery = styled.div`
  margin-top: 1.05rem;
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: 0.45rem;
  }
`;

// Thumbnail (gallery) Image
const ThumbFrame = styled.button<{ $active?: boolean }>`
  border: 2px solid ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.borderLight};
  background: ${({ theme, $active }) => $active ? theme.colors.primaryTransparent : theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
  width: 88px;
  height: 52px;
  aspect-ratio: 16/9;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border 0.15s, background 0.15s, box-shadow 0.14s;
  outline: none;
  box-shadow: ${({ $active, theme }) => $active ? theme.shadows.sm : "none"};

  &:hover, &:focus-visible {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 5px 18px 0 ${({ theme }) => theme.colors.primaryTransparent};
    background: ${({ theme }) => theme.colors.primaryTransparent};
  }
`;

const StyledThumbImage = styled(Image)<{ $active?: boolean }>`
  width: 100% !important;
  height: auto !important;
  object-fit: cover;
  display: block;
`;


const SocialShareBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7em;
  margin: 1.2em 0 2.1em 0;
`;

const ShareLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.88;
`;

const SummaryBox = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-left: 5px solid ${({ theme }) => theme.colors.accent};
  padding: ${({ theme }) => theme.spacings.xl} ${({ theme }) => theme.spacings.lg};
  margin-bottom: ${({ theme }) => theme.spacings.xl};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.xs};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.medium};

  @media (max-width: 600px) {
    padding: ${({ theme }) => theme.spacings.md};
    font-size: ${({ theme }) => theme.fontSizes.small};
  }
`;

const ContentBox = styled.div`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  padding: ${({ theme }) => theme.spacings.xl};
  margin-bottom: ${({ theme }) => theme.spacings.xl};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border-left: 6px solid ${({ theme }) => theme.colors.primary};
  line-height: ${({ theme }) => theme.lineHeights.loose};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text};
  letter-spacing: 0.01em;

  h2, h3 {
    margin-bottom: ${({ theme }) => theme.spacings.md};
    color: ${({ theme }) => theme.colors.primary};
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }
  p, div {
    margin-bottom: ${({ theme }) => theme.spacings.sm};
    font-family: ${({ theme }) => theme.fonts.body};
  }

  @media (max-width: 600px) {
    padding: ${({ theme }) => theme.spacings.sm};
    font-size: ${({ theme }) => theme.fontSizes.small};
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
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const OtherGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1.1rem 1.7rem;
  margin-top: 0.7rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }
`;

const OtherCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.xs};
  border: 1.2px solid ${({ theme }) => theme.colors.borderLight};
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1.1rem;
  transition: box-shadow 0.18s, border 0.18s, transform 0.16s;
  cursor: pointer;
  min-height: 62px;

  &:hover, &:focus-visible {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-5px) scale(1.035);
    z-index: 2;
  }
`;

const OtherImgWrap = styled.div`
  flex-shrink: 0;
  width: 54px;
  height: 36px;
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
  object-fit: contain;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const OtherImgPlaceholder = styled.div`
  width: 54px;
  height: 36px;
  background: ${({ theme }) => theme.colors.skeleton};
  opacity: 0.33;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const OtherTitleMini = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: ${({ theme }) => theme.colors.primary};

  a {
    color: inherit;
    text-decoration: none;
    &:hover, &:focus {
      text-decoration: underline;
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`;
