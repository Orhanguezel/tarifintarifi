// src/modules/dashboard/admin/components/DashboardCharts.tsx
"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { useDashboardModules } from "@/hooks/useDashboardModules";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";

type Dataset = { label: string; data: number[]; [k: string]: any };
type ChartData = { labels: string[]; datasets: Dataset[] } | null | undefined;

type Props = { data: ChartData };

export default function DashboardCharts({ data }: Props) {
  const { t, i18n } = useI18nNamespace("dashboard", translations);
  const { dashboardModules } = useDashboardModules({ activeOnly: true });

  const nf = useMemo(
    () => new Intl.NumberFormat(i18n.language || "en-US"),
    [i18n.language]
  );

  // Aktif modül etiketleri (mevcut dilde) + key/statsKey → normalize ederek Set'e koy
  const { activeLabels, activeKeys } = useMemo(() => {
    const labels = new Set<string>();
    const keys = new Set<string>();

    for (const m of dashboardModules) {
      if (m.label) labels.add(norm(m.label));
      if (m.key) keys.add(norm(m.key));
      if (m.meta?.statsKey) keys.add(norm(String(m.meta.statsKey)));
    }
    return { activeLabels: labels, activeKeys: keys };
  }, [dashboardModules]);

  // Yalnızca aktif modüllere denk gelen dataset'leri göster (normalize karşılaştırma)
  const filtered = useMemo(() => {
    const empty = { labels: [] as string[], datasets: [] as Dataset[] };
    if (!data || !Array.isArray(data.datasets)) return empty;

    const ds = data.datasets.filter((d) => {
      const lbl = norm(String(d?.label ?? ""));
      return activeLabels.has(lbl) || activeKeys.has(lbl);
    });

    return {
      labels: Array.isArray(data.labels) ? data.labels : [],
      datasets: ds,
    };
  }, [data, activeLabels, activeKeys]);

  if (!filtered.datasets.length) {
    return (
      <EmptyWrap role="status" aria-live="polite">
        <p>{t("charts.noSeries", "Gösterilecek seri bulunamadı.")}</p>
      </EmptyWrap>
    );
  }

  return (
    <Grid>
      {filtered.datasets.map((ds) => (
        <ChartCard key={ds.label} aria-label={ds.label} role="group">
          <Header>
            <Title>{ds.label}</Title>
            <Kpis>
              <Kpi>
                <small>{t("total", "Toplam")}</small>
                <strong>{nf.format(sum(ds.data))}</strong>
              </Kpi>
              <Kpi>
                <small>{t("last", "Son")}</small>
                <strong>
                  {last(ds.data) == null ? "—" : nf.format(last(ds.data)!)}
                </strong>
              </Kpi>
              <Kpi>
                <small>{t("max", "Maks")}</small>
                <strong>
                  {max(ds.data) == null ? "—" : nf.format(max(ds.data)!)}
                </strong>
              </Kpi>
            </Kpis>
          </Header>

          <Sparkline data={ds.data} />

          <XAxis aria-hidden="true">
            {filtered.labels.map((lbl, i) => (
              <span key={i} title={toLongDate(lbl, i18n.language)}>
                {shortDate(lbl, i18n.language)}
              </span>
            ))}
          </XAxis>
        </ChartCard>
      ))}
    </Grid>
  );
}

/* ---------- helpers ---------- */
function sum(arr: number[] = []) {
  return arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}
function last(arr: number[] = []) {
  return arr.length ? arr[arr.length - 1] : undefined;
}
function max(arr: number[] = []) {
  return arr.length ? Math.max(...arr) : undefined;
}
function shortDate(iso: string, lang?: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lang || undefined, { month: "short", day: "2-digit" });
}
function toLongDate(iso: string, lang?: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(lang || undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
// aksan/ünlem/boşluk farklarını normalize ederek karşılaştır
function norm(s: string) {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritics
    .replace(/\s+/g, " "); // çoklu boşluk
}

/* Basit çizgi grafik (SVG sparkline) */
function Sparkline({ data }: { data: number[] }) {
  const viewW = 100;
  const viewH = 36;

  const d = Array.isArray(data) ? data.filter((n) => Number.isFinite(n)) : [];
  const len = d.length;

  if (!len)
    return (
      <SparkWrap>
        <EmptyLine />
      </SparkWrap>
    );

  const minV = Math.min(...d);
  const maxV = Math.max(...d);
  const span = maxV - minV || 1;

  const stepX = len > 1 ? viewW / (len - 1) : 0;
  const points = d
    .map((v, i) => {
      const x = i * stepX;
      const y = viewH - ((v - minV) / span) * viewH; // 0 üstte olmasın
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <SparkWrap>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="none">
        <line x1="0" y1={viewH} x2={viewW} y2={viewH} className="baseline" />
        <polyline points={points} className="line" fill="none" />
      </svg>
    </SparkWrap>
  );
}

/* ---------- styled ---------- */
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: ${({ theme }) => theme.spacings.lg};
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: ${({ theme }) => theme.spacings.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.sm};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacings.md};
`;
const Title = styled.h4`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.title};
`;
const Kpis = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacings.md};
`;
const Kpi = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.1;
  small {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.xsmall};
  }
  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: 700;
  }
`;

const SparkWrap = styled.div`
  width: 100%;
  height: 72px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  svg {
    width: 100%;
    height: 100%;
  }
  .baseline {
    stroke: ${({ theme }) => theme.colors.borderLight};
    stroke-width: 0.6;
  }
  .line {
    stroke: ${({ theme }) => theme.colors.primary};
    stroke-width: 2;
  }
`;
const EmptyLine = styled.div`
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    transparent 0,
    transparent 8px,
    rgba(0, 0, 0, 0.03) 8px,
    rgba(0, 0, 0, 0.03) 9px
  );
`;

const XAxis = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 0 2px;
`;

const EmptyWrap = styled.div`
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.cardBackground};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacings.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;
