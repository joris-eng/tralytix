import type { HTMLAttributes } from "react";
import { cn } from "@/features/ui/lib/cn";

type HeadingLevel = 1 | 2 | 3;

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: HeadingLevel;
};

export function Heading({ level = 2, className, children, ...props }: HeadingProps) {
  if (level === 1) {
    return (
      <h1 data-level={1} className={cn("ui-heading", className)} {...props}>
        {children}
      </h1>
    );
  }
  if (level === 3) {
    return (
      <h3 data-level={3} className={cn("ui-heading", className)} {...props}>
        {children}
      </h3>
    );
  }
  return (
    <h2 data-level={2} className={cn("ui-heading", className)} {...props}>
      {children}
    </h2>
  );
}
