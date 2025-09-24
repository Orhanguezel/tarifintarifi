"use client";
import React, { useMemo, useState, ChangeEvent, FormEvent } from "react";
import styled from "styled-components";
import { useAppDispatch } from "@/store/hooks";
import { batchUpdateModuleSetting } from "@/modules/adminmodules/slices/moduleMaintenanceSlice";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";
import { toast } from "react-toastify";
import { SUPPORTED_LOCALES } from "@/i18n";
import type { TranslatedLabel } from "@/types/common";

type FieldKey =
  | "enabled"
  | "visibleInSidebar"
  | "useAnalytics"
  | "showInDashboard"
  | "roles"
  | "order"
  | "seoOgImage"
  | "seoTitle"
  | "seoDescription"
  | "seoSummary";

const BOOLEAN_FIELDS: FieldKey[] = [
  "enabled",
  "visibleInSidebar",
  "useAnalytics",
  "showInDashboard",
];
const NUMBER_FIELDS: FieldKey[] = ["order"];
const LIST_FIELDS: FieldKey[] = ["roles"];
const SEO_ML_FIELDS: FieldKey[] = ["seoTitle", "seoDescription", "seoSummary"];
const SEO_SINGLE_FIELDS: FieldKey[] = ["seoOgImage"];

const BatchUpdateModuleForm: React.FC = () => {
  const { t } = useI18nNamespace("adminModules", translations);
  const dispatch = useAppDispatch();

  const [moduleName, setModuleName] = useState<string>("");
  const [field, setField] = useState<FieldKey>("enabled");
  const [value, setValue] = useState<boolean | string | number | TranslatedLabel>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const emptyML = useMemo<TranslatedLabel>(
    () =>
      SUPPORTED_LOCALES.reduce(
        (acc, lng) => ({ ...acc, [lng]: "" }),
        {} as TranslatedLabel
      ),
    []
  );

  const handleFieldChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextField = e.target.value as FieldKey;
    setField(nextField);

    if (BOOLEAN_FIELDS.includes(nextField)) setValue(true);
    else if (NUMBER_FIELDS.includes(nextField)) setValue(0);
    else if (LIST_FIELDS.includes(nextField)) setValue("");
    else if (SEO_SINGLE_FIELDS.includes(nextField)) setValue("");
    else if (SEO_ML_FIELDS.includes(nextField)) setValue({ ...emptyML });
  };

  const getInput = () => {
    if (field === "roles") {
      return (
        <StyledInput
          type="text"
          placeholder={t("roles", "Roles (comma separated)")}
          value={typeof value === "string" ? value : ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          disabled={loading}
        />
      );
    }

    if (field === "order") {
      return (
        <StyledInput
          type="number"
          placeholder={t("order", "Order")}
          value={typeof value === "number" ? value : 0}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setValue(Number(e.target.value || 0))
          }
          disabled={loading}
          min={0}
        />
      );
    }

    if (field === "seoOgImage") {
      return (
        <StyledInput
          type="text"
          placeholder={t("seoOgImage", "OG Image URL")}
          value={typeof value === "string" ? value : ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          disabled={loading}
        />
      );
    }

    if (SEO_ML_FIELDS.includes(field)) {
      const v = (value as TranslatedLabel) || emptyML;
      const isTextarea = field === "seoDescription" || field === "seoSummary";
      return (
        <SeoBlock>
          {SUPPORTED_LOCALES.map((lng) => (
            <SeoRow key={lng}>
              <LangBadge title={lng.toUpperCase()}>{lng.toUpperCase()}</LangBadge>
              {isTextarea ? (
                <SeoTextarea
                  rows={2}
                  placeholder={
                    field === "seoDescription"
                      ? t("seoDescription", "SEO Description")
                      : t("seoSummary", "SEO Summary")
                  }
                  value={v[lng] ?? ""}
                  onChange={(e) =>
                    setValue({ ...(v || {}), [lng]: e.target.value })
                  }
                  disabled={loading}
                />
              ) : (
                <StyledInput
                  type="text"
                  placeholder={t("seoTitle", "SEO Title")}
                  value={v[lng] ?? ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setValue({ ...(v || {}), [lng]: e.target.value })
                  }
                  disabled={loading}
                />
              )}
            </SeoRow>
          ))}
        </SeoBlock>
      );
    }

    // boolean
    return (
      <StyledSelect
        value={value ? "1" : "0"}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          setValue(e.target.value === "1")
        }
        disabled={loading}
      >
        <option value="1">{t("yes", "Yes")}</option>
        <option value="0">{t("no", "No")}</option>
      </StyledSelect>
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!moduleName.trim()) return;
    setLoading(true);
    try {
      let sendValue: any = value;

      if (field === "roles" && typeof value === "string") {
        sendValue = Array.from(
          new Set(
            value
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean)
          )
        );
      }

      if (SEO_ML_FIELDS.includes(field)) {
        const ml = (value as TranslatedLabel) || emptyML;
        sendValue = SUPPORTED_LOCALES.reduce(
          (acc, lng) => ({ ...acc, [lng]: ml[lng] ?? "" }),
          {} as TranslatedLabel
        );
      }

      await dispatch(
        batchUpdateModuleSetting({
          module: moduleName.trim(),
          update: { [field]: sendValue },
        })
      ).unwrap();

      setModuleName("");
      if (BOOLEAN_FIELDS.includes(field)) setValue(true);
      else if (NUMBER_FIELDS.includes(field)) setValue(0);
      else if (LIST_FIELDS.includes(field)) setValue("");
      else if (SEO_SINGLE_FIELDS.includes(field)) setValue("");
      else if (SEO_ML_FIELDS.includes(field)) setValue({ ...emptyML });
    } catch (err: any) {
      toast.error(err?.message || t("batchUpdateError", "Batch update failed!"));
    } finally {
      setLoading(false);
    }
  };

  const isSeoML = SEO_ML_FIELDS.includes(field);

  return (
    <PanelCard>
      <Form onSubmit={handleSubmit}>
        <Title>{t("batchUpdate", "Batch Update Module Setting")}</Title>

        <Row>
          <StyledInput
            value={moduleName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setModuleName(e.target.value)
            }
            placeholder={t("moduleName", "Module Name")}
            required
            disabled={loading}
          />

          <StyledSelect value={field} onChange={handleFieldChange} disabled={loading}>
            {BOOLEAN_FIELDS.map((f) => (
              <option key={f} value={f}>
                {t(f, f)}
              </option>
            ))}
            {LIST_FIELDS.map((f) => (
              <option key={f} value={f}>
                {t(f, f)}
              </option>
            ))}
            {NUMBER_FIELDS.map((f) => (
              <option key={f} value={f}>
                {t(f, f)}
              </option>
            ))}
            <optgroup label={t("seoOverrides", "SEO Overrides")}>
              {SEO_SINGLE_FIELDS.concat(SEO_ML_FIELDS).map((f) => (
                <option key={f} value={f}>
                  {t(f, f)}
                </option>
              ))}
            </optgroup>
          </StyledSelect>

          {/* Dynamic input — SEO ML ise tam genişlik satır */}
          {isSeoML ? <FullRow>{getInput()}</FullRow> : getInput()}

          <SubmitButton
            type="submit"
            disabled={loading || !moduleName.trim()}
            aria-busy={loading}
          >
            {loading ? t("saving", "Saving...") : t("update", "Update")}
          </SubmitButton>
        </Row>
      </Form>
    </PanelCard>
  );
};

