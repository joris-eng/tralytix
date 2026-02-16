"use client";

import { useEffect, useRef } from "react";

export type Candle = {
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type Props = {
  data: Candle[];
};

export function CandlesChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup = () => {};

    async function draw() {
      const { createChart, CrosshairMode } = await import("lightweight-charts");
      if (!containerRef.current) return;

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 420,
        layout: {
          background: { color: "#0b1220" },
          textColor: "#cbd5e1"
        },
        grid: {
          vertLines: { color: "#1e293b" },
          horzLines: { color: "#1e293b" }
        },
        crosshair: {
          mode: CrosshairMode.Normal
        }
      });

      const series = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444"
      });

      series.setData(
        data.map((c) => ({
          time: Math.floor(new Date(c.ts).getTime() / 1000) as never,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }))
      );
      chart.timeScale().fitContent();

      const onResize = () => {
        if (!containerRef.current) return;
        chart.applyOptions({ width: containerRef.current.clientWidth });
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        chart.remove();
      };
    }

    void draw();
    return () => cleanup();
  }, [data]);

  return <div className="card" ref={containerRef} />;
}
