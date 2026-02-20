const TOKEN_KEY = "tralytix_token";

let memoryToken: string | null = null;

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getToken(): string | null {
  if (memoryToken) {
    return memoryToken;
  }
  if (!isBrowser()) {
    return null;
  }
  memoryToken = window.localStorage.getItem(TOKEN_KEY);
  return memoryToken;
}

export function setToken(token: string): void {
  memoryToken = token;
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  memoryToken = null;
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
}

