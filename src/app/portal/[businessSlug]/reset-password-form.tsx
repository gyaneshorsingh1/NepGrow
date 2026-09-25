"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPortalPasswordAction } from "@/features/portal/actions";

export function PortalResetPasswordForm({
  businessSlug,
  token,
}: {
  businessSlug: string;
  token: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setPending(true);
    const result = await resetPortalPasswordAction(
      businessSlug,
      token,
      password,
    );
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Password updated. You can sign in now.");
    router.push(`/portal/${businessSlug}`);
  }

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        Missing reset token.{" "}
        <Link
          href={`/portal/${businessSlug}/forgot-password`}
          className="text-primary underline"
        >
          Request a new link
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11"
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          minLength={8}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-11"
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
