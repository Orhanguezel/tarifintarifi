"use client";
import { useCallback } from "react";
import { AddressForm } from "@/modules/users";
import { ICustomer } from "@/modules/customer/types";
import styled from "styled-components";
import { CustomerInfoCard } from "@/modules/customer";
import { useAppDispatch } from "@/store/hooks";
import { fetchCustomerById } from "@/modules/customer/slice/customerSlice";
import { useI18nNamespace } from "@/hooks/useI18nNamespace";
import translations from "@/modules/customer/locales";

interface Props {
  customer: ICustomer;
  onAddressChanged?: () => void;
}

export default function CustomerDetailsPage({ customer, onAddressChanged }: Props) {
  const dispatch = useAppDispatch();
  const { t } = useI18nNamespace("customer", translations);

  // Sadece ilgili customer'ı güncelle
  const handleAddressesChanged = useCallback(async () => {
    if (customer._id) {
      await dispatch(fetchCustomerById(customer._id));
    }
    onAddressChanged?.();
  }, [dispatch, customer._id, onAddressChanged]);

  if (!customer?._id) return <p>{t("notFound", "Customer record not found.")}</p>;

  return (
    <Wrap>
      {/* Bilgi kartı (mevcut bileşen, olduğu gibi) */}
      <CustomerInfoCard customer={customer} />

      {/* Adres yönetimi (props/işleyiş aynı), sadece görünüm apartment standardı */}
      <Card>
        <Sub>{t("addresses.title", "Addresses")}</Sub>
        <AddressForm
          parentType="customer"
          parentId={customer._id}
          addresses={customer.addresses?.filter((a) => typeof a === "object" && a !== null)}
          onChanged={handleAddressesChanged}
          renderAsForm={true}
        />
      </Card>
    </Wrap>
  );
}

/* -------- styled: apartment sayfası ile tam uyum -------- */
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacings.md};
  max-width: 980px;
  width: 100%;
  margin: 0 auto;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacings.md};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: ${({ theme }) => theme.borders.thin} ${({ theme }) => theme.colors.borderLight};
`;

const Sub = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  margin-bottom: ${({ theme }) => theme.spacings.sm};
  color: ${({ theme }) => theme.colors.textAlt};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;
