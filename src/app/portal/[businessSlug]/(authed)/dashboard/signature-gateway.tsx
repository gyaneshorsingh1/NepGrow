"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { signCustomerDocumentAction } from "@/features/documents/actions";

export function SignatureGateway({
  businessId,
  customerId,
  template,
}: {
  businessId: string;
  customerId: string;
  template: { id: string; name: string; content: string };
}) {
  const router = useRouter();
  const [signature, setSignature] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) return;

    setPending(true);
    const result = await signCustomerDocumentAction(businessId, {
      templateId: template.id,
      customerId,
      signatureName: signature,
    });
    setPending(false);

    if (result.ok) {
      toast.success("Document signed successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to sign document");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-4 md:p-6">
      <Card className="flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-b-none border-destructive/25 shadow-xl sm:rounded-xl sm:rounded-b-xl">
        <CardHeader className="shrink-0 space-y-1.5 border-b border-border bg-destructive/5 px-4 py-4 sm:px-6">
          <CardTitle className="text-lg text-destructive sm:text-xl">
            Action Required
          </CardTitle>
          <CardDescription className="text-pretty">
            You must read and sign the <strong>{template.name}</strong> before
            accessing your dashboard or the facility.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
          <div
            className="mb-6 max-w-none rounded-lg border border-border bg-muted/50 p-3 text-sm leading-relaxed text-muted-foreground sm:p-4 [&_a]:text-primary [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Type your full legal name to sign
              </Label>
              <Input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                className="h-11 font-serif text-lg sm:h-12"
              />
              <p className="text-xs text-muted-foreground">
                By typing your name and clicking agree, you acknowledge that you
                have read and agree to the terms above.
              </p>
            </div>
            <Button
              type="submit"
              className="h-11 w-full text-base sm:h-12"
              size="lg"
              disabled={pending || !signature.trim()}
            >
              {pending ? "Signing..." : "I Agree and Sign"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
