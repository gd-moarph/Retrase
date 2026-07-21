import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { seo } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(seo.siteUrl),
  title: {
    default: seo.homeTitle,
    template: "%s",
  },
  description: seo.homeDescription,
  applicationName: seo.siteName,
  category: "health",
  manifest: "/manifest.json",
  icons: {
    icon: "/retrase-icon.svg",
    shortcut: "/retrase-icon.svg",
    apple: "/retrase-icon.svg",
  },
  openGraph: {
    title: seo.homeTitle,
    description: seo.homeDescription,
    url: seo.siteUrl,
    siteName: seo.siteName,
    type: "website",
    locale: "ro_RO",
    images: [{ url: new URL(seo.defaultImage, seo.siteUrl).toString(), width: 1200, height: 630, alt: seo.homeTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: seo.homeTitle,
    description: seo.homeDescription,
    images: [new URL(seo.defaultImage, seo.siteUrl).toString()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          {children}
          <Toaster richColors position="bottom-right" expand visibleToasts={4} gap={10} />
        </TooltipProvider>
      </body>
    </html>
  );
}
