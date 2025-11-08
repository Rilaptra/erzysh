// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css"; // <-- TAMBAHKAN BARIS INI
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// URL logo yang akan digunakan
const LOGO_URL =
  "https://erzysh.vercel.app/api/database/1396528719002075287/1396528759082844230/1411358085611520081?raw=true&userID=881d4d54-126d-4362-8228-dd2235e90b58";

export const metadata: Metadata = {
  title: {
    template: "%s | Eryzsh",
    default: "Eryzsh",
  },
  description: "Personal dashboard, DBaaS, and university toolkit.",
  openGraph: {
    title: "Eryzsh",
    description: "Personal dashboard, DBaaS, and university toolkit.",
    url: "https://eryzsh.vercel.app",
    siteName: "Eryzsh",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: LOGO_URL, // Menggunakan URL logo yang baru
        width: 512,
        height: 512,
        alt: "Eryzsh Logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Eryzsh",
    description: "Personal dashboard, DBaaS, and university toolkit.",
    // creator: "@yourtwitterhandle",
    images: [LOGO_URL], // Menggunakan URL logo yang baru
  },
  manifest: "/manifest.json", // <-- TAMBAHKAN INI
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Header />
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
