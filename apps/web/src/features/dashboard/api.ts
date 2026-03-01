import { apiClient } from "@/shared/api/apiClient";
import {
  dashboardInsightsSchema,
  dashboardSummarySchema,
  type DashboardInsights,
  type DashboardSummary
} from "@/features/dashboard/model";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const payload = await apiClient.analyticsSummary();
  return dashboardSummarySchema.parse(payload);
}

export async function fetchDashboardInsights(): Promise<DashboardInsights> {
  const payload = await apiClient.mt5AnalyticsInsights();
  return dashboardInsightsSchema.parse(payload);
}
