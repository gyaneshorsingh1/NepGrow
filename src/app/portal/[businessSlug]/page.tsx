import { notFound, redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { getPortalSession } from "@/features/portal/actions";
import { PortalLoginForm } from "./login-form";

export async function generateMetadata({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const business = await prisma.business.findFirst({
    where: { slug: businessSlug },
  });
  if (!business) return { title: "Portal Not Found" };
  return { title: `${business.name} | Customer Portal` };
}

export default async function CustomerPortalPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const business = await prisma.business.findFirst({
    where: { slug: businessSlug, status: "ACTIVE" },
  });

  if (!business) {
    notFound();
  }

  // Check if already logged in
  const session = await getPortalSession();
  if (session && session.business.slug === businessSlug) {
    redirect(`/portal/${businessSlug}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary">{business.name.charAt(0)}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to {business.name}</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email to log in to your account.
          </p>
        </div>

        <PortalLoginForm businessSlug={business.slug} />

        <p className="text-xs text-center text-muted-foreground pt-4">
          Powered by Nepgrow
        </p>
      </div>
    </div>
  );
}
