import { z } from "zod";

export const healthSchema = z.object({
  status: z.string(),
  db: z.string().optional()
});

export const versionSchema = z.object({
  name: z.string(),
  version: z.string(),
  commit: z.string().optional(),
  builtAt: z.string().optional()
});

export type HealthModel = z.infer<typeof healthSchema>;
export type VersionModel = z.infer<typeof versionSchema>;

