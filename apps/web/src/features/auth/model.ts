import { z } from "zod";

export const devLoginResponseSchema = z.object({
  token: z.string().min(1)
});

export type DevLoginResponseModel = z.infer<typeof devLoginResponseSchema>;

