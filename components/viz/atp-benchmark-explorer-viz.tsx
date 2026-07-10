"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import { ShieldCheck, FlaskConical, Gauge, TimerReset } from "lucide-react";

type RegimeId = "perfect" | "good" | "bad" | "broken";
type Tier = "plaintext" | "encrypted";

interface Regime {
  id: RegimeId;
  label: string;
  spec: string;
  tone: string;
}

interface Cell {
  ratio: number | null; // atp median ÷ rsync median; < 1.0 means atp wins
  display?: string; // overrides the computed tag (ranges, notes)
  note?: string;
}

interface Row {
  workload: string;
  cells: Record<RegimeId, Cell>;
}

const REGIMES: Regime[] = [
  { id: "perfect", label: "Perfect", spec: "1 Gbit · 2 ms · 0% loss", tone: "#22c55e" },
  { id: "good", label: "Good", spec: "200 Mbit · 25 ms · 0.1% loss", tone: "#38bdf8" },
  { id: "bad", label: "Bad", spec: "50 Mbit · 80±20 ms · 2% loss", tone: "#f59e0b" },
  { id: "broken", label: "Broken", spec: "10 Mbit · 200±50 ms · 10% loss + 5% reorder + 1% dup", tone: "#ef4444" },
];

// Medians of 3-5 reps, atp 0.3.5 release builds vs tuned rsync
// (--whole-file --inplace --no-compress on its fastest honest transport).
const PLAINTEXT_ROWS: Row[] = [
  {
    workload: "500 KB file",
    cells: {
      perfect: { ratio: 0.21 },
      good: { ratio: 0.34 },
      bad: { ratio: 0.31 },
      broken: { ratio: 0.21 },
    },
  },
  {
    workload: "50 MB file",
    cells: {
      perfect: { ratio: 0.45 },
      good: { ratio: 0.72 },
      bad: { ratio: 0.71 },
      broken: { ratio: 0.83 },
    },
  },
  {
    workload: "500 MB file",
    cells: {
      perfect: { ratio: 0.88, note: "4.52 s vs 5.13 s" },
      good: { ratio: null },
      bad: { ratio: 0.98 },
      broken: { ratio: 0.93, note: "converges 3/3; atp used to time out here entirely" },
    },
  },
  {
    workload: "5 GB file",
    cells: {
      perfect: { ratio: 0.99, note: "46.0 s vs 46.6 s" },
      good: { ratio: null },
      bad: { ratio: null },
      broken: { ratio: null },
    },
  },
  {
    workload: "Tree · 2,000 small files",
    cells: {
      perfect: { ratio: 1.09, note: "handshake round-trip floor, within noise" },
      good: { ratio: 0.95 },
      bad: { ratio: 0.79 },
      broken: { ratio: 0.68 },
    },
  },
  {
    workload: "Tree · 400 large files",
    cells: {
      perfect: { ratio: 0.6 },
      good: { ratio: 0.67 },
      bad: { ratio: 0.62 },
      broken: { ratio: 0.41 },
    },
  },
];

// QUIC + TLS 1.3 vs rsync over ssh with aes128-gcm. Sparser board; the
// clean-large gap is a userspace-QUIC vs kernel-TCP frontier, printed anyway.
const ENCRYPTED_ROWS: Row[] = [
  {
    workload: "500 KB file",
    cells: {
      perfect: { ratio: 0.33, display: "3.0× faster" },
      good: { ratio: 0.2, display: "5.0× faster", note: "QUIC 1-RTT vs ssh session setup" },
      bad: { ratio: null },
      broken: { ratio: null },
    },
  },
  {
    workload: "50 MB file",
    cells: {
      perfect: { ratio: 1.48, note: "noisy cell" },
      good: { ratio: 0.98 },
      bad: { ratio: null },
      broken: { ratio: null },
    },
  },
  {
    workload: "500 MB file",
    cells: {
      perfect: { ratio: 1.47, note: "atp ~74 MB/s vs ssh ~108 MB/s" },
      good: { ratio: null },
      bad: { ratio: null },
      broken: { ratio: null },
    },
  },
  {
    workload: "Tree · 2,000 small files",
    cells: {
      perfect: { ratio: 1.4, display: "rsync 1.2–1.6× faster" },
      good: { ratio: 1.0, display: "parity" },
      bad: { ratio: null },
      broken: { ratio: null },
    },
  },
];

