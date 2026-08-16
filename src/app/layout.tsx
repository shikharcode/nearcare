import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/shared/providers";
import { SwRegister } from "@/components/shared/sw-register";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NearCare — Your Personal Health OS",
  description: "Track your health, medications, and medical history in one place. AI-powered insights, family alerts, and doctor portal.",
  manifest: "/manifest.json",
  keywords: ["health", "medications", "medical history", "health tracker", "personal health OS", "vitals", "wellness", "India", "elderly care"],
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NearCare",
    startupImage: "/icon-512.png",
  },
  openGraph: {
    title: "NearCare — Your Personal Health OS",
    description: "AI-powered health tracking, family alerts, and doctor portal for Indian families.",
    type: "website",
    siteName: "NearCare",
  },
  twitter: {
    card: "summary_large_image",
    title: "NearCare — Your Personal Health OS",
    description: "AI-powered health tracking, family alerts, and doctor portal for Indian families.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
        <body className="min-h-full flex flex-col" suppressHydrationWarning>
          <Providers>
            {children}
            <Toaster richColors position="top-right" />
            <SwRegister />
            <Analytics />
            <SpeedInsights />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
