import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://loginptn.xyz"),
  title: {
    default: "LoginPTN — Platform Belajar UTBK SNBT Gratis dengan AI",
    template: "%s | LoginPTN",
  },
  description:
    "Platform belajar digital cerdas berbasis AI untuk persiapan UTBK SNBT 2026. Bank soal lengkap, tryout realistis, AI assistant, analytics performa, study groups, dan leaderboard. Gratis untuk semua pelajar Indonesia.",
  keywords: [
    "UTBK", "SNBT", "belajar UTBK", "belajar SNBT", "tryout UTBK", "tryout SNBT",
    "latihan soal UTBK", "latihan soal SNBT", "soal UTBK 2026", "soal SNBT 2026",
    "persiapan UTBK", "persiapan SNBT", "bank soal UTBK", "bank soal SNBT",
    "belajar online", "platform belajar", "PTN", "masuk PTN", "lolos PTN",
    "AI belajar", "tryout online gratis", "simulasi UTBK",
    "penalaran umum", "pengetahuan kuantitatif", "literasi",
    "LoginPTN", "login PTN", "belajar gratis"
  ],
  authors: [{ name: "LoginPTN", url: "https://loginptn.xyz" }],
  creator: "LoginPTN",
  publisher: "LoginPTN",
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
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://loginptn.xyz",
    siteName: "LoginPTN",
    title: "LoginPTN — Platform Belajar UTBK SNBT #1 di Indonesia",
    description:
      "Raih PTN impianmu dengan AI! Bank soal 5000+, tryout realistis, AI assistant, analytics, dan study groups. 100% gratis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LoginPTN — Smart AI Learning Platform untuk UTBK SNBT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LoginPTN — Belajar UTBK SNBT dengan AI Gratis",
    description: "Platform belajar cerdas untuk lolos PTN impianmu. Bank soal, tryout, AI assistant, dan analytics.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://loginptn.xyz",
  },
  category: "education",
  verification: {
    google: "ADD_YOUR_GOOGLE_VERIFICATION_CODE_HERE",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
