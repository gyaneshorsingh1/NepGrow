"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logProgressMetricAction } from "@/features/programs/actions";
import { Activity } from "lucide-react";

export function LogMetricWidget({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [metricName, setMetricName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricName || !value || !unit) return;
    
    setPending(true);
    const result = await logProgressMetricAction({
      customerId,
      metricName,
      value: parseFloat(value),
      unit
    });
    setPending(false);

    if (result.ok) {
      toast.success("Progress logged!");
      setMetricName("");
      setValue("");
      setUnit("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to log progress");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Log Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium">Metric (e.g. Weight)</label>
            <Input 
              value={metricName}
              onChange={e => setMetricName(e.target.value)}
              placeholder="Body Weight"
              required
              disabled={pending}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-medium">Value</label>
              <Input 
                type="number"
                step="0.1"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="75.5"
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Unit</label>
              <Input 
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="kg"
                required
                disabled={pending}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="sm" disabled={pending}>
            {pending ? "Saving..." : "Save Metric"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
