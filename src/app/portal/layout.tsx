import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Customer Portal",
    template: "%s · Portal",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1d24" },
  ],
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
