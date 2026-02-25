"use client";

import { useEffect, useState } from "react";

import { getToken, setToken as persistToken } from "@/lib/auth";

type TokenInputProps = {
  id?: string;
  label?: string;
  onTokenChange?: (value: string) => void;
  onRememberChange?: (value: boolean) => void;
};

export function TokenInput({
  id = "token",
  label = "Token",
  onTokenChange,
  onRememberChange
}: TokenInputProps) {
  const [token, setToken] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(true);

  useEffect(() => {
    const stored = getToken() ?? "";
    setToken(stored);
    onTokenChange?.(stored);
    setRemember(true);
    onRememberChange?.(true);
  }, [onRememberChange, onTokenChange]);

  function handleChange(value: string) {
    setToken(value);
    if (remember) {
      persistToken(value);
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
      <label htmlFor={`${id}-remember`}>
        <input
          id={`${id}-remember`}
          type="checkbox"
          checked={remember}
          onChange={(event) => {
            const nextRemember = event.target.checked;
            setRemember(nextRemember);
            onRememberChange?.(nextRemember);
          }}
        />
        Remember
      </label>
    </>
  );
}
