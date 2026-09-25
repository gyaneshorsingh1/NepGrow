"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPortalPasswordResetAction } from "@/features/portal/actions";

export function PortalForgotPasswordForm({
  businessSlug,
}: {
  businessSlug: string;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await requestPortalPasswordResetAction(businessSlug, email);
    setPending(false);
    setSent(true);
    toast.success("If that email exists, a reset link was sent");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {sent ? (
        <p className="text-sm text-muted-foreground">
          Check your inbox (or server logs in development).{" "}
          <Link
            href={`/portal/${businessSlug}`}
            className="text-primary underline underline-offset-2"
          >
            Back to login
          </Link>
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              autoComplete="email"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link
              href={`/portal/${businessSlug}`}
              className="text-primary underline underline-offset-2"
            >
              Back to login
            </Link>
          </p>
        </>
      )}
    </form>
  );
}
