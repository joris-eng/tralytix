function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getApiBaseUrl(): string {
  const raw = process.env.API_BASE_URL?.trim();

  if (raw && isValidHttpUrl(raw)) {
    return raw;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080";
  }

  throw new Error("API_BASE_URL is required in production");
}
