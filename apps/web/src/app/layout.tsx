import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
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
            <Link href="/">Dashboard</Link>
            <Link href="/login">Login</Link>
            <Link href="/mt5-status">MT5 Status</Link>
            <Link href="/chart">Chart</Link>
            <Link href="/stats">Stats</Link>
            <LogoutButton />
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
