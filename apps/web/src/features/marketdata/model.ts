import { z } from "zod";

export const candlesQuerySchema = z.object({
  symbol: z.string().min(1),
  asset: z.string().min(1),
  tf: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1)
});

export type CandlesQuery = z.infer<typeof candlesQuerySchema>;

