"use client";

import { useState } from "react";
import { useMt5Import } from "@/features/mt5/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";

export function Mt5ImportCard() {
  const [file, setFile] = useState<File | null>(null);
  const { upload, loading, error, result } = useMt5Import();

  const onUpload = async () => {
    if (!file) {
      return;
    }
    await upload(file);
  };

  return (
    <section className="card">
      <h2>MT5 CSV Import</h2>
      <div className="row">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button className="primary" onClick={() => void onUpload()} disabled={!file || loading}>
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>
      {error ? <ApiError message={error} /> : null}
      {result ? <JsonBlock value={result} /> : null}
    </section>
  );
}

