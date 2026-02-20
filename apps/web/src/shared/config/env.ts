const API_BASE_FALLBACK = "http://localhost:8080/v1";

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) {
    return value;
  }
  if (fallback) {
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${name}`);
}

function stripApiPrefix(base: string): string {
  return base.replace(/\/v1\/?$/, "");
}

export const env = {
  apiBase: readEnv("NEXT_PUBLIC_API_BASE", API_BASE_FALLBACK)
};

export const envDerived = {
  apiOrigin: stripApiPrefix(env.apiBase),
  apiRuntimeBase: typeof window === "undefined" ? env.apiBase : "/api/v1",
  apiRuntimeOrigin: typeof window === "undefined" ? stripApiPrefix(env.apiBase) : "/api"
};

