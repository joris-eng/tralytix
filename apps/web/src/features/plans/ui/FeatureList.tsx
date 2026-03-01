import { Text } from "@/features/ui/primitives";

type FeatureListProps = {
  items: string[];
};

export function FeatureList({ items }: FeatureListProps) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
      {items.map((item) => (
        <li key={item}>
          <Text size="sm">{item}</Text>
        </li>
      ))}
    </ul>
  );
}
