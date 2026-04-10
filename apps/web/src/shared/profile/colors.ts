import type { RiskSeverity, SeverityColors, ColorClasses } from "./types";

export const getSeverityColor = (severity: RiskSeverity): SeverityColors => {
  const colorMap: Record<RiskSeverity, SeverityColors> = {
    CRITICAL: {
      bg: "from-red-500/10 to-red-600/10",
      border: "border-red-500/50",
      text: "text-red-400",
      leftBorder: "border-l-red-500",
    },
    HIGH: {
      bg: "from-orange-500/10 to-orange-600/10",
      border: "border-orange-500/40",
      text: "text-orange-400",
      leftBorder: "border-l-orange-500",
    },
    MEDIUM: {
      bg: "from-amber-500/10 to-amber-600/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      leftBorder: "border-l-amber-500",
    },
  };
  return colorMap[severity];
};

export const getColorClasses = (color: string): ColorClasses => {
  const colors: Record<string, ColorClasses> = {
    emerald: {
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
    },
    cyan: {
      bg: "bg-cyan-500/5",
      border: "border-cyan-500/20",
      text: "text-cyan-400",
    },
    purple: {
      bg: "bg-purple-500/5",
      border: "border-purple-500/20",
      text: "text-purple-400",
    },
    blue: {
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      text: "text-blue-400",
    },
  };
  return colors[color] || colors.cyan;
};

export const getSeverityProgressWidth = (severity: RiskSeverity): number => {
  const widthMap: Record<RiskSeverity, number> = {
    CRITICAL: 85,
    HIGH: 65,
    MEDIUM: 45,
  };
  return widthMap[severity];
};
