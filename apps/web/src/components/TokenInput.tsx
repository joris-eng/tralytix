"use client";

import { useEffect, useState } from "react";

const TOKEN_STORAGE_KEY = "tralytix_token";

type TokenInputProps = {
  id?: string;
  label?: string;
  onTokenChange?: (value: string) => void;
};

export function TokenInput({
  id = "token",
  label = "Token",
  onTokenChange
}: TokenInputProps) {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
    setToken(stored);
    onTokenChange?.(stored);
  }, [onTokenChange]);

  function handleChange(value: string) {
    setToken(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, value);
    }
    onTokenChange?.(value);
  }

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={token}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Bearer token"
        style={{ width: "100%", marginBottom: 8 }}
      />
    </>
  );
}
