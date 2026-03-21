import { httpRequest } from "@/shared/api/http";
import { envDerived } from "@/shared/config/env";
import {
  ReviewListResponseSchema,
  ReviewSchema,
  type UpsertReviewPayload,
  type Review,
  type ReviewListResponse,
} from "@/features/revision/model/types";

const client = { baseUrl: envDerived.apiRuntimeBase, defaultTimeoutMs: 10_000 };

export const revisionApi = {
  list: async (): Promise<ReviewListResponse> => {
    const data = await httpRequest<unknown>(client, "GET", "/reviews");
    return ReviewListResponseSchema.parse(data);
  },

  upsert: async (tradeID: number, payload: UpsertReviewPayload): Promise<Review> => {
    const data = await httpRequest<unknown>(client, "PUT", `/reviews/${tradeID}`, { body: payload });
    return ReviewSchema.parse(data);
  },

  delete: async (tradeID: number): Promise<void> => {
    await httpRequest<void>(client, "DELETE", `/reviews/${tradeID}`);
  },
};
