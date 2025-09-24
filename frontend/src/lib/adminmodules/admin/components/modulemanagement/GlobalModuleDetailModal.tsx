"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { XCircle, Pencil } from "lucide-react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";
import { SupportedLocale } from "@/types/common";
import { SUPPORTED_LOCALES } from "@/i18n";
import { EditGlobalModuleModal } from "@/modules/adminmodules";
import type { IModuleMeta } from "@/modules/adminmodules/types";

interface GlobalModuleDetailModalProps {
  module: IModuleMeta;
  onClose: () => void;
  onAfterAction?: () => void;
}

export default function GlobalModuleDetailModal({
  module,
  onClose,
  onAfterAction,
}: GlobalModuleDetailModalProps) {
  const { i18n, t } = useI18nNamespace("adminModules", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;

  const [isEditModalOpen, setEditModalOpen] = useState(false);

  // ESC ile kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Label (tercihen aktif dil, yoksa EN, yoksa name)
  const moduleLabel = useMemo(
    () =>
      module?.label?.[lang]?.trim() ||
      module?.label?.en?.trim() ||
      module?.name ||
      "",
    [module, lang]
  );

  // Versiyon geçmişi (son 5)
  const shownHistory = Array.isArray(module?.history)
    ? module.history.slice(-5)
    : [];
  const hasMoreHistory =
    Array.isArray(module?.history) && module.history.length > 5;

  // Bilgiler
  const rolesText = Array.isArray(module?.roles)
    ? module.roles.join(", ")
    : "";
  const routesCount = Array.isArray(module?.routes) ? module.routes.length : 0;

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    onAfterAction?.();
  };

  return (
    <>
      <Overlay>
        <Modal role="dialog" aria-modal="true" aria-labelledby="global-module-title">
          <Header>
            <Title id="global-module-title">
              {moduleLabel}
              <ModuleName>({module?.name})</ModuleName>
            </Title>
            <ButtonGroup>
              <EditButton
                type="button"
                onClick={() => setEditModalOpen(true)}
                aria-label={t("edit", "Edit")}
                title={t("edit", "Edit")}
              >
                <Pencil size={18} />
              </EditButton>
              <CloseButton
                type="button"
                onClick={onClose}
                aria-label={t("close", "Close")}
                title={t("close", "Close")}
              >
                <XCircle size={18} />
              </CloseButton>
            </ButtonGroup>
          </Header>

          <Content>
            {/* Genel Bilgiler */}
            <SectionTitle>{t("details", "Details")}</SectionTitle>
            <DetailGrid>
              <DetailRow>
                <dt>{t("icon", "Icon")}</dt>
                <dd>{module?.icon || <em>-</em>}</dd>
              </DetailRow>
              <DetailRow>
                <dt>{t("roles", "Roles")}</dt>
                <dd>{rolesText || <em>-</em>}</dd>
              </DetailRow>
              <DetailRow>
                <dt>{t("language", "Language")}</dt>
                <dd>{module?.language?.toUpperCase?.() || <em>-</em>}</dd>
              </DetailRow>
              <DetailRow>
                <dt>{t("order", "Order")}</dt>
                <dd>{Number.isFinite(module?.order) ? module.order : <em>-</em>}</dd>
              </DetailRow>
              <DetailRow>
                <dt>{t("version", "Version")}</dt>
                <dd>{module?.version || <em>-</em>}</dd>
              </DetailRow>
              <DetailRow>
                <dt>{t("statsKey", "Stats Key")}</dt>
                <dd>{module?.statsKey || <em>-</em>}</dd>
              </DetailRow>
              <DetailRow>
                <dt>{t("routes", "Routes")}</dt>
                <dd>{routesCount}</dd>
              </DetailRow>
              <DetailRow>
                <dt>{t("enabled", "Enabled")}</dt>
                <dd>
                  <BoolDot $active={!!module.enabled} />
                  <span>{module.enabled ? t("yes", "Yes") : t("no", "No")}</span>
                </dd>
              </DetailRow>
            </DetailGrid>

            {/* Çoklu dil label gösterimi */}
            <SectionTitle>{t("labels", "Module Labels")}</SectionTitle>
            <LabelTable>
              <tbody>
                {SUPPORTED_LOCALES.map((l) => (
                  <tr key={l}>
                    <th>{l.toUpperCase()}</th>
                    <td>{module.label?.[l] || <em>-</em>}</td>
                  </tr>
                ))}
              </tbody>
            </LabelTable>

            {/* Versiyon geçmişi */}
            {shownHistory.length > 0 && (
              <>
                <SectionTitle>{t("history", "Version History")}</SectionTitle>
                <HistoryList>
                  {shownHistory.map((h, i) => (
                    <HistoryItem key={i}>
                      <VersionLine>
                        <Version>
                          <strong>{h.version}</strong>
                        </Version>
                        <Author>{h.by || "-"}</Author>
                        <HistoryDate>
                          (
                          {h.date
                            ? new Date(h.date).toLocaleDateString(lang)
                            : "-"}
                          )
                        </HistoryDate>
                      </VersionLine>
                      {h.note && <NoteText>{h.note}</NoteText>}
                    </HistoryItem>
                  ))}
                  {hasMoreHistory && (
                    <HistoryItem>
                      <em style={{ opacity: 0.7 }}>
                        ...{t("andMore", "and more")}
                      </em>
                    </HistoryItem>
                  )}
                </HistoryList>
              </>
            )}
          </Content>
        </Modal>
      </Overlay>

      {/* Düzenleme Modalı */}
      {isEditModalOpen && (
        <EditGlobalModuleModal
          module={module}
          onClose={() => setEditModalOpen(false)}
          onAfterAction={handleEditSuccess}
        />
      )}
    </>
  );
}

