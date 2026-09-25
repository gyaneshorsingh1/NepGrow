import { redirect } from "next/navigation";

import { PortalAuthenticatedChrome } from "@/components/portal/portal-nav";
import {
  getPortalAccessFlags,
  getPortalSession,
} from "@/features/portal/actions";

export default async function PortalAuthedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const session = await getPortalSession();

  if (!session || session.business.slug !== businessSlug) {
    redirect(`/portal/${businessSlug}`);
  }

  const flags = await getPortalAccessFlags(
    session.customer.id,
    session.business.id,
  );

  return (
    <PortalAuthenticatedChrome
      businessName={session.business.name}
      businessSlug={session.business.slug}
      customerName={session.customer.name}
      canBookCourt={flags.canBookCourt}
    >
      {children}
    </PortalAuthenticatedChrome>
  );
}
