"use client";
import styled from "styled-components";

export const PageWrap = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xl};
`;
export const HeaderBar = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:${({ theme }) => theme.spacings.lg};
  ${({ theme }) => theme.media.mobile}{
    flex-direction:column; align-items:flex-start; gap:${({ theme }) => theme.spacings.sm};
  }
`;
export const Right = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.sm};
  align-items:center; flex-wrap:wrap;
`;
export const Counter = styled.span`
  padding:6px 10px; border-radius:${({ theme }) => theme.radii.pill};
  background:${({ theme }) => theme.colors.backgroundAlt};
  font-weight:${({ theme }) => theme.fontWeights.medium};
`;

export const Section = styled.section`
  margin-top:${({ theme }) => theme.spacings.xl};
`;
export const SectionHead = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:${({ theme }) => theme.spacings.sm};
`;
export const RowGap = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.sm};
`;
export const Card = styled.div`
  background:${({ theme }) => theme.colors.cardBackground};
  border-radius:${({ theme }) => theme.radii.lg};
  box-shadow:${({ theme }) => theme.cards.shadow};
  padding:${({ theme }) => theme.spacings.lg};
`;
export const SmallBtn = styled.button`
  background:${({ theme }) => theme.buttons.secondary.background};
  color:${({ theme }) => theme.buttons.secondary.text};
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  padding:6px 10px; border-radius:${({ theme }) => theme.radii.md};
  cursor:pointer;
`;
export const Muted = styled.div`
  color:${({ theme }) => theme.colors.textSecondary};
  font-size:${({ theme }) => theme.fontSizes.sm};
`;
