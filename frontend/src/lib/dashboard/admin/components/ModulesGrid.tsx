// src/modules/dashboard/admin/components/ModulesGrid.tsx
"use client";

import styled from "styled-components";
import Link from "next/link";
import { createSelector } from "@reduxjs/toolkit";
import { useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";
import { Muted } from "./Layout";
import { useDashboardModules } from "@/hooks/useDashboardModules";

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
  if (name === "contracts")  return Number(counters?.["contracts.active"]);
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

/* ---- memoized overview selector (aynı input → aynı obje) ---- */
const EMPTY_OBJ: any = {};
const selectCountersFinance = createSelector(
  [
    (s: any) => s.dashboardOverview ?? s.overview ?? s.dailyOverview ?? null,
  ],
  (ov) => ({
    counters: (ov?.data?.counters as Record<string, any>) ?? EMPTY_OBJ,
    finance: (ov?.data?.finance as { revenue?: number; expenses?: number; net?: number }) ?? EMPTY_OBJ,
  })
);

export default function ModulesGrid() {
  const { i18n } = useI18nNamespace("dashboard", translations);
  const { dashboardModules, isLoading } = useDashboardModules({ activeOnly: true });

  // ✅ Artık memoized selector kullanıyoruz
  const { counters, finance } = useAppSelector(selectCountersFinance);

  const numberFmt = (v?: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? new Intl.NumberFormat(i18n.language || "en").format(v)
      : "—";

  const items = dashboardModules.map((m) => ({
    ...m,
    value: getModuleValue(m.key, counters, finance),
    href : `/admin${m.slug ? `/${m.slug}` : ""}`,
  }));

  if (!items.length) return <Muted>{isLoading ? "…" : "—"}</Muted>;

  return (
    <Grid>
      {items.map((mod) => (
        <Link
          href={mod.href}
          key={mod.key}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <CardMod tabIndex={0}>
            <TopRow>
              <Label>{mod.label}</Label>
              <ValuePill title={String(mod.value ?? "")}>
                {numberFmt(mod.value)}
              </ValuePill>
            </TopRow>
            <Description>{mod.description}</Description>
          </CardMod>
        </Link>
      ))}
    </Grid>
  );
}

/* styled ... (değişmedi) */
const Grid = styled.div`
  display:grid; grid-template-columns:repeat(auto-fill, minmax(238px, 1fr));
  gap:${({ theme }) => theme.spacings.xl};
  ${({ theme }) => theme.media.tablet}{
    grid-template-columns:repeat(auto-fill, minmax(170px, 1fr));
    gap:${({ theme }) => theme.spacings.md};
  }
  ${({ theme }) => theme.media.mobile}{
    grid-template-columns:1fr; gap:${({ theme }) => theme.spacings.sm};
  }
`;
const CardMod = styled.div`
  background:${({ theme }) => theme.cards.background};
  border-radius:${({ theme }) => theme.radii.lg};
  box-shadow:${({ theme }) => theme.cards.shadow};
  padding:${({ theme }) => `${theme.spacings.xl} ${theme.spacings.md}`};
  display:flex; flex-direction:column;
  cursor:pointer; min-height:110px;
  transition:${({ theme }) => theme.transition.fast};
  &:hover, &:focus{
    box-shadow:${({ theme }) => theme.shadows.lg};
    background:${({ theme }) => theme.colors.backgroundAlt};
    outline:2px solid ${({ theme }) => theme.colors.primary};
  }
`;
const TopRow = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  gap:${({ theme }) => theme.spacings.sm};
  margin-bottom:${({ theme }) => theme.spacings.sm};
`;
const Label = styled.div`
  font-size:${({ theme }) => theme.fontSizes.lg};
  font-weight:${({ theme }) => theme.fontWeights.bold};
`;
const ValuePill = styled.span`
  padding:4px 10px;
  border-radius:${({ theme }) => theme.radii.pill};
  background:${({ theme }) => theme.colors.backgroundAlt};
  font-size:${({ theme }) => theme.fontSizes.sm};
  font-weight:${({ theme }) => theme.fontWeights.medium};
  white-space:nowrap;
`;
const Description = styled.div`
  color:${({ theme }) => theme.colors.textSecondary};
  font-size:${({ theme }) => theme.fontSizes.sm};
  word-break:break-word;
`;
