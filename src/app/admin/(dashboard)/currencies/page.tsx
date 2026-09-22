import Link from "next/link";
<<<<<<< HEAD
import { Pencil } from "lucide-react";
=======
>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696

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

<<<<<<< HEAD
=======
import { CreateCurrencyForm, EditCurrencyCard } from "./currency-forms";

>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
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
<<<<<<< HEAD
              <TableHead className="text-right">Actions</TableHead>
=======
>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.length === 0 ? (
              <TableRow>
                <TableCell
<<<<<<< HEAD
                  colSpan={6}
=======
                  colSpan={5}
>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
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
<<<<<<< HEAD
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon" title="Edit">
                      <Link href={`/admin/currencies/${c.id}`}>
                        <Pencil aria-hidden />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                  </TableCell>
=======
>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
<<<<<<< HEAD
=======

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit currencies</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {currencies.map((c) => (
            <EditCurrencyCard key={c.id} currency={c} />
          ))}
        </div>
      </div>
>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
    </div>
  );
}
