import Link from "next/link";
import { format, subDays } from "date-fns";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";
import { PhoneCall, Mail } from "lucide-react";

export const metadata = { title: "Follow-ups" };

export default async function FollowUpsPage() {
  const ctx = await resolveTenantContext();

  // Find leads that are NEW or CONTACTED and were created more than 2 days ago
  const leadsToFollowUp = await prisma.lead.findMany({
    where: { 
      businessId: ctx.businessId,
      status: { in: ["NEW", "CONTACTED"] },
      createdAt: { lt: subDays(new Date(), 2) }
    },
    orderBy: { createdAt: "asc" }, // Oldest first
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups Action List"
        description="Leads that have been idle for more than 2 days. Give them a call!"
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Idle Since</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead className="text-right">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsToFollowUp.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No pending follow-ups! Great job keeping up with your pipeline.
                </TableCell>
              </TableRow>
            )}
            {leadsToFollowUp.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm text-muted-foreground">
                    <span>{lead.email || "No email"}</span>
                    <span>{lead.phone || "No phone"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-orange-600 font-medium">
                  {format(lead.createdAt, "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                    {lead.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${lead.phone}`} title="Call Lead">
                        <PhoneCall className="w-4 h-4 mr-2" /> Call
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${lead.email}`} title="Email Lead">
                        <Mail className="w-4 h-4 mr-2" /> Email
                      </a>
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/app/crm/${lead.id}`}>View Details</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
