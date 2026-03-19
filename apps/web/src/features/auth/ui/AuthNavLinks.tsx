"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTokenPresence } from "@/shared/auth/useSessionState";
import styles from "@/features/auth/ui/nav.module.css";

function NavDropdown({ label, items }: { label: string; items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={styles.dropdown}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button type="button" className={styles.dropdownTrigger}>
        {label} <span className={styles.caret}>▾</span>
      </button>
      {open && (
        <div className={styles.dropdownMenu}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={styles.dropdownItem}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AuthNavLinks() {
  const { hasToken, checking } = useTokenPresence();
  const pathname = usePathname();

  if (checking) return null;

  if (!hasToken) {
    return <Link href="/login" className={styles.navLink}>Login</Link>;
  }

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <nav className={styles.navLinks}>
      <Link
        href="/dashboard-v1"
        className={`${styles.navLink} ${isActive("/dashboard-v1") ? styles.navLinkActive : ""}`}
      >
        Dashboard
      </Link>

      <NavDropdown
        label="Trades"
        items={[
          { href: "/pro-analysis", label: "Pro Analysis" },
          { href: "/pro-analysis", label: "Trade Journal" },
        ]}
      />

      <NavDropdown
        label="Analyse"
        items={[
          { href: "/pro-analysis", label: "Performance" },
          { href: "/dashboard-v1", label: "Insights" },
        ]}
      />

      <Link
        href="/mt5-status"
        className={`${styles.navLink} ${isActive("/mt5-status") ? styles.navLinkActive : ""}`}
      >
        Import
      </Link>

      <Link
        href="/plans"
        className={`${styles.navLink} ${isActive("/plans") ? styles.navLinkActive : ""}`}
      >
        Plans
      </Link>
    </nav>
  );
}
