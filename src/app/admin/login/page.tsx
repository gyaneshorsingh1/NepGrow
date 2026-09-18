import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export const metadata = {
  title: "Admin login",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_55%)] px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Link href="/" className="text-lg font-semibold text-primary">
            NepGrow
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Platform admin</p>
        </div>
        <Card>
          <CardHeader className="pb-0" />
          <CardContent className="pt-6">
            <LoginForm
              redirectTo="/admin"
              title="Admin sign in"
              subtitle="Use your platform admin credentials."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
