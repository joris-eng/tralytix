import type { HTMLAttributes } from "react";
import { cn } from "@/features/ui/lib/cn";

type DividerProps = HTMLAttributes<HTMLHRElement>;

export function Divider({ className, ...props }: DividerProps) {
  return <hr className={cn("ui-divider", className)} {...props} />;
}
