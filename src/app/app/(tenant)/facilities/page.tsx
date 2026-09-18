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
import { resolveTenantContext } from "@/lib/authorization/context";
import { listFacilities } from "@/server/services/sports";

import { CreateFacilityForm } from "./create-facility-form";

export const metadata = { title: "Facilities" };

export default async function FacilitiesPage() {
  const ctx = await resolveTenantContext();
  const facilities = await listFacilities(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities"
        description="Sports facilities available at your center."
      />
      <CreateFacilityForm />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Courts</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell>{f.sport}</TableCell>
                <TableCell>{f.courts.length}</TableCell>
                <TableCell>
                  <StatusBadge status={f.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
