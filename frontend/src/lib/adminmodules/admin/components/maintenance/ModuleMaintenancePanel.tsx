"use client";
import React from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  repairModuleSettings,
  assignAllModulesToTenant,
  cleanupOrphanModuleSettings,
  fetchModuleTenantMatrix,
} from "@/modules/adminmodules/slices/moduleMaintenanceSlice";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";

import {
  ModuleTenantMatrixTable,
  BatchUpdateModuleForm,
  BatchCleanupOrphanSettings,
  BatchAssignModuleForm,
  BatchDeleteModulesForm,
  BatchAddTenantsForm,
  ModuleJsonImportExportPanel,
  MaintenanceLogBox,
} from "@/modules/adminmodules";

interface ModuleMaintenancePanelProps {
  selectedTenant?: string;
}

const ModuleMaintenancePanel: React.FC<ModuleMaintenancePanelProps> = ({
  selectedTenant,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useI18nNamespace("adminModules", translations);
  const { maintenanceLoading, maintenanceError, lastAction } = useAppSelector(
    (state) => state.moduleMaintenance
  );

  const canAssignAllToTenant = Boolean(selectedTenant);

  return (
    <PanelContainer aria-busy={maintenanceLoading}>
      <SectionTitle>🛠 {t("maintenance", "Maintenance & Batch Actions")}</SectionTitle>

      <ButtonRow>
        <MaintButton
          onClick={() => dispatch(repairModuleSettings())}
          disabled={maintenanceLoading}
        >
          {t("repairSettings", "Repair Missing Settings")}
        </MaintButton>

        <MaintButton
          onClick={() =>
            canAssignAllToTenant && dispatch(assignAllModulesToTenant(selectedTenant!))
          }
          disabled={maintenanceLoading || !canAssignAllToTenant}
          title={
            !canAssignAllToTenant
              ? t("selectTenantHint", "Please select a tenant first")
              : undefined
          }
        >
          {t("assignAllToTenant", "Assign All To Tenant")}
        </MaintButton>

        <MaintButton
          onClick={() => dispatch(cleanupOrphanModuleSettings())}
          disabled={maintenanceLoading}
        >
          {t("cleanupOrphan", "Cleanup Orphan Settings")}
        </MaintButton>

        <MaintButton
          onClick={() => dispatch(fetchModuleTenantMatrix())}
          disabled={maintenanceLoading}
        >
          {t("fetchMatrix", "Fetch Module-Tenant Matrix")}
        </MaintButton>
      </ButtonRow>

      {(maintenanceError || maintenanceLoading || lastAction) && (
        <FeedbackArea>
          {maintenanceError && <ErrorBox role="alert">{maintenanceError}</ErrorBox>}
          {maintenanceLoading && <InfoBox>{t("loading", "Loading...")}</InfoBox>}
          {lastAction && (
            <SmallInfo>
              <b>{t("lastAction", "Last action")}:</b> {lastAction}
            </SmallInfo>
          )}
        </FeedbackArea>
      )}

      <CardSection>
        <MaintCard><BatchUpdateModuleForm /></MaintCard>
        <MaintCard><BatchCleanupOrphanSettings /></MaintCard>
        <MaintCard><BatchAssignModuleForm /></MaintCard>
        <MaintCard><BatchDeleteModulesForm /></MaintCard>
        <MaintCard><BatchAddTenantsForm /></MaintCard>
        <MaintCard><ModuleJsonImportExportPanel /></MaintCard>
      </CardSection>

      <LogSection>
        <MaintenanceLogBox />
        <ModuleTenantMatrixTable />
      </LogSection>
    </PanelContainer>
  );
};

export default ModuleMaintenancePanel;

/* ---- STYLED COMPONENTS (classicTheme uyumlu) ---- */

const PanelContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacings.lg};
  background: ${({ theme }) => theme.colors.sectionBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacings.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const SectionTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.title};
  margin: 0 0 ${({ theme }) => theme.spacings.md} 0;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacings.sm};
  margin-bottom: ${({ theme }) => theme.spacings.lg};
`;

const MaintButton = styled.button`
  background: ${({ theme }) => theme.buttons.primary.background};
  color: ${({ theme }) => theme.buttons.primary.text};
  padding: 10px 20px;
  border: ${({ theme }) => theme.borders.thin} transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  box-shadow: ${({ theme }) => theme.shadows.button};
  transition: background ${({ theme }) => theme.transition.fast},
    box-shadow ${({ theme }) => theme.transition.fast}, opacity ${({ theme }) =>
      theme.transition.fast};
  &:hover {
    background: ${({ theme }) => theme.buttons.primary.backgroundHover};
    box-shadow: ${({ theme }) => theme.shadows.md};
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  &:disabled {
    background: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
    opacity: ${({ theme }) => theme.opacity.disabled};
    box-shadow: none;
  }
`;

const CardSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.spacings.lg};
  margin: ${({ theme }) => theme.spacings.md} 0 ${({ theme }) => theme.spacings.lg};
`;

const MaintCard = styled.div`
  background: ${({ theme }) => theme.cards.background};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacings.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  display: flex;
  flex-direction: column;
  min-height: 100px;
`;

const FeedbackArea = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.xs};
`;

const ErrorBox = styled.div`
  color: ${({ theme }) => theme.colors.textOnDanger};
  background: ${({ theme }) => theme.colors.dangerBg};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;

const InfoBox = styled.div`
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.contentBackground};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
`;

const SmallInfo = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
`;

const LogSection = styled.div`
  margin-top: ${({ theme }) => theme.spacings.lg};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacings.lg};

  ${props => props.theme.media.small} {
    grid-template-columns: 1fr;
  }
`;
