import "./globals.css";
import type { Metadata } from "next";
import { AuthNavLinks } from "@/features/auth/ui/AuthNavLinks";
import { AuthSessionProvider } from "@/shared/auth/AuthSessionProvider";
import { NavRight } from "@/features/auth/ui/NavRight";

export const metadata: Metadata = {
  title: "Tralytix",
  description: "Precision trading analytics terminal"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
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
            <header className="app-nav">
              {/* Logo */}
              <a href="/dashboard-v1" className="app-nav-logo">
                <span className="app-nav-logo-T">T</span>
                <div className="app-nav-logo-text">
                  <span className="app-nav-logo-name">Tralytix</span>
                  <span className="app-nav-logo-tag">TRADING ANALYTICS</span>
                </div>
              </a>

              {/* Nav links */}
              <div className="app-nav-links">
                <AuthNavLinks />
              </div>

              {/* Right side */}
              <div className="app-nav-actions">
                <NavRight />
              </div>
            </header>
            <main className="app-main">
              {children}
            </main>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