export default BatchUpdateModuleForm;

/* --- Styles (classicTheme uyumlu ve tam responsive) --- */
const PanelCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: ${({ theme }) => theme.spacings.lg};
  min-width: 270px;
  flex: 1 1 270px;
  margin-bottom: ${({ theme }) => theme.spacings.md};
  display: flex;
  flex-direction: column;
  overflow: hidden; /* taşmayı kes */
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.sm};
`;

const Title = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin-bottom: ${({ theme }) => theme.spacings.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr;        /* ⬅️ her şey alt alta */
  gap: ${({ theme }) => theme.spacings.sm};
  align-items: stretch;
`;

const FullRow = styled.div`
  grid-column: 1 / -1; /* tüm satırı kapla */
  min-width: 0;        /* overflow kır */
`;

const controlBase = `
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 7px 12px;
  border-radius: 7px;
  font-size: 1em;
  border: 1px solid #b4b7c9;
  background: var(--input-bg);
  color: var(--input-fg);
`;

const StyledInput = styled.input`
  ${controlBase}
  --input-bg: ${({ theme }) => theme.inputs.background};
  --input-fg: ${({ theme }) => theme.inputs.text};
`;

const StyledSelect = styled.select`
  ${controlBase}
  --input-bg: ${({ theme }) => theme.inputs.background};
  --input-fg: ${({ theme }) => theme.inputs.text};
`;

const SubmitButton = styled.button`
  justify-self: start;
  background: ${({ theme }) => theme.colors.buttonBackground || theme.colors.primary};
  color: ${({ theme }) => theme.colors.buttonText || theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 8px 22px;
  font-size: 1em;
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  cursor: pointer;
  min-width: 140px;
  transition: background ${({ theme }) => theme.transition.fast};
  &:hover,
  &:focus {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Mobilde tam genişlik */
  ${({ theme }) => theme.media.mobile} {
    width: 100%;
  }
`;

const SeoBlock = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacings.xs};
  max-height: 40vh;       /* çok dil olduğunda taşmasın */
  overflow: auto;
  padding: ${({ theme }) => theme.spacings.xs};
  background: ${({ theme }) => theme.colors.cardBackground};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const SeoRow = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: ${({ theme }) => theme.spacings.xs};
  align-items: center;
  min-width: 0;
`;

const LangBadge = styled.div`
  justify-self: center;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.text};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
`;

const SeoTextarea = styled.textarea`
  ${controlBase}
  --input-bg: ${({ theme }) => theme.inputs.background};
  --input-fg: ${({ theme }) => theme.inputs.text};
  resize: vertical;
  min-height: 64px;
  line-height: 1.4;
  font-family: ${({ theme }) => theme.fonts.body};
`;
