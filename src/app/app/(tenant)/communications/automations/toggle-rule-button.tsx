"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleAutomationRuleAction } from "@/features/automations/actions";
import { toast } from "sonner";
import { Play, Pause } from "lucide-react";

export function ToggleAutomationRuleButton({ ruleId, isActive }: { ruleId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleAutomationRuleAction(ruleId, !isActive);
      if (result.ok) {
        toast.success(`Rule ${!isActive ? "activated" : "paused"} successfully`);
      } else {
        toast.error(result.error || "Failed to toggle rule");
      }
    });
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleToggle} 
      disabled={pending}
      title={isActive ? "Pause Rule" : "Activate Rule"}
    >
      {isActive ? <Pause className="w-4 h-4 text-orange-500" /> : <Play className="w-4 h-4 text-green-500" />}
      <span className="sr-only">{isActive ? "Pause" : "Activate"}</span>
    </Button>
  );
}
