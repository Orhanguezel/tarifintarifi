// shared/primitives.tsx
import styled from "styled-components";
import Link from "next/link";

/* ---------- Shell ---------- */
export const Wrap = styled.main`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: ${({ theme }) => theme.spacings.lg} auto ${({ theme }) => theme.spacings.xxxl};
  padding: 0 ${({ theme }) => theme.spacings.lg};

  ${({ theme }) => theme.media.small} {
    margin: ${({ theme }) => theme.spacings.md} auto ${({ theme }) => theme.spacings.xxl};
    padding: 0 ${({ theme }) => theme.spacings.md};
  }
`;

export const PageCard = styled.section`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: 20px 22px;

  ${({ theme }) => theme.media.small} {
    padding: 14px 12px;
    border-radius: ${({ theme }) => theme.radii.md};
  }
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.borderBright};
  margin: 14px 0 16px;

  ${({ theme }) => theme.media.small} {
    margin: 10px 0 12px;
  }
`;

/* ---------- Layout Grid ---------- */
export const ContentGrid = styled.section`
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr) clamp(260px, 28vw, 340px);
  align-items: start;

  ${({ theme }) => theme.media.medium} {
    grid-template-columns: minmax(0, 1fr) clamp(240px, 30vw, 320px);
    gap: 18px;
  }

  ${({ theme }) => theme.media.small} {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

export const Article = styled.article`
  padding: 2px;
  min-width: 0; /* prevent overflow in flex/grid */
`;

export const Aside = styled.aside`
  padding: 2px;
  position: sticky;
  top: 12px;

  ${({ theme }) => theme.media.small} {
    position: static;
  }
`;

/* ---------- Cards & Titles ---------- */
export const CardBox = styled.section`
  background: ${({ theme }) => theme.cards.background};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: 14px 16px;
  margin-bottom: 16px;

  ${({ theme }) => theme.media.small} {
    padding: 12px;
    border-radius: ${({ theme }) => theme.radii.md};
    margin-bottom: 12px;
  }
`;

export const SectionTitle = styled.h3`
  margin: 4px 0 10px;
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: ${({ theme }) => theme.colors.textAlt};
  font-weight: 700;
  position: relative;

  &:after {
    content: "";
    display: block;
    width: 48px;
    height: 3px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 2px;
    margin-top: 6px;
  }

  ${({ theme }) => theme.media.small} {
    margin: 2px 0 8px;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    &:after { width: 36px; height: 2px; }
  }
