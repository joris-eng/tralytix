import "./globals.css";
import type { Metadata } from "next";
import { AuthNavLinks } from "@/features/auth/ui/AuthNavLinks";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";

export const metadata: Metadata = {
  title: "Trading SaaS",
  description: "MVP front for trading-saas API"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          <nav className="nav">
            <AuthNavLinks />
            <LogoutButton />
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
