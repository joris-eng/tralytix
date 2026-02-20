import { z } from "zod";

export const tradeCreateSchema = z.object({
  instrument_id: z.string().min(1),
  side: z.string().min(1),
  qty: z.coerce.number().positive(),
  entry_price: z.coerce.number().positive(),
  fees: z.coerce.number().default(0),
  notes: z.string().optional()
});

export type TradeCreateInput = z.infer<typeof tradeCreateSchema>;

