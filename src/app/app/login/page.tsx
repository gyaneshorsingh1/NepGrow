import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { getPostLoginPath, getSession } from "@/lib/auth/session";

export const metadata = {
  title: "Tenant login",
};

export default async function AppLoginPage() {
  const session = await getSession();
  if (session) {
    redirect(await getPostLoginPath("/app"));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_55%)] px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Link href="/" className="text-lg font-semibold text-primary">
            NepGrow
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Business app</p>
        </div>
        <Card>
          <CardHeader className="pb-0" />
          <CardContent className="pt-6">
            <LoginForm
              redirectTo="/app"
              title="Business sign in"
              subtitle="Sign in to manage your sports center."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
