import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/features/ui/lib/cn";

type ButtonVariant = "neutral" | "primary" | "warning" | "success";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "neutral", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} data-variant={variant} className={cn("ui-button", className)} {...props} />;
}
