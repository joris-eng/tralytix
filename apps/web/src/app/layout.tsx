import "./globals.css";
import type { Metadata } from "next";
import { AuthNavLinks } from "@/features/auth/ui/AuthNavLinks";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { AuthSessionProvider } from "@/shared/auth/AuthSessionProvider";
import { NotificationBell } from "@/shared/notifications/NotificationBell";

export const metadata: Metadata = {
  title: "Tralytix",
  description: "Precision trading analytics terminal"
};

export default function RootLayout({
  children
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
          <div className="app-shell">
            <nav className="app-nav">
              <div className="app-nav-logo">
                TRALYTIX<span className="app-nav-dot">.</span>
              </div>
              <div className="app-nav-links">
                <AuthNavLinks />
              </div>
              <div className="app-nav-actions">
                <NotificationBell />
                <LogoutButton />
              </div>
            </nav>
            <main className="app-main">
              {children}
            </main>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