// Computed from the cells actually shown, so the summary can never drift
// from the board above it.
function geomeanOfShownCells(rows: Row[], regime: RegimeId): number | undefined {
  const ratios = rows
    .map((r) => r.cells[regime].ratio)
    .filter((x): x is number => x !== null);
  if (ratios.length === 0) return undefined;
  return Math.exp(ratios.reduce((acc, x) => acc + Math.log(x), 0) / ratios.length);
}

function tagFor(cell: Cell): { text: string; tone: "win" | "parity" | "loss" | "na" } {
  if (cell.ratio === null) return { text: "not measured", tone: "na" };
  if (cell.display) {
    if (cell.ratio < 0.97) return { text: cell.display, tone: "win" };
    if (cell.ratio <= 1.03) return { text: cell.display, tone: "parity" };
    return { text: cell.display, tone: "loss" };
  }
  if (cell.ratio < 0.97) return { text: `${(1 / cell.ratio).toFixed(1)}× faster`, tone: "win" };
  if (cell.ratio <= 1.03) return { text: "parity", tone: "parity" };
  return { text: `rsync ${cell.ratio.toFixed(2)}×`, tone: "loss" };
}

const TONE_STYLES: Record<string, string> = {
  win: "text-emerald-400",
  parity: "text-amber-400",
  loss: "text-red-400",
  na: "text-slate-600",
};

const INTEGRITY_CHIPS = [
  "hermetic network namespaces",
  "netem on both veth ends",
  "SHA-256 on every transfer",
  "medians of 3–5 reps",
  "rsync tuned: --whole-file --inplace --no-compress",
  "crypto-symmetric tiers only",
  "230+ ledger experiments",
];