/* --- styled --- */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 4vh 16px;
  overflow: auto; /* küçük ekranlar için */
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacings.lg};
  width: 100%;
  max-width: 720px;
  max-height: 92vh;            /* yükseklik sınırlı */
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  flex-direction: column;
  @media (max-width: 480px) {
    padding: ${({ theme }) => theme.spacings.md};
  }
`;

const Header = styled.div`
  flex: 0 0 auto;
  margin-bottom: ${({ theme }) => theme.spacings.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin: 0;
`;

const ModuleName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: 7px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.xs};
`;

const EditButton = styled.button`
  background: ${({ theme }) => theme.colors.warning};
  color: ${({ theme }) => theme.colors.whiteColor};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transition.fast};
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`;

const CloseButton = styled.button`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.whiteColor};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transition.fast};
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`;

const Content = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;            /* içerik kaydırılabilir */
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.sm};
`;

const SectionTitle = styled.h4`
  margin-top: ${({ theme }) => theme.spacings.md};
  margin-bottom: ${({ theme }) => theme.spacings.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};
  border-bottom: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.spacings.xs};
`;

const DetailGrid = styled.dl`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: ${({ theme }) => theme.spacings.xs} ${({ theme }) => theme.spacings.md};
`;

const DetailRow = styled.div`
  display: contents;
  dt {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
  dd {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const LabelTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacings.md};
  th,
  td {
    padding: 6px 8px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    border: 1px solid ${({ theme }) => theme.colors.border};
  }
  th {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    text-align: left;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textSecondary};
    width: 80px;
  }
  td {
    background: ${({ theme }) => theme.cards.background};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const BoolDot = styled.span<{ $active: boolean }>`
  display: inline-block;
  width: 11px;
  height: 11px;
  margin-right: 6px;
  border-radius: 50%;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.success : theme.colors.danger};
  border: 1.5px solid #ddd;
  vertical-align: middle;
`;

const HistoryList = styled.ul`
  padding-left: ${({ theme }) => theme.spacings.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.md};
`;

const HistoryItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.xs};
`;

const VersionLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacings.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Version = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;

const Author = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

const NoteText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.85;
  padding-left: ${({ theme }) => theme.spacings.md};
  border-left: ${({ theme }) => theme.borders.thick} ${({ theme }) => theme.colors.primary};
`;

const HistoryDate = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  opacity: 0.7;
`;
