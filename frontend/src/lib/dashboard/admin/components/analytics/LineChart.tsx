// src/modules/dashboard/admin/components/analytics/LineChart.tsx
"use client";

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import styled, { useTheme } from "styled-components";
import { useMemo } from "react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";
import { SupportedLocale, DATE_FORMATS } from "@/types/common";

/* ---------- Types ---------- */
export type TrendEntry = {
  _id: {
    year: number;
    month: number; // 1-12
    day: number;   // 1-31
  };
  total: number;
};

export interface AnalyticsLineChartProps {
  data: TrendEntry[];
  height?: number; // opsiyonel: default 300
}

/* ---------- Utils ---------- */
function formatDate(entry: TrendEntry, lang: SupportedLocale): string {
  const { year, month, day } = entry._id;
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  const yyyy = String(year);

  const fmt = DATE_FORMATS[lang] || "yyyy-MM-dd";
  switch (fmt) {
    case "yyyy-MM-dd":
      return `${yyyy}-${mm}-${dd}`;
    case "dd.MM.yyyy":
      return `${dd}.${mm}.${yyyy}`;
    case "dd/MM/yyyy":
      return `${dd}/${mm}/${yyyy}`;
    default:
      return `${dd}.${mm}.${yyyy}`;
  }
}

/* ---------- Component ---------- */
function AnalyticsLineChart({ data, height = 300 }: AnalyticsLineChartProps) {
  const { t, i18n } = useI18nNamespace("dashboard", translations);
  const theme = useTheme();
  const lang = (i18n.language?.slice(0, 2) || "en") as SupportedLocale;

  // güvenli + sıralı veriyi tek seferde hazırla
  const chartData = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];

    // TrendEntry -> { ts, date, count }
    const mapped = arr.map((entry) => {
      const { year, month, day } = entry._id || ({} as any);
      // JS Date month 0-based
      const ts = new Date(
        Number(year) || 1970,
        Math.max(0, Math.min(11, (Number(month) || 1) - 1)),
        Math.max(1, Math.min(31, Number(day) || 1))
      ).getTime();

      return {
        ts,
        date: formatDate(entry, lang),
        count: Number.isFinite(entry.total) ? entry.total : 0,
      };
    });

    // tarihe göre artan sırala
    mapped.sort((a, b) => a.ts - b.ts);
    return mapped;
  }, [data, lang]);

  if (!chartData.length) {
    return <NoData>{t("noData", "Veri bulunamadı.")}</NoData>;
  }

  return (
    <ChartWrapper>
      <ResponsiveContainer width="100%" height={height}>
        <ReLineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 8 }}
          role="img"
          aria-label={t("analytics.trendChartLabel", "Günlük etkinlik trendi çizgi grafiği")}
        >
          <CartesianGrid stroke={theme.colors.border} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: theme.colors.textSecondary, fontSize: 12 }}
            axisLine={{ stroke: theme.colors.border }}
            tickLine={{ stroke: theme.colors.border }}
            label={{
              value: t("analytics.date", "Tarih"),
              position: "insideBottom",
              offset: -2,
              fill: theme.colors.textSecondary,
            }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: theme.colors.textSecondary, fontSize: 12 }}
            axisLine={{ stroke: theme.colors.border }}
            tickLine={{ stroke: theme.colors.border }}
            label={{
              value: t("analytics.total", "Toplam"),
              angle: -90,
              position: "insideLeft",
              fill: theme.colors.textSecondary,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.colors.cardBackground,
              border: `1px solid ${theme.colors.border}`,
              fontSize: "0.9rem",
              borderRadius: "8px",
            }}
            labelStyle={{ color: theme.colors.textPrimary, fontWeight: 500 }}
            itemStyle={{ color: theme.colors.primary }}
            formatter={(value: any) => [`${value}`, t("analytics.total", "Toplam")]}
            labelFormatter={(label: any) => `${t("analytics.date", "Tarih")}: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={theme.colors.primary}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

export default AnalyticsLineChart;

/* ---------- styled ---------- */
const ChartWrapper = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  padding: ${({ theme }) => theme.spacings.md};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.cards.shadow};
`;

const NoData = styled.div`
  margin: ${({ theme }) => theme.spacings.lg} 0;
  padding: ${({ theme }) => theme.spacings.md};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.md};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
`;
