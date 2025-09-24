"use client";

import styled from "styled-components";
import { useMemo, useState } from "react";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/team/locales";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { SupportedLocale } from "@/types/common";
import { SUPPORTED_LOCALES } from "@/types/common";

import {
  createTeam,
  updateTeam,
  deleteTeam,
  togglePublishTeam,
} from "@/modules/team/slice/teamSlice";

import type { ITeam } from "@/modules/team/types";
import { TeamList,TeamForm } from "@/modules/team";


/* --- helpers --- */
const getUILang = (lng?: string): SupportedLocale => {
  const two = (lng || "").slice(0, 2).toLowerCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(two)
    ? (two as SupportedLocale)
    : "tr";
};

export default function AdminTeamPage() {
  const { i18n, t } = useI18nNamespace("team", translations);
  const lang = useMemo<SupportedLocale>(() => getUILang(i18n?.language), [i18n?.language]);

  const dispatch = useAppDispatch();

  // Store’dan okuma (fetch parent’ta)
  const { teamAdmin, loading, error } = useAppSelector((s) => s.team);
  const team = Array.isArray(teamAdmin) ? teamAdmin : [];

  // UI state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ITeam | null>(null);

  // Actions
  const handleSubmit = async (formData: FormData, id?: string) => {
    try {
      if (id) {
        await dispatch(updateTeam({ id, formData }) as any).unwrap();
      } else {
        await dispatch(createTeam(formData) as any).unwrap();
      }
      setEditingItem(null);
      setIsFormOpen(false);
    } catch {
      /* hata slice’ta yönetiliyor */
    }
  };

  const handleDelete = async (id: string) => {
    const msg = t("confirm.delete_team", "Bu makaleyi silmek istediğinize emin misiniz?");
    if (window.confirm(msg)) {
      try {
        await dispatch(deleteTeam(id) as any).unwrap();
      } catch {}
    }
  };

  const handleTogglePublish = (id: string, isPublished: boolean) => {
    dispatch(togglePublishTeam({ id, isPublished: !isPublished }) as any);
  };

  const openCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };
  const openEdit = (item: ITeam) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };
  const closeForm = () => {
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const count = team?.length ?? 0;

  return (
    <PageWrap>
      <Header>
        <TitleBlock>
          <h1>{t("admin.title", "Team Articles")}</h1>
          <Subtitle>{t("admin.subtitle", "Create, organize and publish your Team content")}</Subtitle>
        </TitleBlock>
        <Right>
          <Counter aria-label="team-count">{count}</Counter>
          <PrimaryBtn onClick={openCreate}>+ {t("create", "Create")}</PrimaryBtn>
        </Right>
      </Header>

      <Section>
        <SectionHead>
          <h2>{t("list", "List")}</h2>
          <SmallBtn disabled>{t("managedByParent", "Managed by parent fetch")}</SmallBtn>
        </SectionHead>

        <Card>
          <TeamList
            team={team}
            lang={lang}
            loading={loading}
            error={error}
            onEdit={openEdit}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
          />
        </Card>
      </Section>

      {/* Form (modal benzeri) */}
      <TeamForm
        isOpen={isFormOpen}
        onClose={closeForm}
        editingItem={editingItem}  // <-- initial yerine editingItem
        onSubmit={handleSubmit}
      />
    </PageWrap>
  );
}

/* ---- styled ---- */
const PageWrap = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xl};
`;
const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacings.lg};
  ${({ theme }) => theme.media.mobile} {
    flex-direction: column; align-items: flex-start; gap: ${({ theme }) => theme.spacings.sm};
  }
`;
const TitleBlock = styled.div`display:flex; flex-direction:column; gap:4px; h1{margin:0;}`;
const Subtitle = styled.p`margin:0; color:${({theme})=>theme.colors.textSecondary}; font-size:${({theme})=>theme.fontSizes.sm};`;
const Right = styled.div`display:flex; gap:${({ theme }) => theme.spacings.sm}; align-items:center;`;
const Counter = styled.span`
  padding: 6px 10px; border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;
const Section = styled.section`margin-top: ${({ theme }) => theme.spacings.sm};`;
const SectionHead = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:${({ theme }) => theme.spacings.sm};
`;
const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  padding: ${({ theme }) => theme.spacings.lg};
`;
const PrimaryBtn = styled.button`
  background:${({theme})=>theme.buttons.primary.background};
  color:${({theme})=>theme.buttons.primary.text};
  border:${({theme})=>theme.borders.thin} transparent;
  padding:8px 12px; border-radius:${({theme})=>theme.radii.md}; cursor:pointer;
  transition: opacity ${({ theme }) => theme.transition.normal};
  &:hover { opacity: ${({ theme }) => theme.opacity.hover}; background:${({theme})=>theme.buttons.primary.backgroundHover}; }
`;
const SmallBtn = styled.button`
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:6px 10px; border-radius:${({theme})=>theme.radii.md}; cursor:pointer;
`;
