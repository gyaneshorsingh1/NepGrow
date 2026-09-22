"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

type LogoutButtonProps = {
  redirectTo?: string;
};

export function LogoutButton({ redirectTo = "/" }: LogoutButtonProps) {
  const router = useRouter();

  async function onLogout() {
    await authClient.signOut();
    toast.success("Signed out");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onLogout}>
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
