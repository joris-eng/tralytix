import { httpRequest } from "@/shared/api/http";
import { envDerived } from "@/shared/config/env";
import {
  JournalListResponseSchema,
  JournalEntrySchema,
  type CreateEntryPayload,
  type JournalEntry,
  type JournalListResponse,
} from "@/features/journal/model/types";

const client = { baseUrl: envDerived.apiRuntimeBase, defaultTimeoutMs: 10_000 };

export const journalApi = {
  list: async (): Promise<JournalListResponse> => {
    const data = await httpRequest<unknown>(client, "GET", "/journal");
    return JournalListResponseSchema.parse(data);
  },

  create: async (payload: CreateEntryPayload): Promise<JournalEntry> => {
    const data = await httpRequest<unknown>(client, "POST", "/journal", { body: payload });
    return JournalEntrySchema.parse(data);
  },

  get: async (id: string): Promise<JournalEntry> => {
    const data = await httpRequest<unknown>(client, "GET", `/journal/${id}`);
    return JournalEntrySchema.parse(data);
  },

  update: async (id: string, payload: CreateEntryPayload): Promise<JournalEntry> => {
    const data = await httpRequest<unknown>(client, "PUT", `/journal/${id}`, { body: payload });
    return JournalEntrySchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpRequest<void>(client, "DELETE", `/journal/${id}`);
  },
};