`;

export const AsideTitle = styled.h4`
  margin: 0 0 10px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textAlt};
  font-weight: 600;

  ${({ theme }) => theme.media.small} {
    margin: 0 0 8px;
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

/* ---------- Links ---------- */
export const ChipLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-decoration: none;
  transition: background ${({ theme }) => theme.transition.fast};

  &:hover { background: ${({ theme }) => theme.colors.inputBackgroundFocus}; }

  ${({ theme }) => theme.media.small} {
    padding: 5px 8px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

export const RelatedLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  &:hover { text-decoration: underline; color: ${({ theme }) => theme.colors.linkHover}; }
`;

/* ---------- Typographic ---------- */
export const H1 = styled.h1`
  margin: 6px 0 6px;
  font-size: ${({ theme }) => theme.fontSizes.h1};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 700;

  ${({ theme }) => theme.media.small} {
    margin: 4px 0 6px;
  }
`;

export const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 8px;

  ${({ theme }) => theme.media.small} {
    gap: 6px;
    margin: 6px 0 6px;
  }
`;

export const Badge = styled.span`
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 6px 10px;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  ${({ theme }) => theme.media.small} {
    padding: 5px 8px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

export const Desc = styled.p`
  margin: 4px 0 10px;
  color: ${({ theme }) => theme.colors.textLight};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};

  ${({ theme }) => theme.media.small} {
    margin: 2px 0 8px;
  }
`;

/* ---------- Tables ---------- */
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    vertical-align: top;
  }
  th { width: 50%; color: ${({ theme }) => theme.colors.textSecondary}; }
  tr:last-child td { border-bottom: none; }

  /* mobile scroll container */
  display: block;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;

  ${({ theme }) => theme.media.small} {
    th, td { padding: 8px 10px; font-size: ${({ theme }) => theme.fontSizes.xs}; }
  }
`;

/* ---------- Lists ---------- */
export const Ul = styled.ul`
  margin: 0 0 6px 18px;
  line-height: ${({ theme }) => theme.lineHeights.relaxed};

  ${({ theme }) => theme.media.small} { margin-left: 16px; }
`;
export const Ol = styled.ol`
  margin: 0 0 6px 20px;
  line-height: ${({ theme }) => theme.lineHeights.relaxed};

  ${({ theme }) => theme.media.small} { margin-left: 18px; }
`;
export const RelatedList = styled.ul`
  list-style: none;
  padding: 0; margin: 0;
  li+li { margin-top: 8px; }

  ${({ theme }) => theme.media.small} {
    li+li { margin-top: 6px; }
  }
`;
export const Icon = styled.span` font-size: 1em; line-height: 1; margin-right: 6px; `;

/* ---------- Top row / Breadcrumbs ---------- */
export const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-wrap: wrap;

  ${({ theme }) => theme.media.small} {
    gap: 8px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    margin-bottom: 6px;
  }
`;
export const Crumbs = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
  min-width: 0;

  ${({ theme }) => theme.media.small} {
    gap: 2px;
  }
`;
export const Crumb = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;
export const CrumbSep = styled.span` opacity: .6; `;
export const Current = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PrintLink = styled.button`
  text-decoration: none;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  appearance: none;
  background-clip: padding-box;

  ${({ theme }) => theme.media.small} {
    padding: 5px 8px;
  }
`;

/* ---------- Media (Hero) ---------- */
export const HeroImg = styled.img`
  width: 100%;
  height: auto;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  margin: 6px 0 10px;
  display: block;
  object-fit: cover;
  max-height: clamp(220px, 42vw, 360px);
  aspect-ratio: 16 / 9;

  ${({ theme }) => theme.media.small} {
    border-radius: ${({ theme }) => theme.radii.md};
    margin: 4px 0 8px;
  }
`;

/* ---------- Chips / Stars / Misc ---------- */
export const Row = styled.div`
  display: flex; gap: 8px; flex-wrap: wrap;

  ${({ theme }) => theme.media.small} { gap: 6px; }
`;

export const Chip = styled.span`
  display: inline-flex; align-items: center; gap: 6px;
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 6px 10px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  ${({ theme }) => theme.media.small} {
    padding: 5px 8px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

export const ChipBtn = styled.button<{ $active?: boolean }>`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  background: ${({ theme, $active }) => ($active ? theme.colors.backgroundSecondary : theme.colors.inputBackgroundLight)};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.fast};
  &:disabled { opacity: .6; cursor: default; }
  b { font-weight: 700; }

  ${({ theme }) => theme.media.small} {
    padding: 5px 8px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

export const Stars = styled.div`
  display: flex; gap: 2px; margin-left: 4px;
`;

export const Star = styled.button<{ $on?: boolean }>`
  border: none; background: transparent; cursor: pointer; font-size: 18px; line-height: 1;
  color: ${({ theme, $on }) => ($on ? theme.colors.primary : theme.colors.border)};
  &:disabled { opacity: .6; cursor: default; }

  ${({ theme }) => theme.media.small} { font-size: 16px; }
`;

export const Muted = styled.span` opacity: .8; margin-left: 2px; `;

export const Tags = styled.div`
  display: flex; gap: 8px; flex-wrap: wrap;

  ${({ theme }) => theme.media.small} { gap: 6px; }
`;

/* ---------- BadgePill for allergen/diet ---------- */
export const BadgePill = styled.span<{ "data-variant"?: "ok" | "warn" | "danger" | "neutral" }>`
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid
    ${({ theme, "data-variant": v }) =>
      v === "ok" ? "rgba(24,169,87,.35)" :
      v === "warn" ? "rgba(245,165,36,.35)" :
      v === "danger" ? "rgba(229,72,77,.35)" :
      theme.colors.borderBright};
  background:
    ${({ theme, "data-variant": v }) =>
      v === "ok" ? theme.colors.successBg :
      v === "warn" ? theme.colors.warningBackground :
      v === "danger" ? theme.colors.dangerBg :
      theme.colors.inputBackgroundLight};
  color:
    ${({ theme, "data-variant": v }) =>
      v === "ok" ? theme.colors.textOnSuccess :
      v === "danger" ? theme.colors.textOnDanger :
      theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};

  ${({ theme }) => theme.media.small} {
    padding: 5px 8px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

/* ---------- Note ---------- */
export const Note = styled.div`
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  ${({ theme }) => theme.media.small} {
    padding: 10px;
    border-radius: ${({ theme }) => theme.radii.md};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

export const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  ${({ theme }) => theme.media.small} { gap: 6px; }
`;

export const Stats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 4px;

  ${({ theme }) => theme.media.small} {
    gap: 10px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    margin-bottom: 2px;
  }
`;

export const StatItem = styled.span``;
