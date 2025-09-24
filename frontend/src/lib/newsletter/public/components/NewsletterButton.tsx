"use client";

import styled from "styled-components";
import { useState } from "react";
import { HiOutlineMailOpen } from "react-icons/hi";
import NewsletterModal from "./NewsletterModal";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/newsletter/locales";

export default function NewsletterButton() {
  const [open, setOpen] = useState(false);
  const { t } = useI18nNamespace("newsletter", translations);

  return (
    <>
      <Fab
        type="button"
        aria-label={t("buttonText")}
        title={t("buttonText")}
        onClick={() => setOpen(true)}
      >
        <IconWrap>
          <HiOutlineMailOpen />
        </IconWrap>
        <Label>{t("buttonText")}</Label>
      </Fab>

      {open && <NewsletterModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

const Fab = styled.button`
  position: fixed;
  top: 360px;
  right: 16px;
  z-index: ${({ theme }) => theme.zIndex.overlay};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacings.sm};
  height: 48px;
  width: 48px; /* başlangıç: ikon-only */
  padding: 0 14px;
  border: none;
  cursor: pointer;
  overflow: hidden;
  line-height: 0; /* ikon hizasını sabitle */

  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentText};
  border-radius: ${({ theme }) => theme.radii.pill};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  transition:
    width ${({ theme }) => theme.transition.normal},
    background ${({ theme }) => theme.transition.fast},
    box-shadow ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.fast};

  &:hover,
  &:focus-visible {
    width: 210px; /* hover’da yatay açılır */
    background: ${({ theme }) => theme.colors.accentHover};
    box-shadow: ${({ theme }) => theme.shadows.xl};
    outline: none;
  }

  &:active {
    transform: translateY(1px);
  }

  /* mobil: daima ikon-only ve tam merkez */
  ${({ theme }) => theme.media.mobile} {
    right: 8px;
    top: 198px;
    height: 44px;
    width: 44px;
    padding: 0;
    border-radius: ${({ theme }) => theme.radii.circle};

    display: inline-flex;
    align-items: center;
    justify-content: center; /* << yatay- dikey merkez */
    gap: 0;

    &:hover,
    &:focus-visible {
      width: 44px; /* genişleme yok */
    }
  }
`;

const IconWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;

  svg {
    width: 24px;
    height: 24px;
    display: block; /* baseline ofsetini engelle */
  }

  ${({ theme }) => theme.media.mobile} {
    width: 24px;
    height: 24px;
    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

const Label = styled.span`
  white-space: nowrap;
  opacity: 0;
  transform: translateX(8px);
  pointer-events: none;

  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  letter-spacing: 0.01em;
  font-family: ${({ theme }) => theme.fonts.body};

  transition:
    opacity ${({ theme }) => theme.transition.normal},
    transform ${({ theme }) => theme.transition.normal};

  ${Fab}:hover &,
  ${Fab}:focus-visible & {
    opacity: 1;
    transform: translateX(0);
  }

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;
