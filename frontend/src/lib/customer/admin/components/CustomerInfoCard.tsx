import styled from "styled-components";
import type { ICustomer } from "@/modules/customer/types";
import type { Address } from "@/modules/users/types/address";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import { SupportedLocale } from "@/types/common";
import translations from "../../locales";

/* i18n yardımcı: string ya da {tr,en,...} destekler */
function getTranslatedLabel(val: any, lang: SupportedLocale, fallback = ""): string {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object" && typeof val[lang] === "string") return String(val[lang]);
  const first = Object.values(val)[0];
  return typeof first === "string" ? first : fallback;
}

function isAddressObject(addr: string | Address): addr is Address {
  return typeof addr === "object" && addr !== null && "addressLine" in addr;
}

export default function CustomerInfoCard({ customer }: { customer: ICustomer | null }) {
  const { i18n, t } = useI18nNamespace("customer", translations);
  const lang = (i18n.language?.slice(0, 2) || "en") as SupportedLocale;
  if (!customer) return null;

  const populatedAddresses = (customer.addresses ?? []).filter(isAddressObject);
  const addressObj = populatedAddresses.find(a => (a as any)?.isDefault) || populatedAddresses[0];

  const addressStr = addressObj
    ? [
        addressObj.addressLine,
        addressObj.street,
        addressObj.houseNumber,
        addressObj.city,
        addressObj.province,
        addressObj.district,
        addressObj.postalCode,
        addressObj.country,
      ].filter(Boolean).join(", ")
    : "-";

  const title =
    getTranslatedLabel(customer.companyName as any, lang, "") ||
    getTranslatedLabel(customer.contactName as any, lang, t("companyName", "Company Name"));

  const kindLabel =
    (customer as any)?.kind === "organization"
      ? t("kind.organization", "Organization")
      : (customer as any)?.kind === "person"
      ? t("kind.person", "Person")
      : "-";

  return (
    <Card role="region" aria-label={t("card.title","Customer")}>
      <Head>
        <Title title={title}>{title}</Title>
        <Meta>
          <span>{t("contactName", "Contact")}: <b>{getTranslatedLabel(customer.contactName as any, lang, "-")}</b></span>
          <Dot>•</Dot>
          <span>{t("email", "E-Mail")}: <b>{customer.email || "-"}</b></span>
          <Dot>•</Dot>
          <span>{t("phone", "Phone")}: <b>{customer.phone || "-"}</b></span>
        </Meta>
      </Head>

      <InfoGrid>
        <Info>
          <K>{t("kind", "Type")}</K>
          <V>{kindLabel}</V>
        </Info>
        <Info>
          <K>{t("address", "Address")}</K>
          <V>{addressStr}</V>
        </Info>
        {addressObj?.phone && (
          <Info>
            <K>{t("addressPhone", "Address Phone")}</K>
            <V>{addressObj.phone}</V>
          </Info>
        )}
        <Info>
          <K>{t("isActive", "Status")}</K>
          <V>
            <StatusPill $active={!!customer.isActive}>
              {customer.isActive ? t("active", "Active") : t("inactive", "Inactive")}
            </StatusPill>
          </V>
        </Info>
        {customer.notes && (
          <Info style={{ gridColumn: "1 / -1" }}>
            <K>{t("notes", "Notes")}</K>
            <V>{customer.notes}</V>
          </Info>
        )}
      </InfoGrid>
    </Card>
  );
}

/* ---- styled: apartment sayfaları ile tam uyum ---- */
const Card = styled.section`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacings.md};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.spacings.sm};
`;

const Head = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: ${({ theme }) => theme.spacings.md};
  border-bottom: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  padding-bottom: ${({ theme }) => theme.spacings.sm};
`;

const Title = styled.h3`
  margin: 0; font-size: ${({ theme }) => theme.fontSizes.medium};
  color: ${({ theme }) => theme.colors.title};
`;

const Meta = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  display: flex; align-items: center; gap: ${({ theme }) => theme.spacings.xs};
  flex-wrap: wrap;
`;

const Dot = styled.span`opacity: .6;`;

const InfoGrid = styled.div`
  display: grid; gap: ${({ theme }) => theme.spacings.sm};
  grid-template-columns: repeat(3, 1fr);
  margin-top: ${({ theme }) => theme.spacings.sm};
  ${({ theme }) => theme.media.tablet}{ grid-template-columns: repeat(2, 1fr); }
  ${({ theme }) => theme.media.mobile}{ grid-template-columns: 1fr; }
`;

const Info = styled.div`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacings.sm};
`;

const K = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const V = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-top: 2px;
  word-break: break-word;
`;

const StatusPill = styled.span<{ $active: boolean }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.fontSizes.xsmall};
  background: ${({ theme, $active }) => ($active ? theme.colors.successBg : theme.colors.dangerBg)};
  color: ${({ theme, $active }) => ($active ? theme.colors.success : theme.colors.danger)};
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.success : theme.colors.danger)};
`;
