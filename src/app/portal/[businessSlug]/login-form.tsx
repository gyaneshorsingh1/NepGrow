"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginPortalCustomerAction } from "@/features/portal/actions";

export function PortalLoginForm({ businessSlug }: { businessSlug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setPending(true);
    const result = await loginPortalCustomerAction(businessSlug, email);
    setPending(false);

    if (result.ok) {
      toast.success("Login successful!");
      router.push(`/portal/${businessSlug}/dashboard`);
    } else {
      toast.error(result.error || "Failed to login");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email Address</label>
        <Input 
          id="email" 
          type="email" 
          placeholder="your@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Logging in..." : "Continue with Email"}
      </Button>
    </form>
  );
}
