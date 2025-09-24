"use client";
import React from "react";
import styled from "styled-components";
import { useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";

// Backend ile hizalı tip
type ModuleTenantMatrix = Record<string, Record<string, boolean>>;

const ModuleTenantMatrixTable: React.FC = () => {
  const { t } = useI18nNamespace("adminModules", translations);

  // Not: RootState tipi hazırsa burayı tipe bağlayabilirsin.
  const { moduleTenantMatrix = {} as ModuleTenantMatrix } = useAppSelector(
    (s: any) => s.moduleMaintenance
  );

  const modules = Object.keys(moduleTenantMatrix || {}).sort();

  // Tüm modüllerin tenant’larını birleştir (bazı modüllerde eksik olabilir)
  const tenants = Array.from(
    new Set(
      modules.flatMap((m) => Object.keys(moduleTenantMatrix[m] || {}))
    )
  ).sort();

  if (!modules.length || !tenants.length) {
    return (
      <EmptyWrap>
        <EmptyTitle>{t("tenantMatrix.empty", "No module-tenant mapping data available.")}</EmptyTitle>
        <EmptyHint>
          {t("tenantMatrix.hint", "Use “Fetch Module-Tenant Matrix” to load the latest data.")}
        </EmptyHint>
      </EmptyWrap>
    );
    }

  return (
    <Wrap>
      <Legend>
        <LegendItem>
          <ActiveDot aria-hidden />
          <span>{t("matrix.assigned", "Assigned")}</span>
        </LegendItem>
        <LegendItem>
          <InactiveDot aria-hidden />
          <span>{t("matrix.notAssigned", "Not assigned")}</span>
        </LegendItem>
      </Legend>

      <TableContainer>
        <MatrixTable role="table">
          <caption className="sr-only">
            {t("matrix.caption", "Module to tenant assignment matrix")}
          </caption>
          <thead>
            <tr>
              <Th scope="col">{t("matrix.module", "Module")}</Th>
              {tenants.map((tenant) => (
                <Th key={tenant} scope="col">{tenant}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod}>
                <ModuleCell scope="row" title={mod}>{mod}</ModuleCell>
                {tenants.map((tenant) => {
                  const assigned = !!moduleTenantMatrix[mod]?.[tenant];
                  return (
                    <Td key={`${mod}:${tenant}`} aria-label={`${mod} → ${tenant}`}>
                      {assigned ? (
                        <ActiveDot title={t("matrix.assigned", "Assigned")} />
                      ) : (
                        <InactiveDot title={t("matrix.notAssigned", "Not assigned")} />
                      )}
                    </Td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </MatrixTable>
      </TableContainer>
    </Wrap>
  );
};

export default ModuleTenantMatrixTable;

/* --- styles (classicTheme uyumlu) --- */

const Wrap = styled.div`
  margin-top: ${({ theme }) => theme.spacings.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.sm};
`;

const Legend = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.md};
  align-items: center;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacings.xs};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.cards.background};
  box-shadow: ${({ theme }) => theme.cards.shadow};
`;

const MatrixTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead tr {
    background: ${({ theme }) => theme.colors.tableHeader};
  }
`;

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: center;
  padding: ${({ theme }) => theme.spacings.sm};
  border-bottom: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Td = styled.td`
  text-align: center;
  padding: ${({ theme }) => theme.spacings.sm};
  border-top: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-left: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  &:first-of-type {
    border-left: none;
  }
`;

const ModuleCell = styled.td.attrs({ as: "th" })`
  text-align: left;
  padding: ${({ theme }) => theme.spacings.sm};
  border-top: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  white-space: nowrap;
  position: sticky;
  left: 0;
`;

const ActiveDot = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  background: ${({ theme }) => theme.colors.success};
  border-radius: 50%;
  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

const InactiveDot = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  background: ${({ theme }) => theme.colors.inputBackgroundLight};
  border-radius: 50%;
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
`;

const EmptyWrap = styled.div`
  margin: ${({ theme }) => theme.spacings.md} 0;
  text-align: center;
  background: ${({ theme }) => theme.colors.contentBackground};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacings.lg};
`;

const EmptyTitle = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const EmptyHint = styled.div`
  margin-top: ${({ theme }) => theme.spacings.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
`;