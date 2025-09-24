"use client";

import React from "react";
import styled from "styled-components";

export interface StatCardProps {
  /** Parent i18n ile çevrilmiş label göndermeli */
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  highlight,
}) => (
  <Card $highlight={!!highlight} tabIndex={0} aria-label={label} role="group">
    {icon && <IconWrapper aria-hidden="true">{icon}</IconWrapper>}
    <Label>{label}</Label>
    <Value $highlight={!!highlight}>{String(value)}</Value>
  </Card>
);

export default StatCard;

/* styled */
const Card = styled.div<{ $highlight: boolean }>`
  background: ${({ theme, $highlight }) =>
    $highlight ? theme.colors.primary + "18" : theme.colors.cardBackground};
  border-radius: 1.2rem;
  padding: 1.5rem 1.2rem;
  text-align: center;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.07);
  border: ${({ $highlight, theme }) =>
    $highlight ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.borderLight}`};
  transition: background 0.22s, border 0.22s, box-shadow 0.22s;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary + "33"};
  }
`;

const IconWrapper = styled.div`
  font-size: 2.1rem;
  margin-bottom: 0.6rem;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Label = styled.div`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.3rem;
  font-weight: 500;
`;

const Value = styled.div<{ $highlight: boolean }>`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme, $highlight }) =>
    $highlight ? theme.colors.primary : theme.colors.textPrimary};
  letter-spacing: 0.5px;
  transition: color 0.15s;
`;
