"use client";
import styled from "styled-components";
import { useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/blog/locales";
import { Skeleton, ErrorMessage } from "@/shared";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import type { SupportedLocale } from "@/types/common";
import type { IBlog } from "@/modules/blog/types";
import { useState } from "react";

/* ✅ SEO: store’dan meta üretimi */
import SeoFromStore from "@/modules/seo/SeoFromStore";

// Arşiv (Ay/Yıl)
const getArchives = (blog: IBlog[]) => {
  if (!Array.isArray(blog)) return [];
  const archiveSet = new Set<string>();
  blog.forEach((n) => {
    const dt = n.publishedAt || n.createdAt;
    if (dt) {
      const d = new Date(dt);
      const label = d.toLocaleString("tr-TR", { year: "numeric", month: "long" });
      archiveSet.add(label);
    }
  });
  return Array.from(archiveSet);
};

// Kategori (çoklu dil destekli)
const getCategories = (blog: IBlog[], lang: SupportedLocale) => {
  if (!Array.isArray(blog)) return [];
  const cats: { [slug: string]: { _id?: string; name: string } } = {};
  blog.forEach((n) => {
    if (n.category) {
      if (typeof n.category === "string") {
        cats[n.category] = { name: n.category };
      } else if (typeof n.category === "object" && n.category.name) {
        cats[n.category._id || n.category.name[lang] || "-"] = {
          _id: n.category._id,
          name: n.category.name[lang] || n.category.name["en"] || "-",
        };
      }
    }
  });
  return Object.entries(cats).map(([slug, { _id, name }]) => ({ slug, _id, name }));
};

export default function BlogPage() {
  const { i18n, t } = useI18nNamespace("blog", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;
  const { blog, loading, error } = useAppSelector((state) => state.blog);
  const [search, setSearch] = useState("");

  Object.entries(translations).forEach(([lng, resources]) => {
    if (!i18n.hasResourceBundle(lng, "blog")) {
      i18n.addResourceBundle(lng, "blog", resources, true, true);
    }
  });

  const filteredBlog =
    blog && Array.isArray(blog)
      ? [...blog]
          .filter(
            (n) =>
              !search ||
              (n.title?.[lang] ?? "").toLowerCase().includes(search.toLowerCase())
          )
          .sort(
            (a, b) =>
              new Date(b.publishedAt || b.createdAt).getTime() -
              new Date(a.publishedAt || a.createdAt).getTime()
          )
      : [];

  const recentBlog = filteredBlog.slice(0, 4);
  const archives = getArchives(blog || []);
  const categories = getCategories(blog || [], lang);

  if (loading) {
    return (
      <>
        {/* ✅ SEO */}
        <SeoFromStore page="blog" locale={lang} />
        <PageWrapper>
          <MainGrid>
            <LeftColumn>
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} />
              ))}
            </LeftColumn>
            <RightColumn>
              <Skeleton />
            </RightColumn>
          </MainGrid>
        </PageWrapper>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* ✅ SEO */}
        <SeoFromStore page="blog" locale={lang} />
        <PageWrapper>
          <ErrorMessage message={error} />
        </PageWrapper>
      </>
    );
  }

  if (!blog || blog.length === 0) {
    return (
      <>
        {/* ✅ SEO */}
        <SeoFromStore page="blog" locale={lang} />
        <PageWrapper>
          <NoBlog>{t("page.noBlog", "Hiç blog bulunamadı.")}</NoBlog>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      {/* ✅ SEO */}
      <SeoFromStore page="blog" locale={lang} />
      <PageWrapper>
        <MainGrid>
          <LeftColumn>
            {filteredBlog.map((item: IBlog) => (
              <BlogItem key={item._id}>
                {item.images?.[0]?.url && (
                  <MainImageWrap>
                    <StyledImage
                      src={item.images[0].url}
                      alt={item.title?.[lang] || "Blog Image"}
                      width={800}
                      height={460}
                      loading="lazy"
                    />
                  </MainImageWrap>
                )}
                <BlogTitle>
                  <Link href={`/blog/${item.slug}`}>{item.title?.[lang] || "Untitled"}</Link>
                </BlogTitle>
                <BlogMeta>
                  <span>
                    {new Date(item.publishedAt || item.createdAt).toLocaleDateString("tr-TR", {
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
                </BlogMeta>
                <BlogSummary>
                  {item.summary?.[lang] || item.content?.[lang]?.substring(0, 180) + "..."}
                </BlogSummary>
                <ReadMoreBtn href={`/blog/${item.slug}`}>
                  {t("readMore", "Devamını Oku")}
                </ReadMoreBtn>
              </BlogItem>
            ))}
          </LeftColumn>

          <RightColumn>
            <SidebarBox>
              <SidebarTitle>{t("search", "Arama")}</SidebarTitle>
              <SearchForm onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  placeholder={t("search", "Arama")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </SearchForm>
            </SidebarBox>

            <SidebarBox>
              <SidebarTitle>{t("recent", "Son Bloglar")}</SidebarTitle>
              <SidebarList>
                {recentBlog.length ? (
                  recentBlog.map((n) => (
                    <li key={n._id}>
                      <Link href={`/blog/${n.slug}`}>{n.title?.[lang]}</Link>
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </SidebarList>
            </SidebarBox>

            <SidebarBox>
              <SidebarTitle>{t("archives", "Arşivler")}</SidebarTitle>
              <SidebarList>
                {archives.length ? archives.map((ar: string, i: number) => <li key={ar + i}>{ar}</li>) : <li>-</li>}
              </SidebarList>
            </SidebarBox>

            <SidebarBox>
              <SidebarTitle>{t("categories", "Kategoriler")}</SidebarTitle>
              <SidebarList>
                {categories.length ? categories.map((cat) => <li key={cat.slug}>{cat.name}</li>) : <li>-</li>}
              </SidebarList>
            </SidebarBox>
          </RightColumn>
        </MainGrid>
      </PageWrapper>
    </>
  );
}

// --- Styled Components ---

const PageWrapper = styled.div`
  width: 100%;
  min-height: 92vh;
  background: ${({ theme }) => theme.colors.sectionBackground};
  padding: ${({ theme }) => theme.spacings.xxl} ${({ theme }) => theme.spacings.md};
  box-sizing: border-box;

  ${({ theme }) => theme.media.small} {
    padding: ${({ theme }) => theme.spacings.lg} 0;
    
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 2.5rem;
  align-items: flex-start;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;

  ${({ theme }) => theme.media.medium} {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;

  ${({ theme }) => theme.media.small} {
    gap: 1.4rem;
  }
`;

const BlogItem = styled(motion.article)`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 2.1rem 2.3rem 1.5rem 2.3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 0.5rem;

  ${({ theme }) => theme.media.small} {
    padding: 0.6rem 0.3rem 1rem 0.3rem;
    border-radius: ${({ theme }) => theme.radii.md};
  }
`;

const MainImageWrap = styled.div`
  width: 100%;
  margin-bottom: 1.1rem;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.md};
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ theme }) => theme.media.small} {
    margin-bottom: 0.5rem;
    border-radius: ${({ theme }) => theme.radii.md};
  }
`;

const StyledImage = styled(Image)`
  width: 100% !important;
  max-width: 100vw !important;
  height: auto !important;
  object-fit: cover;
  display: block;
  border-radius: ${({ theme }) => theme.radii.lg};

  ${({ theme }) => theme.media.small} {
    border-radius: ${({ theme }) => theme.radii.md};
    max-width: 99vw !important;
    height: auto !important;
  }
`;

const BlogTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: 0.23rem;
  line-height: 1.18;

  a {
    color: inherit;
    text-decoration: none;
    transition: color 0.17s;
    &:hover {
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  ${({ theme }) => theme.media.small} {
    font-size: ${({ theme }) => theme.fontSizes.medium};
  }
`;

const BlogMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  gap: 1.05rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.18rem;
`;

const CategoryLabel = styled.span`
  background: ${({ theme }) => theme.colors.primaryTransparent};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.9em;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 1px 8px;
  margin-left: 0.32em;
  font-weight: 500;
`;

const BlogSummary = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.06rem;
  margin: 0.14em 0 1.05em 0;
  line-height: 1.62;
`;

const ReadMoreBtn = styled(Link)`
  align-self: flex-start;
  background: linear-gradient(90deg, #2875c2 60%, #0bb6d6 100%);
  color: #fff;
  padding: 0.46em 1.18em;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 1.01rem;
  font-weight: 600;
  box-shadow: 0 3px 10px 0 rgba(40,117,194,0.06);
  text-decoration: none;
  transition: background 0.2s, color 0.18s, transform 0.14s;
  &:hover, &:focus-visible {
    background: linear-gradient(90deg, #0bb6d6 0%, #2875c2 90%);
    color: #fff;
    transform: translateY(-2px) scale(1.04);
  }
`;

const RightColumn = styled.aside`
  position: sticky;
  top: 84px;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 260px;
  max-width: 380px;
  z-index: 30;
  height: fit-content;

  ${({ theme }) => theme.media.medium} {
    position: static !important;
    min-width: 0;
    max-width: 100%;
    gap: 1.2rem;
    z-index: 1;
    height: auto !important;
  }
`;

const SidebarBox = styled.div`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.3rem 1.3rem 1.4rem 1.3rem;
  margin-bottom: 0.4rem;
`;

const SidebarTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.medium};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  margin-bottom: 1rem;
  border-bottom: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.primaryTransparent};
  padding-bottom: 0.38rem;
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  input {
    flex: 1;
    padding: 0.37em 1em;
    border-radius: ${({ theme }) => theme.radii.md};
    border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
    font-size: 1em;
    color: ${({ theme }) => theme.colors.text};
    outline: none;
    background: ${({ theme }) => theme.colors.inputBackground};
    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
      background: #1b2838;
    }
  }
`;

const SidebarList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    margin-bottom: 0.61em;
    font-size: 1em;
    a {
      color: ${({ theme }) => theme.colors.text};
      text-decoration: none;
      transition: color 0.16s;
      &:hover {
        color: ${({ theme }) => theme.colors.primary};
      }
    }
  }
`;

const NoBlog = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.08rem;
  padding: 2.1rem 0 3rem 0;
  opacity: 0.86;
  text-align: center;
`;
