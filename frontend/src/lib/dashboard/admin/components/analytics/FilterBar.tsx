// src/modules/dashboard/admin/components/analytics/FilterBar.tsx
"use client";

import React, { useId, useMemo } from "react";
import styled from "styled-components";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";

export interface FilterBarProps {
  module: string;
  eventType: string;
  onChange: (filters: { module: string; eventType: string }) => void;
  availableModules: string[];
  availableEventTypes: string[];
}

function FilterBar({
  module,
  eventType,
  onChange,
  availableModules,
  availableEventTypes,
}: FilterBarProps) {
  const { t } = useI18nNamespace("dashboard", translations);
  const moduleSelectId = useId();
  const eventTypeSelectId = useId();

  const moduleOptions = useMemo(
    () =>
      Array.from(new Set((availableModules || []).filter(Boolean)))
        .map(String)
        .sort((a, b) => a.localeCompare(b)),
    [availableModules]
  );

  const eventTypeOptions = useMemo(
    () =>
      Array.from(new Set((availableEventTypes || []).filter(Boolean)))
        .map(String)
        .sort((a, b) => a.localeCompare(b)),
    [availableEventTypes]
  );

  return (
    <Wrapper>
      <Field>
        <Label htmlFor={moduleSelectId}>
          {t("analytics.moduleFilter", "Modül")}
        </Label>
        <Select
          id={moduleSelectId}
          value={module}
          onChange={(e) => onChange({ module: e.target.value, eventType })}
          aria-label={t("analytics.moduleFilter", "Modül")}
          disabled={moduleOptions.length === 0}
        >
          <option value="">{t("analytics.all", "Tümü")}</option>
          {moduleOptions.map((mod) => (
            <option key={mod} value={mod}>
              {t(`modules.${mod}`, mod)}
            </option>
          ))}
        </Select>
        {moduleOptions.length === 0 && (
          <Hint>{t("analytics.noModules", "Uygun modül yok")}</Hint>
        )}
      </Field>

      <Field>
        <Label htmlFor={eventTypeSelectId}>
          {t("analytics.eventTypeFilter", "Etkinlik Türü")}
        </Label>
        <Select
          id={eventTypeSelectId}
          value={eventType}
          onChange={(e) => onChange({ module, eventType: e.target.value })}
          aria-label={t("analytics.eventTypeFilter", "Etkinlik Türü")}
          disabled={eventTypeOptions.length === 0}
        >
          <option value="">{t("analytics.all", "Tümü")}</option>
          {eventTypeOptions.map((type) => (
            <option key={type} value={type}>
              {t(`events.${type}`, type)}
            </option>
          ))}
        </Select>
        {eventTypeOptions.length === 0 && (
          <Hint>{t("analytics.noEventTypes", "Uygun etkinlik türü yok")}</Hint>
        )}
      </Field>
    </Wrapper>
  );
}

export default React.memo(FilterBar);

/* styled */
const Wrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.md};
  margin-bottom: ${({ theme }) => theme.spacings.md};
  flex-wrap: wrap;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 180px;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: ${({ theme }) => theme.spacings.xs};
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacings.sm};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  outline: none;
  transition: ${({ theme }) => theme.transition.fast};
  appearance: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}22;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Hint = styled.small`
  margin-top: ${({ theme }) => theme.spacings.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;
