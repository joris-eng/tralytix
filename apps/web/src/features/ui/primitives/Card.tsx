import type { HTMLAttributes } from "react";
import { cn } from "@/features/ui/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
};

export function Card({ elevated = false, className, ...props }: CardProps) {
  return <div data-elevated={elevated} className={cn("ui-card", className)} {...props} />;
}
