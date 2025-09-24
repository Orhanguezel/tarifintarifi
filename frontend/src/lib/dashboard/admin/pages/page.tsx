// src/modules/dashboard/admin/pages/AdminDashboardPage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";

import { StatsGrid, AnalyticsPanel, ModulesGrid, DashboardCharts } from "@/modules/dashboard";

/* selectors + clear actions */
import {
  selectOverviewData,
  selectOverviewLoading,
} from "@/modules/dashboard/slice/dailyOverviewSlice";
import {
  selectChartsData,
  selectChartsLoading,
} from "@/modules/dashboard/slice/chartDataSlice";

/* ✅ parametresiz analytics slice (fetch sadece sayfada!) */
import {
  selectAnalyticsLoading,
  setEventsQuery,
  setTrendsQuery,
  fetchAnalyticsEvents,
  fetchAnalyticsTrends,
} from "@/modules/dashboard/slice/analyticsSlice";

import {
  PageWrap,
  HeaderBar,
  Right,
  Counter,
  Section,
  SectionHead,
  Card,
  SmallBtn,
} from "../components/Layout";

type TabKey = "modules" | "stats" | "charts" | "analytics";

type AnalyticsFilters = {
  startDate?: string;
  endDate?: string;
  module?: string;
  eventType?: string;
};

