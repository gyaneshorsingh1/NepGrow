import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  authorize,
  resolveTenantContext,
} from "@/lib/authorization/context";
import type { WebsiteContent } from "@/features/websites/resolve";
import { getTenantWebsite } from "@/server/services/websites";

import { WebsiteContentForm } from "./website-content-form";

export const metadata = { title: "Website content" };

export default async function WebsiteSettingsPage() {
  const ctx = await resolveTenantContext();
  await authorize(ctx, "view", "settings", "settings");

  const website = await getTenantWebsite(ctx);
  const content = (website.content ?? {}) as WebsiteContent;
  const canUpdate = ctx.ability.can("update", "settings");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website content"
        description="Edit public site copy, contact details, and SEO."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings">Back to settings</Link>
          </Button>
        }
      />
      <WebsiteContentForm
        canUpdate={canUpdate}
        defaults={{
          heroHeadline: String(content.heroHeadline ?? ""),
          heroSubheadline: String(content.heroSubheadline ?? ""),
          about: String(content.about ?? ""),
          contactEmail: String(content.contactEmail ?? ""),
          contactPhone: String(content.contactPhone ?? ""),
          address: String(content.address ?? ""),
          seoTitle: website.seoTitle ?? "",
          seoDescription: website.seoDescription ?? "",
          indexable: website.indexable,
          published: website.published,
        }}
      />
    </div>
  );
}
