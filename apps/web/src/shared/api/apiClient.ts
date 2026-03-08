import { envDerived } from "@/shared/config/env";
import { httpRequest, type HttpClientConfig } from "@/shared/api/http";

const privateClient: HttpClientConfig = {
  baseUrl: envDerived.apiRuntimeBase,
  defaultTimeoutMs: 8000
};

const publicClient: HttpClientConfig = {
  baseUrl: envDerived.apiRuntimeOrigin,
  defaultTimeoutMs: 8000
};

export const apiClient = {
  health: () => httpRequest<unknown>(publicClient, "GET", "/health", { auth: false }),
  version: () => httpRequest<unknown>(publicClient, "GET", "/version", { auth: false }),
  devLogin: (email: string) =>
    httpRequest<unknown>(privateClient, "POST", "/auth/dev-login", {
      auth: false,
      body: { email }
    }),
  mt5Status: () => httpRequest<unknown>(privateClient, "GET", "/integrations/mt5/status"),
  mt5Trades: (limit?: number, offset?: number) =>
    httpRequest<unknown>(privateClient, "GET", "/integrations/mt5/trades", {
      query: {
        ...(limit !== undefined ? { limit: String(limit) } : {}),
        ...(offset !== undefined ? { offset: String(offset) } : {})
      }
    }),
  mt5Import: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return httpRequest<unknown>(privateClient, "POST", "/integrations/mt5/import", {
      body: formData
    });
  },
  tradesList: () => httpRequest<unknown>(privateClient, "GET", "/trades"),
  tradesCreate: (body: unknown) => httpRequest<unknown>(privateClient, "POST", "/trades", { body }),
  marketdataCandles: (query: Record<string, string>) =>
    httpRequest<unknown>(privateClient, "GET", "/marketdata/candles", { query }),
  analyticsSummary: () => httpRequest<unknown>(privateClient, "GET", "/analytics/summary"),
  mt5AnalyticsSummary: () =>
    httpRequest<unknown>(privateClient, "GET", "/integrations/mt5/analytics/summary"),
  mt5AnalyticsInsights: () =>
    httpRequest<unknown>(privateClient, "GET", "/integrations/mt5/analytics/insights"),
  mt5AnalyticsEquity: () =>
    httpRequest<unknown>(privateClient, "GET", "/integrations/mt5/analytics/equity"),
  billingCheckout: (priceId: string) =>
    httpRequest<{ checkout_url: string }>(privateClient, "POST", "/billing/checkout", {
      body: { price_id: priceId },
      timeoutMs: 30_000 // Stripe session creation can take several seconds on cold start
    }),
  billingPlan: () => httpRequest<{ plan: "free" | "pro" }>(privateClient, "GET", "/billing/plan"),
  mt5AnalyticsRecomputeDaily: () =>
    httpRequest<unknown>(privateClient, "POST", "/integrations/mt5/analytics/recompute-daily")
};

