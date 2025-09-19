"use client";

import styled from "styled-components";

type Props = {
  ariaLabel: string;
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevLabel: string;
  nextLabel: string;
  onChange: (p: number) => void;
};

export default function Pagination({
  ariaLabel, page, totalPages, hasPrev, hasNext, prevLabel, nextLabel, onChange
}: Props) {
  if (totalPages <= 1) return null;

  const clamp = (p: number) => Math.min(Math.max(1, p), totalPages);
  const go = (p: number) => () => onChange(clamp(p));

  const prevPage = clamp(page - 1);
  const nextPage = clamp(page + 1);

  return (
    <Nav aria-label={ariaLabel}>
      <Btn type="button" onClick={go(prevPage)} disabled={!hasPrev} aria-label={`${prevLabel}, ${prevPage}`}>
        ← {prevLabel}
      </Btn>

      <Pages>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          const active = p === page;
          return (
            <Page
              key={p}
              type="button"
              $active={active}
              onClick={!active ? go(p) : undefined}
              aria-current={active ? "page" : undefined}
              disabled={active}
              title={String(p)}
            >
              {p}
            </Page>
          );
        })}
      </Pages>

      <Btn type="button" onClick={go(nextPage)} disabled={!hasNext} aria-label={`${nextLabel}, ${nextPage}`}>
        {nextLabel} →
      </Btn>
    </Nav>
  );
}

const Nav = styled.nav`
  display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 18px;
`;
const Btn = styled.button`
  padding: 8px 12px; border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  &:disabled { opacity: .6; cursor: not-allowed; }
`;
const Pages = styled.div` display: flex; gap: 6px; `;
const Page = styled.button<{ $active?: boolean }>`
  padding: 8px 12px; border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderBright};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primaryTransparent : theme.colors.inputBackgroundLight};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  &:disabled { cursor: default; }
`;
