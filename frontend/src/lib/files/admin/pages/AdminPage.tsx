"use client";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { translations } from "@/modules/files";
import { fetchAllFilesAdmin, clearFileMessages } from "@/modules/files/slice/filesSlice";
import { FileList, FileUpload } from "@/modules/files";

export default function AdminFilesPage() {
  const { t } = useI18nNamespace("files", translations);
  const dispatch = useAppDispatch();
  const { items, loading, error, successMessage } = useAppSelector(s => (s as any).files);

  const [loaded, setLoaded] = useState(false);

  useEffect(()=>{ dispatch(fetchAllFilesAdmin()).finally(()=>setLoaded(true)); },[dispatch]);

  useEffect(()=>{
    if (successMessage) toast.success(successMessage);
    if (error) toast.error(error);
    if (successMessage || error) dispatch(clearFileMessages());
  },[successMessage, error, dispatch]);

  const count = useMemo(()=> items?.length ?? 0, [items]);

  return (
    <PageWrap>
      <Header>
        <h1>{t("title","Files")}</h1>
        <Right>
          <Counter>{count}</Counter>
          <FileUpload />
        </Right>
      </Header>

      <Section>
        <SectionHead>
          <h2>{t("list","Files")}</h2>
          <SmallBtn onClick={()=>dispatch(fetchAllFilesAdmin())} disabled={loading || !loaded}>
            {t("refresh","Refresh")}
          </SmallBtn>
        </SectionHead>
        <Card>
          <FileList items={items || []} loading={loading && loaded} />
        </Card>
      </Section>
    </PageWrap>
  );
}

/* styled */
const PageWrap = styled.div`
  max-width:${({theme})=>theme.layout.containerWidth};
  margin:0 auto;
  padding:${({theme})=>theme.spacings.xl};
`;
const Header = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:${({theme})=>theme.spacings.lg};
  ${({theme})=>theme.media.mobile}{flex-direction:column;align-items:flex-start;gap:${({theme})=>theme.spacings.sm};}
`;
const Right = styled.div`display:flex;gap:${({theme})=>theme.spacings.sm};align-items:center;flex-wrap:wrap;`;
const Counter = styled.span`
  padding:6px 10px;border-radius:${({theme})=>theme.radii.pill};
  background:${({theme})=>theme.colors.backgroundAlt};
  font-weight:${({theme})=>theme.fontWeights.medium};
`;
const Section = styled.section`margin-top:${({theme})=>theme.spacings.xl};`;
const SectionHead = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:${({theme})=>theme.spacings.sm};
`;
const Card = styled.div`
  background:${({theme})=>theme.colors.cardBackground};
  border-radius:${({theme})=>theme.radii.lg};
  box-shadow:${({theme})=>theme.cards.shadow};
  padding:${({theme})=>theme.spacings.lg};
`;
const SmallBtn = styled.button`
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:6px 10px;border-radius:${({theme})=>theme.radii.md};cursor:pointer;
`;
