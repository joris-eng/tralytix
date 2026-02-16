import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

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
            <Link href="/login">Login</Link>
            <Link href="/chart">Chart</Link>
            <Link href="/stats">Stats</Link>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
