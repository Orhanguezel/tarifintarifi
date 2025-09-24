"use client";

import { useId, useMemo } from "react";
import styled from "styled-components";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/dashboard/locales";
import type { AnalyticsEvent } from "@/modules/dashboard/types";

interface Props {
  data?: AnalyticsEvent[];        // undefined gelse bile boş tablo
  onExportClick?: () => void;     // CSV/JSON dışa aktarım butonu (opsiyonel)
}

export default function AnalyticsTable({ data, onExportClick }: Props) {
  const { t, i18n } = useI18nNamespace("dashboard", translations);
  const tableTitleId = useId();

  // Güvenli & sıralı veri: timestamp DESC
  const rows: AnalyticsEvent[] = useMemo(() => {
    const arr = Array.isArray(data) ? data.slice() : [];
    return arr.sort((a, b) => {
      const ta = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta; // desc
    });
  }, [data]);

  if (!rows.length) {
    return <NoData>{t("noData", "Veri bulunamadı.")}</NoData>;
  }

  return (
    <TableWrap role="region" aria-labelledby={tableTitleId}>
      <Toolbar>
        <Title id={tableTitleId}>{t("analytics.logTable", "Log Detayları")}</Title>
        {onExportClick && (
          <ExportBtn onClick={onExportClick} aria-label={t("exportCSV", "CSV Dışa Aktar")}>
            {t("exportCSV", "CSV Dışa Aktar")}
          </ExportBtn>
        )}
      </Toolbar>

      <Table>
        <thead>
          <tr>
            <th>{t("table.timestamp", "Zaman")}</th>
            <th>{t("table.module", "Modül")}</th>
            <th>{t("table.eventType", "Olay Türü")}</th>
            <th>{t("table.user", "Kullanıcı")}</th>
            <th>{t("table.location", "Konum")}</th>
            <th>{t("table.city", "Şehir")}</th>
            <th>{t("table.country", "Ülke")}</th>
            <th>{t("table.ip", "IP")}</th>
            <th>{t("table.agent", "Tarayıcı")}</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((log, i) => {
            // — Tarih
            let formatted = "-";
            if (log?.timestamp) {
              const d = new Date(log.timestamp);
              if (!Number.isNaN(d.getTime())) {
                formatted = `${d.toLocaleDateString(i18n.language)} ${d.toLocaleTimeString(
                  i18n.language,
                  { hour: "2-digit", minute: "2-digit" }
                )}`;
              }
            }

            // — i18n etiketleri
            const moduleLabel = t(`modules.${log?.module}`, log?.module || "-") || "-";
            const eventLabel  = t(`events.${log?.eventType}`, log?.eventType || "-") || "-";

            // — Konum
            let latLon = "-";
            const coords = log?.location?.coordinates;
            if (Array.isArray(coords) && coords.length === 2) {
              const [lon, lat] = coords;
              if (Number.isFinite(lat) && Number.isFinite(lon)) {
                latLon = `${(+lat).toFixed(4)}, ${(+lon).toFixed(4)}`;
              }
            }

            // — UA kısaltma
            const ua = log?.userAgent || "";
            const uaShort = ua ? (ua.length > 48 ? `${ua.slice(0, 48)}…` : ua) : "-";

            // Güvenli key
            const rowKey = log?._id || `${log?.module || "m"}:${log?.eventType || "e"}:${log?.timestamp || i}`;

            return (
              <tr key={rowKey}>
                <td>{formatted}</td>
                <td>{moduleLabel}</td>
                <td>{eventLabel}</td>
                <td>{log?.userId || "-"}</td>
                <td>{latLon}</td>
                <td title={log?.city || ""}>{log?.city || "-"}</td>
                <td title={log?.country || ""}>{log?.country || "-"}</td>
                <td>{log?.ip || "-"}</td>
                <td title={ua}>{uaShort}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrap>
  );
}

/* ---------------- styled ---------------- */

const TableWrap = styled.div`
  overflow-x: auto;
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.cardBackground};
  box-shadow: ${({ theme }) => theme.cards.shadow};
`;

const Toolbar = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
  gap:${({ theme }) => theme.spacings.sm};
  border-bottom: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
`;

const Title = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ExportBtn = styled.button`
  padding: ${({ theme }) => theme.spacings.xs} ${({ theme }) => theme.spacings.md};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: background-color ${({ theme }) => theme.transition.fast};
  &:hover { background-color: ${({ theme }) => theme.colors.primaryHover}; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};

  th, td {
    padding: ${({ theme }) => theme.spacings.sm} ${({ theme }) => theme.spacings.md};
    border-bottom: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
    text-align: left;
    white-space: nowrap;
  }

  thead {
    background: ${({ theme }) => theme.colors.tableHeader};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tbody tr:hover {
    background-color: ${({ theme }) => theme.colors.hoverBackground};
  }
`;

const NoData = styled.div`
  margin-top: ${({ theme }) => theme.spacings.md};
  padding: ${({ theme }) => theme.spacings.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.small};
  text-align: center;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
`;
