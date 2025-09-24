import { headers } from "next/headers";
import { getEnvTenant } from "@/lib/config";

/** Reverse proxy X-Tenant geldiyse onu, yoksa .env TENANT'ı kullan */
export async function resolveTenant(): Promise<string> {
  const envTenant = getEnvTenant();
  const h = await headers();
  const forwardedTenant = h.get("x-tenant");
  return (forwardedTenant || envTenant).toLowerCase();
}
