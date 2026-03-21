import { z } from "zod";

export const JournalEntrySchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: z.enum(["LONG", "SHORT"]),
  timeframe: z.string(),
  entry_price: z.number(),
  close_price: z.number(),
  profit: z.number(),
  opened_at: z.string(),
  setup: z.string(),
  emotions: z.array(z.string()),
  notes: z.string(),
  lessons: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const JournalStatsSchema = z.object({
  total_entries: z.number(),
  documented_setups: z.number(),
  lessons_learned: z.number(),
  documentation_rate: z.number(),
});

export const JournalListResponseSchema = z.object({
  entries: z.array(JournalEntrySchema),
  stats: JournalStatsSchema,
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type JournalStats = z.infer<typeof JournalStatsSchema>;
export type JournalListResponse = z.infer<typeof JournalListResponseSchema>;

export interface CreateEntryPayload {
  symbol: string;
  side: "LONG" | "SHORT";
  timeframe: string;
  entry_price: number;
  close_price: number;
  profit: number;
  opened_at: string;
  setup: string;
  emotions: string[];
  notes: string;
  lessons: string;
}

export const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];

export const EMOTION_OPTIONS = [
  "Confiant",
  "Patient",
  "Discipliné",
  "Frustré",
  "Impatient",
  "Stressé",
  "Revanche",
  "Euphorique",
  "Neutre",
];
