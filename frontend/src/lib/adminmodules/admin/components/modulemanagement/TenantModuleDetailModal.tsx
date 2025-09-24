"use client";

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { XCircle, Pencil, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { translations } from "@/modules/adminmodules";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import type { SupportedLocale } from "@/types/common";
import type { IModuleSetting } from "@/modules/adminmodules/types";
import type { TranslatedLabel } from "@/types/common";
import { EditTenantModuleModal } from "@/modules/adminmodules";
import { SUPPORTED_LOCALES } from "@/i18n";

interface TenantModuleDetailModalProps {
  module: IModuleSetting;
  onClose: () => void;
  onAfterAction?: () => void;
  globalEnabled?: boolean;
}

const ensureTranslated = (obj?: Record<string, string> | TranslatedLabel): TranslatedLabel => {
  const out: Partial<TranslatedLabel> = {};
  for (const lng of SUPPORTED_LOCALES) {
    out[lng] = (obj && (obj as any)[lng]) || "";
  }
  return out as TranslatedLabel;
};

const TenantModuleDetailModal: React.FC<TenantModuleDetailModalProps> = ({
  module,
  onClose,
  onAfterAction,
  globalEnabled,
}) => {
  const { i18n, t } = useI18nNamespace("adminModules", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const tenantLabel = module.tenant || "-";
  const moduleName = module.module || "-";

  const isGloballyEnabled = typeof globalEnabled === "boolean" ? globalEnabled : true;
  const isActive = !!module.enabled && isGloballyEnabled;

  const hasSeo =
    !!module.seoOgImage || !!module.seoTitle || !!module.seoDescription || !!module.seoSummary;

  const ml = (obj?: Record<string, string> | TranslatedLabel, l?: string) =>
    (obj && l && (obj as any)[l]) || (obj && (obj as any).en) || "";

  // Edit modalına geçerken SEO alanlarını TranslatedLabel’a normalize et
  const moduleForEdit = useMemo(
    () =>
      ({
        ...module,
        seoTitle: ensureTranslated(module.seoTitle as any),
        seoDescription: ensureTranslated(module.seoDescription as any),
        seoSummary: ensureTranslated(module.seoSummary as any),
      }) as IModuleSetting & { name?: string },
    [module]
  );

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    onAfterAction?.();
  };

  return (
    <>
      <Overlay>
        <Modal role="dialog" aria-modal="true" aria-labelledby="tenant-module-title">
          <Header>
            <Title id="tenant-module-title">
              {moduleName}
              <TenantName>
                {" | "}
                <span style={{ color: "#0086E0" }}>{tenantLabel}</span>
              </TenantName>
            </Title>
            <ButtonGroup>
              <EditButton
                type="button"
                onClick={() => setEditModalOpen(true)}
                aria-label={t("edit", "Edit")}
                disabled={!isGloballyEnabled}
                title={
                  !isGloballyEnabled
                    ? t(
                        "globalDisabledWarn",
                        "Globally disabled. You can't edit tenant settings."
                      )
                    : undefined
                }
              >
                <Pencil size={18} />
              </EditButton>
              <CloseButton type="button" onClick={onClose} aria-label={t("close", "Close")}>
                <XCircle size={18} />
              </CloseButton>
            </ButtonGroup>
          </Header>

          <Content>
            {!isGloballyEnabled && (
              <WarnBox role="alert">
                <AlertTriangle size={16} style={{ marginRight: 6 }} />
                {t(
                  "globalDisabledWarn",
                  "This module is globally disabled. Tenant settings are ignored."
                )}
              </WarnBox>
            )}

            <DetailItem>
              <strong>{t("createdAt", "Created At")}:</strong>{" "}
              {module?.createdAt ? new Date(module.createdAt).toLocaleString(lang) : "-"}
            </DetailItem>
            <DetailItem>
              <strong>{t("updatedAt", "Updated At")}:</strong>{" "}
              {module?.updatedAt ? new Date(module.updatedAt).toLocaleString(lang) : "-"}
            </DetailItem>
            <DetailItem>
              <strong>{t("type", "Module Type")}:</strong> {t("tenant", "Tenant")}
            </DetailItem>
            <DetailItem>
              <strong>{t("enabled", "Enabled")}:</strong> <BoolDot $active={isActive} />
              <span>
                {isActive
                  ? t("yes", "Yes")
                  : !isGloballyEnabled
                  ? t("noGlobal", "No (global disabled)")
                  : t("no", "No")}
              </span>
            </DetailItem>

            {"visibleInSidebar" in module && (
              <DetailItem>
                <strong>{t("visibleInSidebar", "Show in Sidebar")}:</strong>{" "}
                <BoolDot $active={!!module.visibleInSidebar && isGloballyEnabled} />
                <span>
                  {module.visibleInSidebar && isGloballyEnabled ? t("yes", "Yes") : t("no", "No")}
                </span>
              </DetailItem>
            )}

            {"useAnalytics" in module && (
              <DetailItem>
                <strong>{t("useAnalytics", "Analytics")}:</strong>{" "}
                <BoolDot $active={!!module.useAnalytics && isGloballyEnabled} />
                <span>
                  {module.useAnalytics && isGloballyEnabled ? t("yes", "Yes") : t("no", "No")}
                </span>
              </DetailItem>
            )}

            {"showInDashboard" in module && (
              <DetailItem>
                <strong>{t("showInDashboard", "Dashboard")}:</strong>{" "}
                <BoolDot $active={!!module.showInDashboard && isGloballyEnabled} />
                <span>
                  {module.showInDashboard && isGloballyEnabled ? t("yes", "Yes") : t("no", "No")}
                </span>
              </DetailItem>
            )}

            <DetailItem>
              <strong>{t("roles", "Roles")}:</strong>{" "}
              {Array.isArray(module.roles) && module.roles.length ? module.roles.join(", ") : "-"}
            </DetailItem>

            {"order" in module && (
              <DetailItem>
                <strong>{t("order", "Order")}:</strong> {module.order ?? "-"}
              </DetailItem>
            )}

            {hasSeo && (
              <>
                <SectionTitle>{t("seoOverrides", "SEO Overrides")}</SectionTitle>

                {module.seoOgImage && (
                  <DetailItem>
                    <strong>{t("seoOgImage", "OG Image URL")}:</strong>{" "}
                    <a
                      href={module.seoOgImage}
                      target="_blank"
                      rel="noreferrer"
                      title={module.seoOgImage}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <LinkIcon size={14} /> {module.seoOgImage}
                    </a>
                  </DetailItem>
                )}

                <SeoList>
                  {SUPPORTED_LOCALES.map((l) => {
                    const anyForLang =
                      ml(module.seoTitle as any, l) ||
                      ml(module.seoDescription as any, l) ||
                      ml(module.seoSummary as any, l);
                    if (!anyForLang) return null;
                    return (
                      <SeoItem key={l}>
                        <LangBadge title={l.toUpperCase()}>{l.toUpperCase()}</LangBadge>
                        <SeoFields>
                          {!!ml(module.seoTitle as any, l) && (
                            <div>
                              <SmallLabel>{t("seoTitle", "SEO Title")}</SmallLabel>
                              <div className="value">{ml(module.seoTitle as any, l)}</div>
                            </div>
                          )}
                          {!!ml(module.seoDescription as any, l) && (
                            <div>
                              <SmallLabel>{t("seoDescription", "SEO Description")}</SmallLabel>
                              <div className="value">{ml(module.seoDescription as any, l)}</div>
                            </div>
                          )}
                          {!!ml(module.seoSummary as any, l) && (
                            <div>
                              <SmallLabel>{t("seoSummary", "SEO Summary")}</SmallLabel>
                              <div className="value">{ml(module.seoSummary as any, l)}</div>
                            </div>
                          )}
                        </SeoFields>
                      </SeoItem>
                    );
                  })}
                </SeoList>
              </>
            )}
          </Content>
        </Modal>
      </Overlay>

      {isEditModalOpen && (
        <EditTenantModuleModal
          module={moduleForEdit}
          onClose={() => setEditModalOpen(false)}
          onAfterAction={handleEditSuccess}
          globalEnabled={isGloballyEnabled}
        />
      )}
    </>
  );
};

export default TenantModuleDetailModal;

/* --- Styled --- */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacings.lg};
  max-width: 560px;
  width: 96%;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  max-height: 92vh;
  overflow-y: auto;
  @media (max-width: 480px) {
    padding: ${({ theme }) => theme.spacings.md};
  }
