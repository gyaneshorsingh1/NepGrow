"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createAvailabilityRuleAction } from "@/features/sports/actions";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function CreateAvailabilityForm({
  courts,
}: {
  courts: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createAvailabilityRuleAction({
        courtId: String(fd.get("courtId") ?? "") || undefined,
        dayOfWeek: Number(fd.get("dayOfWeek")),
        startTime: String(fd.get("startTime") ?? ""),
        endTime: String(fd.get("endTime") ?? ""),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Availability rule added");
      router.push("/app/availability");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-2">
        <Label htmlFor="dayOfWeek">Day</Label>
        <Select id="dayOfWeek" name="dayOfWeek" defaultValue="1" required>
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="startTime">Start</Label>
        <Input id="startTime" name="startTime" type="time" defaultValue="06:00" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endTime">End</Label>
        <Input id="endTime" name="endTime" type="time" defaultValue="22:00" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="courtId">Court</Label>
        <Select id="courtId" name="courtId" defaultValue="">
          <option value="">All courts</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/availability">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add rule"}
        </Button>
      </div>
    </form>
  );
}
