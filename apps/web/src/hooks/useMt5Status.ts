"use client";

import { useCallback, useEffect, useState } from "react";
import { devLogin } from "@/lib/auth/authService";
import { getToken } from "@/lib/auth/tokenStore";
import { getMt5Status, type Mt5StatusResponse } from "@/lib/api/mt5";
import { isHttpError } from "@/lib/http/errors";

const DEV_LOGIN_EMAIL = "dev@local.test";

export type Mt5StatusHookState = {
  data: Mt5StatusResponse | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useMt5Status(): Mt5StatusHookState {
  const [data, setData] = useState<Mt5StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!getToken()) {
        await devLogin(DEV_LOGIN_EMAIL);
      }

      const status = await getMt5Status();
      setData(status);
      return;
    } catch (err) {
      let finalError: unknown = err;
      const shouldRetry =
        !getToken() || (isHttpError(finalError) && finalError.status === 401);
      if (shouldRetry) {
        try {
          await devLogin(DEV_LOGIN_EMAIL);
          const status = await getMt5Status();
          setData(status);
          setError(null);
          return;
        } catch (secondError) {
          finalError = secondError;
        }
      }

      if (isHttpError(finalError)) {
        setError(`${finalError.message} (status ${finalError.status})`);
      } else if (finalError instanceof Error) {
        setError(finalError.message);
      } else {
        setError("Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, loading, refresh };
}

