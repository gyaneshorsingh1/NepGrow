import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";

export const metadata = { title: "Activity" };

type SearchParams = Promise<{ q?: string; action?: string }>;

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const action = sp.action?.trim();

  const logs = await prisma.activityLog.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { action: { contains: q } },
                { module: { contains: q } },
                { entity: { contains: q } },
                { business: { name: { contains: q } } },
                { user: { email: { contains: q } } },
              ],
            }
          : {},
        action ? { action: { contains: action } } : {},
      ],
    },
    include: {
      user: { select: { name: true, email: true } },
      business: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Recent platform and tenant activity logs."
      />

      <form className="flex flex-wrap gap-2" method="get">
        <Input
          name="q"
          placeholder="Search action, module, business…"
          defaultValue={q}
          className="max-w-sm"
        />
        <Input
          name="action"
          placeholder="Filter action (e.g. user.login)"
          defaultValue={action}
          className="max-w-xs"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Module</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {log.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </TableCell>
                <TableCell className="font-medium">{log.action}</TableCell>
                <TableCell>
                  {log.user?.name || log.user?.email || "System"}
                </TableCell>
                <TableCell>{log.business?.name ?? "—"}</TableCell>
                <TableCell>{log.module ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
