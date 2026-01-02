import type { } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { db } from "@/lib/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata() {
  const data = await db
    .select()
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);
  const siteSettings = data.length > 0 ? data[0] : null;

  return {
    title: siteSettings?.siteTitle || "ASBP",
    description: siteSettings?.siteDescription || "A Simple Blogging Platform",
    icons: siteSettings?.faviconUrl
      ? [{ rel: "icon", url: siteSettings.faviconUrl }]
      : [{ rel: "icon", url: "/favicon.ico" }],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="top-center" richColors />
        </NextIntlClientProvider>
        <Script
          src="/js/instantpage.min.js"
          strategy="afterInteractive"
          type="module"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
