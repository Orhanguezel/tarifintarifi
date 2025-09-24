"use client";

import React, { useState, KeyboardEvent } from "react";
import styled from "styled-components";
import { Globe, Trash2, AlertCircle } from "lucide-react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";
import { SupportedLocale } from "@/types/common";
import * as MdIcons from "react-icons/md";
import { ModuleStatusToggle } from "@/modules/adminmodules";
import { useAppDispatch } from "@/store/hooks";
import { toast } from "react-toastify";

import {
  updateModuleMeta,
  deleteModuleMeta, // ✅ EKLENDİ
} from "@/modules/adminmodules/slices/moduleMetaSlice";
import { updateModuleSetting } from "@/modules/adminmodules/slices/moduleSettingSlice";

import type {
  IModuleMeta,
  IModuleSetting,
  RouteMeta,
} from "@/modules/adminmodules/types";

type ModuleType = "meta" | "tenant";

interface ModuleCardProps {
  module: IModuleMeta | (IModuleSetting & { globalEnabled?: boolean });
  search?: string;
  type?: ModuleType;
  onShowDetail?: (module: IModuleMeta | IModuleSetting, type: ModuleType) => void;
  onDelete?: (moduleKey: string) => void; // sadece meta için (opsiyonel)
}

// --- Dynamic icon function ---
const dynamicIcon = (iconName?: string) =>
  iconName && (MdIcons as any)[iconName]
    ? (MdIcons as any)[iconName]
    : MdIcons.MdSettings;

