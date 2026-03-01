import type { ReactNode } from "react";
import { Card, Heading } from "@/features/ui/primitives";

type FilterBarProps = {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function FilterBar({ title = "Filters", children, actions }: FilterBarProps) {
  return (
    <Card>
      <div className="ui-filter-bar">
        <Heading level={3}>{title}</Heading>
        <div className="ui-filter-grid">{children}</div>
        {actions ? <div>{actions}</div> : null}
      </div>
    </Card>
  );
}