`;

const WarnBox = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.warning};
  color: #fff;
  font-size: 13px;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 7px 11px;
  margin-bottom: ${({ theme }) => theme.spacings.sm};
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin: 0;
`;

const TenantName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.info};
  margin-left: 8px;
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
  &:hover { opacity: ${({ theme }) => theme.opacity.hover}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const CloseButton = styled.button`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.whiteColor};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transition.fast};
  &:hover { opacity: ${({ theme }) => theme.opacity.hover}; }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.sm};
`;

const DetailItem = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
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

const SectionTitle = styled.h4`
  margin-top: ${({ theme }) => theme.spacings.lg};
  margin-bottom: ${({ theme }) => theme.spacings.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  border-bottom: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.spacings.xs};
`;

const SeoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.sm};
`;

const SeoItem = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: ${({ theme }) => theme.spacings.sm};
  align-items: start;
  padding: ${({ theme }) => theme.spacings.xs} 0;
  border-top: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  &:first-of-type { border-top: none; }
`;

const LangBadge = styled.div`
  grid-column: 1 / 2;
  align-self: center;
  justify-self: center;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.text};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;

const SeoFields = styled.div`
  grid-column: 2 / -1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  .value {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.cards.background};
    border-radius: ${({ theme }) => theme.radii.sm};
    padding: 6px 8px;
  }
`;

const SmallLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  opacity: 0.9;
`;
