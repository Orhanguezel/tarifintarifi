"use client";
import React from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { cleanupOrphanModuleSettings } from "@/modules/adminmodules/slices/moduleMaintenanceSlice";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";

const BatchCleanupOrphanSettings: React.FC = () => {
  const { t } = useI18nNamespace("adminModules", translations);
  const dispatch = useAppDispatch();
  const { maintenanceLoading, orphans = [], deletedCount = 0, successMessage } =
    useAppSelector((s) => s.moduleMaintenance);

  const handleCleanup = async () => {
    try {
      await dispatch(cleanupOrphanModuleSettings()).unwrap();
    } catch {
      /* slice zaten hata toast’lıyor */
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(orphans, null, 2));
    } catch {
      /* noop */
    }
  };

  const hasOrphans = Array.isArray(orphans) && orphans.length > 0;

  return (
    <PanelCard>
      <Title>{t("cleanupOrphan", "Cleanup Orphan Settings")}</Title>

      <SummaryRow>
        <Pill>
          {t("found", "Found")}: <b>{orphans?.length ?? 0}</b>
        </Pill>
        <Pill>
          {t("deleted", "Deleted")}: <b>{deletedCount}</b>
        </Pill>
        {successMessage && <SmallNote>{successMessage}</SmallNote>}
      </SummaryRow>

      <ActionRow>
        <CleanupButton
          type="button"
          onClick={handleCleanup}
          disabled={maintenanceLoading}
          aria-busy={maintenanceLoading}
        >
          {maintenanceLoading
            ? t("cleaning", "Cleaning...")
            : t("cleanupNow", "Cleanup Now")}
        </CleanupButton>

        {hasOrphans && (
          <SecondaryButton type="button" onClick={handleCopy}>
            {t("copyJson", "Copy JSON")}
          </SecondaryButton>
        )}
      </ActionRow>

      {hasOrphans && (
        <OrphanBox>
          <b>{t("orphans", "Orphan Settings")}:</b>
          <pre>{JSON.stringify(orphans, null, 2)}</pre>
        </OrphanBox>
      )}
    </PanelCard>
  );
};

export default BatchCleanupOrphanSettings;

/* --- Styled Components --- */
const PanelCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 22px 22px 16px 22px;
  min-width: 270px;
  flex: 1 1 270px;
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 1.08em;
  color: ${({ theme }) => theme.colors.text};
`;

const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Pill = styled.span`
  background: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
`;

const SmallNote = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CleanupButton = styled.button`
  background: ${({ theme }) => theme.colors.warning};
  color: #222;
  border: none;
  border-radius: 7px;
  padding: 8px 16px;
  font-size: 0.98em;
  font-weight: 600;
  cursor: pointer;
  min-width: 160px;
  transition: background 0.13s;
  &:hover,
  &:focus {
    background: ${({ theme }) => theme.colors.warningHover || "#ffd042"};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  background: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  border-radius: 7px;
  padding: 8px 14px;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.13s;
  &:hover,
  &:focus {
    opacity: 0.9;
  }
`;

const OrphanBox = styled.div`
  background: ${({ theme }) => theme.cards?.background || "#fffbe6"};
  border: 1px solid ${({ theme }) => theme.colors.border || "#ffe58f"};
  padding: 13px 12px;
  margin-top: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  border-radius: 7px;
  max-height: 260px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Fira Mono",
    "Courier New", monospace;

  pre {
    margin: 8px 0 0 0;
    white-space: pre;
  }
`;
