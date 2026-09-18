import Link from "next/link";

type SportsLayoutProps = {
  businessName: string;
  categorySlug: string;
  businessSlug: string;
  children: React.ReactNode;
};

const links = [
  { label: "Home", path: "" },
  { label: "Facilities", path: "/facilities" },
  { label: "Memberships", path: "/memberships" },
  { label: "Book", path: "/book" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export function SportsWebsiteLayout({
  businessName,
  categorySlug,
  businessSlug,
  children,
}: SportsLayoutProps) {
  const base = `/sites/${categorySlug}/${businessSlug}`;

  return (
    <div className="min-h-screen bg-[#06120d] text-white">
      <header className="border-b border-emerald-500/20 bg-[#07150f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href={base} className="text-xl font-semibold tracking-tight text-emerald-300">
            {businessName}
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-emerald-50/80">
            {links.map((link) => (
              <Link
                key={link.path}
                href={`${base}${link.path}`}
                className="transition hover:text-emerald-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-emerald-500/15 px-6 py-8 text-center text-sm text-emerald-100/50">
        Powered by NepGrow
      </footer>
    </div>
  );
}
