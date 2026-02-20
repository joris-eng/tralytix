import { MT5_ENDPOINTS } from "@/lib/api/endpoints";
import { httpClient } from "@/lib/http/client";

export type Mt5StatusResponse = {
  account_id?: string;
  total_trades?: number;
  last_imported_at?: string | null;
  last_import_status?: string;
  AccountID?: string;
  TotalTrades?: number;
  LastImportedAt?: string | null;
  LastImportStatus?: string;
};

export async function getMt5Status(): Promise<Mt5StatusResponse> {
  return httpClient.request<Mt5StatusResponse>("GET", MT5_ENDPOINTS.status, {
    auth: true
  });
}

