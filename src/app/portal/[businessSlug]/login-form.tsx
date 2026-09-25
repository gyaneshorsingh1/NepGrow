"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginPortalCustomerAction } from "@/features/portal/actions";

export function PortalLoginForm({ businessSlug }: { businessSlug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setPending(true);
    const result = await loginPortalCustomerAction(
      businessSlug,
      email,
      password,
    );
    setPending(false);

    if (result.ok) {
      toast.success("Login successful!");
      router.push(`/portal/${businessSlug}/dashboard`);
    } else {
      toast.error(result.error || "Failed to login");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 text-base sm:h-12"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Password</Label>
          <Link
            href={`/portal/${businessSlug}/forgot-password`}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="h-11 text-base sm:h-12"
        />
      </div>
      <Button
        type="submit"
        className="h-11 w-full text-base sm:h-12"
        size="lg"
        disabled={pending}
      >
        {pending ? "Logging in..." : "Sign in"}
      </Button>
    </form>
  );
}
