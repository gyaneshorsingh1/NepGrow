"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signCustomerDocumentAction } from "@/features/documents/actions";

export function SignatureGateway({ 
  businessId, 
  customerId, 
  template 
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border-destructive/20">
        <CardHeader className="border-b bg-destructive/5">
          <CardTitle className="text-xl text-destructive">Action Required</CardTitle>
          <CardDescription>
            You must read and sign the <strong>{template.name}</strong> before accessing your dashboard or the facility.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6">
          <div 
            className="prose prose-sm max-w-none text-muted-foreground border rounded-md p-4 bg-slate-50 mb-6"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Type your full legal name to sign:</label>
              <Input 
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="John Doe"
                required
                className="font-serif text-lg" // Gives it a slight signature feel
              />
              <p className="text-xs text-muted-foreground">
                By typing your name and clicking agree, you acknowledge that you have read and agree to the terms above.
              </p>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={pending || !signature.trim()}>
              {pending ? "Signing..." : "I Agree and Sign"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
