"use client";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "../../locales";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  SectionTable,
  SectionEditModal,
  SectionFilterBar,
  SectionBulkActions,
  SectionSnackbar,
} from "@/modules/section";
import {
  clearSectionSettingMessages,
  updateSectionSetting,
  createSectionSetting,
  deleteSectionSetting,
} from "@/modules/section/slices/sectionSettingSlice";
import {
  clearSectionMetaMessages,
  deleteSectionMeta,
} from "@/modules/section/slices/sectionMetaSlice";
import type { ISectionMeta, ISectionSetting } from "@/modules/section/types";
import type { SupportedLocale } from "@/types/common";

export default function AdminSectionPage() {
  const { i18n, t } = useI18nNamespace("section", translations);
  const lang = (i18n.language?.slice(0, 2)) as SupportedLocale;

  // Store
  const {
    metasAdmin = [],
    loading: loadingMetas,
    error: errorMetas,
    successMessage: metaSuccess,
  } = useAppSelector((s) => s.sectionMeta);
  const {
    settingsAdmin = [],
    loading: loadingSettings,
    error: errorSettings,
    successMessage: settingSuccess,
  } = useAppSelector((s) => s.sectionSetting);
  const dispatch = useAppDispatch();

  // Local UI state
  const [search, setSearch] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [editTarget, setEditTarget] = useState<{ meta: ISectionMeta; setting?: ISectionSetting } | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; type: "success" | "error" | "info"; open: boolean }>({
    message: "", type: "success", open: false,
  });

  // Derived data
  const filteredMetas = useMemo(
    () =>
      metasAdmin.filter((meta: ISectionMeta) => {
        const label = meta.label?.[lang] || meta.sectionKey;
        const matchesSearch = label.toLowerCase().includes(search.toLowerCase());
        const setting = settingsAdmin.find((s: ISectionSetting) => s.sectionKey === meta.sectionKey);
        const enabledVal = setting?.enabled ?? meta.defaultEnabled;
        const matchesEnabled =
          enabledFilter === "all" ? true : enabledFilter === "enabled" ? enabledVal : !enabledVal;
        return matchesSearch && matchesEnabled;
      }),
    [metasAdmin, settingsAdmin, search, enabledFilter, lang]
  );

  const totalCount = metasAdmin.length;
  const filteredCount = filteredMetas.length;
  const selectedCount = selectedKeys.length;

  // Toasts & slice message clearing
  useEffect(() => {
    if (settingSuccess) toast.success(settingSuccess);
    if (metaSuccess) toast.success(metaSuccess);
    if (errorMetas) toast.error(errorMetas);
    if (errorSettings) toast.error(errorSettings);

    if (loadingMetas || loadingSettings) {
      // kısa bilgi — spam'i önlemek için tek info
      toast.dismiss();
      toast.info(t("loading", "Loading..."), { autoClose: 700 });
    }

    if (settingSuccess || errorSettings) dispatch(clearSectionSettingMessages());
    if (errorMetas || metaSuccess) dispatch(clearSectionMetaMessages());
  }, [
    settingSuccess,
    metaSuccess,
    loadingSettings,
    errorSettings,
    errorMetas,
    loadingMetas,
    dispatch,
    t,
  ]);

  // Select Row
  const handleSelect = useCallback((sectionKey: string) => {
    setSelectedKeys((prev) =>
      prev.includes(sectionKey) ? prev.filter((k) => k !== sectionKey) : [...prev, sectionKey]
    );
  }, []);

  // Edit Modal
  const handleEdit = useCallback((meta: ISectionMeta, setting?: ISectionSetting) => {
    setEditTarget({ meta, setting });
  }, []);

  // Save (CREATE or UPDATE)
  const handleSaveEdit = useCallback(
    async (data: Partial<ISectionSetting>) => {
      if (!editTarget) return;
      const sectionKey = editTarget.meta.sectionKey;
      const payload: Partial<ISectionSetting> = { ...data, sectionKey };
      Object.keys(payload).forEach((k) => (payload as any)[k] === undefined && delete (payload as any)[k]);

      try {
        if (editTarget.setting) {
          await dispatch(updateSectionSetting({ sectionKey, data: payload })).unwrap();
          setSnackbar({ message: t("success.saved", "Saved!"), type: "success", open: true });
        } else {
          await dispatch(createSectionSetting(payload)).unwrap();
          setSnackbar({ message: t("success.created", "Created!"), type: "success", open: true });
        }
      } catch (err: any) {
        setSnackbar({ message: err?.message || t("error", "Error!"), type: "error", open: true });
      }
      setEditTarget(null);
    },
    [dispatch, editTarget, t]
  );

  // Bulk Delete
  const handleBulkDelete = useCallback(
    async (selected: string[]) => {
      const toDelete = selected
        .map((sectionKey) => {
          const setting = settingsAdmin.find((s) => s.sectionKey === sectionKey);
          return { sectionKey, setting };
        })
        .filter((item) => !!item.sectionKey);

      if (toDelete.length === 0) {
        setSnackbar({
          message: t("error.noSelectedToDelete", "No selected settings to delete!"),
          type: "error",
          open: true,
        });
        return;
      }
      try {
        for (const { sectionKey, setting } of toDelete) {
          if (setting) {
            await dispatch(deleteSectionSetting({ sectionKey })).unwrap();
          }
          await dispatch(deleteSectionMeta(sectionKey)).unwrap();
        }
        setSnackbar({ message: t("success.bulkDeleted", "Selected deleted!"), type: "success", open: true });
        setSelectedKeys([]);
      } catch (err: any) {
        setSnackbar({ message: err?.message || t("error", "Error!"), type: "error", open: true });
      }
    },
    [dispatch, settingsAdmin, t]
  );

  // Bulk Enable
  const handleBulkEnable = useCallback(
    async (selected: string[]) => {
      try {
        for (const sectionKey of selected) {
          const setting = settingsAdmin.find((s) => s.sectionKey === sectionKey);
          if (setting) {
            await dispatch(updateSectionSetting({ sectionKey, data: { enabled: true } })).unwrap();
          } else {
            const meta = metasAdmin.find((m) => m.sectionKey === sectionKey);
            if (meta) {
              await dispatch(createSectionSetting({ sectionKey, enabled: true })).unwrap();
            }
          }
        }
        setSnackbar({ message: t("success.bulkEnabled", "Selected enabled!"), type: "success", open: true });
        setSelectedKeys([]);
      } catch (err: any) {
        setSnackbar({ message: err?.message || t("error", "Error!"), type: "error", open: true });
      }
    },
    [dispatch, metasAdmin, settingsAdmin, t]
  );

  // Bulk Disable
  const handleBulkDisable = useCallback(
    async (selected: string[]) => {
      try {
        for (const sectionKey of selected) {
          const setting = settingsAdmin.find((s) => s.sectionKey === sectionKey);
          if (setting) {
            await dispatch(updateSectionSetting({ sectionKey, data: { enabled: false } })).unwrap();
          }
        }
        setSnackbar({ message: t("success.bulkDisabled", "Selected disabled!"), type: "success", open: true });
        setSelectedKeys([]);
      } catch (err: any) {
        setSnackbar({ message: err?.message || t("error", "Error!"), type: "error", open: true });
      }
    },
    [dispatch, settingsAdmin, t]
  );

  // Tekli sil
  const handleDeleteSection = useCallback(
    async (meta: ISectionMeta, setting?: ISectionSetting) => {
      try {
        if (setting) {
          await dispatch(deleteSectionSetting({ sectionKey: setting.sectionKey })).unwrap();
        }
        await dispatch(deleteSectionMeta(meta.sectionKey)).unwrap();
        setSnackbar({ message: t("success.deleted", "Deleted!"), type: "success", open: true });
      } catch (err: any) {
        setSnackbar({ message: err?.message || t("error", "Error!"), type: "error", open: true });
      }
    },
    [dispatch, t]
  );

  return (
    <PageWrap>
      <Header>
        <TitleBlock>
          <h1>{t("section.title", "Section Management")}</h1>
          <Subtitle>
            {t("section.subtitle", "Create, organize and control visibility of your sections")}
          </Subtitle>
        </TitleBlock>
        <Right>
          <Counter title={t("total", "Total")}>
            {filteredCount}/{totalCount}
          </Counter>
          {selectedCount > 0 && <Counter title={t("selected", "Selected")}>{selectedCount}</Counter>}
        </Right>
      </Header>

      <Card>
        <SectionFilterBar
          search={search}
          setSearch={setSearch}
          enabledFilter={enabledFilter}
          setEnabledFilter={setEnabledFilter}
        />
      </Card>

      <SectionBulkActions
        selected={selectedKeys}
        onDelete={handleBulkDelete}
        onEnable={handleBulkEnable}
        onDisable={handleBulkDisable}
      />

      <Card>
        <SectionTable
          metasAdmin={filteredMetas}
          settings={settingsAdmin}
          onEdit={handleEdit}
          onDelete={handleDeleteSection}
          onSelect={handleSelect}
          selectedKeys={selectedKeys}
        />
      </Card>

      <SectionEditModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        meta={editTarget?.meta ?? ({} as ISectionMeta)}
        setting={editTarget?.setting}
        onSave={handleSaveEdit}
      />

      <SectionSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </PageWrap>
  );
}

/* ---- styled (global admin patern) ---- */
const PageWrap = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xl};

  ${({ theme }) => theme.media.small} {
    padding: ${({ theme }) => theme.spacings.md};
  }
`;
const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacings.lg};
  ${({ theme }) => theme.media.mobile} {
    flex-direction: column; align-items: flex-start; gap: ${({ theme }) => theme.spacings.sm};
  }
`;
const TitleBlock = styled.div`display:flex; flex-direction:column; gap:4px; h1{ margin:0; }`;
const Subtitle = styled.p`
  margin:0; color:${({theme})=>theme.colors.textSecondary};
  font-size:${({theme})=>theme.fontSizes.sm};
`;
const Right = styled.div`display:flex; gap:${({ theme }) => theme.spacings.sm}; align-items:center;`;
const Counter = styled.span`
  padding: 6px 10px; border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;
const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: ${({ theme }) => theme.spacings.lg};
  margin-bottom: ${({ theme }) => theme.spacings.lg};
`;
