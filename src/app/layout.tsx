import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NearCare — Your Personal Health OS",
  description: "Track your health, medications, and medical history in one place.",
  manifest: "/manifest.json",
  keywords: ["health", "medications", "medical history", "health tracker", "personal health OS", "vitals", "wellness"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NearCare",
  },
  openGraph: {
    title: "NearCare — Your Personal Health OS",
    description: "Track your health, medications, and medical history in one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NearCare — Your Personal Health OS",
    description: "Track your health, medications, and medical history in one place.",
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
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
