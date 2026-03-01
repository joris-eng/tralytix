import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/features/ui/lib/cn";

type TooltipProps = HTMLAttributes<HTMLSpanElement> & {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children, className, ...props }: TooltipProps) {
  return (
    <span className={cn("ui-tooltip-root", className)} {...props}>
      {children}
      <span role="tooltip" className="ui-tooltip-bubble">
        {content}
      </span>
    </span>
  );
}
