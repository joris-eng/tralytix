"use client";

import { cn } from "@/features/ui/lib/cn";

export type ToggleOption<T extends string> = {
  value: T;
  label: string;
};

type ToggleTabsProps<T extends string> = {
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
};

export function ToggleTabs<T extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel = "View mode"
}: ToggleTabsProps<T>) {
  return (
    <div className={cn("ui-toggle", className)} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            data-active={active}
            aria-selected={active}
            className="ui-toggle-item"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
