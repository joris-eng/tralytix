"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTokenPresence } from "@/shared/auth/useSessionState";

function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = items.some((i) => pathname?.startsWith(i.href));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: isActive ? "var(--ui-color-primary)" : "var(--ui-color-muted)",
          fontSize: "0.85rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: "0.3rem 0",
          fontFamily: "inherit",
        }}
      >
        {label}
        <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            background: "#1a1a1f",
            border: "1px solid var(--ui-color-border)",
            borderRadius: "10px",
            padding: "0.4rem",
            minWidth: "180px",
            zIndex: 200,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "0.55rem 0.8rem",
                borderRadius: "6px",
                fontSize: "0.85rem",
                color: pathname === item.href ? "var(--ui-color-primary)" : "var(--ui-color-text)",
                textDecoration: "none",
                background: pathname === item.href ? "rgba(0,255,163,0.07)" : "transparent",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.href)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.href)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
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

  if (checking) {
    return <span className="session-badge loading">Syncing...</span>;
  }

  if (!hasToken) {
    return <Link href="/login">Login</Link>;
  }

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <span className="session-badge">Connected</span>
      <Link
        href="/dashboard-v1"
        style={{
          color: isActive("/dashboard-v1") ? "var(--ui-color-primary)" : "var(--ui-color-muted)",
          fontWeight: 600,
          fontSize: "0.85rem",
          textDecoration: "none",
        }}
      >
        Dashboard
      </Link>
      <NavDropdown
        label="Trades"
        items={[
          { href: "/trades", label: "Journal de Trading" },
          { href: "/trades/revision", label: "Révision des Trades" },
        ]}
      />
      <Link
        href="/pro-analysis"
        style={{
          color: isActive("/pro-analysis") ? "var(--ui-color-primary)" : "var(--ui-color-muted)",
          fontWeight: 600,
          fontSize: "0.85rem",
          textDecoration: "none",
        }}
      >
        Analyse
      </Link>
      <Link
        href="/mt5-status"
        style={{
          color: isActive("/mt5-status") ? "var(--ui-color-primary)" : "var(--ui-color-muted)",
          fontWeight: 600,
          fontSize: "0.85rem",
          textDecoration: "none",
        }}
      >
        Import
      </Link>
      <Link
        href="/plans"
        style={{
          color: isActive("/plans") ? "var(--ui-color-primary)" : "var(--ui-color-muted)",
          fontWeight: 600,
          fontSize: "0.85rem",
          textDecoration: "none",
        }}
      >
        Plans
      </Link>
    </>
  );
}
