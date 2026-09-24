"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createDocumentTemplateAction } from "@/features/documents/actions";

export function CreateTemplateForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isRequired, setIsRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) return;
    
    setPending(true);
    const result = await createDocumentTemplateAction(businessId, {
      name, content, isRequired
    });
    setPending(false);

    if (result.ok) {
      toast.success("Document template created!");
      router.push("/app/settings/documents");
    } else {
      toast.error(result.error || "Failed to create template");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Template Name</label>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Liability Waiver" 
            required 
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Document Content (HTML/Text)</label>
          <Textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Enter the full legal text here..." 
            className="min-h-[300px]"
            required 
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-slate-50">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Require Before Entry</label>
            <p className="text-xs text-muted-foreground">
              If enabled, customers will be prompted to sign this immediately when they log into the portal. Access Control will deny entry if this is unsigned.
            </p>
          </div>
          <Switch 
            checked={isRequired}
            onCheckedChange={setIsRequired}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Create Template"}
        </Button>
      </div>
    </form>
  );
}
