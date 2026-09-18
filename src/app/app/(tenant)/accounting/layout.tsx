import { AccessDenied } from "@/components/shared/access-denied";
import { resolveTenantContext, requireModule } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";

export default async function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await resolveTenantContext();
  try {
    await requireModule(ctx, "accounting");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="Accounting is not enabled for this business." />
      );
    }
    throw error;
  }

  if (!ctx.ability.can("view", "accounting")) {
    return (
      <AccessDenied description="You need accounting.view to open Accounting." />
    );
  }

  return <>{children}</>;
}
