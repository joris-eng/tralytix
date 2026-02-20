export const API_PREFIX = "/v1";

export const SYSTEM_ENDPOINTS = {
  health: "/health",
  version: "/version"
} as const;

export const AUTH_ENDPOINTS = {
  devLogin: `${API_PREFIX}/auth/dev-login`
} as const;

export const MT5_ENDPOINTS = {
  status: `${API_PREFIX}/integrations/mt5/status`
} as const;

