"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createAutomationRuleAction } from "@/features/automations/actions";

export function CreateRuleForm({ 
  businessId,
  templates
}: { 
  businessId: string;
  templates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("MEMBERSHIP_EXPIRING");
  const [offsetDays, setOffsetDays] = useState("0");
  const [templateId, setTemplateId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !triggerEvent || !templateId) return;
    
    setPending(true);
    const result = await createAutomationRuleAction(businessId, {
      name, 
      triggerEvent, 
      offsetDays: parseInt(offsetDays, 10),
      templateId
    });
    setPending(false);

    if (result.ok) {
      toast.success("Automation rule created!");
      router.push("/app/communications/automations");
    } else {
      toast.error(result.error || "Failed to create rule");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Rule Name</label>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. 3-Day Expiry Warning" 
            required 
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Trigger Event</label>
            <Select value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)} required>
              <option value="MEMBERSHIP_EXPIRING">Membership Expiring</option>
              <option value="MEMBERSHIP_EXPIRED">Membership Expired</option>
              <option value="NEW_LEAD">New Lead Added</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Offset (Days)</label>
            <Input 
              type="number"
              value={offsetDays} 
              onChange={e => setOffsetDays(e.target.value)} 
              required 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use negative for &quot;before&quot; event (e.g. -3 = 3 days before expiry). Positive for &quot;after&quot;.
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Action: Send Template</label>
          <Select value={templateId} onChange={e => setTemplateId(e.target.value)} required>
            <option value="">Select a template to send...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Create Rule"}
        </Button>
      </div>
    </form>
  );
}
