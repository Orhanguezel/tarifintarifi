"use client";

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import { useMemo } from "react";
import styled, { useTheme } from "styled-components";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";

type AnyDict = Record<string, any>;
interface AnalyticsEvent extends AnyDict { module: string; }

interface Props {
  data?: AnalyticsEvent[];
  /** Grafikte gösterilecek maksimum bar sayısı (default: 12) */
  maxBars?: number;
  /** Bir bara tıklandığında çağrılır (module key gönderir) */
  onBarClick?: (moduleKey: string) => void;
}

/* ------ helpers ------ */
const normalize = (s: unknown) =>
  String(s ?? "").trim().toLowerCase();

const truncate = (s: string, n = 22) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

/* Özel YAxis tick: uzun etiketleri kısalt, <title> ile tamını göster */
const YAxisTick = (props: any) => {
  const { x, y, payload, fill, fontSize } = props;
  const value: string = payload?.value ?? "";
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill={fill} fontSize={fontSize}>
      <title>{value}</title>
      {truncate(value, 22)}
    </text>
  );
};

export default function BarChart({ data, maxBars = 12, onBarClick }: Props) {
  const { t } = useI18nNamespace("dashboard", translations);
  const theme = useTheme() as any;

  const colors = {
    border: theme?.colors?.borderLight || "#e5e7eb",
    grid: theme?.colors?.borderLight || "#e5e7eb",
    text: theme?.colors?.textSecondary || "#6b7280",
    textPrimary: theme?.colors?.textPrimary || "#111827",
    primary: theme?.colors?.primary || "#3b82f6",
    cardBg: theme?.colors?.cardBackground || "#fff",
  };

  // Güvenli veri + modül bazlı sayım + i18n label
  const chartData = useMemo(() => {
    const safe: AnalyticsEvent[] = Array.isArray(data) ? data : [];

    // normalize edilmiş key -> { count, keyOriginal }
    const acc = new Map<string, { count: number; keyOriginal: string }>();

    for (const ev of safe) {
      const raw = ev?.module ?? "";
      const norm = normalize(raw);
      if (!norm) continue;
      const curr = acc.get(norm) || { count: 0, keyOriginal: String(raw) };
      curr.count += 1;
      if (!acc.has(norm)) curr.keyOriginal = String(raw);
      acc.set(norm, curr);
    }

    const rows = Array.from(acc.entries()).map(([normKey, v]) => {
      const label = t(`modules.${v.keyOriginal}`, v.keyOriginal);
      return {
        moduleKey: v.keyOriginal, // dış olaylar/i18n için
        module: normKey,          // dahili kategori
        label,
        count: v.count,
      };
    });

    return rows.sort((a, b) => b.count - a.count).slice(0, maxBars);
  }, [data, maxBars, t]);

  if (chartData.length === 0) {
    return <EmptyInfo>{t("noData", "Veri bulunamadı.")}</EmptyInfo>;
  }

  const barStyle = onBarClick ? { cursor: "pointer" } : undefined;

  return (
    <ChartWrapper>
      <ResponsiveContainer width="100%" height={320}>
        <ReBarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 42, bottom: 10 }}
          aria-label={t("analytics.moduleDistribution", "Modül Bazlı Yoğunluk")}
        >
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, "dataMax"]}
            allowDecimals={false}
            tick={{ fill: colors.text, fontSize: 12 }}
            axisLine={{ stroke: colors.border }}
            label={{
              value: t("analytics.events", "Event Count"),
              position: "insideBottomRight",
              offset: -5,
              fill: colors.text,
              fontSize: 13,
            }}
          />
          <YAxis
            dataKey="label"
            type="category"
            width={160}
            tick={<YAxisTick fill={colors.text} fontSize={12} />}
            axisLine={{ stroke: colors.border }}
            label={{
              value: t("analytics.module", "Module"),
              position: "insideLeft",
              angle: -90,
              offset: 10,
              fill: colors.text,
              fontSize: 13,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: colors.textPrimary,
            }}
            formatter={(value: any) => [
              `${value}`,
              t("analytics.events", "Event Count"),
            ]}
            labelFormatter={(label: any) =>
              `${t("analytics.module", "Module")}: ${label}`
            }
          />
          <Bar
            dataKey="count"
            fill={colors.primary}
            radius={[0, 6, 6, 0]}
            onClick={(entry: any) => {
              if (!onBarClick) return;
              const modKey = entry?.payload?.moduleKey || entry?.payload?.module || "";
              if (modKey) onBarClick(modKey);
            }}
            style={barStyle}
          >
            <LabelList
              dataKey="count"
              position="right"
              style={{
                fill: colors.textPrimary,
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            />
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

/* styled */
const ChartWrapper = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  padding: ${({ theme }) => theme.spacings.md};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.cards.shadow};
`;

const EmptyInfo = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.05rem;
  text-align: center;
  padding: 2rem 0;
`;
