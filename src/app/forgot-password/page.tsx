import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Link href="/" className="text-lg font-semibold text-primary">
            NepGrow
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
