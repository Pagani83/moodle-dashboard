import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MoodleAppWrapper } from "@/providers/moodle-provider";
import { ThemeClient } from "@/components/theme/theme-client";
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
  title: "Dashboard Moodle CJUD",
  description: "Sistema de acompanhamento e relatórios para cursos Moodle do CJUD",
  keywords: ["moodle", "dashboard", "cjud", "relatórios", "cursos"],
  authors: [{ name: "CJUD - Tribunal de Justiça do RS" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <ThemeClient />
        <MoodleAppWrapper
          enableDevtools={process.env.NODE_ENV === 'development'}
          requireConfiguration={true}
        >
          {children}
        </MoodleAppWrapper>
      </body>
    </html>
  );
}
