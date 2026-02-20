import { apiClient } from "@/shared/api/apiClient";
import {
  analyticsSummarySchema,
  mt5AnalyticsSummarySchema,
  mt5InsightsSchema
} from "@/features/analytics/model";

export async function getAnalyticsSummary(): Promise<unknown> {
  const payload = await apiClient.analyticsSummary();
  return analyticsSummarySchema.parse(payload);
}

export async function getMt5AnalyticsSummary(): Promise<unknown> {
  const payload = await apiClient.mt5AnalyticsSummary();
  return mt5AnalyticsSummarySchema.parse(payload);
}

export async function getMt5AnalyticsInsights(): Promise<unknown> {
  const payload = await apiClient.mt5AnalyticsInsights();
  return mt5InsightsSchema.parse(payload);
}

export async function getMt5AnalyticsEquity(): Promise<unknown> {
  return apiClient.mt5AnalyticsEquity();
}

export async function recomputeMt5AnalyticsDaily(): Promise<unknown> {
  return apiClient.mt5AnalyticsRecomputeDaily();
}

