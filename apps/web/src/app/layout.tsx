import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "UIRift — Visual regression workspace", template: "%s · UIRift" },
  description: "Compare deployed interfaces and review every changed pixel in a precise developer workspace.",
  applicationName: "UIRift",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full"><a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a><Providers>{children}</Providers></body>
    </html>
  );
}
