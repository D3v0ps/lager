import { tenantSlugs } from "@/lib/tenants.generated";
import TenantShell from "./_components/tenant-shell";

export const dynamicParams = false;

export function generateStaticParams() {
  return tenantSlugs.map((tenant) => ({ tenant }));
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return <TenantShell tenant={tenant}>{children}</TenantShell>;
}
