"use client";

import { motion } from "motion/react";

export default function Logo() {
  return (
    <div className="flex items-center gap-3.5">
      <div className="relative w-11 h-11">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-lg opacity-75" />
        <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 backdrop-blur-xl flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5" />
          <svg viewBox="0 0 24 24" className="w-6 h-6 relative z-10" fill="none">
            <path
              d="M7 7h10M12 7v10M10 17h4"
              stroke="url(#logoGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="logoGrad" x1="7" y1="7" x2="17" y2="17" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-violet-400/20 blur-xl opacity-50" />
          <h1 className="relative text-[26px] font-extrabold tracking-[-0.04em] bg-gradient-to-br from-white via-gray-50 to-gray-200 bg-clip-text text-transparent leading-none">
            Tralytix
          </h1>
          <div className="absolute -bottom-1 left-0 right-0 h-3 bg-gradient-to-b from-white/[0.03] to-transparent blur-sm" />
        </motion.div>
        <motion.p
          className="text-[9px] text-gray-500/80 font-semibold tracking-[0.2em] uppercase leading-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          Trading Analytics
        </motion.p>
      </div>
    </div>
  );
}
