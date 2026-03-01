import type { HTMLAttributes } from "react";
import { cn } from "@/features/ui/lib/cn";

type BadgeVariant = "neutral" | "primary" | "warning" | "success";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return <span data-variant={variant} className={cn("ui-badge", className)} {...props} />;
}