export default function AtpBenchmarkExplorerViz() {
  const prefersReduced = useReducedMotion();
  const [tier, setTier] = useState<Tier>("plaintext");
  const [regime, setRegime] = useState<RegimeId>("broken");

  const rows = tier === "plaintext" ? PLAINTEXT_ROWS : ENCRYPTED_ROWS;
  const geomean = geomeanOfShownCells(rows, regime);
  const activeRegime = REGIMES.find((r) => r.id === regime) as Regime;
  const dur = prefersReduced ? 0 : 0.5;

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">The Scoreboard</h3>
          <p className="text-sm text-slate-400 mt-1">
            Median wall-clock, atp ÷ rsync. Shorter bar = faster atp. The losses stay on the board.
          </p>
        </div>
        <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs font-bold">
          <button
            onClick={() => setTier("plaintext")}
            aria-pressed={tier === "plaintext"}
            className={`px-4 py-2 transition-colors ${tier === "plaintext" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            Plaintext vs rsyncd
          </button>
          <button
            onClick={() => setTier("encrypted")}
            aria-pressed={tier === "encrypted"}
            className={`px-4 py-2 transition-colors ${tier === "encrypted" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            TLS 1.3 vs ssh
          </button>
        </div>
      </div>

      {/* Regime tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {REGIMES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRegime(r.id)}
            aria-pressed={regime === r.id}
            className={`rounded-xl border p-3 text-left transition-all ${
              regime === r.id
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-white/5 bg-black/40 hover:border-white/15"
            }`}
          >
            <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${regime === r.id ? "text-blue-400" : "text-slate-400"}`}>
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: r.tone, boxShadow: regime === r.id ? `0 0 8px ${r.tone}` : undefined }}
                aria-hidden="true"
              />
              {r.label}
            </div>
            <div className="text-[9px] font-mono text-slate-600 mt-1 leading-tight">{r.spec}</div>
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="rounded-xl border border-white/5 bg-black/40 p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {activeRegime.label} link · {activeRegime.spec}
          </span>
          <span className="text-[10px] font-mono text-slate-600 hidden sm:block">rsync baseline = 1.00</span>
        </div>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {rows.map((row) => {
              const cell = row.cells[regime];
              const tag = tagFor(cell);
              const width = cell.ratio === null ? 0 : Math.min(cell.ratio, 1.6) / 1.6;
              const baselineLeft = (1 / 1.6) * 100;
              return (
                <motion.div
                  key={`${tier}-${row.workload}`}
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: dur * 0.6 }}
                >
                  <div className="flex items-baseline justify-between mb-1.5 gap-2">
                    <span className="text-xs font-bold text-slate-300">{row.workload}</span>
                    <span className={`text-xs font-mono font-bold ${TONE_STYLES[tag.tone]}`}>{tag.text}</span>
                  </div>
                  <div className="relative h-5 rounded-md bg-slate-900 border border-white/5 overflow-hidden">
                    {/* rsync baseline marker at ratio 1.0 */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-slate-500"
                      style={{ left: `${baselineLeft}%` }}
                      aria-hidden="true"
                    />
                    {cell.ratio !== null ? (
                      <motion.div
                        className={`h-full rounded-r-sm ${
                          tag.tone === "win"
                            ? "bg-gradient-to-r from-blue-600 to-blue-400"
                            : tag.tone === "parity"
                              ? "bg-gradient-to-r from-slate-600 to-amber-500/70"
                              : "bg-gradient-to-r from-red-900 to-red-500"
                        }`}
                        initial={prefersReduced ? false : { width: 0 }}
                        animate={{ width: `${width * 100}%` }}
                        transition={{ duration: dur, ease: [0.19, 1, 0.22, 1] }}
                      />
                    ) : (
                      <div className="h-full flex items-center px-3 text-[9px] font-mono text-slate-600">
                        — not measured (which is not a win)
                      </div>
                    )}
                  </div>
                  {cell.note && <p className="text-[10px] font-mono text-slate-600 mt-1">{cell.note}</p>}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Geomean, shown cells</span>
          {geomean !== undefined ? (
            <span
              className={`text-sm font-mono font-black ${
                geomean < 0.97 ? "text-emerald-400" : geomean <= 1.03 ? "text-amber-400" : "text-red-400"
              }`}
            >
              {geomean.toFixed(2)} ·{" "}
              {geomean < 0.97
                ? `atp ≈${(1 / geomean).toFixed(1)}× faster`
                : geomean <= 1.03
                  ? "parity on these cells"
                  : `rsync ahead by ~${Math.round((geomean - 1) * 100)}%`}
            </span>
          ) : (
            <span className="text-sm font-mono text-slate-600">no measured cells on this board</span>
          )}
        </div>
      </div>

      {/* Headline cells */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <Gauge className="h-4 w-4 text-blue-400 mb-2" />
          <div className="text-xl font-black font-mono text-white">946 Mbit/s</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Sustained on a 1 Gbit path by the BBR-style paced stream. Effectively line rate, with zero repair
            symbols sent.
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <TimerReset className="h-4 w-4 text-blue-400 mb-2" />
          <div className="text-xl font-black font-mono text-white">4.52 s vs 5.13 s</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            500 MB over clean gigabit, plaintext tier. On 5 GB the gap narrows to 46.0 s vs 46.6 s.
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <FlaskConical className="h-4 w-4 text-blue-400 mb-2" />
          <div className="text-xl font-black font-mono text-white">564.8 s vs 574.5 s</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            500 MB on the nastiest cell (10% loss, 5% reorder, 200 ms). atp&rsquo;s worst rep beat rsync&rsquo;s
            best rep. Before the congestion-control campaign, atp timed out here at 900 s+.
          </p>
        </div>
      </div>

      {/* Integrity strip */}
      <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Built so a false win is structurally impossible
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTEGRITY_CHIPS.map((chip) => (
            <span
              key={chip}
              className="px-2.5 py-1 rounded-full border border-white/10 bg-black/40 text-[10px] font-mono text-slate-400"
            >
              {chip}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
          Every number comes from an append-only evidence ledger that also keeps the failures: refuted
          optimization hypotheses stay on the record with their failure mechanism, so nobody re-chases them.
          A timeout, error, or hash mismatch is never scored as a win.
        </p>
      </div>
    </div>
  );
}
