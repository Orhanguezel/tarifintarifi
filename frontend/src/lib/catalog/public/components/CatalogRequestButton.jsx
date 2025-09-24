"use client";

import styled from "styled-components";
import { useState } from "react";
import { HiOutlineDocumentText } from "react-icons/hi";
import CatalogRequestModal from "./CatalogRequestModal";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/catalog/locales";

export default function CatalogRequestButton() {
  const [open, setOpen] = useState(false);
  const { t } = useI18nNamespace("catalogRequest", translations);

  return (
    <>
      <Fab
        type="button"
        aria-label={t("buttonText")}
        title={t("buttonText")}
        onClick={() => setOpen(true)}
      >
        <IconWrap>
          <HiOutlineDocumentText />
        </IconWrap>
        <Label>{t("buttonText")}</Label>
      </Fab>

      {open && <CatalogRequestModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

const Fab = styled.button`
  position: fixed;
  top: 160px;
  right: 16px;
  z-index: ${({ theme }) => theme.zIndex.overlay};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacings.sm};
  height: 48px;
  width: 48px; /* başlangıç: sadece ikon */
  padding: 0 14px;
  border: none;
  cursor: pointer;
  overflow: hidden;
  line-height: 0; /* ikon hizasını garantiye al */

  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
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
    background: ${({ theme }) => theme.buttons.primary.backgroundHover};
    box-shadow: ${({ theme }) => theme.shadows.xl};
    outline: none;
  }

  &:active {
    transform: translateY(1px);
  }

  /* mobil: daima ikon-only ve TAM MERKEZ */
  ${({ theme }) => theme.media.mobile} {
    right: 8px;
    top: 114px;
    height: 44px;
    width: 44px;
    padding: 0;
    border-radius: ${({ theme }) => theme.radii.circle};

    display: inline-flex;
    align-items: center;
    justify-content: center;    /* << yatay tam merkez */
    gap: 0;                      /* tek öğe; boşluk yok */

    &:hover,
    &:focus-visible {
      width: 44px; /* genişlemesin */
    }
  }
`;

const IconWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px; /* desktop için sabit ikon alanı */
  height: 24px;

  svg {
    width: 24px;
    height: 24px;
    display: block; /* baseline ofsetini engelle */
  }

  ${({ theme }) => theme.media.mobile} {
    /* mobilde de kesin kare ve merkez */
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    margin: 0;
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
