import type { HTMLAttributes } from "react";
import { cn } from "@/features/ui/lib/cn";

type TextSize = "sm" | "md";
type TextTone = "default" | "muted" | "subtle";

type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  size?: TextSize;
  tone?: TextTone;
};

export function Text({ size = "md", tone = "default", className, ...props }: TextProps) {
  return <p data-size={size} data-tone={tone} className={cn("ui-text", className)} {...props} />;
}
