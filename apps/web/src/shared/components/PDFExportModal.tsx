"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Download, FileText, TrendingUp, BarChart, Lightbulb, List } from "lucide-react";
import { useLanguage } from "@/shared/contexts/LanguageContext";

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFExportModal({ isOpen, onClose }: PDFExportModalProps) {
  const { t } = useLanguage();

  const sections = [
    { icon: TrendingUp, title: t("pdfExport.performanceSummary"), included: true },
    { icon: BarChart, title: t("pdfExport.equityCurve"), included: true },
    { icon: Lightbulb, title: t("pdfExport.topInsights"), included: true },
    { icon: List, title: t("pdfExport.tradeBreakdown"), included: true },
  ];

  const handleDownload = () => {
    console.log("Downloading PDF report...");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 shadow-2xl overflow-hidden"
            >
              <div className="relative p-6 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{t("pdfExport.title")}</h2>
                      <p className="text-sm text-gray-400">{t("pdfExport.month")}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    {t("pdfExport.reportSections")}
                  </h3>
                  <div className="space-y-3">
                    {sections.map((section, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/10"
                      >
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <section.icon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="flex-1 text-sm">{section.title}</span>
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{t("pdfExport.infoText")}</p>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button onClick={onClose} className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors">
                  {t("pdfExport.cancel")}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {t("pdfExport.download")}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
