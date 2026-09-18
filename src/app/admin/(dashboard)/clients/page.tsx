import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listClients } from "@/server/services/clients";

import { ClientsTable } from "./clients-table";

export const metadata = { title: "Clients" };

type SearchParams = Promise<{
  search?: string;
  categoryId?: string;
  planId?: string;
  status?: string;
  page?: string;
}>;

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || "1") || 1);
  const result = await listClients({
    search: params.search,
    categoryId: params.categoryId,
    planId: params.planId,
    status: params.status,
    page,
    pageSize: 20,
  });

  const rows = result.items.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    slug: item.slug,
    status: item.status,
    categoryName: item.category.name,
    planName: item.subscription?.plan.name ?? "—",
    usersCount: item._count.memberships,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage tenant businesses on the platform."
        actions={
          <Button asChild>
            <Link href="/admin/clients/new">New client</Link>
          </Button>
        }
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ClientsTable
          rows={rows}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
        />
      </Suspense>
    </div>
  );
}
