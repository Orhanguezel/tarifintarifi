"use client";
import styled from "styled-components";
import { Button } from "@/shared";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "../../locales";

type SectionBulkActionsProps = {
  selected: string[];
  onDelete: (selected: string[]) => void;
  onEnable: (selected: string[]) => void;
  onDisable: (selected: string[]) => void;
};

export default function SectionBulkActions({
  selected,
  onDelete,
  onEnable,
  onDisable,
}: SectionBulkActionsProps) {
  const { t } = useI18nNamespace("section", translations);

  if (!selected.length) return null;

  return (
    <ActionsCard>
      <Row>
        <Info>
          {t("selectedCount", "Selected")}: <b>{selected.length}</b>
        </Info>
        <Btns>
          <Button variant="danger" size="sm" onClick={() => onDelete(selected)}>
            {t("deleteSelected", "Delete Selected")}
          </Button>
          <Button variant="primary" size="sm" onClick={() => onEnable(selected)}>
            {t("enableSelected", "Enable")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDisable(selected)}>
            {t("disableSelected", "Disable")}
          </Button>
        </Btns>
      </Row>
    </ActionsCard>
  );
}

const ActionsCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: ${({ theme }) => theme.spacings.md};
  margin-bottom: ${({ theme }) => theme.spacings.lg};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderBright};
`;
const Row = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: ${({ theme }) => theme.spacings.sm};
  ${({ theme }) => theme.media.small} {
    flex-direction: column; align-items: stretch;
  }
`;
const Info = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
const Btns = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.xs};
  ${({ theme }) => theme.media.small} {
    button { width: 100%; }
    display: grid; grid-template-columns: 1fr; gap: ${({ theme }) => theme.spacings.xs};
  }
`;
