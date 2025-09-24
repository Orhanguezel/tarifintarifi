"use client";
import styled from "styled-components";
import { useEffect } from "react";

type SnackbarProps = {
  message: string;
  type: "success" | "error" | "info";
  open: boolean;
  onClose: () => void;
};

export default function SectionSnackbar({ message, type, open, onClose }: SnackbarProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Snackbar
      $type={type}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      onClick={onClose}
      title="Click to dismiss"
    >
      {message}
    </Snackbar>
  );
}

/* styled */
const Snackbar = styled.div<{ $type: "success" | "error" | "info" }>`
  position: fixed;
  left: 50%; bottom: 2.25rem; transform: translateX(-50%);
  min-width: 220px; max-width: 94vw;
  padding: 0.9rem 1.2rem;
  border-radius: ${({ theme }) => theme.radii.lg};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $type, theme }) =>
    $type === "success" ? theme.colors.textOnSuccess :
    $type === "error" ? theme.colors.textOnDanger :
    theme.colors.info};
  background: ${({ $type, theme }) =>
    $type === "success" ? theme.colors.success :
    $type === "error" ? theme.colors.danger :
    theme.colors.info};
  box-shadow: ${({ theme }) => theme.shadows.md};
  z-index: ${({ theme }) => theme.zIndex.modal + 10};
  cursor: pointer;
  text-align: center;
  transition: transform .2s ease, opacity .2s ease;

  ${({ theme }) => theme.media.small} {
    padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
    font-size: ${({ theme }) => theme.fontSizes.xsmall};
    bottom: 1rem;
    border-radius: ${({ theme }) => theme.radii.md};
  }
`;
