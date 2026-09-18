"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolvePostLoginPathAction } from "@/features/auth/actions";
import { authClient } from "@/lib/auth/client";
import { loginSchema } from "@/lib/validation/schemas";

type LoginValues = z.output<typeof loginSchema>;

type LoginFormProps = {
  /** Login surface preference: admin console vs tenant app */
  redirectTo: "/admin" | "/app";
  title?: string;
  subtitle?: string;
};

export function LoginForm({
  redirectTo,
  title = "Sign in",
  subtitle,
}: LoginFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema) as Resolver<LoginValues>,
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setPending(true);
    try {
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid email or password");
        return;
      }

      // Always resolve by role/membership (tenant rules), not only the form surface
      const destination = await resolvePostLoginPathAction(redirectTo);

      if (destination.endsWith("/login")) {
        toast.error(
          redirectTo === "/admin"
            ? "This account is not a platform admin."
            : "This account is not linked to a business tenant.",
        );
        await authClient.signOut();
        return;
      }

      if (redirectTo === "/admin" && destination.startsWith("/app")) {
        toast.message("Signed in as business user — opening client app");
      } else if (redirectTo === "/app" && destination.startsWith("/admin")) {
        toast.message("Signed in as platform admin — opening admin console");
      } else {
        toast.success("Signed in");
      }

      router.push(destination);
      router.refresh();
    } catch {
      toast.error("Unable to sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <a href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
          Forgot password?
        </a>
      </p>
    </form>
  );
}
