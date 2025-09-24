"use client";
import React, { useRef } from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { importModuleMetas } from "@/modules/adminmodules/slices/moduleMetaSlice";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";
import { toast } from "react-toastify";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const ModuleJsonImportExportPanel: React.FC = () => {
  const { t } = useI18nNamespace("adminModules", translations);
  const dispatch = useAppDispatch();
  const { modules = [] } = useAppSelector((s) => s.moduleMeta);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = "module-json-file-input";

  // Export as JSON
  const handleExport = () => {
    try {
      const json = JSON.stringify(modules, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `module-metas-${date}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t("exported", "Exported successfully!"));
    } catch (e: any) {
      toast.error(
        t("exportFailed", "Export failed!") + (e?.message ? `: ${e.message}` : "")
      );
    }
  };

  // Import from JSON
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    try {
      if (!file) return;

      if (file.type && file.type !== "application/json") {
        toast.error(t("importInvalid", "Invalid JSON file."));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          t("fileTooLarge", "File is too large (max 2MB).")
        );
        return;
      }

      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        toast.error(t("importInvalid", "Invalid JSON file."));
        return;
      }
      if (parsed.length === 0) {
        toast.error(t("emptyList", "Nothing to import."));
        return;
      }

      // İsteğe bağlı min. doğrulama: name alanı kontrolü
      const invalidIndex = parsed.findIndex((x) => !x || typeof x.name !== "string");
      if (invalidIndex !== -1) {
        toast.error(
          t("importInvalid", "Invalid JSON file.") +
            ` (index ${invalidIndex})`
        );
        return;
      }

      await dispatch(importModuleMetas(parsed)).unwrap();
      toast.success(
        t("imported", "Imported successfully!") + ` (${parsed.length})`
      );
    } catch (err: any) {
      toast.error(
        t("importFailed", "Import failed!") +
          (err?.message ? `: ${err.message}` : "")
      );
    } finally {
      // aynı dosyayı yeniden seçebilsin
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <Title>{t("jsonExportImport", "JSON Export / Import")}</Title>
      <Actions>
        <ExportButton type="button" onClick={handleExport}>
          {t("exportJson", "Export as JSON")}
        </ExportButton>

        {/* Label-for ile erişilebilir import */}
        <ImportLabel htmlFor={inputId}>
          {t("importJson", "Import from JSON")}
        </ImportLabel>
        <HiddenFileInput
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
        />
      </Actions>

      <Helper>
        {t(
          "jsonExportImportHint",
          "Export all module definitions as a backup or import a full set from JSON."
        )}
      </Helper>
    </Card>
  );
};

export default ModuleJsonImportExportPanel;

/* --- Styled Components --- */
const Card = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
  padding: 22px 18px 18px 18px;
  min-width: 270px;
  flex: 1 1 270px;
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 1.05em;
  margin-bottom: 13px;
  color: ${({ theme }) => theme.colors.text};
`;

const Actions = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 9px;
  flex-wrap: wrap;

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
  }
`;

const ExportButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 7px 18px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.13s;
  &:hover,
  &:focus {
    background: ${({ theme }) => theme.colors.primaryHover || "#1890ff"};
  }
`;

const ImportLabel = styled.label`
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.primary};
  border: 1.2px dashed ${({ theme }) => theme.colors.primary};
  border-radius: 6px;
  padding: 7px 18px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.13s;
  &:hover,
  &:focus {
    background: ${({ theme }) => theme.colors.background};
  }
  text-decoration: underline;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const Helper = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  margin-top: 8px;
`;
