import { z } from "zod";

export const tradeCreateSchema = z.object({
  instrument_id: z.string().min(1),
  side: z.string().min(1),
  qty: z.coerce.number().positive(),
  entry_price: z.coerce.number().positive(),
  fees: z.coerce.number().default(0),
  notes: z.string().optional()
});

export const tradeSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().optional(),
  instrument_id: z.string().optional(),
  side: z.string().optional(),
  qty: z.number().optional(),
  entry_price: z.number().optional(),
  opened_at: z.string().optional(),
  fees: z.number().optional(),
  notes: z.string().optional()
});

export const tradesListSchema = z.object({
  trades: z.array(tradeSchema).default([])
});

export type TradeCreateInput = z.infer<typeof tradeCreateSchema>;
export type TradeModel = z.infer<typeof tradeSchema>;
export type TradesListModel = z.infer<typeof tradesListSchema>;

