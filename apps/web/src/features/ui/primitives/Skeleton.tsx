import type { HTMLAttributes } from "react";
import { cn } from "@/features/ui/lib/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: number | string;
  height?: number | string;
};

export function Skeleton({ width = "100%", height = 12, className, style, ...props }: SkeletonProps) {
  return <div className={cn("ui-skeleton", className)} style={{ width, height, ...style }} aria-hidden {...props} />;
}