// --- Highlight helper ---
const highlightMatch = (text: string, search: string) => {
  if (!search) return text;
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === search.toLowerCase() ? (
      <Highlight key={i}>{part}</Highlight>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
};

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  search = "",
  type = "meta",
  onShowDetail,
  onDelete,
}) => {
  const { i18n, t } = useI18nNamespace("adminModules", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;
  const dispatch = useAppDispatch();

  const [busyKey, setBusyKey] = useState<string | null>(null); // toggle/delete sırasında disable için
  const [deleting, setDeleting] = useState<boolean>(false);    // sadece delete için

  const isMeta = type === "meta";
  const asMeta = module as IModuleMeta;
  const asSetting = module as IModuleSetting & { globalEnabled?: boolean };

  const moduleKey = isMeta ? asMeta.name : asSetting.module;
  const globalEnabled = isMeta ? undefined : asSetting.globalEnabled ?? true;

  // Label (çoklu dil için)
  const moduleLabel = isMeta
    ? (asMeta.label?.[lang]?.trim() ||
        asMeta.label?.[("en" as SupportedLocale)]?.trim() ||
        asMeta.name ||
        "")
    : moduleKey;

  const IconComponent = dynamicIcon(isMeta ? asMeta.icon : undefined);

  // --- Delete (sadece meta) ---
  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();   // ✅ form submit vb. engelle
    e.stopPropagation();  // ✅ kartın onClick’ine tırmanmasın
    if (!isMeta) return;

    const ok = window.confirm(
      t("confirmDelete", "Silmek istediğinize emin misiniz?")
    );
    if (!ok) return;

    try {
      setBusyKey(moduleKey);
      setDeleting(true);

      if (onDelete) {
        // Parent kendi akışını yönetmek istiyorsa
        await Promise.resolve(onDelete(moduleKey));
      } else {
        // ✅ Fallback: prop gelmese bile thunk ile sil
        await dispatch(deleteModuleMeta(moduleKey)).unwrap();
        toast.success(t("deleted", "Modül silindi"));
      }
    } catch (err: any) {
      toast.error(
        t("deleteError", "Silme işlemi başarısız") +
          (err?.message ? `: ${err.message}` : "")
      );
    } finally {
      setDeleting(false);
      setBusyKey(null);
    }
  };

  // --- Toggle handler ---
  const handleToggle = async (key: keyof (IModuleMeta & IModuleSetting)) => {
    setBusyKey(moduleKey);
    try {
      if (!isMeta && globalEnabled === false) {
        toast.warn(t("globalDisabledWarn", "Globally disabled, cannot activate!"));
        return;
      }
      if (!isMeta) {
        await dispatch(
          updateModuleSetting({
            module: moduleKey,
            [key]: !(asSetting as any)[key],
          } as any)
        ).unwrap();
      } else {
        await dispatch(
          updateModuleMeta({
            name: moduleKey,
            updates: { [key]: !(asMeta as any)[key] },
          })
        ).unwrap();
      }
    } catch (err: any) {
      toast.error(
        t("updateError", "Update error!") + (err?.message ? `: ${err.message}` : "")
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleCardClick = () => {
    onShowDetail?.(module as any, type);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const tenantBadge = (
    <BadgeTenant>
      {asSetting.tenant || t("tenant", "Tenant")}
      {globalEnabled === false && (
        <DisabledWarn title={t("globalDisabled", "Globally disabled")}>
          <AlertCircle size={14} />
        </DisabledWarn>
      )}
    </BadgeTenant>
  );

  const shownRoutes: RouteMeta[] =
    isMeta && Array.isArray(asMeta.routes) && asMeta.routes.length > 0
      ? asMeta.routes.slice(-5)
      : [];

  const isRowDisabled = !isMeta && globalEnabled === false;

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={moduleLabel}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      data-disabled={isRowDisabled}
      aria-disabled={isRowDisabled}
      style={isRowDisabled ? { opacity: 0.5 } : {}}
    >
      <CardHeader>
        <IconWrapper>
          <IconComponent />
        </IconWrapper>

        <ModuleInfo>
          <LabelText title={moduleLabel}>{highlightMatch(moduleLabel, search)}</LabelText>
          <NameText title={moduleKey}>{highlightMatch(moduleKey, search)}</NameText>
        </ModuleInfo>

        <CardBadges>
          {isMeta ? (
            <BadgeGlobal title={t("global", "Global Meta")}>
              <Globe size={13} style={{ marginRight: 2 }} />
              {t("global", "Global")}
            </BadgeGlobal>
          ) : (
            tenantBadge
          )}
        </CardBadges>

        <Actions>
          {isMeta && (
            <TrashButton
              type="button"                  // ✅ submit değil
              onClick={handleDeleteClick}
              title={t("delete", "Delete Module")}
              aria-label={t("delete", "Delete Module")}
              disabled={deleting || busyKey === moduleKey} // ✅ busy iken kilitle
            >
              <Trash2 size={18} />
            </TrashButton>
          )}
        </Actions>
      </CardHeader>

      <Divider />

      {/* --- TOGGLES --- */}
      <StatusGroup>
        {isMeta && "enabled" in asMeta && (
          <StatusItem>
            <span>{t("enabled", "Enabled")}</span>
            <ModuleStatusToggle
              isActive={!!(asMeta as any).enabled}
              onToggle={() => handleToggle("enabled")}
              disabled={busyKey === moduleKey}
            />
          </StatusItem>
        )}

        {!isMeta && (
          <>
            {"enabled" in asSetting && (
              <StatusItem>
                <span>{t("enabled", "Enabled")}</span>
                <ModuleStatusToggle
                  isActive={!!asSetting.enabled && globalEnabled !== false}
                  onToggle={() => handleToggle("enabled")}
                  disabled={busyKey === moduleKey || globalEnabled === false}
                  title={
                    globalEnabled === false
                      ? t(
                          "globalDisabledWarn",
                          "Cannot activate while globally disabled"
                        )
                      : undefined
                  }
                />
              </StatusItem>
            )}
            {"visibleInSidebar" in asSetting && (
              <StatusItem>
                <span>{t("visibleInSidebar", "Sidebar")}</span>
                <ModuleStatusToggle
                  isActive={!!asSetting.visibleInSidebar && globalEnabled !== false}
                  onToggle={() => handleToggle("visibleInSidebar")}
                  disabled={busyKey === moduleKey || globalEnabled === false}
                />
              </StatusItem>
            )}
            {"useAnalytics" in asSetting && (
              <StatusItem>
                <span>{t("useAnalytics", "Analytics")}</span>
                <ModuleStatusToggle
                  isActive={!!asSetting.useAnalytics && globalEnabled !== false}
                  onToggle={() => handleToggle("useAnalytics")}
                  disabled={busyKey === moduleKey || globalEnabled === false}
                />
              </StatusItem>
            )}
            {"showInDashboard" in asSetting && (
              <StatusItem>
                <span>{t("showInDashboard", "Dashboard")}</span>
                <ModuleStatusToggle
                  isActive={!!asSetting.showInDashboard && globalEnabled !== false}
                  onToggle={() => handleToggle("showInDashboard")}
                  disabled={busyKey === moduleKey || globalEnabled === false}
                />
              </StatusItem>
            )}
          </>
        )}
      </StatusGroup>

      <MetaInfo>
        <small>{t("createdAt", "Created at")}:</small>
        <TimeText>
          {"createdAt" in module && (module as any).createdAt
            ? new Date((module as any).createdAt).toLocaleString(lang)
            : "-"}
        </TimeText>
        <small>{t("updatedAt", "Updated at")}:</small>
        <TimeText>
          {"updatedAt" in module && (module as any).updatedAt
            ? new Date((module as any).updatedAt).toLocaleString(lang)
            : "-"}
        </TimeText>
      </MetaInfo>

      {isMeta && shownRoutes.length > 0 && (
        <>
          <Divider />
          <RouteList>
            {shownRoutes.map((r: RouteMeta, idx: number) => (
              <li key={idx}>
                <code>{r.method}</code>
                <span>{r.path}</span>
              </li>
            ))}
            {Array.isArray(asMeta.routes) && asMeta.routes.length > 5 && (
              <li className="more">...{t("andMore", "and more")}</li>
            )}
          </RouteList>
        </>
      )}

      {isMeta && Array.isArray(asMeta.history) && asMeta.history.length > 0 && (
        <>
          <Divider />
          <RouteList>
            <li>
              <strong>{t("history", "Change History")}:</strong>
            </li>
            {asMeta.history.slice(-5).map((h, idx) => (
              <li key={idx}>
                <span>
                  {h.date ? new Date(h.date).toLocaleString(lang) : "-"}
                  {h.version && <b> v{h.version}</b>}
                  {h.by && ` (${h.by})`}
                  {h.note && `: ${h.note}`}
                </span>
              </li>
            ))}
            {asMeta.history.length > 5 && (
              <li className="more">...{t("andMore", "and more")}</li>
            )}
          </RouteList>
        </>
      )}

      <CardFooter>
        <SwaggerLink
          href={`/api-docs/#/${moduleKey}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Globe size={16} />
          {t("swagger", "Swagger")}
        </SwaggerLink>
      </CardFooter>
    </Card>
  );
};

export default ModuleCard;

/* --- styled --- */
const Card = styled.div`
  background: ${({ theme }) => theme.cards.background};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  box-sizing: border-box;
  transition: box-shadow ${({ theme }) => theme.transition.fast};
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    cursor: pointer;
    z-index: 2;
  }
`;
const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;
`;
const IconWrapper = styled.div`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
`;
const ModuleInfo = styled.div`
  flex: 1 1 0;
  min-width: 0;
`;
const CardBadges = styled.div`
  display: flex;
  gap: 0.3rem;
`;
const BadgeTenant = styled.span`
  background: ${({ theme }) => theme.colors.info};
  color: #fff;
  font-size: 11px;
  border-radius: 7px;
  padding: 1px 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
`;
const DisabledWarn = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.danger};
  margin-left: 3px;
  font-size: 12px;
`;
const BadgeGlobal = styled.span`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 11px;
  border-radius: 7px;
  padding: 1px 8px;
  font-weight: 600;
`;
const Actions = styled.div`
  display: flex;
  gap: 0.3rem;
`;
const TrashButton = styled.button.attrs({ type: "button" })`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: ${({ theme }) => theme.colors.danger};
  transition: opacity ${({ theme }) => theme.transition.fast};
  &:hover { opacity: 0.7; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;
const LabelText = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin: 0;
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const NameText = styled.small`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const Highlight = styled.span`
  background-color: ${({ theme }) => theme.colors.warning};
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 0 2px;
  animation: highlightFlash 0.8s ease-in-out;
  @keyframes highlightFlash {
    from { background-color: transparent; }
    to { background-color: ${({ theme }) => theme.colors.warning}; }
  }
`;
const Divider = styled.hr`
  border: none;
  border-top: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  margin: 0.3rem 0;
`;
const StatusGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.7rem 1.2rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;
const MetaInfo = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;
const TimeText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text};
`;
const RouteList = styled.ul`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  li {
    display: flex;
    gap: 0.3rem;
    code {
      font-weight: ${({ theme }) => theme.fontWeights.semiBold};
      color: ${({ theme }) => theme.colors.primary};
      white-space: nowrap;
    }
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &.more {
      font-style: italic;
      opacity: 0.7;
    }
  }
`;
const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;
const SwaggerLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: ${({ theme }) => theme.colors.link};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transition.fast};
  &:hover {
    text-decoration: underline;
    color: ${({ theme }) => theme.colors.linkHover};
  }
`;
