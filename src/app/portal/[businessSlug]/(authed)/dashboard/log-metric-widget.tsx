"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logProgressMetricAction } from "@/features/programs/actions";

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
      unit,
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
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="size-5 text-primary" />
          Log Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Metric (e.g. Weight)</Label>
            <Input
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              placeholder="Body Weight"
              required
              disabled={pending}
              className="h-10 sm:h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Value</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="75.5"
                required
                disabled={pending}
                className="h-10 sm:h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Unit</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg"
                required
                disabled={pending}
                className="h-10 sm:h-11"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="h-10 w-full sm:h-11"
            size="sm"
            disabled={pending}
          >
            {pending ? "Saving..." : "Save Metric"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
