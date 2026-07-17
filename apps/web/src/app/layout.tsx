import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Breakscope — Responsive testing", template: "%s · Breakscope" },
  description: "Find responsive failures across the widths and browsers that matter.",
  applicationName: "Breakscope",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full"><a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a><Providers>{children}</Providers></body>
    </html>
  );
}
