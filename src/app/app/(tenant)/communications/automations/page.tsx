import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ToggleAutomationRuleButton } from "./toggle-rule-button";

export const metadata = { title: "Automations" };

export default async function AutomationsPage() {
  const ctx = await resolveTenantContext();

  const rules = await prisma.automationRule.findMany({
    where: { businessId: ctx.businessId },
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 flex flex-col">
      <PageHeader
        title="Automations Engine"
        description="Set up automatic triggers to dispatch emails/SMS based on customer events."
        actions={
          <Button asChild>
            <Link href="/app/communications/automations/new">+ New Rule</Link>
          </Button>
        }
      />
      <div className="flex-1 rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule Name</TableHead>
              <TableHead>Trigger Event</TableHead>
              <TableHead>Offset</TableHead>
              <TableHead>Template Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No automation rules configured.
                </TableCell>
              </TableRow>
            )}
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{rule.triggerEvent}</Badge>
                </TableCell>
                <TableCell>
                  {rule.offsetDays === 0 ? "Same Day" : 
                   rule.offsetDays > 0 ? `${rule.offsetDays} days after` : 
                   `${Math.abs(rule.offsetDays)} days before`}
                </TableCell>
                <TableCell>
                  Send: <strong>{rule.template.name}</strong>
                </TableCell>
                <TableCell>
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "ACTIVE" : "PAUSED"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ToggleAutomationRuleButton ruleId={rule.id} isActive={rule.isActive} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
