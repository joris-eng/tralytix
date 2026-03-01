"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  Skeleton,
  Text,
  ToggleTabs,
  Tooltip
} from "@/features/ui/primitives";

type ViewMode = "simple" | "pro";

const VIEW_OPTIONS = [
  { value: "simple", label: "Simple" },
  { value: "pro", label: "Pro" }
] as const;

export function UIKitPreview() {
  const [viewMode, setViewMode] = useState<ViewMode>("simple");

  return (
    <section className="ui-kit-layout">
      <Card elevated>
        <Heading level={1}>UI Kit</Heading>
        <Text tone="muted">
          Fondations dark premium: surfaces nettes, contrastes lisibles, accents limites aux signaux importants.
        </Text>
      </Card>

      <Card>
        <Heading level={2}>Buttons & Badges</Heading>
        <div className="ui-kit-row">
          <Button variant="neutral">Neutral</Button>
          <Button variant="primary">Primary CTA</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="success">Success</Button>
        </div>
        <Divider style={{ margin: "16px 0" }} />
        <div className="ui-kit-row">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="primary">KPI</Badge>
          <Badge variant="warning">Risk</Badge>
          <Badge variant="success">Healthy</Badge>
        </div>
      </Card>

      <Card>
        <Heading level={2}>Typography & Tooltip</Heading>
        <Text size="md">Texte principal pour information prioritaire.</Text>
        <Text size="sm" tone="muted">
          Texte secondaire, discret, jamais le point focal.
        </Text>
        <div className="ui-kit-row">
          <Tooltip content="Metrique calculee sur les 30 derniers jours">
            <Badge variant="primary" tabIndex={0}>
              Hover / Focus me
            </Badge>
          </Tooltip>
        </div>
      </Card>

      <Card>
        <Heading level={2}>Tabs / Toggle</Heading>
        <ToggleTabs<ViewMode> value={viewMode} options={[...VIEW_OPTIONS]} onChange={setViewMode} ariaLabel="Mode d'affichage" />
        <Text tone="subtle" style={{ marginTop: 12 }}>
          Mode actif: {viewMode === "simple" ? "Simple (signal essentiel)" : "Pro (details complets)"}
        </Text>
      </Card>

      <Card>
        <Heading level={2}>Skeleton</Heading>
        <div className="ui-kit-section">
          <Skeleton height={14} width={220} />
          <Skeleton height={12} />
          <Skeleton height={12} width="82%" />
        </div>
      </Card>
    </section>
  );
}
