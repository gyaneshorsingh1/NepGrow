import { notFound, redirect } from "next/navigation";

import {
  PortalBrandMark,
  PortalShell,
} from "@/components/portal/portal-shell";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { getPortalSession } from "@/features/portal/actions";
import { prisma } from "@/server/db/prisma";

import { PortalLoginForm } from "./login-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const business = await prisma.business.findFirst({
    where: { slug: businessSlug },
  });
  if (!business) return { title: "Portal Not Found" };
  return { title: `${business.name} | Customer Portal` };
}

export default async function CustomerPortalPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const business = await prisma.business.findFirst({
    where: { slug: businessSlug, status: "ACTIVE" },
  });

  if (!business) {
    notFound();
  }

  const session = await getPortalSession();
  if (session && session.business.slug === businessSlug) {
    redirect(`/portal/${businessSlug}/dashboard`);
  }

  return (
    <PortalShell className="flex flex-col">
      <div className="flex justify-end px-4 pt-4 sm:px-6 md:px-8">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-8 pt-2 sm:px-6 sm:pb-12 md:px-8">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-8 md:p-10">
          <div className="space-y-3 text-center sm:space-y-4">
            <div className="flex justify-center">
              <PortalBrandMark name={business.name} size="lg" showName={false} />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
                Welcome to {business.name}
              </h1>
          <p className="text-pretty text-sm text-muted-foreground sm:text-base">
            Sign in with the email and password provided by {business.name}.
          </p>
            </div>
          </div>

          <PortalLoginForm businessSlug={business.slug} />

          <p className="pt-1 text-center text-xs text-muted-foreground">
            Powered by Nepgrow
          </p>
        </div>
      </div>
    </PortalShell>
  );
}
