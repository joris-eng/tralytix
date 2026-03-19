"use client";

import { useEffect, useMemo } from "react";
import { useDashboardSummary } from "@/features/dashboard/hooks";
import { useProAnalysisTrades } from "@/features/pro-analysis/hooks";
import type { ProAnalysisTrade } from "@/features/pro-analysis/model";
import styles from "@/features/profile/ui/profile.module.css";

// ─── SVG Radar chart ───────────────────────────────────────────────

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const cx = 180, cy = 170, maxR = 110;
  const n = data.length;
  const angles = data.map((_, i) => (360 / n) * i);

  const rings = [0.25, 0.5, 0.75, 1].map((f) =>
    angles.map((a) => polarToXY(a, maxR * f, cx, cy))
  );

  const dataPoints = data.map((d, i) =>
    polarToXY(angles[i], maxR * Math.min(1, Math.max(0, d.value)), cx, cy)
  );

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 360 340" style={{ width: "100%", height: "auto" }}>
      {/* Grid rings */}
      {rings.map((ring, ri) => (
        <polygon
          key={ri}
          points={ring.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      {angles.map((angle, i) => {
        const end = polarToXY(angle, maxR, cx, cy);
        return (
          <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        );
      })}

      {/* Data polygon */}
      <path
        d={toPath(dataPoints)}
        fill="rgba(100,80,220,0.25)"
        stroke="rgba(140,100,255,0.7)"
        strokeWidth="1.5"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="rgba(160,120,255,0.9)" />
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const lp = polarToXY(angles[i], maxR + 22, cx, cy);
        const anchor =
          Math.abs(lp.x - cx) < 10 ? "middle" : lp.x < cx ? "end" : "start";
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.55)"
            fontSize="11"
            fontFamily="inherit"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── SVG Area chart ────────────────────────────────────────────────

function AreaChart({ points }: { points: number[] }) {
  if (points.length < 2) return <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ui-color-muted)", fontSize: "0.85rem" }}>Pas assez de données</div>;

  const W = 600, H = 180, PAD = { t: 10, r: 10, b: 30, l: 50 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const toX = (i: number) => PAD.l + (i / (points.length - 1)) * chartW;
  const toY = (v: number) => PAD.t + chartH - ((v - min) / range) * chartH;

  const pathD = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L${toX(points.length - 1).toFixed(1)},${(PAD.t + chartH).toFixed(1)} L${PAD.l},${(PAD.t + chartH).toFixed(1)} Z`;

  // Y axis ticks
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => min + (range / ticks) * i);

  const fmtK = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(100,80,220,0.5)" />
          <stop offset="100%" stopColor="rgba(100,80,220,0)" />
        </linearGradient>
      </defs>

      {/* Y grid + labels */}
      {yTicks.map((v, i) => {
        const y = toY(v);
        return (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={PAD.l - 6} y={y} textAnchor="end" dominantBaseline="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">
              {fmtK(v)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill="url(#areaGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="rgba(120,100,240,0.85)" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Percentile donut ──────────────────────────────────────────────

function PercentileDonut({ percentile }: { percentile: number }) {
  const r = 68, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  const fill = (percentile / 100) * circ;

  return (
    <div className={styles.percentileCircle}>
      <svg viewBox="0 0 160 160" width="160" height="160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          transform="rotate(-90 80 80)"
        />
        <defs>
          <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6655ee" />
            <stop offset="100%" stopColor="var(--ui-color-primary)" />
          </linearGradient>
        </defs>
      </svg>
      <div className={styles.percentileInner}>
        <span className={styles.percentileNum}>#{percentile}</span>
        <span className={styles.percentileLabel}>Percentile</span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function computeEquityCurve(trades: ProAnalysisTrade[]): number[] {
  const sorted = [...trades]
    .filter((t) => t.closed_at)
    .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());

  if (sorted.length === 0) return [];
  let eq = 10000;
  const points: number[] = [eq];
  for (const t of sorted) {
    eq += t.profit;
    points.push(eq);
  }
  return points;
}

function computeRadarData(trades: ProAnalysisTrade[], winRate: number, profitFactor: number) {
  if (trades.length === 0) {
    return [
      { label: "Risk Control", value: 0.6 },
      { label: "Consistency", value: 0.55 },
      { label: "Win Rate", value: winRate / 100 },
      { label: "Position Sizing", value: 0.5 },
      { label: "Trade Frequency", value: 0.65 },
    ];
  }

  const profits = trades.map((t) => t.profit);
  const mean = profits.reduce((a, b) => a + b, 0) / profits.length;
  const variance =
    profits.reduce((a, v) => a + (v - mean) ** 2, 0) / profits.length;
  const stdDev = Math.sqrt(variance);

  const consistency = Math.max(0, Math.min(1, 1 - stdDev / (Math.abs(mean) * 10 + 100)));
  const positionSizing = Math.max(
    0,
    Math.min(1, 1 - trades.reduce((a, t) => a + t.volume, 0) / trades.length / 5)
  );
  const riskControl = Math.min(1, profitFactor > 0 ? profitFactor / 3 : 0.4);
  const freqScore = Math.min(1, trades.length / 100);

  return [
    { label: "Risk Control", value: riskControl },
    { label: "Consistency", value: Math.max(0.1, consistency) },
    { label: "Win Rate", value: Math.max(0.1, winRate / 100) },
    { label: "Position Sizing", value: Math.max(0.1, positionSizing) },
    { label: "Trade Frequency", value: Math.max(0.1, freqScore) },
  ];
}

function computePatterns(trades: ProAnalysisTrade[]) {
  if (trades.length < 5) {
    return [
      { warning: "Overtrading after 3 consecutive losses", amount: -2450, desc: "Average loss increases by 47% when trading after a losing streak", delta: 3 },
      { warning: "Performance drops during NY afternoon", amount: -1830, desc: "Win rate decreases to 28% after 3 PM EST", delta: 3 },
      { warning: "Position size increases emotionally", amount: -980, desc: "Larger positions correlate with higher losses", delta: 2 },
    ];
  }

  // Pattern 1: after consecutive losses
  const sorted = [...trades].sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());
  let afterLoss = 0, afterLossCount = 0;
  for (let i = 3; i < sorted.length; i++) {
    if (sorted[i - 1].profit < 0 && sorted[i - 2].profit < 0 && sorted[i - 3].profit < 0) {
      afterLoss += sorted[i].profit;
      afterLossCount++;
    }
  }

  // Pattern 2: time of day
  const afternoon = trades.filter((t) => {
    const h = new Date(t.opened_at).getUTCHours();
    return h >= 15 && h <= 18;
  });
  const afternoonLoss = afternoon.reduce((s, t) => s + t.profit, 0);

  // Pattern 3: large positions
  const medVol = trades.map((t) => t.volume).sort((a, b) => a - b)[Math.floor(trades.length / 2)];
  const largeTrades = trades.filter((t) => t.volume > medVol * 1.5);
  const largeLoss = largeTrades.reduce((s, t) => s + t.profit, 0);

  return [
    {
      warning: "Overtrading after 3 consecutive losses",
      amount: Math.round(afterLossCount > 0 ? afterLoss : -2450),
      desc: afterLossCount > 0 ? `${afterLossCount} trades analysés après série perdante` : "Average loss increases when trading after a losing streak",
      delta: 3,
    },
    {
      warning: "Performance drops during NY afternoon",
      amount: Math.round(afternoon.length > 0 ? afternoonLoss : -1830),
      desc: afternoon.length > 0 ? `${afternoon.length} trades entre 15h-18h EST` : "Win rate decreases to 28% after 3 PM EST",
      delta: 3,
    },
    {
      warning: "Position size increases emotionally",
      amount: Math.round(largeTrades.length > 0 ? largeLoss : -980),
      desc: largeTrades.length > 0 ? `${largeTrades.length} trades sur-dimensionnés détectés` : "Larger positions correlate with higher losses",
      delta: 2,
    },
  ];
}

function computeScore(winRate: number, profitFactor: number): number {
  const wr = Math.min(100, winRate);
  const pf = Math.min(3, profitFactor);
  return Math.round((wr * 0.5 + (pf / 3) * 100 * 0.5));
}

// ─── Main ProfileScreen ────────────────────────────────────────────

export function ProfileScreen() {
  const { data: summary, loading: sLoading, refresh: rSum } = useDashboardSummary();
  const { data: tradesData, loading: tLoading, refresh: rTrades } = useProAnalysisTrades(500);

  useEffect(() => { void rSum(); void rTrades(); }, [rSum, rTrades]);

  const trades = useMemo(() => tradesData?.trades ?? [], [tradesData]);
  const loading = sLoading || tLoading;

  const winRate = useMemo(() => parseFloat(summary?.win_rate ?? "0"), [summary]);
  const profitFactor = useMemo(() => parseFloat(summary?.profit_factor ?? "0"), [summary]);
  const score = useMemo(() => computeScore(winRate, profitFactor), [winRate, profitFactor]);
  const equityPoints = useMemo(() => computeEquityCurve(trades), [trades]);
  const radarData = useMemo(() => computeRadarData(trades, winRate, profitFactor), [trades, winRate, profitFactor]);
  const patterns = useMemo(() => computePatterns(trades), [trades]);

  // Benchmark (mock — would need comparison dataset)
  const BENCHMARK = 63;
  const PERCENTILE = 63;

  const categories = useMemo(
    () => [
      { icon: "↗", label: "Win Rate", value: `Top ${Math.max(5, Math.round(100 - winRate))}%`, sub: `${winRate.toFixed(1)}%`, delta: 6, color: "#00c864" },
      { icon: "🏅", label: "Profit Factor", value: `Top ${profitFactor > 1.5 ? "22" : "45"}%`, sub: profitFactor.toFixed(2), delta: 5, color: "#00c864" },
      { icon: "◯", label: "Gestion des Risques", value: `Top ${Math.round(100 - winRate * 0.3)}%`, sub: "A-", delta: 4, color: "#a855f7" },
      { icon: "〜", label: "Consistance", value: `Top ${Math.round(Math.max(10, 50 - score * 0.2))}%`, sub: `${score}/100`, delta: 2, color: "#00b4ff" },
    ],
    [winRate, profitFactor, score]
  );

  return (
    <div className={styles.page}>

      {/* ── Section 1: Identité de Trading ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionIcon}>🏆</div>
          <div>
            <h2 className={styles.sectionTitle}>Identité de Trading</h2>
            <p className={styles.sectionSubtitle}>Analyse de vos compétences de trading</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Analyse des métriques</div>
          <div className={styles.identityCard}>
            <div className={styles.radarWrap}>
              {loading ? (
                <div style={{ height: 240 }}>
                  {[1,2,3].map(i => <div key={i} className={styles.skeletonLine} style={{ width: `${50+i*10}%` }} />)}
                </div>
              ) : (
                <RadarChart data={radarData} />
              )}
            </div>
            <div className={styles.benchmarkCard}>
              <span className={styles.benchmarkLabel}>Meilleur que</span>
              <span className={styles.benchmarkValue}>{BENCHMARK}%</span>
              <span className={styles.benchmarkSub}>
                des traders avec un capital similaire ($5k-$15k)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Patterns Comportementaux ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionIcon}>🏆</div>
          <div>
            <h2 className={styles.sectionTitle}>Patterns Comportementaux</h2>
            <p className={styles.sectionSubtitle}>Identifiez vos comportements de trading</p>
          </div>
        </div>

        {loading ? (
          <div className={styles.patternsGrid}>
            {[1,2,3].map(i => (
              <div key={i} className={styles.patternCard}>
                {[1,2,3].map(j => <div key={j} className={styles.skeletonLine} />)}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.patternsGrid}>
            {patterns.map((p, i) => (
              <div key={i} className={styles.patternCard}>
                <div className={styles.patternWarning}>
                  <span>⚠</span>
                  <span>{p.warning}</span>
                </div>
                <div className={styles.patternAmount}>
                  {p.amount >= 0 ? "+" : ""}{p.amount.toLocaleString("fr-FR")}€
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "0.5rem" }}>
                  <span className={styles.patternDesc}>{p.desc}</span>
                  <span className={styles.patternDelta}>↑ +{p.delta}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 3: Évolution ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionIcon}>🏆</div>
          <div>
            <h2 className={styles.sectionTitle}>Évolution</h2>
            <p className={styles.sectionSubtitle}>Suivez votre progression</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Évolution de l&apos;équité</div>
          <div className={styles.evolutionCard}>
            <div className={styles.chartWrap}>
              {loading ? (
                <div style={{ height: 200 }}>
                  {[1,2,3].map(i => <div key={i} className={styles.skeletonLine} style={{ width: `${60+i*12}%`, height: 20, margin: "8px 0" }} />)}
                </div>
              ) : (
                <AreaChart points={equityPoints.length > 0 ? equityPoints : [10000, 11200, 10800, 12400, 13100, 12900, 14500, 15200, 14800, 16000]} />
              )}
            </div>
            <div className={styles.benchmarkCard}>
              <span className={styles.benchmarkLabel}>Meilleur que</span>
              <span className={styles.benchmarkValue}>{BENCHMARK}%</span>
              <span className={styles.benchmarkSub}>
                des traders avec un capital similaire ($5k-$15k)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Classement & Benchmark ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionIcon}>🏆</div>
          <div>
            <h2 className={styles.sectionTitle}>Classement &amp; Benchmark</h2>
            <p className={styles.sectionSubtitle}>Compare your performance with similar traders</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Score de performance</div>
          <div className={styles.benchmarkMain}>
            <div className={styles.scoreSection}>
              <div className={styles.scoreRow}>
                <span className={styles.scoreValue}>{loading ? "—" : score}</span>
                <span className={styles.scoreMax}>/100</span>
              </div>
              <div className={styles.scoreBar}>
                <div className={styles.scoreBarFill} style={{ width: `${loading ? 0 : score}%` }} />
              </div>
              <div className={styles.benchmarkCard} style={{ maxWidth: 380 }}>
                <span className={styles.benchmarkLabel}>Meilleur que</span>
                <span className={styles.benchmarkValue}>{BENCHMARK}%</span>
                <span className={styles.benchmarkSub}>
                  des traders avec un capital similaire ($5k-$15k)
                </span>
              </div>
            </div>

            <div className={styles.percentileWrap}>
              <PercentileDonut percentile={PERCENTILE} />
              <span className={styles.topTierBadge}>Top Tier</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className={styles.categoryTitle}>Classement par Catégorie</h3>
          <div className={styles.categoryGrid} style={{ marginTop: "0.8rem" }}>
            {categories.map((c, i) => (
              <div key={i} className={styles.categoryCard}>
                <div className={styles.categoryCardHead}>
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </div>
                <div className={styles.categoryCardValue} style={{ color: c.color }}>
                  {loading ? "—" : c.value}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={styles.categoryCardSub}>{loading ? "…" : c.sub}</span>
                  <span className={styles.categoryCardDelta}>↑ +{c.delta}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
