// src/modules/dashboard/admin/components/AnalyticsPanel.tsx
"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { Download, FileText } from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";
import { Loader } from "@/shared";

// Grafik ve tablo
import { LineChart, BarChart, AnalyticsTable } from "@/modules/dashboard";

// Barrel
import { FilterBar, DateRangeSelector, LogsList } from "@/modules/dashboard";

type TabKey = "trends" | "distribution" | "geo" | "table";
type TrendEntry = { _id: { year: number; month: number; day: number }; total: number };

// Harita tipi
type MapChartEvent = {
  module: string;
  eventType: string;
  location?: { type: "Point"; coordinates: [number, number] }; // [lon, lat]
  userId?: string;
  timestamp?: string;
};
type MapChartProps = { data: MapChartEvent[] };

const MapChart = dynamic<MapChartProps>(
  () => import("@/modules/dashboard/admin/components/analytics/MapChart").then((m) => m.default),
  { ssr: false }
);

/* ---- helpers ---- */
const toISO = (v: any | undefined): string | undefined => {
  if (!v) return undefined;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

function normalizeEvents(raw: any[]): any[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => {
    const moduleName = (e?.module ?? e?.type ?? "unknown").toString();
    const evt = (e?.eventType ?? e?.status ?? e?.type ?? "event").toString();
    const ts = e?.timestamp ?? e?.ts;
    return { ...e, module: moduleName, eventType: evt, timestamp: toISO(ts) };
  });
}

function buildTrendsFromEvents(events: any[]): TrendEntry[] {
  const map = new Map<string, number>();
  for (const e of events) {
    const ts = e?.timestamp ?? e?.ts;
    const d = ts ? new Date(ts) : null;
    if (!d || Number.isNaN(d.getTime())) continue;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, total]) => {
      const [y, m, d] = key.split("-").map(Number);
      return { _id: { year: y, month: m, day: d }, total };
    });
}

