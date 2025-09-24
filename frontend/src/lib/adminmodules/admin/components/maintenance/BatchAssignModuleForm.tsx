"use client";
import React, { useState } from "react";
import styled from "styled-components";
import { useAppDispatch } from "@/store/hooks";
import { toast } from "react-toastify";
import {
  assignAllModulesToTenant,
  assignModuleToAllTenants,
} from "@/modules/adminmodules/slices/moduleMaintenanceSlice";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/adminmodules";

const slugify = (raw: string) =>
  raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const BatchAssignModuleForm: React.FC = () => {
  const { t } = useI18nNamespace("adminModules", translations);
  const dispatch = useAppDispatch();
  const [tenant, setTenant] = useState("");
  const [module, setModule] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssignAllToTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = tenant.trim();
    if (!raw) return toast.info(t("tenantRequired", "Please enter a tenant."));
    const tenantSlug = /[^a-z0-9-]/i.test(raw) ? slugify(raw) : raw.toLowerCase();

    setLoading(true);
    try {
      const res = await dispatch(assignAllModulesToTenant(tenantSlug)).unwrap();
      setTenant("");
      toast.success(res?.message || t("assignSuccess", "Modules assigned to tenant!"));
    } catch (err: any) {
      toast.error((err?.message || err) ?? t("assignError", "Failed to assign modules"));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignModuleToAllTenants = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const modKey = module.trim();
    if (!modKey) return toast.info(t("moduleRequired", "Please enter a module key."));

    setLoading(true);
    try {
      const res = await dispatch(assignModuleToAllTenants(modKey)).unwrap();
      setModule("");
      toast.success(res?.message || t("assignSuccessAll", "Module assigned to all tenants!"));
    } catch (err: any) {
      toast.error((err?.message || err) ?? t("assignError", "Failed to assign modules"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelCard>
      <Title>{t("batchAssign", "Batch Assign")}</Title>

      <AssignForm onSubmit={handleAssignAllToTenant}>
        <label htmlFor="tenant-input">{t("tenantName", "Tenant name")}</label>
        <input
          id="tenant-input"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          placeholder={t("tenantPlaceholder", "e.g. ensotek")}
          disabled={loading}
          autoComplete="off"
        />
        <ActionButton type="submit" disabled={loading || !tenant.trim()}>
          {loading ? t("processing", "Processing…") : t("assignAllToTenant", "Assign All Modules to Tenant")}
        </ActionButton>
      </AssignForm>

      <AssignForm onSubmit={handleAssignModuleToAllTenants}>
        <label htmlFor="module-input">{t("moduleName", "Module name")}</label>
        <input
          id="module-input"
          value={module}
          onChange={(e) => setModule(e.target.value)}
          placeholder={t("modulePlaceholder", "e.g. apartmentcategory")}
          disabled={loading}
          autoComplete="off"
        />
        <ActionButton type="submit" disabled={loading || !module.trim()}>
          {loading ? t("processing", "Processing…") : t("assignToAllTenants", "Assign Module to All Tenants")}
        </ActionButton>
      </AssignForm>
    </PanelCard>
  );
};

export default BatchAssignModuleForm;

/* --- Styles --- */
const PanelCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: 20px;
  width: 100%;
  max-width: 420px;          /* masaüstünde dar kart */
  flex: 1 1 280px;
  min-width: 0;              /* overflow'u engelle */
  margin-bottom: 22px;
  display: flex;
  flex-direction: column;
  gap: 22px;

  /* Mobilde tam genişlik + piksel padding (vw yok!) */
  ${({ theme }) => theme.media.xsmall} {
    max-width: 100%;
    padding: 16px;
    gap: 16px;
  }
`;

const Title = styled.div`
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin-bottom: 6px;
  color: ${({ theme }) => theme.colors.text};
`;

const AssignForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.inputBorder};
    border-radius: ${({ theme }) => theme.radii.sm};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    background: ${({ theme }) => theme.inputs.background};
    color: ${({ theme }) => theme.inputs.text};
    outline: none;
  }
`;

const ActionButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 10px 12px;
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  width: 100%;
  margin-top: 4px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.fast};
  &:hover,
  &:focus {
    background: ${({ theme }) =>
      theme.buttons?.primary?.backgroundHover || theme.colors.primaryHover};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
