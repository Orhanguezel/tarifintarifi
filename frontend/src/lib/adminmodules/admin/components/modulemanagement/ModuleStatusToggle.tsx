"use client";
import React, { memo } from "react";
import styled, { keyframes } from "styled-components";
import { Check, X } from "lucide-react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";

interface ModuleStatusToggleProps {
  isActive: boolean;
  onToggle: (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLButtonElement>
  ) => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
}

const ModuleStatusToggle: React.FC<ModuleStatusToggleProps> = ({
  isActive,
  onToggle,
  disabled = false,
  loading = false,
  title,
}) => {
  const { t } = useI18nNamespace("adminModules", translations);
  const label = isActive ? t("toggleActive", "Active") : t("toggleInactive", "Inactive");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!disabled && !loading) onToggle(e);
  };

  return (
    <ToggleButton
      type="button"
      onClick={handleClick}
      $active={isActive}
      aria-pressed={isActive}
      aria-busy={loading}
      aria-label={label}
      title={title ?? label}
      tabIndex={0}
      disabled={disabled || loading}
      data-loading={loading ? "true" : "false"}
    >
      {loading ? (
        <Spinner aria-hidden="true" />
      ) : isActive ? (
        <>
          <Check size={16} />
          <span className="label">{label}</span>
        </>
      ) : (
        <>
          <X size={16} />
          <span className="label">{label}</span>
        </>
      )}
    </ToggleButton>
  );
};

export default memo(ModuleStatusToggle);

// Spinner
const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: ${({ theme }) => theme.colors.whiteColor || "#fff"};
  border-radius: 50%;
  display: inline-block;
  animation: ${spin} 0.8s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// Button
const ToggleButton = styled.button<{ $active: boolean }>`
  background: ${({ theme, $active }) => ($active ? theme.colors.success : theme.colors.danger)};
  color: #fff;
  border: none;
  padding: 4px 10px 4px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  min-width: 68px;
  transition: background 0.16s, opacity 0.16s;
  .label {
    font-weight: 500;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    letter-spacing: 0.01em;
    user-select: none;
  }
  &:hover {
    opacity: ${({ disabled }) => (disabled ? 0.7 : 0.85)};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;
