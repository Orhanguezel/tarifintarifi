import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { resolveTenant } from "@/lib/server/tenant";
import { normalizeLocale } from "@/lib/server/locale";
import { buildCommonHeaders } from "@/lib/http";
import type { DefaultTheme } from "styled-components";

export type TenantSelf = {
  id: string;
  slug: string;
  defaultLocale: string;
  locales?: string[];
};

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  order?: number;
  children?: NavItem[];
};

export type Bootstrap = {
  tenant: TenantSelf;
  locale: string;
  locales: string[];
  themeTokens?: any;           // BE'nin token şeması (özgür bırakıyoruz)
  navigation?: {
    primary?: NavItem[];
    footer?: NavItem[];
    legal?: NavItem[];
    [k: string]: NavItem[] | undefined;
  };
};

const REVALIDATE = 300;

async function safeJson<T>(url: string, init: RequestInit) {
  const r = await fetch(url, { ...init, next: { revalidate: REVALIDATE } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return (await r.json()) as T;
}

export async function fetchBootstrap(requestedLocale?: string): Promise<Bootstrap> {
  const [base, tenant, locale] = await Promise.all([
    getServerApiBaseAbsolute(),
    resolveTenant(),
    Promise.resolve(normalizeLocale(requestedLocale)),
  ]);
  const headers = buildCommonHeaders(locale, tenant);

  // Paralel istekler — navigation opsiyonel; BE hazır değilse try/catch
  const [tenantSelf, themeTokens, navigation] = await Promise.all([
    safeJson<TenantSelf>(`${base}/v1/tenants/self`, { headers }),
    safeJson<any>(`${base}/v1/theme`, { headers }).catch(() => undefined),
    safeJson<any>(`${base}/v1/navigation`, { headers }).catch(() => undefined),
  ]);

  const locales =
    tenantSelf.locales && tenantSelf.locales.length ? tenantSelf.locales : [locale];

  return { tenant: tenantSelf, locale, locales, themeTokens, navigation };
}