/** CSV export helper (panel içinde kullanılacak) */
function exportToCSV(data: any[], filename = "analytics-export.csv") {
  if (!Array.isArray(data) || !data.length) return;
  const keys = Array.from(
    data.reduce<Set<string>>((s, r) => {
      Object.keys(r || {}).forEach((k) => s.add(k));
      return s;
    }, new Set())
  );
  const rows = [
    keys.join(","),
    ...data.map((row) =>
      keys
        .map((k) => {
          const v = row?.[k];
          const str = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

type FiltersChange = {
  startDate?: string;
  endDate?: string;
  module?: string;
  eventType?: string;
};

interface Props {
  /** Üst bileşen fetch edecek */
  onFiltersChange?: (f: FiltersChange) => void;
  onResetFilters?: () => void;
}

export default function AnalyticsPanel({ onFiltersChange, onResetFilters }: Props) {
  const { t, i18n } = useI18nNamespace("dashboard", translations);
  const lang = i18n.language;

  // store’dan oku (yalnızca görüntüleme)
  const analytics    = useAppSelector((s: any) => s.analytics) || {};
  const dashboardLog = useAppSelector((s: any) => s.dashboardLogs);
  const modMeta      = useAppSelector((s: any) => s.moduleMeta) || {};
  const modSet       = useAppSelector((s: any) => s.moduleSetting) || {};

  const loading = !!analytics.loading;

  // Fallback: eski dashboard logs – memoize
  const fallbackRaw = useMemo<any[]>(() => {
    const a = dashboardLog?.data?.events;
    const b = dashboardLog?.events;
    const c = dashboardLog?.items;
    return (Array.isArray(a) && a) || (Array.isArray(b) && b) || (Array.isArray(c) && c) || [];
  }, [dashboardLog]);

  // normalize + fallback — storeEvents'i ayrıca tanımlamıyoruz; direkt state üzerinden okuyoruz
  const events = useMemo<any[]>(
    () => {
      const se = Array.isArray(analytics?.events) ? analytics.events : [];
      return se.length ? se : normalizeEvents(fallbackRaw);
    },
    [analytics?.events, fallbackRaw]
  );

  const trends = useMemo<TrendEntry[]>(
    () => {
      const st = Array.isArray(analytics?.trends) ? analytics.trends : [];
      return st.length ? (st as any) : buildTrendsFromEvents(events);
    },
    [analytics?.trends, events]
  );

  // meta / tenant modules (select’leri doldurmak için)
  const metaModules = useMemo<any[]>(
    () => (Array.isArray(modMeta.modules) ? metaModulesSanitize(modMeta.modules) : []),
    [modMeta.modules]
  );
  const tenantModules = useMemo<any[]>(
    () => (Array.isArray(modSet.tenantModules) ? (modSet.tenantModules as any[]) : []),
    [modSet.tenantModules]
  );

  const error =
    (analytics?.error ? String(analytics.error) : null) ||
    (dashboardLog?.error ? String(dashboardLog.error) : null) ||
    null;

  // Filtreler (yalnız UI state) — fetch parent’ta
  const [tab, setTab] = useState<TabKey>("trends");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");

  // Aktif analytics modülleri (tenant + meta)
  const activeAnalyticsModules = useMemo(() => {
    if (!metaModules.length || !tenantModules.length) return [];
    return metaModules
      .filter((m: any) => {
        const st = tenantModules.find((x: any) => (x.module ?? x.name) === m.name);
        return st?.enabled !== false && st?.useAnalytics === true;
      })
      .map((m: any) => ({
        value: m.name,
        label: m?.label?.[lang as keyof typeof m.label] || m?.label?.en || m.name,
      }));
  }, [metaModules, tenantModules, lang]);

  // Otomatik listeler (normalize edilmiş events)
  const availableEventTypes = useMemo(
    () => Array.from(new Set(events.map((e) => e?.eventType).filter(Boolean))),
    [events]
  );
  const availableModules = useMemo(
    () => Array.from(new Set(events.map((e) => e?.module).filter(Boolean))),
    [events]
  );

  // Filtreler → client-side görünüm
  const filteredEvents = useMemo(() => {
    let res = events;
    if (selectedModule)    res = res.filter((e) => e?.module === selectedModule);
    if (selectedEventType) res = res.filter((e) => e?.eventType === selectedEventType);
    if (startDate)         res = res.filter((e) => e?.timestamp && new Date(e.timestamp) >= startDate);
    if (endDate)           res = res.filter((e) => e?.timestamp && new Date(e.timestamp) <= endDate);
    return res;
  }, [events, selectedModule, selectedEventType, startDate, endDate]);

  const filteredTrends = useMemo<TrendEntry[]>(() => {
    if (!trends.length) return [];
    return trends.filter((t: any) => {
      if (selectedModule && t?.module && t?.module !== selectedModule) return false;
      if (selectedEventType && t?.eventType && t?.eventType !== selectedEventType) return false;
      return true;
    });
  }, [trends, selectedModule, selectedEventType]);

  const geoEvents = useMemo<MapChartEvent[]>(
    () =>
      filteredEvents.filter(
        (e: any) =>
          Array.isArray(e?.location?.coordinates) &&
          e.location.coordinates.length === 2 &&
          e.location.coordinates.every((n: any) => typeof n === "number")
      ),
    [filteredEvents]
  );

  // ---- Parent’a bildirim helpers (panel fetch yapmaz) ----
  const notifyParent = (next?: Partial<FiltersChange>) => {
    onFiltersChange?.({
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate:   endDate   ? endDate.toISOString()   : undefined,
      module: selectedModule || undefined,
      eventType: selectedEventType || undefined,
      ...(next || {}),
    });
  };

  // Export
  const handleExport = (fmt: "csv" | "json") => {
    if (!filteredEvents.length) return;
    if (fmt === "json") {
      const blob = new Blob([JSON.stringify(filteredEvents, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.setAttribute("download", "analytics-export.json");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      exportToCSV(filteredEvents, "analytics-export.csv");
    }
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedModule("");
    setSelectedEventType("");
    onResetFilters?.();
  };

  return (
    <PanelWrap>
      <TopBar>
        <Title>{t("analytics.title", "Log Analizi ve Etkinlik Trendleri")}</Title>
        <Actions>
          <MiniStat>{t("total", "Toplam")}: <b>{filteredEvents.length}</b></MiniStat>
          <MiniStat>{t("uniqueModules", "Modül")}: <b>{availableModules.length}</b></MiniStat>
          <MiniStat>{t("types", "Tip")}: <b>{availableEventTypes.length}</b></MiniStat>

          <Btn onClick={() => handleExport("csv")} title={t("exportCSV", "CSV Dışa Aktar")}><Download size={16}/> CSV</Btn>
          <Btn onClick={() => handleExport("json")} title={t("exportJSON", "JSON Dışa Aktar")}><FileText size={16}/> JSON</Btn>
          <BtnGhost onClick={resetFilters}>{t("reset", "Filtreleri Temizle")}</BtnGhost>
        </Actions>
      </TopBar>

      {/* Filters */}
      <Filters>
        <Field>
          <label htmlFor="moduleSelect">{t("selectModule", "Modül Seç")}</label>
          <select
            id="moduleSelect"
            value={selectedModule}
            onChange={(e) => {
              const next = e.target.value;
              setSelectedModule(next);
              notifyParent({ module: next || undefined });
            }}
            disabled={!activeAnalyticsModules.length && !availableModules.length}
          >
            <option value="">{t("allModules", "Tümü")}</option>
            {activeAnalyticsModules.map((m: any) => (
              <option key={`meta-${m.value}`} value={m.value}>{m.label}</option>
            ))}
            {availableModules
              .filter((m) => !activeAnalyticsModules.some((x: any) => x.value === m))
              .map((m) => (
                <option key={`ev-${m}`} value={m}>{m}</option>
              ))}
          </select>
        </Field>

        <Field>
          <label htmlFor="eventTypeSelect">{t("eventType", "Event Tipi")}</label>
          <select
            id="eventTypeSelect"
            value={selectedEventType}
            onChange={(e) => {
              const next = e.target.value;
              setSelectedEventType(next);
              notifyParent({ eventType: next || undefined });
            }}
            disabled={!availableEventTypes.length}
          >
            <option value="">{t("allEvents", "Tümü")}</option>
            {availableEventTypes.map((et) => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
        </Field>

        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onChange={({ startDate, endDate }) => {
            setStartDate(startDate);
            setEndDate(endDate);
            notifyParent({
              startDate: startDate ? startDate.toISOString() : undefined,
              endDate:   endDate   ? endDate.toISOString()   : undefined,
            });
          }}
        />
      </Filters>

      {/* Quick filter bar */}
      <FilterBar
        module={selectedModule}
        eventType={selectedEventType}
        onChange={({ module, eventType }) => {
          setSelectedModule(module);
          setSelectedEventType(eventType);
          notifyParent({ module: module || undefined, eventType: eventType || undefined });
        }}
        availableModules={availableModules}
        availableEventTypes={availableEventTypes}
      />

      {/* Tabs */}
      <Tabs>
        <Tab $active={tab==="trends"}       onClick={()=>setTab("trends")}>{t("analytics.dailyTrends","Trendler")}</Tab>
        <Tab $active={tab==="distribution"} onClick={()=>setTab("distribution")}>{t("analytics.moduleDistribution","Dağılım")}</Tab>
        <Tab $active={tab==="geo"}          onClick={()=>setTab("geo")}>{t("analytics.geoMap","Harita")}</Tab>
        <Tab $active={tab==="table"}        onClick={()=>setTab("table")}>{t("analytics.logTable","Tablo")}</Tab>
      </Tabs>

      {loading && <Loader />}
      {error && <ErrorBox>{error}</ErrorBox>}

      {!loading && !error && (
        <>
          {tab === "trends" && (
            <Section>
              <SectionTitle>{t("analytics.dailyTrends", "Günlük Event Trendleri")}</SectionTitle>
              {filteredTrends.length ? <LineChart data={filteredTrends} /> : <NoData>{t("noData", "Veri yok")}</NoData>}
            </Section>
          )}

          {tab === "distribution" && (
            <Section>
              <SectionTitle>{t("analytics.moduleDistribution", "Modül Bazlı Yoğunluk")}</SectionTitle>
              {filteredEvents.length ? <BarChart data={filteredEvents} /> : <NoData>{t("noData", "Veri yok")}</NoData>}
            </Section>
          )}

          {tab === "geo" && (
            <Section>
              <SectionTitle>{t("analytics.geoMap", "Coğrafi Dağılım")}</SectionTitle>
              {geoEvents.length ? <MapChart data={geoEvents} /> : <NoData>{t("noGeoData", "Konum verisi içeren kayıt yok.")}</NoData>}
            </Section>
          )}

          {tab === "table" && (
            <Section>
              <SectionTitle>{t("analytics.logTable", "Log Detayları")}</SectionTitle>
              <AnalyticsTable data={filteredEvents.slice(0, 200)} />
            </Section>
          )}
        </>
      )}

      <Divider />
      <Section>
        <SectionTitle>{t("analytics.activity", "Dashboard Aktiviteleri")}</SectionTitle>
        <LogsList />
      </Section>
    </PanelWrap>
  );
}

/* utils */
function metaModulesSanitize(arr: any[]) { return arr; }

/* ---- Styled ---- */
const PanelWrap = styled.div`
  padding:${({ theme }) => theme.spacings.xxl};
  @media (max-width:1000px){ padding:${({ theme }) => theme.spacings.lg}; }
  @media (max-width:700px){ padding:${({ theme }) => theme.spacings.sm}; }
`;
const TopBar = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  gap:${({ theme }) => theme.spacings.md};
  margin-bottom:${({ theme }) => theme.spacings.lg};
  @media (max-width:800px){ flex-direction:column; align-items:stretch; }
`;
const Title = styled.h2`
  font-size:${({ theme }) => theme.fontSizes["2xl"]};
  color:${({ theme }) => theme.colors.title};
`;
const Actions = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.sm}; align-items:center; flex-wrap:wrap;
`;
const MiniStat = styled.span`
  background:${({ theme }) => theme.colors.backgroundAlt};
  border-radius:${({ theme }) => theme.radii.pill};
  padding:4px 8px; font-size:${({ theme }) => theme.fontSizes.xs};
`;
const Btn = styled.button`
  display:flex; align-items:center; gap:6px;
  background:${({ theme }) => theme.colors.primary};
  color:${({ theme }) => theme.colors.white};
  border:none; border-radius:${({ theme }) => theme.radii.sm};
  padding:${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  cursor:pointer; font-size:${({ theme }) => theme.fontSizes.sm};
  &:hover{ background:${({ theme }) => theme.colors.primaryHover}; }
`;
const BtnGhost = styled.button`
  background:${({ theme }) => theme.colors.background};
  color:${({ theme }) => theme.colors.textPrimary};
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius:${({ theme }) => theme.radii.sm};
  padding:${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  cursor:pointer; font-size:${({ theme }) => theme.fontSizes.sm};
`;
const Filters = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.md};
  align-items:flex-end; flex-wrap:wrap;
  margin-bottom:${({ theme }) => theme.spacings.md};
`;
const Field = styled.div`
  display:flex; flex-direction:column; gap:6px; min-width:180px;
  label{ font-size:${({ theme }) => theme.fontSizes.sm}; color:${({ theme }) => theme.colors.textSecondary}; }
  select{
    padding:${({ theme }) => theme.spacings.sm};
    border-radius:${({ theme }) => theme.radii.sm};
    border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
    background:${({ theme }) => theme.inputs.background};
    color:${({ theme }) => theme.inputs.text};
    font-size:${({ theme }) => theme.fontSizes.sm};
  }
`;
const Tabs = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.sm};
  margin:${({ theme }) => theme.spacings.md} 0 ${({ theme }) => theme.spacings.lg};
  flex-wrap:wrap;
`;
const Tab = styled.button<{ $active?: boolean }>`
  padding:8px 12px; border-radius:${({ theme }) => theme.radii.pill};
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  background:${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.background)};
  color:${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.textPrimary)};
  cursor:pointer; font-weight:${({ $active }) => ($active ? 700 : 500)};
`;
const Section = styled.section`
  margin-bottom:${({ theme }) => theme.spacings.xxl};
  @media (max-width:700px){ margin-bottom:${({ theme }) => theme.spacings.lg}; }
`;
const SectionTitle = styled.h3`
  font-size:${({ theme }) => theme.fontSizes.large};
  margin-bottom:${({ theme }) => theme.spacings.md};
  color:${({ theme }) => theme.colors.textPrimary};
`;
const ErrorBox = styled.div`
  color:${({ theme }) => theme.colors.danger};
  margin-top:${({ theme }) => theme.spacings.md};
  text-align:center;
`;
const NoData = styled.div`
  padding:${({ theme }) => theme.spacings.md};
  background:${({ theme }) => theme.colors.cardBackground};
  border-radius:${({ theme }) => theme.radii.md};
  color:${({ theme }) => theme.colors.textMuted};
  text-align:center;
`;
const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
  margin: ${({ theme }) => theme.spacings.xl} 0;
`;
