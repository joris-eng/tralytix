export const TOKEN_KEY = "tralytix_token";

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getToken(): string | null {
  if (!isBrowser()) {
    return null;
  }
  const value = window.localStorage.getItem(TOKEN_KEY)?.trim() ?? "";
  return value || null;
}

export function setToken(token: string): void {
  if (!isBrowser()) {
    return;
  }
  const value = token.trim();
  window.localStorage.setItem(TOKEN_KEY, value);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=${value}; Path=/; SameSite=Lax; Max-Age=2592000${secure}`;
}

export function clearToken(): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}