export default function AdminDashboardPage() {
  const { t } = useI18nNamespace("dashboard", translations);
  const dispatch = useAppDispatch();

  // slice okumaları
  const overviewData    = useAppSelector(selectOverviewData);
  const overviewLoading = useAppSelector(selectOverviewLoading);
  const chartsData    = useAppSelector(selectChartsData);
  const chartsLoading = useAppSelector(selectChartsLoading);
  const analyticsLoading = useAppSelector(selectAnalyticsLoading);

  const [tab, setTab] = useState<TabKey>("modules");

  // 🔁 Panel fetch yerine: filtreleri burada tut
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilters | null>(null);


  // 📡 Fetch sadece burada: Analytics tabı açıldığında ve/veya filtreler değiştiğinde
  useEffect(() => {
    if (tab !== "analytics") return;

    // default 30 gün (filtre yoksa)
    let next = analyticsFilters;
    if (!next) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      next = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
      setAnalyticsFilters(next); // state'i doldur, bu effect bir sonraki render'da fetch'leyecek
      return;
    }

    // store query yaz + fetch
    dispatch(setEventsQuery({ limit: 500, ...next }));
    dispatch(setTrendsQuery({ period: "day", ...next }));
    dispatch(fetchAnalyticsEvents());
    dispatch(fetchAnalyticsTrends());
  }, [tab, analyticsFilters, dispatch]);

  // Panel'den gelen filtre değişimlerini burada yakala
  const handleAnalyticsFiltersChange = (f?: AnalyticsFilters) => {
    if (!f || (!f.startDate && !f.endDate && !f.module && !f.eventType)) {
      // reset → 30 gün default
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      setAnalyticsFilters({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      return;
    }
    setAnalyticsFilters((prev) => {
      const next = { ...prev, ...f };
      // gereksiz re-render/fetch'i önlemek için shallow compare
      const same =
        prev &&
        prev.startDate === next.startDate &&
        prev.endDate === next.endDate &&
        prev.module === next.module &&
        prev.eventType === next.eventType;
      return same ? prev : next;
    });
  };

  // stat kartları
  const statEntries = useMemo(() => {
    const {
      apartments = 0,
      employees = 0,
      activeContracts = 0,
      overdueInvoices = 0,
      plannedJobsToday = 0,
      timeLast7dMinutes = 0,
    } = (overviewData?.counters ?? {}) as Partial<{
      apartments: number;
      employees: number;
      activeContracts: number;
      overdueInvoices: number;
      plannedJobsToday: number;
      timeLast7dMinutes: number;
    }>;

    const { revenue = 0, expenses = 0, net = 0 } = (overviewData?.finance ??
      {}) as Partial<{ revenue: number; expenses: number; net: number }>;

    return [
      { key: "apartments", label: t("stats.apartments", "Apartments"), value: apartments },
      { key: "employees",  label: t("stats.employees", "Employees"),   value: employees },
      { key: "contracts",  label: t("stats.contracts", "Active Contracts"), value: activeContracts },
      { key: "overdue",    label: t("stats.overdueInvoices", "Overdue Invoices"), value: overdueInvoices },
      { key: "jobsToday",  label: t("stats.jobsToday", "Jobs Today"), value: plannedJobsToday },
      { key: "time",       label: t("stats.timeLast7d", "Time (7d, min)"), value: timeLast7dMinutes },
      { key: "revenue",    label: t("stats.revenue", "Revenue"), value: revenue,  highlight: true },
      { key: "expenses",   label: t("stats.expenses", "Expenses"), value: expenses },
      { key: "net",        label: t("stats.net", "Net"), value: net, highlight: true },
    ];
  }, [overviewData, t]);

  const modulesCount = useAppSelector((s: any) =>
    Array.isArray(s?.moduleSetting)
      ? s.moduleSetting.filter((m: any) => m?.showInDashboard !== false && m?.enabled !== false).length
      : 0
  );

  const isLoadingCurrentTab =
    (tab === "stats"     && overviewLoading) ||
    (tab === "charts"    && chartsLoading)  ||
    (tab === "analytics" && analyticsLoading);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "modules",   label: t("tabs.modules",   "Modules") },
    { key: "stats",     label: t("tabs.stats",     "Statistics") },
    { key: "charts",    label: t("tabs.charts",   "Charts") },
    { key: "analytics", label: t("tabs.analytics", "Analytics") },
  ];

  return (
    <PageWrap>
      <HeaderBar>
        <h1>{t("title", "Dashboard")}</h1>
        <Right>
          <Counter>{modulesCount}</Counter>
          {isLoadingCurrentTab && <SmallBtn disabled>{t("loading", "Loading…")}</SmallBtn>}
        </Right>
      </HeaderBar>

      <TabsBar>
        {tabs.map(tb => (
          <TabBtn key={tb.key} $active={tab===tb.key} onClick={()=>setTab(tb.key)} type="button">
            {tb.label}
          </TabBtn>
        ))}
      </TabsBar>

      {tab === "modules" && (
        <Section>
          <SectionHead><h2>{t("tabs.modules","Modules")}</h2></SectionHead>
          <Card><ModulesGrid /></Card>
        </Section>
      )}

      {tab === "stats" && (
        <Section>
          <SectionHead><h2>{t("tabs.stats","Statistics")}</h2></SectionHead>
          <Card><StatsGrid entries={statEntries} /></Card>
        </Section>
      )}

      {tab === "charts" && (
        <Section>
          <SectionHead><h2>{t("tabs.charts","Charts")}</h2></SectionHead>
          <Card><DashboardCharts data={chartsData} /></Card>
        </Section>
      )}

      {tab === "analytics" && (
        <Section>
          <SectionHead><h2>{t("tabs.analytics","Analytics")}</h2></SectionHead>
          {/* Panel fetch yapmaz; filtre değişimini parent'a bildirir */}
          <Card>
            <AnalyticsPanel
              onFiltersChange={(f) => handleAnalyticsFiltersChange(f)}
              onResetFilters={() => handleAnalyticsFiltersChange(undefined)}
            />
          </Card>
        </Section>
      )}
    </PageWrap>
  );
}

/* — Tabs UI — */
const TabsBar = styled.div`
  display:flex; align-items:center; gap:${({theme})=>theme.spacings.sm};
  margin-bottom:${({theme})=>theme.spacings.lg};
  flex-wrap:wrap;
`;
const TabBtn = styled.button<{ $active:boolean }>`
  padding:${({theme})=>`${theme.spacings.sm} ${theme.spacings.lg}`};
  border:none; cursor:pointer; border-radius:${({theme})=>theme.radii.pill};
  background:${({$active,theme})=>$active?theme.colors.primary:theme.colors.background};
  color:${({$active,theme})=>$active?theme.colors.white:theme.colors.textPrimary};
  font-weight:${({$active})=>$active?700:400};
  box-shadow:${({$active,theme})=>$active?theme.shadows.sm:"none"};
  transition:${({theme})=>theme.transition.fast};
`;
