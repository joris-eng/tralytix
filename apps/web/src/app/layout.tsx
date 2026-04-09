import "./globals.css";
import type { Metadata } from "next";
import { AuthSessionProvider } from "@/shared/auth/AuthSessionProvider";
import { LanguageProvider } from "@/shared/contexts/LanguageContext";
import AppShell from "@/shared/components/AppShell";

export const metadata: Metadata = {
  title: "Tralytix",
  description: "Precision trading analytics terminal",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthSessionProvider>
          <LanguageProvider>
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
