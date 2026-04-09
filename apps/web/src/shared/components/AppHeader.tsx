"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp, BarChart3, CreditCard, LogOut, BookOpen,
  User, Upload, ChevronDown, FileText,
} from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useTokenPresence } from "@/shared/auth/useSessionState";
import { clearToken } from "@/lib/auth";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { hasToken } = useTokenPresence();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  const navItems = [
    { path: "/dashboard-v1", label: t("nav.dashboard"), icon: TrendingUp, isExact: true },
    {
      path: "/trades",
      label: t("nav.trades"),
      icon: BookOpen,
      submenu: [
        { path: "/trades", label: t("nav.tradingJournal"), icon: BookOpen },
        { path: "/trades/revision", label: t("nav.tradeReview"), icon: FileText },
      ],
    },
    {
      path: "/pro-analysis",
      label: t("nav.analysis"),
      icon: BarChart3,
      submenu: [
        { path: "/pro-analysis", label: t("nav.proAnalysis"), icon: BarChart3 },
      ],
    },
    { path: "/mon-profil", label: t("nav.monProfil"), icon: User },
    { path: "/mt5-status", label: t("nav.import"), icon: Upload },
    { path: "/plans", label: t("nav.plans"), icon: CreditCard },
  ];

  const isSectionActive = (item: (typeof navItems)[0]) => {
    if (item.isExact) return pathname === item.path;
    if (item.submenu) return item.submenu.some((sub) => pathname === sub.path);
    return pathname === item.path;
  };

  return (
    <header className="border-b border-white/5 backdrop-blur-xl bg-black/20">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <Logo />

          <div className="flex items-center gap-3 md:gap-6">
            <LanguageSwitcher />
            {hasToken && (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-gray-400">Connected</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden md:block text-gray-400 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 mt-8">
          {navItems.map((item) => {
            const isActive = isSectionActive(item);
            return (
              <div
                key={item.path}
                className="relative"
                onMouseEnter={() => setHoveredSection(item.path)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <Link href={item.path}>
                  <motion.div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive ? "text-cyan-400" : "text-gray-400 hover:text-white"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm tracking-wider uppercase">{item.label}</span>
                    {item.submenu && (
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          hoveredSection === item.path || isActive ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </motion.div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-600"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>

                <AnimatePresence>
                  {item.submenu && (hoveredSection === item.path || isActive) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setHoveredSection(item.path)}
                      onMouseLeave={() => setHoveredSection(null)}
                      className="absolute top-full left-0 mt-2 min-w-[200px] rounded-xl bg-black/95 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
                    >
                      {item.submenu.map((subItem) => {
                        const isSubActive = pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            href={subItem.path}
                            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                              isSubActive
                                ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span className="text-sm">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
