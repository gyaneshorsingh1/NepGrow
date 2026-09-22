import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";

import { EditCurrencyCard } from "../currency-forms";

export const metadata = { title: "Edit currency" };

export default async function AdminCurrencyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currency = await prisma.currency.findUnique({ where: { id } });
  if (!currency) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={currency.code}
        description="Edit currency details used across client businesses."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/currencies">Back to currencies</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <EditCurrencyCard currency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}