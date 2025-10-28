"use client";

import styled from "styled-components";
import { useMemo, useRef, useState } from "react";
import {
  useAdminListRecipesQuery,
  useAdminDeleteRecipeMutation,
  useAdminPatchStatusMutation,
} from "@/lib/recipes/api.client";
import type { Recipe } from "@/lib/recipes/types";
import RecipeForm from "@/components/admin/recipes/RecipeForm";
import RecipeList from "@/components/admin/recipes/RecipeList";

type Paged = { items: Recipe[]; page: number; limit: number; total: number; totalPages?: number };

function getErrorText(err: unknown): string | undefined {
  const e = err as any;
  return (
    e?.data?.error ||
    e?.error ||
    (typeof e?.status === "number" ? `HTTP ${e.status}` : undefined)
  );
}

export default function AdminRecipesPage() {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshBusy, setRefreshBusy] = useState(false);

  const { data, isLoading, error, refetch } = useAdminListRecipesQuery(
    { page: 1, limit: 50, q: "", category: "", status: undefined },
    { refetchOnMountOrArgChange: true }
  );

  const [del] = useAdminDeleteRecipeMutation();
  const [patchStatus] = useAdminPatchStatusMutation();

  const recipes: Recipe[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? (data as Recipe[]) : ((data as Paged).items ?? []);
  }, [data]);

  const current = useMemo(
    () => (editingId ? recipes.find((r) => r._id === editingId) ?? null : null),
    [recipes, editingId]
  );

  // Listeyi güvenle yenile
  const doRefetch = async () => {
    try {
      setRefreshBusy(true);
      await refetch();
    } finally {
      setRefreshBusy(false);
    }
  };

  return (
    <PageWrap>
      <Header>
        <TitleBlock>
          <h1>Tarifler</h1>
          <Subtitle>Tarif ekle, düzenle ve yayınla</Subtitle>
        </TitleBlock>
        <Right>
          <Counter aria-label="recipe-count">{recipes.length}</Counter>
          <PrimaryBtn
            onClick={() => {
              setEditingId(null);
              setActiveTab("create");
            }}
          >
            + Yeni Tarif
          </PrimaryBtn>
        </Right>
      </Header>

      <Tabs>
        <Tab $active={activeTab === "list"} onClick={() => setActiveTab("list")}>
          Liste
        </Tab>
        <Tab $active={activeTab === "create"} onClick={() => setActiveTab("create")}>
          {editingId ? "Düzenle" : "Oluştur"}
        </Tab>
      </Tabs>

      <Section>
        <SectionHead>
          <h2>{activeTab === "list" ? "Liste" : editingId ? "Düzenle" : "Oluştur"}</h2>
          {activeTab === "list" ? (
            <SmallBtn disabled={isLoading || refreshBusy} onClick={doRefetch} aria-busy={refreshBusy}>
              Yenile
            </SmallBtn>
          ) : (
            <SmallBtn onClick={() => setActiveTab("list")}>Listeye Dön</SmallBtn>
          )}
        </SectionHead>

        <Card>
          {activeTab === "list" && (
            <RecipeList
              recipes={recipes}
              loading={isLoading}
              error={getErrorText(error)}
              onEdit={(id) => {
                setEditingId(id);
                setActiveTab("create");
              }}
              onDelete={async (id) => {
                if (!confirm("Bu tarifi silmek istediğinize emin misiniz?")) return;

                // İyimser kaldırma
                const prev = recipes.slice();
                try {
                  await del({ id }).unwrap();
                  await doRefetch();
                } catch {
                  // rollback
                  // (Liste server’dan yeniden çekileceği için çoğu durumda gerek kalmaz,
                  //  ama local UI anında geri gelsin istersen state tutup geri koyabilirsin)
                  alert("Silme başarısız oldu.");
                }
              }}
              onTogglePublish={async (id, isPublished) => {
                // İyimser toggle
                try {
                  await patchStatus({ id, isPublished: !isPublished }).unwrap();
                } catch {
                  alert("Yayın durumunu güncelleyemedik.");
                } finally {
                  await doRefetch();
                }
              }}
            />
          )}

          {activeTab === "create" && (
            <RecipeForm
              mode={editingId ? "edit" : "create"}
              initial={current}
              onDone={async () => {
                setEditingId(null);
                setActiveTab("list");
                await doRefetch();
              }}
              onCancel={() => {
                setEditingId(null);
                setActiveTab("list");
              }}
            />
          )}
        </Card>
      </Section>
    </PageWrap>
  );
}

/* ---- styled (classic theme) ---- */
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
const Tabs = styled.div`display:flex; gap:${({ theme }) => theme.spacings.xs}; margin-bottom:${({ theme }) => theme.spacings.md};`;
const Tab = styled.button<{ $active?: boolean }>`
  padding:8px 12px; border-radius:${({ theme }) => theme.radii.pill};
  background:${({ $active, theme }) => ($active ? theme.colors.primaryLight : theme.colors.cardBackground)};
  color:${({ theme }) => theme.colors.text};
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  cursor:pointer;
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
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.buttons.primary.backgroundHover};
  padding:8px 12px; border-radius:${({theme})=>theme.radii.md}; cursor:pointer;
`;
const SmallBtn = styled.button`
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:6px 10px; border-radius:${({theme})=>theme.radii.md}; cursor:pointer;
`;
