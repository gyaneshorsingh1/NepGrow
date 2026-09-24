import Link from "next/link";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";

export const metadata = { title: "Currencies" };

export default async function AdminCurrenciesPage() {
  const currencies = await prisma.currency.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Currencies"
        description="Manage currencies available for client businesses. Owners select one for all pricing display."
        actions={
          <Button asChild>
            <Link href="/admin/currencies/new">+ Create Currency</Link>
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Decimals</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No currencies yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              currencies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.symbol ?? "—"}</TableCell>
                  <TableCell>{c.decimals}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon" title="Edit">
                      <Link href={`/admin/currencies/${c.id}`}>
                        <Pencil aria-hidden />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}