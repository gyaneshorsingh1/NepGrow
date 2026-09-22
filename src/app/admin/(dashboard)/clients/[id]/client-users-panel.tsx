"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { setTenantUserStatusAction } from "@/features/clients/actions";

type UserRow = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  roles: string[];
};

export function ClientUsersPanel({
  businessId,
  users,
}: {
  businessId: string;
  users: UserRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleStatus(userId: string, next: "ACTIVE" | "DISABLED") {
    startTransition(async () => {
      const result = await setTenantUserStatusAction({
        businessId,
        userId,
        status: next,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(next === "ACTIVE" ? "User activated" : "User disabled");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/admin/clients/${businessId}/users/new`}>+ Add User</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.membershipId}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.roles.join(", ") || "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={u.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      toggleStatus(
                        u.userId,
                        u.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                      )
                    }
                  >
                    {u.status === "ACTIVE" ? "Disable" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
