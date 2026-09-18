import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";

type Params = Promise<{ category: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { category } = await params;
  const cat = await prisma.businessCategory.findFirst({
    where: {
      OR: [{ domainSlug: category }, { slug: category }],
    },
  });
  return {
    title: cat ? `${cat.name} businesses` : "Category",
  };
}

export default async function CategoryLandingPage({
  params,
}: {
  params: Params;
}) {
  const { category } = await params;
  const cat = await prisma.businessCategory.findFirst({
    where: {
      OR: [{ domainSlug: category }, { slug: category }],
      status: "ACTIVE",
    },
  });

  if (!cat) notFound();

  const businesses = await prisma.business.findMany({
    where: {
      categoryId: cat.id,
      status: { in: ["ACTIVE", "TRIAL"] },
      website: { published: true },
    },
    orderBy: { name: "asc" },
  });

  if (businesses.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <PageHeader
          title={cat.name}
          description="No published businesses in this category yet."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <PageHeader
        title={cat.name}
        description={cat.description ?? "Browse businesses in this category."}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <CardTitle>
                <Link
                  href={`/sites/${cat.domainSlug}/${b.slug}`}
                  className="hover:text-primary"
                >
                  {b.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {b.description || b.address || "View website"}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
