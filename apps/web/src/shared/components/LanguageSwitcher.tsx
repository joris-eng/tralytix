"use client";

import { motion, AnimatePresence } from "motion/react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languageLabel = language === "en" ? "🇬🇧 English" : "🇫🇷 Français";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
      >
        <Globe className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium">{languageLabel}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-32 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden z-50"
          >
            <button
              onClick={() => { setLanguage("en"); setIsOpen(false); }}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                language === "en" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-300 hover:bg-white/10"
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => { setLanguage("fr"); setIsOpen(false); }}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                language === "fr" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-300 hover:bg-white/10"
              }`}
            >
              🇫🇷 Français
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
