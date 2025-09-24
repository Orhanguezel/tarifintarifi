"use client";

import { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  fetchAllSubscribers,
  deleteSubscriber,
  clearNewsletterState,
  verifySubscriber,
  sendBulkNewsletter,
  sendSingleNewsletter,
} from "@/modules/newsletter/slice/newsletterSlice";
import type { INewsletter } from "@/modules/newsletter/types";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/newsletter/locales";
import { toast } from "react-toastify";

// Alt componentler
import {
  SubscriberList,
  SubscriberModal,
  BulkSendModal,
  SingleSendModal,
  PreviewModal,
} from "@/modules/newsletter";

export default function AdminNewsletterPage() {
  // type-safe t
  const { t: tBase } = useI18nNamespace("newsletter", translations);
  const t = (key: string, defaultValue?: string, vars?: Record<string, any>) =>
    tBase(key, { ...vars, defaultValue });

  const dispatch = useAppDispatch();

  // Redux state
  const subscribers = useAppSelector((s) => s.newsletter.subscribersAdmin);
  const loading = useAppSelector((s) => s.newsletter.loading);
  const error = useAppSelector((s) => s.newsletter.error);
  const successMessage = useAppSelector((s) => s.newsletter.successMessage);
  const bulkStatus = useAppSelector((s) => s.newsletter.bulkStatus);
  const bulkResult = useAppSelector((s) => s.newsletter.bulkResult);
  const singleStatus = useAppSelector((s) => s.newsletter.singleStatus);

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [bulkModal, setBulkModal] = useState(false);
  const [singleModal, setSingleModal] = useState<INewsletter | null>(null);
  const [previewModal, setPreviewModal] = useState<{ subject: string; html: string } | null>(null);

  // ilk fetch
  useEffect(() => {
    dispatch(fetchAllSubscribers());
  }, [dispatch]);

  // toastlar
  useEffect(() => {
    if (successMessage) toast.success(successMessage);
    if (error) toast.error(error);
    if (successMessage || error) dispatch(clearNewsletterState());
  }, [successMessage, error, dispatch]);

  useEffect(() => {
    return () => { dispatch(clearNewsletterState()); };
  }, [dispatch]);

  // handlers
  const handleDelete = async (id: string) => {
    const confirmMsg = t("admin.confirmDelete", "Bu aboneyi silmek istediğinize emin misiniz?");
    if (window.confirm(confirmMsg)) {
      await dispatch(deleteSubscriber(id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleVerify = async (id: string) => {
    await dispatch(verifySubscriber(id));
    toast.success(t("admin.verified", "Abone onaylandı!"));
  };

  const handleSingleSend = (sub: INewsletter) => setSingleModal(sub);

  const filtered = useMemo(
    () => subscribers.filter((s) => s.email.toLowerCase().includes(search.toLowerCase())),
    [subscribers, search]
  );

  const selectedSubscriber = useMemo(
    () => subscribers.find((s) => s._id === selectedId),
    [subscribers, selectedId]
  );

  const count = subscribers?.length ?? 0;

  return (
    <PageWrap>
      {/* Header — ortak patern */}
      <Header>
        <TitleBlock>
          <h1>{t("admin.title", "E-Bülten Aboneleri")}</h1>
          <Subtitle>{t("admin.subtitle", "Aboneleri görüntüleyin, doğrulayın ve toplu/tekil bülten gönderin")}</Subtitle>
        </TitleBlock>
        <Right>
          <Counter aria-label="subscriber-count">{count}</Counter>
          <PrimaryBtn onClick={() => setBulkModal(true)}>
            + {t("admin.bulkSend", "Toplu Gönderim")}
          </PrimaryBtn>
        </Right>
      </Header>

      <Section>
        <SectionHead>
          <h2>{t("list", "List")}</h2>
          <SmallBtn onClick={() => dispatch(fetchAllSubscribers())} disabled={loading}>
            {t("refresh", "Refresh")}
          </SmallBtn>
        </SectionHead>

        <Card>
          {/* Arama kutusu */}
          <Controls>
            <Input
              placeholder={t("admin.search", "E-posta ile ara...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t("admin.search", "E-posta ile ara...")}
            />
          </Controls>

          {/* Mesajlar */}
          {loading && <InfoMsg>{t("admin.loading", "Yükleniyor...")}</InfoMsg>}
          {error && <ErrorMsg role="alert">❌ {error}</ErrorMsg>}
          {successMessage && <SuccessMsg>{successMessage}</SuccessMsg>}
          {bulkStatus === "succeeded" && bulkResult && (
            <SuccessMsg>
              {t("admin.bulkSent", "{{sent}} aboneye gönderildi.", {
                sent: bulkResult.sent,
                total: bulkResult.total,
              })}
            </SuccessMsg>
          )}

          {/* Liste */}
          <ListWrap>
            <SubscriberList
              subscribers={filtered}
              onSelect={setSelectedId}
              onDelete={handleDelete}
              onVerify={handleVerify}
              onSingleSend={handleSingleSend}
              selectedId={selectedId}
              t={t}
            />
          </ListWrap>
        </Card>
      </Section>

      {/* Modallar */}
      {selectedSubscriber && (
        <SubscriberModal
          subscriber={selectedSubscriber}
          onClose={() => setSelectedId(null)}
          t={t}
        />
      )}

      {singleModal && (
        <SingleSendModal
          subscriber={singleModal}
          onClose={() => setSingleModal(null)}
          onPreview={(subject, html) => setPreviewModal({ subject, html })}
          onSend={async (subject, html) => {
            await dispatch(sendSingleNewsletter({ id: singleModal._id, subject, html }));
            setSingleModal(null);
          }}
          loading={singleStatus === "loading"}
          t={t}
        />
      )}

      {bulkModal && (
        <BulkSendModal
          onClose={() => setBulkModal(false)}
          onPreview={(subject, html) => setPreviewModal({ subject, html })}
          onSubmit={async (subject, html) => {
            await dispatch(sendBulkNewsletter({ subject, html }));
            setBulkModal(false);
          }}
          loading={bulkStatus === "loading"}
          t={t}
        />
      )}

      {previewModal && (
        <PreviewModal
          subject={previewModal.subject}
          html={previewModal.html}
          onClose={() => setPreviewModal(null)}
          t={t}
        />
      )}
    </PageWrap>
  );
}

/* ---- styled: Admin (About/Services/Portfolio/Pricing) paternine uyumlu ---- */
const PageWrap = styled.div`
  max-width: ${({ theme }) => theme.layout.containerWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacings.xl};
`;

const Header = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:${({ theme }) => theme.spacings.lg};
  ${({ theme }) => theme.media.mobile}{
    flex-direction:column; align-items:flex-start; gap:${({ theme }) => theme.spacings.sm};
  }
`;

const TitleBlock = styled.div`display:flex; flex-direction:column; gap:4px; h1{margin:0;}`;
const Subtitle = styled.p`margin:0; color:${({theme})=>theme.colors.textSecondary}; font-size:${({theme})=>theme.fontSizes.sm};`;
const Right = styled.div`display:flex; gap:${({ theme }) => theme.spacings.sm}; align-items:center;`;

const Counter = styled.span`
  padding:6px 10px; border-radius:${({ theme }) => theme.radii.pill};
  background:${({ theme }) => theme.colors.backgroundAlt};
  font-weight:${({ theme }) => theme.fontWeights.medium};
`;

const Section = styled.section`margin-top:${({ theme }) => theme.spacings.sm};`;

const SectionHead = styled.div`
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:${({ theme }) => theme.spacings.sm};
`;

const Card = styled.div`
  background:${({ theme }) => theme.colors.cardBackground};
  border-radius:${({ theme }) => theme.radii.lg};
  box-shadow:${({ theme }) => theme.cards.shadow};
  padding:${({ theme }) => theme.spacings.lg};
`;

const Controls = styled.div`
  display:flex; gap:${({ theme }) => theme.spacings.sm};
  margin-bottom:${({ theme }) => theme.spacings.md};
`;

const Input = styled.input`
  flex:1 1 auto;
  padding:10px 12px; border-radius:${({theme})=>theme.radii.md};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.inputBorder};
  background:${({theme})=>theme.inputs.background}; color:${({theme})=>theme.inputs.text};
`;

const PrimaryBtn = styled.button`
  background:${({theme})=>theme.buttons.primary.background};
  color:${({theme})=>theme.buttons.primary.text};
  border:${({theme})=>theme.borders.thin} transparent;
  padding:8px 12px; border-radius:${({theme})=>theme.radii.md}; cursor:pointer;
  transition: opacity ${({ theme }) => theme.transition.normal};
  &:hover{ opacity:${({ theme }) => theme.opacity.hover}; background:${({theme})=>theme.buttons.primary.backgroundHover}; }
`;

const SmallBtn = styled.button`
  background:${({theme})=>theme.buttons.secondary.background};
  color:${({theme})=>theme.buttons.secondary.text};
  border:${({theme})=>theme.borders.thin} ${({theme})=>theme.colors.border};
  padding:6px 10px; border-radius:${({theme})=>theme.radii.md}; cursor:pointer;
`;

const InfoMsg = styled.div`
  color:${({ theme }) => theme.colors.primary};
  margin-bottom:${({ theme }) => theme.spacings.sm};
  font-size:${({ theme }) => theme.fontSizes.sm};
  text-align:left;
`;

const ErrorMsg = styled.div`
  color:${({ theme }) => theme.colors.danger};
  margin-bottom:${({ theme }) => theme.spacings.sm};
  font-size:${({ theme }) => theme.fontSizes.sm};
  text-align:left;
`;

const SuccessMsg = styled.div`
  color:${({ theme }) => theme.colors.success};
  margin-bottom:${({ theme }) => theme.spacings.sm};
  font-size:${({ theme }) => theme.fontSizes.sm};
  text-align:left;
`;

const ListWrap = styled.div`
  border:${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.border};
  border-radius:${({ theme }) => theme.radii.lg};
  padding:${({ theme }) => theme.spacings.md};
  background:${({ theme }) => theme.colors.backgroundAlt};
`;
