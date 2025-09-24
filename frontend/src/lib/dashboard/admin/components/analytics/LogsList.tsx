// src/modules/dashboard/admin/components/LogsList.tsx
"use client";

import styled from "styled-components";
import { useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";
import { Muted } from "../Layout";
import { selectDashboardLogs } from "@/modules/dashboard/slice/logsSlice";

export default function LogsList() {
  const { t } = useI18nNamespace("dashboard", translations);

  // ✅ Tek güvenli selector: slice yoksa da default state döner
  const { items, loading } = useAppSelector(selectDashboardLogs);

  if (loading) return <Muted>{t("loading", "Loading...")}</Muted>;
  if (!items?.length) return <Muted>{t("logs.empty", "No recent events.")}</Muted>;

  return (
    <List>
      {items.map((e: any) => {
        const ts = e?.ts ? new Date(e.ts) : null;
        const tsLabel =
          ts && !Number.isNaN(ts.getTime()) ? ts.toLocaleString() : "—";
        const hasAmount =
          typeof e?.amount === "number" && Number.isFinite(e.amount);

        return (
          <Row key={`${e?.type ?? "event"}:${e?.refId ?? Math.random()}`}>
            <CellW>
              <Badge>{e?.type ?? "-"}</Badge>
              <small>{tsLabel}</small>
            </CellW>
            <Cell>{e?.title || "-"}</Cell>
            <Cell>{e?.status || "-"}</Cell>
            <CellR>
              {hasAmount ? (
                <strong>
                  {e.amount} {e?.currency || ""}
                </strong>
              ) : (
                <span>—</span>
              )}
            </CellR>
          </Row>
        );
      })}
    </List>
  );
}

/* styled */
const List = styled.div`display:flex; flex-direction:column; gap:10px;`;
const Row = styled.div`
  display:grid; grid-template-columns:230px 1fr 160px 160px;
  gap:10px; align-items:center;
  ${({ theme }) => theme.media.mobile}{ grid-template-columns:1fr; gap:4px; }
`;
const Cell = styled.div``;
const CellW = styled.div`display:flex; gap:10px; align-items:center;`;
const CellR = styled.div`text-align:right;`;
const Badge = styled.span`
  background:${({ theme }) => theme.colors.backgroundAlt};
  border-radius:${({ theme }) => theme.radii.pill};
  padding:4px 8px; font-size:${({ theme }) => theme.fontSizes.xs};
`;
