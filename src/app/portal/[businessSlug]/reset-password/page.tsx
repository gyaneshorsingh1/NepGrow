import { notFound } from "next/navigation";

import {
  PortalBrandMark,
  PortalShell,
} from "@/components/portal/portal-shell";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { prisma } from "@/server/db/prisma";

import { PortalResetPasswordForm } from "../reset-password-form";

export const metadata = { title: "Reset password" };

export default async function PortalResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { businessSlug } = await params;
  const { token } = await searchParams;
  const business = await prisma.business.findFirst({
    where: { slug: businessSlug, status: "ACTIVE" },
  });
  if (!business) notFound();

  return (
    <PortalShell className="flex flex-col">
      <div className="flex justify-end px-4 pt-4 sm:px-6">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-8">
          <div className="space-y-3 text-center">
            <div className="flex justify-center">
              <PortalBrandMark name={business.name} size="lg" showName={false} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Choose a new password
            </h1>
          </div>
          <PortalResetPasswordForm
            businessSlug={business.slug}
            token={token ?? ""}
          />
        </div>
      </div>
    </PortalShell>
  );
}
