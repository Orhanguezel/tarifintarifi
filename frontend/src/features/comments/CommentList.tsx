"use client";

import styled from "styled-components";
import { useTranslations, useLocale } from "next-intl";
import { useListRecipeCommentsQuery } from "@/lib/comments/api";

function formatDate(s?: string, locale?: string) {
  if (!s) return "";
  try {
    const d = new Date(s);
    return d.toLocaleDateString(locale || undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s || "";
  }
}

export default function CommentList({ recipeId }: { recipeId: string }) {
  const t = useTranslations("comments");
  const locale = useLocale();

  const { data, isLoading } = useListRecipeCommentsQuery({ recipeId });
  const items = data?.data || [];

  if (isLoading) {
    return (
      <ListWrap>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </ListWrap>
    );
  }

  return (
    <ListWrap>
      {items.length === 0 ? (
        <Empty>
          <span>💬</span>
          <p>{t("emptyPrompt")}</p>
        </Empty>
      ) : (
        <Ul>
          {items.map((c, i) => {
            const name = c.name?.trim() || t("guest");
            return (
              <Li key={c._id} data-first={i === 0 || undefined}>
                <Head>
                  <Name>{name}</Name>
                  <Dot aria-hidden>•</Dot>
                  <Time>{formatDate(c.createdAt, locale)}</Time>
                </Head>
                <Body>{c.text}</Body>
              </Li>
            );
          })}
        </Ul>
      )}
    </ListWrap>
  );
}

/* ---------- styled ---------- */

const ListWrap = styled.div`
  margin-top: ${({ theme }) => theme.spacings.md};
`;

const Ul = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const Li = styled.li`
  padding: 14px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderBright};
  &[data-first] {
    border-top: 0;
    padding-top: 0;
  }
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.2;
`;

const Name = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const Dot = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Time = styled.time`
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Body = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.textLight};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const Empty = styled.div`
  display: grid;
  justify-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacings.sm};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacings.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  span { font-size: 1.4rem; }
  p { margin: 0; }
`;

const Skeleton = styled.div`
  height: 72px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.skeleton} 0%,
    ${({ theme }) => theme.colors.skeletonBackground} 50%,
    ${({ theme }) => theme.colors.skeleton} 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite ease;
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
