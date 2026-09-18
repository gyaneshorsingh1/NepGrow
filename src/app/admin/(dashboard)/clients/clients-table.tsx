"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ClientRow = {
  id: string;
  name: string;
  email: string;
  slug: string;
  status: string;
  categoryName: string;
  planName: string;
  usersCount: number;
};

const columns: ColumnDef<ClientRow>[] = [
  {
    accessorKey: "name",
    header: "Business",
    cell: ({ row }) => (
      <div>
        <Link
          href={`/admin/clients/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.name}
        </Link>
        <p className="text-xs text-muted-foreground">{row.original.slug}</p>
      </div>
    ),
  },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "categoryName", header: "Category" },
  { accessorKey: "planName", header: "Plan" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "usersCount",
    header: "Users",
  },
];

export function ClientsTable({
  rows,
  total,
  page,
  pageSize,
}: {
  rows: ClientRow[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";

  function updateSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("search", value);
    else params.delete("search");
    params.delete("page");
    router.push(`/admin/clients?${params.toString()}`);
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyTitle="No clients yet"
      emptyDescription="Create your first client business to get started."
      searchSlot={
        <form
          className="flex w-full max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateSearch(String(fd.get("search") || ""));
          }}
        >
          <Input
            name="search"
            placeholder="Search clients…"
            defaultValue={search}
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      }
      pagination={{
        pageIndex: page - 1,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        total,
        onPageChange: (pageIndex) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("page", String(pageIndex + 1));
          router.push(`/admin/clients?${params.toString()}`);
        },
      }}
    />
  );
}
