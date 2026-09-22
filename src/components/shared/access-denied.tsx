import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AccessDenied({
  title = "Access denied",
  description = "You do not have permission to view this page.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/app">Back to dashboard</Link>
      </Button>
    </div>
  );
}
