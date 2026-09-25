import { notFound } from "next/navigation";

import {
  PortalBrandMark,
  PortalShell,
} from "@/components/portal/portal-shell";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { prisma } from "@/server/db/prisma";

import { PortalForgotPasswordForm } from "../forgot-password-form";

export const metadata = { title: "Forgot password" };

export default async function PortalForgotPasswordPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
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
              Reset password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we will send a reset link.
            </p>
          </div>
          <PortalForgotPasswordForm businessSlug={business.slug} />
        </div>
      </div>
    </PortalShell>
  );
}
