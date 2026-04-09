"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, BookOpen, BarChart3, User, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "@/shared/contexts/LanguageContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { path: "/dashboard-v1", icon: TrendingUp, label: t("nav.dashboard"), isExact: true },
    { path: "/trades", icon: BookOpen, label: t("nav.trades") },
    { path: "/pro-analysis", icon: BarChart3, label: t("nav.analysis") },
    { path: "/mon-profil", icon: User, label: t("nav.monProfil") },
    { path: "/mt5-status", icon: Upload, label: t("nav.import") },
  ];

  const isActive = (path: string, isExact?: boolean) => {
    if (isExact) return pathname === path;
    return pathname?.startsWith(path) ?? false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 backdrop-blur-xl z-40">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const active = isActive(item.path, item.isExact);
          return (
            <Link key={item.path} href={item.path} className="relative flex flex-col items-center gap-1 px-3 py-2 min-w-[60px]">
              {active && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative">
                <item.icon className={`w-5 h-5 ${active ? "text-cyan-400" : "text-gray-400"}`} />
              </div>
              <span className={`text-[10px] font-medium relative ${active ? "text-cyan-400" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
