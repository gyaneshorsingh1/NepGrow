import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/providers/toaster";

import "./globals.css";

const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NepGrow",
    template: "%s · NepGrow",
  },
  description:
    "NepGrow helps sports centers and local businesses run bookings, memberships, and growth from one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
