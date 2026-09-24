"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { assignProgramAction } from "@/features/programs/actions";

export function AssignProgramForm({ 
  businessId, 
  customers 
}: { 
  businessId: string;
  customers: { id: string; name: string; email: string | null }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !name || !content) return;
    
    setPending(true);
    const result = await assignProgramAction(businessId, {
      customerId, name, content, startDate, endDate
    });
    setPending(false);

    if (result.ok) {
      toast.success("Program assigned successfully!");
      router.push("/app/memberships/programs");
    } else {
      toast.error(result.error || "Failed to assign program");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer</label>
          <Select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
            <option value="">Select a customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.email ? `(${c.email})` : ""}
              </option>
            ))}
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Program Name</label>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. 12-Week Transformation" 
            required 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <Input 
            type="date"
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <Input 
            type="date"
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Program Content (Instructions/Workouts)</label>
        <Textarea 
          value={content} 
          onChange={e => setContent(e.target.value)} 
          placeholder="Week 1:\n- Squats 3x10\n- Bench 3x10..." 
          className="min-h-[200px] font-mono text-sm"
          required 
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Assigning..." : "Assign Program"}
        </Button>
      </div>
    </form>
  );
}
