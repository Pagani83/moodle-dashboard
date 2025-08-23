import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MoodleAppWrapper } from "@/providers/moodle-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
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
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
        suppressHydrationWarning
      >
        <ThemeClient />
        <AuthProvider>
          <MoodleAppWrapper
            enableDevtools={process.env.NODE_ENV === 'development'}
            requireConfiguration={true}
          >
            {children}
          </MoodleAppWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
