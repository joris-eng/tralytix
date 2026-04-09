"use client";

import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import NotificationSidebar from "./NotificationSidebar";
import MobileBottomNav from "./MobileBottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20 md:pb-0">
      <AppHeader />

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        {children}
      </main>

      <NotificationSidebar />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <MobileBottomNav />
    </div>
  );
}
