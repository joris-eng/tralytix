import { z } from "zod";

export const mt5StatusSchema = z
  .object({
    account_id: z.string().optional(),
    total_trades: z.number().optional(),
    last_import_status: z.string().optional(),
    last_imported_at: z.string().nullable().optional(),
    AccountID: z.string().optional(),
    TotalTrades: z.number().optional(),
    LastImportStatus: z.string().optional(),
    LastImportedAt: z.string().nullable().optional()
  })
  .passthrough();

export type Mt5StatusModel = z.infer<typeof mt5StatusSchema>;

