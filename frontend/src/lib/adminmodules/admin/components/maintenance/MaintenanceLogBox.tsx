"use client";
import React from "react";
import styled from "styled-components";
import { useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";

// hooks'suz, dışarıda yardımcı
const safeStringify = (v: unknown) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

const MaintenanceLogBox: React.FC = () => {
  const { t } = useI18nNamespace("adminModules", translations);
  const {
    maintenanceLogs = [],
    repaired = [],
    deletedCount = 0,
    successMessage,
    maintenanceError,
  } = useAppSelector((s) => s.moduleMaintenance);

  const hasAnything =
    (maintenanceLogs && maintenanceLogs.length > 0) ||
    (repaired && repaired.length > 0) ||
    !!deletedCount ||
    !!successMessage ||
    !!maintenanceError;

  if (!hasAnything) return null;

  return (
    <Box role="region" aria-label={t("logs", "Logs / Results")}>
      {successMessage && <SuccessMsg>{successMessage}</SuccessMsg>}
      {maintenanceError && <ErrorMsg>{maintenanceError}</ErrorMsg>}

      {maintenanceLogs.length > 0 && (
        <Section>
          <Summary>
            <b>{t("logs", "Logs / Results")}</b> <Badge>{maintenanceLogs.length}</Badge>
          </Summary>
          <Pre>{safeStringify(maintenanceLogs)}</Pre>
        </Section>
      )}

      {repaired.length > 0 && (
        <Section>
          <Summary>
            <b>{t("repaired", "Repaired Settings")}</b> <Badge>{repaired.length}</Badge>
          </Summary>
          <Pre>{safeStringify(repaired)}</Pre>
        </Section>
      )}

      {deletedCount > 0 && (
        <Section>
          <Summary as="div">
            <b>
              {t("deletedCount", "Deleted Records")}: {deletedCount}
            </b>
          </Summary>
        </Section>
      )}
    </Box>
  );
};

export default MaintenanceLogBox;

/* --- styles --- */
const Box = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 14px;
  margin-top: 18px;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.sm};
`;

const Section = styled.details`
  background: ${({ theme }) => theme.cards.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 10px 12px;
  &[open] {
    box-shadow: ${({ theme }) => theme.shadows.xs};
  }
`;

const Summary = styled.summary`
  cursor: pointer;
  list-style: none;
  user-select: none;
  outline: none;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.text};
  &::-webkit-details-marker {
    display: none;
  }
  &:before {
    content: "▸";
    display: inline-block;
    margin-right: 6px;
    transform: rotate(0deg);
    transition: transform 0.15s ease;
  }
  ${Section}[open] &::before {
    transform: rotate(90deg);
  }
`;

const Badge = styled.span`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  padding: 1px 7px;
`;

const Pre = styled.pre`
  margin: 10px 0 0 0;
  padding: 10px;
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  max-height: 260px;
  overflow: auto;
  font-size: 12.5px;
  line-height: 1.45;
  font-family: "Fira Mono", ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, "Liberation Mono", "Courier New", monospace;
  white-space: pre;
`;

const SuccessMsg = styled.div`
  font-size: 13px;
  background: ${({ theme }) => theme.colors.success}22;
  color: ${({ theme }) => theme.colors.success};
  border: 1px solid ${({ theme }) => theme.colors.success}66;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const ErrorMsg = styled.div`
  font-size: 13px;
  background: ${({ theme }) => theme.colors.danger}14;
  color: ${({ theme }) => theme.colors.danger};
  border: 1px solid ${({ theme }) => theme.colors.danger}55;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
`;
