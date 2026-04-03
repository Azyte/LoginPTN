import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";

export const metadata: Metadata = {
  title: "LoginPTN — Smart AI Learning Platform untuk UTBK SNBT",
  description:
    "Platform belajar digital cerdas berbasis AI untuk persiapan UTBK SNBT. Bank soal, tryout realistis, AI assistant, analytics, dan komunitas belajar.",
  keywords: ["UTBK", "SNBT", "belajar", "PTN", "tryout", "AI", "Indonesia"],
  authors: [{ name: "LoginPTN" }],
  openGraph: {
    title: "LoginPTN — Smart AI Learning Platform",
    description: "Platform belajar cerdas untuk lolos PTN impianmu",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
