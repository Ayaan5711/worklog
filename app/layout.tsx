import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "worklog.space — AI work tracker",
  description: "Type what you did. AI turns it into structured, resume-ready documentation. Standups, brag sheets, and weekly summaries in seconds.",
  metadataBase: new URL("https://www.worklog.space"),
  openGraph: {
    title: "worklog.space — AI work tracker",
    description: "Type what you did. AI turns it into structured, resume-ready documentation.",
    url: "https://www.worklog.space",
    siteName: "worklog.space",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "worklog.space — AI work tracker",
    description: "Type what you did. AI turns it into structured, resume-ready documentation.",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0c0f14] text-white antialiased">
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
