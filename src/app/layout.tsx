// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner"; // Impor Toaster
import Header from "@/components/Layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eryzsh DB",
  description: "Simple Database-as-a-Service powered by Discord",
  openGraph: {
    title: "Eryzsh DB",
    description: "Simple Database-as-a-Service powered by Discord",
    url: "https://eryzshdb.vercel.app",
    siteName: "Eryzsh DB",
    locale: "en-US",
    type: "website",
    images: [
      {
        url: "https://erzysh.vercel.app/api/database/1396528719002075287/1396528759082844230/1396528858702024784?raw=true&userID=881d4d54-126d-4362-8228-dd2235e90b58",
        width: 512,
        height: 512,
        alt: "Eryzsh DB Logo",
      },
    ],
  },
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
