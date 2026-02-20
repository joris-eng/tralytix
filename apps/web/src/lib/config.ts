const API_BASE_URL_ENV = "NEXT_PUBLIC_API_BASE_URL";

function readRequiredEnv(name: string): string {
  const raw = process.env[name];
  const value = raw?.trim();
  if (value) {
    return value;
  }

  const message = `Missing required env var: ${name}`;
  if (process.env.NODE_ENV !== "production") {
    throw new Error(message);
  }
  throw new Error(message);
}

export const config = {
  apiBaseUrl: readRequiredEnv(API_BASE_URL_ENV)
};

