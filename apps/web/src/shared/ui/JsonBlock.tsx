type JsonBlockProps = {
  value: unknown;
};

export function JsonBlock({ value }: JsonBlockProps) {
  return <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify(value, null, 2)}</pre>;
}

