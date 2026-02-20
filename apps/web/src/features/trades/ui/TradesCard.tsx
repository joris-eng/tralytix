"use client";

import { useEffect, useState } from "react";
import { useTrades } from "@/features/trades/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";
import type { TradeCreateInput } from "@/features/trades/model";

const initialForm: TradeCreateInput = {
  instrument_id: "",
  side: "BUY",
  qty: 1,
  entry_price: 1,
  fees: 0,
  notes: ""
};

export function TradesCard() {
  const { items, loading, error, refresh, submit } = useTrades();
  const [result, setResult] = useState<unknown>(null);
  const [form, setForm] = useState<TradeCreateInput>(initialForm);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCreate = async () => {
    const payload: TradeCreateInput = {
      ...form,
      notes: form.notes?.trim() ? form.notes : undefined
    };
    const output = await submit(payload);
    setResult(output);
  };

  return (
    <section className="card">
      <h2>Trades</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="primary" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Loading..." : "Refresh trades"}
        </button>
      </div>

      <div className="grid">
        <input
          placeholder="instrument_id"
          value={form.instrument_id}
          onChange={(event) => setForm((prev) => ({ ...prev, instrument_id: event.target.value }))}
        />
        <select
          value={form.side}
          onChange={(event) => setForm((prev) => ({ ...prev, side: event.target.value }))}
          aria-label="Trade side"
        >
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
          <option value="LONG">LONG</option>
          <option value="SHORT">SHORT</option>
        </select>
        <input
          type="number"
          step="0.0001"
          placeholder="qty"
          value={form.qty}
          onChange={(event) => setForm((prev) => ({ ...prev, qty: Number(event.target.value) }))}
        />
        <input
          type="number"
          step="0.0001"
          placeholder="entry_price"
          value={form.entry_price}
          onChange={(event) => setForm((prev) => ({ ...prev, entry_price: Number(event.target.value) }))}
        />
        <input
          type="number"
          step="0.0001"
          placeholder="fees"
          value={form.fees}
          onChange={(event) => setForm((prev) => ({ ...prev, fees: Number(event.target.value) }))}
        />
        <input
          placeholder="notes"
          value={form.notes ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="primary" onClick={() => void onCreate()} disabled={loading}>
          Create trade
        </button>
      </div>

      {error ? <ApiError message={error} /> : null}
      {result ? <JsonBlock value={{ created: result }} /> : null}
      {items ? <JsonBlock value={{ list: items }} /> : null}
    </section>
  );
}

