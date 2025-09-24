// src/modules/dashboard/admin/components/StatsGrid.tsx
"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { createSelector } from "@reduxjs/toolkit";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "../../locales";
import StatCard from "./StatCard";
import { useDashboardModules } from "@/hooks/useDashboardModules";
import { useAppSelector } from "@/store/hooks";

export interface GridEntry {
  key: string;
  label: string;
  icon?: React.ReactNode;
  value: number | string;
  highlight?: boolean;
}
export interface StatsGridProps { entries?: GridEntry[]; }

/* ---------- Modül -> sayaç eşlemesi ---------- */
function getModuleValue(
  modNameRaw: string | undefined,
  counters: Record<string, any> | undefined,
  finance: { revenue?: number; expenses?: number; net?: number } | undefined
): number | undefined {
  if (!modNameRaw) return undefined;
  const name = String(modNameRaw).toLowerCase();

  if (name === "payments")  return Number(finance?.revenue ?? counters?.["payments.sum"]);
  if (name === "expenses")  return Number(finance?.expenses ?? counters?.["expenses.sum"]);
  if (name === "invoicing") return Number(counters?.["invoicing.overdue"] ?? counters?.overdueInvoices);
  if (name === "operationsjobs") return Number(counters?.["operationsjobs.today"]);
  if (name === "timetracking")   return Number(counters?.["timetracking.minutes"] ?? counters?.timeLast7dMinutes);
  if (name === "contracts")      return Number(counters?.["contracts.active"]);
  if (name === "apartments" || name === "apartment") return Number(counters?.apartments ?? counters?.["apartments.count"]);
  if (name === "employees" || name === "employee")   return Number(counters?.employees);
  if (name === "orders")    return Number(counters?.["orders.count"]);
  if (name === "booking" || name === "bookings")     return Number(counters?.["booking.upcoming"]);
  if (name === "revenue")   return Number(finance?.revenue);
  if (name === "net")       return Number(finance?.net);

  const genericKey = `${name}.count`;
  if (genericKey in (counters || {})) return Number((counters as any)[genericKey]);
  const direct = counters?.[name] ?? counters?.[`${name}s`];
  return typeof direct === "number" ? Number(direct) : undefined;
}

/* ---------- Memoized selector (aynı input → aynı referans) ---------- */
const EMPTY_OBJ: any = {};
const selectCountersFinance = createSelector(
  [(s: any) => s.dashboardOverview ?? s.overview ?? s.dailyOverview ?? null],
  (ov) => {
    const d = (ov?.data ?? ov) || EMPTY_OBJ;
    return {
      counters: (d?.counters as Record<string, any>) ?? EMPTY_OBJ,
      finance : (d?.finance  as { revenue?: number; expenses?: number; net?: number }) ?? EMPTY_OBJ,
    };
  }
);

const StatsGrid: React.FC<StatsGridProps> = ({ entries }) => {
  const { t, i18n } = useI18nNamespace("dashboard", translations);
  const { dashboardModules } = useDashboardModules({ activeOnly: true });

  // ✅ Artık memoize edilmiş selector kullanılıyor (uyarı kalkar)
  const { counters, finance } = useAppSelector(selectCountersFinance);

  const rawList: GridEntry[] = useMemo(() => {
    if (Array.isArray(entries) && entries.length) return entries;

    return dashboardModules.map((m) => {
      const val = getModuleValue(m.key, counters, finance);
      const IconComp = m.Icon;
      return {
        key: m.key,
        label: m.label,
        value: typeof val === "number" && Number.isFinite(val) ? val : "—",
        icon: IconComp ? <IconComp /> : undefined,
        highlight: false,
      };
    });
  }, [entries, dashboardModules, counters, finance]);

  const formatted = useMemo(() => {
    const nf = new Intl.NumberFormat(i18n.language || "en-US");
    return rawList.map((e) => ({
      ...e,
      value:
        typeof e.value === "number" && Number.isFinite(e.value)
          ? nf.format(e.value)
          : e.value ?? "—",
    }));
  }, [rawList, i18n.language]);

  if (!formatted.length) {
    return <EmptyInfo>{t("noData", "Hiç veri bulunamadı.")}</EmptyInfo>;
  }

  return (
    <Grid>
      {formatted.map((stat) => (
        <StatCard
          key={stat.key}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          highlight={!!stat.highlight}
        />
      ))}
    </Grid>
  );
};

export default StatsGrid;

/* styled */
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: ${({ theme }) => theme.spacings.lg};
`;

const EmptyInfo = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.05rem;
  text-align: center;
  padding: 2rem 0;
`;
