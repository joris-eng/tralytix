"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { journalApi } from "@/features/journal/api/journalApi";
import type {
  JournalEntry,
  JournalStats,
  CreateEntryPayload,
} from "@/features/journal/model/types";

export function useJournalList() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await journalApi.list();
      if (!mountedRef.current) return;
      setEntries(res.entries);
      setStats(res.stats);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return { entries, stats, loading, error, refresh: load };
}

export function useCreateEntry() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (payload: CreateEntryPayload): Promise<JournalEntry | null> => {
      setLoading(true);
      setError(null);
      try {
        return await journalApi.create(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur création");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { create, loading, error };
}

export function useUpdateEntry() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (id: string, payload: CreateEntryPayload): Promise<JournalEntry | null> => {
      setLoading(true);
      setError(null);
      try {
        return await journalApi.update(id, payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur mise à jour");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { update, loading, error };
}

export function useDeleteEntry() {
  const [loading, setLoading] = useState(false);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await journalApi.delete(id);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading };
}
