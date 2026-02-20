const TOKEN_KEY = "tralytix_token";

let inMemoryToken: string | null = null;

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getToken(): string | null {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  if (!isBrowser()) {
    return null;
  }

  const stored = window.localStorage.getItem(TOKEN_KEY);
  if (stored) {
    inMemoryToken = stored;
  }
  return stored;
}

export function setToken(token: string): void {
  inMemoryToken = token;
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  inMemoryToken = null;
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
}

