"use client";
import React, { useId, useMemo } from "react";
import styled from "styled-components";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";
import { SupportedLocale, DATE_FORMATS } from "@/types/common";

interface DateRangeSelectorProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  dateFormat?: string; // sadece placeholder için (native date input kendi formatını kullanır)
  minDate?: Date;
  maxDate?: Date;
}

/** YYYY-MM-DD (local) – UTC kaymasını önlemek için TZ offset düşer */
function toLocalInputValue(d: Date | null | undefined): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return dt.toISOString().slice(0, 10);
}

/** input[type=date] → Date (local gün başlangıcı) */
function fromInputValue(v: string | null | undefined): Date | null {
  if (!v) return null;
  const parsed = new Date(`${v}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const maxOf = (a?: Date, b?: Date) =>
  !a ? b : !b ? a : a.getTime() > b.getTime() ? a : b;
const minOf = (a?: Date, b?: Date) =>
  !a ? b : !b ? a : a.getTime() < b.getTime() ? a : b;

export default function DateRangeSelector({
  startDate,
  endDate,
  onChange,
  dateFormat,
  minDate,
  maxDate,
}: DateRangeSelectorProps) {
  const { i18n, t } = useI18nNamespace("dashboard", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;
  const pickerId = useId();

  const placeholderFmt = dateFormat || DATE_FORMATS[lang] || "yyyy-MM-dd";

  const safeStart =
    startDate instanceof Date && !Number.isNaN(startDate.getTime())
      ? startDate
      : null;
  const safeEnd =
    endDate instanceof Date && !Number.isNaN(endDate.getTime())
      ? endDate
      : null;

  // karşılıklı kısıtları hesapla (memoize)
  const { startMin, startMax, endMin, endMax } = useMemo(() => {
    return {
      startMin: minDate,
      startMax: minOf(maxDate, safeEnd ?? undefined),
      endMin: maxOf(minDate, safeStart ?? undefined),
      endMax: maxDate,
    };
  }, [minDate, maxDate, safeStart, safeEnd]);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = fromInputValue(e.target.value);
    // end < start ise end'i start'a çek
    if (s && safeEnd && safeEnd.getTime() < s.getTime()) {
      onChange({ startDate: s, endDate: s });
    } else {
      onChange({ startDate: s, endDate: safeEnd });
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const eDate = fromInputValue(e.target.value);
    // end < start ise start'ı end'e çek
    if (eDate && safeStart && eDate.getTime() < safeStart.getTime()) {
      onChange({ startDate: eDate, endDate: eDate });
    } else {
      onChange({ startDate: safeStart, endDate: eDate });
    }
  };

  return (
    <Wrapper role="group" aria-labelledby={`${pickerId}-label`}>
      <Label id={`${pickerId}-label`}>
        {t("analytics.dateRange", "Tarih Aralığı")}
      </Label>
      <Row>
        <Input
          id={`${pickerId}-start`}
          type="date"
          value={toLocalInputValue(safeStart)}
          onChange={handleStartChange}
          min={startMin ? toLocalInputValue(startMin) : undefined}
          max={startMax ? toLocalInputValue(startMax) : undefined}
          aria-label={t("analytics.startDate", "Başlangıç")}
          placeholder={placeholderFmt}
        />
        <Dash aria-hidden>—</Dash>
        <Input
          id={`${pickerId}-end`}
          type="date"
          value={toLocalInputValue(safeEnd)}
          onChange={handleEndChange}
          min={endMin ? toLocalInputValue(endMin) : undefined}
          max={endMax ? toLocalInputValue(endMax) : undefined}
          aria-label={t("analytics.endDate", "Bitiş")}
          placeholder={placeholderFmt}
        />
      </Row>
    </Wrapper>
  );
}

/* styled */
const Wrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings.md};
`;
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacings.sm};
  flex-wrap: wrap;
`;
const Dash = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;
const Label = styled.label`
  display: inline-block;
  margin-bottom: ${({ theme }) => theme.spacings.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;
const Input = styled.input`
  padding: ${({ theme }) => theme.spacings.sm};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: ${({ theme }) => theme.borders.thin}
    ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  min-width: 180px;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}22;
  }
`;
