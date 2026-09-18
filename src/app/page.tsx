import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MarketingHomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07140f] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(34,197,94,0.28),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.18),_transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight text-emerald-300">
          NepGrow
        </span>
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/app/login">Tenant login</Link>
          </Button>
          <Button asChild className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
            <Link href="/admin/login">Admin</Link>
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center px-6 pb-20 pt-10">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-emerald-300/80">
          Nepal business platform
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl">
          NepGrow
        </h1>
        <p className="mt-5 max-w-xl text-lg text-emerald-50/80 sm:text-xl">
          Run sports centers with bookings, memberships, payments, and a public
          website — built for growth across Nepal.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
          >
            <Link href="/app/login">Open tenant app</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-emerald-400/40 bg-transparent text-emerald-100 hover:bg-emerald-500/10 hover:text-white"
          >
            <Link href="/admin/login">Platform admin</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
