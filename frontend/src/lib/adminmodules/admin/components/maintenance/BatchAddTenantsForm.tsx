"use client";
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { SUPPORTED_LOCALES } from "@/i18n";
import { createTenant } from "@/modules/tenants/slice/tenantSlice";
import { useAppDispatch } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";
import { toast } from "react-toastify";

const slugify = (raw: string) =>
  raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const BatchAddTenantsForm: React.FC = () => {
  const { t } = useI18nNamespace("adminModules", translations);
  const dispatch = useAppDispatch();

  const [tenantNames, setTenantNames] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Girilen metni tek bir yerde normalize et (trim, boşları at, uniq)
  const parsedTenants = useMemo(() => {
    const list = tenantNames
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    // dedupe (case-insensitive)
    const set = new Set(list.map((x) => x.toLowerCase()));
    // ilk orijinal değerleri korumak için sırayla topla
    const uniq: string[] = [];
    list.forEach((original) => {
      const key = original.toLowerCase();
      if (set.has(key) && !uniq.find((u) => u.toLowerCase() === key)) {
        uniq.push(original);
      }
    });
    return uniq;
  }, [tenantNames]);

  const handleBatchAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!parsedTenants.length) {
      toast.info(t("batchAddEmpty", "Please enter at least one tenant name."));
      return;
    }

    setLoading(true);
    let ok = 0;
    const failed: Array<{ name: string; reason?: string }> = [];

    try {
      // Her tenant için FormData oluştur ve dispatch et
      for (const tenant of parsedTenants) {
        const formData = new FormData();

        // Çok dilli isimler — hepsine aynı değeri basıyoruz (isteğe göre özelleştirilebilir)
        SUPPORTED_LOCALES.forEach((locale) =>
          formData.append(`name[${locale}]`, tenant)
        );

        // Güvenli slug
        const slug = slugify(tenant);
        if (!slug) {
          failed.push({ name: tenant, reason: "invalid-slug" });
          continue;
        }
        formData.append("slug", slug);

        try {
          await dispatch(createTenant(formData)).unwrap();
          ok++;
        } catch (err: any) {
          failed.push({
            name: tenant,
            reason:
              err?.message ||
              (typeof err === "string" ? err : t("unknownError", "Unknown error")),
          });
        }
      }

      // Sonuç bildirimi
      if (ok > 0) {
        toast.success(
          t("batchAddSuccess", "Tenants added successfully!") +
            ` (${ok}/${parsedTenants.length})`
        );
      }
      if (failed.length > 0) {
        const msg =
          failed.length > 3
            ? failed
                .slice(0, 3)
                .map((f) => f.name)
                .join(", ") + "…"
            : failed.map((f) => f.name).join(", ");
        toast.error(
          t("batchAddError", "Batch add failed!") +
            ` (${failed.length})` +
            (msg ? ` — ${msg}` : "")
        );
      }

      // Hepsi bittiyse input’u temizle
      if (ok && failed.length === 0) setTenantNames("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelCard>
      <Title>{t("batchAddTenants", "Batch Add Tenants")}</Title>
      <StyledForm onSubmit={handleBatchAdd}>
        <TextArea
          rows={4}
          value={tenantNames}
          onChange={(e) => setTenantNames(e.target.value)}
          placeholder={t(
            "tenantNames",
            "Tenant names (comma or line separated)"
          )}
          disabled={loading}
          aria-label={t("tenantNames", "Tenant names")}
        />
        <RowHint>
          <SmallMuted>
            {t("parsedCount", "Parsed")}: {parsedTenants.length}
          </SmallMuted>
          <SmallMuted>
            {t(
              "slugHint",
              "Non-ASCII characters will be normalized for slugs."
            )}
          </SmallMuted>
        </RowHint>
        <AddButton type="submit" disabled={loading || parsedTenants.length === 0}>
          {loading ? t("adding", "Adding...") : t("add", "Add")}
        </AddButton>
      </StyledForm>
      <HelperText>
        {t(
          "batchAddHint",
          "You can enter multiple tenant names, separated by comma or newline."
        )}
      </HelperText>
    </PanelCard>
  );
};

export default BatchAddTenantsForm;

/* ---------------- styled ---------------- */
const PanelCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 22px 22px 16px 22px;
  min-width: 270px;
  flex: 1 1 270px;
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 1.08em;
  margin-bottom: 13px;
  color: ${({ theme }) => theme.colors.text};
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RowHint = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
`;

const SmallMuted = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 66px;
  padding: 9px 12px;
  border: 1.3px solid ${({ theme }) => theme.colors.border};
  border-radius: 7px;
  font-size: 15px;
  font-family: inherit;
  background: ${({ theme }) => theme.inputs.background};
  color: ${({ theme }) => theme.inputs.text};
  resize: vertical;
`;

const AddButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 0;
  font-weight: 600;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.14s;
  margin-top: 5px;
  &:hover,
  &:focus {
    background: ${({ theme }) => theme.buttons?.primary?.backgroundHover || theme.colors.primaryHover || "#1890ff"};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const HelperText = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  margin-top: 7px;
`;
