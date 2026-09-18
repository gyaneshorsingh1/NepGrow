import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { WebsiteContent } from "@/features/websites/resolve";

export function SportsHome({
  content,
  businessName,
  bookHref,
}: {
  content: WebsiteContent;
  businessName: string;
  bookHref: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.35),_transparent_55%)]"
      />
      <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-20">
        <p className="mb-3 text-sm uppercase tracking-[0.18em] text-emerald-300/80">
          {businessName}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          {content.heroHeadline || businessName}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-emerald-50/75">
          {content.heroSubheadline ||
            "Book courts, join memberships, and play more."}
        </p>
        <div className="mt-8">
          <Button
            asChild
            size="lg"
            className="bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
          >
            <Link href={bookHref}>Book a court</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
