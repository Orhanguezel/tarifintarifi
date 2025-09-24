"use client";
import styled from "styled-components";
import { Button } from "@/shared";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "../../locales";

type SectionFilterBarProps = {
  search: string;
  setSearch: (v: string) => void;
  enabledFilter: "all" | "enabled" | "disabled";
  setEnabledFilter: (v: "all" | "enabled" | "disabled") => void;
};

export default function SectionFilterBar({
  search,
  setSearch,
  enabledFilter,
  setEnabledFilter,
}: SectionFilterBarProps) {
  const { t } = useI18nNamespace("section", translations);

  return (
    <Bar role="toolbar" aria-label={t("filters", "Filters")}>
      <SearchWrap>
        <Input
          aria-label={t("search", "Search")}
          placeholder={t("search", "Search...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchWrap>

      <Buttons>
        <Button
          size="sm"
          variant={enabledFilter === "all" ? "primary" : "outline"}
          onClick={() => setEnabledFilter("all")}
        >
          {t("all", "All")}
        </Button>
        <Button
          size="sm"
          variant={enabledFilter === "enabled" ? "primary" : "outline"}
          onClick={() => setEnabledFilter("enabled")}
        >
          {t("active", "Active")}
        </Button>
        <Button
          size="sm"
          variant={enabledFilter === "disabled" ? "primary" : "outline"}
          onClick={() => setEnabledFilter("disabled")}
        >
          {t("passive", "Passive")}
        </Button>
      </Buttons>
    </Bar>
  );
}

/* styled */
const Bar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  gap: ${({ theme }) => theme.spacings.sm};
  flex-wrap: wrap;
`;
const SearchWrap = styled.div`
  flex: 1 1 260px; min-width: 220px;
  ${({ theme }) => theme.media.small} { flex: 1 1 100%; min-width: 0; }
`;
const Buttons = styled.div`
  display: flex; gap: ${({ theme }) => theme.spacings.xs};
  ${({ theme }) => theme.media.small} {
    width: 100%;
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: ${({ theme }) => theme.spacings.xs};
  }
`;
const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: border 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryTransparent};
  }
`;
