import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./tailwind-fix.css";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portfolio | Professional Developer",
  description: "A modern, responsive portfolio showcasing my work, skills, and experience as a full-stack developer.",
  keywords: ["portfolio", "developer", "full-stack", "web development", "react", "next.js"],
  authors: [{ name: "Portfolio Owner" }],
  creator: "Portfolio Owner",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com",
    title: "Portfolio | Professional Developer",
    description: "A modern, responsive portfolio showcasing my work, skills, and experience as a full-stack developer.",
    siteName: "Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio | Professional Developer",
    description: "A modern, responsive portfolio showcasing my work, skills, and experience as a full-stack developer.",
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
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
