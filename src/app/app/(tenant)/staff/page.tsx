import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateStaffForm } from "@/app/app/(tenant)/staff/create-staff-form";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { prisma } from "@/lib/db";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "staff");
  await authorize(ctx, "view", "staff", "staff");

  const [staff, members] = await Promise.all([
    prisma.staffProfile.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { name: "asc" },
    }),
    prisma.businessMembership.findMany({
      where: { businessId: ctx.businessId },
      include: {
        user: { select: { name: true, email: true, status: true } },
        roles: { include: { role: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const canCreate = ctx.ability.can("create", "staff") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Team members and staff profiles."
      />

      {canCreate ? <CreateStaffForm /> : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">App users</h2>
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.user.name}</TableCell>
                  <TableCell>{m.user.email}</TableCell>
                  <TableCell>
                    {m.roles.map((r) => r.role.name).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Staff profiles</h2>
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.title ?? "—"}</TableCell>
                  <TableCell>{s.email || s.phone || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
