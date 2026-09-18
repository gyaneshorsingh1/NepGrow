import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";

import { CreateClientUserForm } from "../create-client-user-form";

export const metadata = { title: "Add client user" };

export default async function NewClientUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      roles: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });

  if (!business) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add user"
        description={`Create a login for ${business.name}.`}
      />
      <Card>
        <CardContent className="pt-6">
          <CreateClientUserForm
            businessId={business.id}
            roles={business.roles}
          />
        </CardContent>
      </Card>
    </div>
  );
}
