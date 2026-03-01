import { apiClient } from "@/shared/api/apiClient";
import {
  analyticsSummarySchema,
  mt5EquitySchema,
  mt5InsightsSchema,
  mt5AnalyticsSummarySchema,
  type AnalyticsSummaryModel,
  type Mt5AnalyticsSummaryModel,
  type Mt5EquityModel,
  type Mt5InsightsModel
} from "@/features/analytics/model";

export async function getAnalyticsSummary(): Promise<AnalyticsSummaryModel> {
  const payload = await apiClient.analyticsSummary();
  return analyticsSummarySchema.parse(payload);
}

export async function getMt5AnalyticsSummary(): Promise<Mt5AnalyticsSummaryModel> {
  const payload = await apiClient.mt5AnalyticsSummary();
  return mt5AnalyticsSummarySchema.parse(payload);
}

export async function getMt5AnalyticsInsights(): Promise<Mt5InsightsModel> {
  const payload = await apiClient.mt5AnalyticsInsights();
  return mt5InsightsSchema.parse(payload);
}

export async function getMt5AnalyticsEquity(): Promise<Mt5EquityModel> {
  const payload = await apiClient.mt5AnalyticsEquity();
  return mt5EquitySchema.parse(payload);
}

export async function recomputeMt5AnalyticsDaily(): Promise<unknown> {
  return apiClient.mt5AnalyticsRecomputeDaily();
}

