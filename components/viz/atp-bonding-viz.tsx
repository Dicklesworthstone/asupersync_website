"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import { Play, RotateCcw, Skull, CheckCircle2 } from "lucide-react";

const SURFACE = "#0A1628";
const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#f59e0b";

const DONOR_COLORS = ["#3B82F6", "#14B8A6", "#F97316"] as const;
const DONOR_Y = [64, 160, 256] as const;
const DONOR_RIGHT_X = 148;
const RECV_X = 566;
const RECV_Y = 160;
const RATE_PER_DONOR = 307; // Mbit/s, for the aggregate readout
const TICK_MS = 180;
const PROGRESS_PER_DONOR_TICK = 1.1;
const VERIFY_TICKS = 6;

type Phase = "idle" | "running" | "verifying" | "committed";

interface BondSim {
  phase: Phase;
  progress: number;
  contrib: [number, number, number];
  alive: [boolean, boolean, boolean];
  reallocated: number;
  verifyLeft: number;
  flashLeft: number;
  lastKilled: number | null;
}

function freshSim(): BondSim {
  return {
    phase: "idle",
    progress: 0,
    contrib: [0, 0, 0],
    alive: [true, true, true],
    reallocated: 0,
    verifyLeft: VERIFY_TICKS,
    flashLeft: 0,
    lastKilled: null,
  };
}

function stepSim(prev: BondSim): BondSim {
  if (prev.phase === "running") {
    const aliveCount = prev.alive.filter(Boolean).length;
    const contrib = [...prev.contrib] as [number, number, number];
    prev.alive.forEach((a, i) => {
      if (a) contrib[i] += PROGRESS_PER_DONOR_TICK;
    });
    const progress = Math.min(100, prev.progress + aliveCount * PROGRESS_PER_DONOR_TICK);
    return {
      ...prev,
      progress,
      contrib,
      flashLeft: Math.max(0, prev.flashLeft - 1),
      phase: progress >= 100 ? "verifying" : "running",
    };
  }
  if (prev.phase === "verifying") {
    const verifyLeft = prev.verifyLeft - 1;
    return { ...prev, verifyLeft, flashLeft: 0, phase: verifyLeft <= 0 ? "committed" : "verifying" };
  }
  return prev;
}

function cubicPoint(
  t: number,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): [number, number] {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  return [x, y];
}

export default function AtpBondingViz() {
  const prefersReduced = useReducedMotion();
  const reduced = prefersReduced ?? false;
  const [sim, setSim] = useState<BondSim>(freshSim);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (sim.phase === "committed") clearTimer();
  }, [sim.phase, clearTimer]);

  const start = useCallback(() => {
    clearTimer();
    setSim({ ...freshSim(), phase: "running" });
    intervalRef.current = window.setInterval(() => setSim(stepSim), TICK_MS);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setSim(freshSim());
  }, [clearTimer]);

  const kill = useCallback((idx: number) => {
    setSim((prev) => {
      if (prev.phase !== "running" || !prev.alive[idx]) return prev;
      if (prev.alive.filter(Boolean).length <= 1) return prev; // keep one survivor
      const alive = [...prev.alive] as [boolean, boolean, boolean];
      alive[idx] = false;
      return { ...prev, alive, reallocated: prev.reallocated + 2, flashLeft: 10, lastKilled: idx };
    });
  }, []);

  const paths = useMemo(
    () =>
      DONOR_Y.map((y) => {
        const p0: [number, number] = [DONOR_RIGHT_X, y];
        const p1: [number, number] = [300, y];
        const p2: [number, number] = [430, RECV_Y];
        const p3: [number, number] = [RECV_X, RECV_Y];
        const samples = Array.from({ length: 7 }, (_, i) => cubicPoint(i / 6, p0, p1, p2, p3));
        return {
          d: `M ${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`,
          xs: samples.map((p) => p[0]),
          ys: samples.map((p) => p[1]),
        };
      }),
    []
  );

  const aliveCount = sim.alive.filter(Boolean).length;
  const running = sim.phase === "running";
  const done = sim.phase === "committed";
  const ringCirc = 2 * Math.PI * 34;

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Bonded Pull</h3>
          <p className="text-sm text-slate-400 mt-1">
            Three machines hold the same file. All three feed one receiver at once. Kill one mid-transfer.
          </p>
        </div>
        <button
          onClick={sim.phase === "idle" ? start : reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {sim.phase === "idle" ? <Play className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
          {sim.phase === "idle" ? "Start Bonded Pull" : "Reset"}
        </button>
      </div>

      <div className="rounded-xl border border-white/5 bg-black/40 p-2 overflow-x-auto">
        <svg viewBox="0 0 720 320" className="w-full h-auto min-w-[560px]" role="img" aria-label={`Bonded transfer: ${aliveCount} of 3 donors alive, ${Math.round(sim.progress)} percent complete.`}>
          {/* Paths */}
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill="none"
              stroke={sim.alive[i] ? DONOR_COLORS[i] : "#334155"}
              strokeOpacity={sim.alive[i] ? 0.3 : 0.15}
              strokeWidth={1.5}
              strokeDasharray={sim.alive[i] ? "none" : "4 6"}
            />
          ))}

          {/* Symbol dots along paths */}
          {!reduced &&
            running &&
            paths.map((p, i) =>
              sim.alive[i]
                ? [0, 1, 2].map((k) => (
                    <motion.circle
                      key={`${i}-${k}`}
                      r={4}
                      fill={DONOR_COLORS[i]}
                      initial={{ cx: p.xs[0], cy: p.ys[0], opacity: 0 }}
                      animate={{ cx: p.xs, cy: p.ys, opacity: [0, 1, 1, 1, 1, 1, 0.4] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: k * 0.55 }}
                    />
                  ))
                : null
            )}

          {/* Donors */}
          {DONOR_Y.map((y, i) => {
            const alive = sim.alive[i];
            return (
              <g key={i}>
                <rect
                  x={30}
                  y={y - 34}
                  width={118}
                  height={68}
                  rx={10}
                  fill={SURFACE}
                  stroke={alive ? DONOR_COLORS[i] : RED}
                  strokeOpacity={alive ? 0.5 : 0.6}
                  strokeWidth={1.5}
                  opacity={alive ? 1 : 0.55}
                />
                <text x={89} y={y - 12} textAnchor="middle" className="fill-white text-[11px] font-black">
                  donor {i + 1}
                </text>
                <text x={89} y={y + 4} textAnchor="middle" className="fill-slate-500 text-[8px] font-mono">
                  {alive ? `slice ≡ ${i} (mod 3)` : "offline"}
                </text>
                <text
                  x={89}
                  y={y + 20}
                  textAnchor="middle"
                  className={`text-[8px] font-mono ${alive ? "fill-slate-400" : "fill-red-400"}`}
                >
                  {alive ? "merkle proof ✓" : "windows reassigned"}
                </text>
                {!alive && (
                  <text x={140} y={y - 24} textAnchor="middle" className="fill-red-400 text-[13px] font-black">
                    ✕
                  </text>
                )}
              </g>
            );
          })}

          {/* Reassignment flash */}
          <AnimatePresence>
            {sim.flashLeft > 0 && (
              <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                x={350}
                y={30}
                textAnchor="middle"
                fill={AMBER}
                className="text-[10px] font-mono font-bold"
              >
                donor died → outstanding repair windows reassigned to survivors
              </motion.text>
            )}
          </AnimatePresence>

          {/* Repair windows physically moving to the survivors */}
          <AnimatePresence>
            {!reduced &&
              sim.flashLeft > 0 &&
              sim.lastKilled !== null &&
              DONOR_Y.map((y, j) =>
                sim.alive[j] ? (
                  <motion.rect
                    key={`window-${sim.lastKilled}-${j}`}
                    width={16}
                    height={10}
                    rx={3}
                    fill={AMBER}
                    initial={{ x: 81, y: DONOR_Y[sim.lastKilled as number] - 5, opacity: 0 }}
                    animate={{ x: 81, y: y - 5, opacity: [0, 1, 1, 0.6] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
                  />
                ) : null
              )}
          </AnimatePresence>

          {/* Receiver */}
          <rect x={RECV_X} y={RECV_Y - 76} width={128} height={172} rx={12} fill={SURFACE} stroke={done ? GREEN : "#3B82F6"} strokeOpacity={0.5} strokeWidth={1.5} />
          <text x={RECV_X + 64} y={RECV_Y - 54} textAnchor="middle" className="fill-white text-[11px] font-black">
            RECEIVER
          </text>
          {!reduced && (running || sim.phase === "verifying") && (
            <motion.circle
              cx={RECV_X + 64}
              cy={RECV_Y - 4}
              r={41}
              fill="none"
              stroke="#3B82F6"
              strokeWidth={1.5}
              animate={{ strokeOpacity: [0.08, 0.35, 0.08] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <circle cx={RECV_X + 64} cy={RECV_Y - 4} r={34} fill="none" stroke="#1e293b" strokeWidth={6} />
          <motion.circle
            cx={RECV_X + 64}
            cy={RECV_Y - 4}
            r={34}
            fill="none"
            stroke={done ? GREEN : "#3B82F6"}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={ringCirc}
            initial={{ strokeDashoffset: ringCirc }}
            animate={{ strokeDashoffset: ringCirc * (1 - sim.progress / 100) }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            transform={`rotate(-90 ${RECV_X + 64} ${RECV_Y - 4})`}
          />
          <text x={RECV_X + 64} y={RECV_Y - 1} textAnchor="middle" className={`text-[12px] font-mono font-black ${done ? "fill-emerald-400" : "fill-white"}`}>
            {done ? "✓" : `${Math.round(sim.progress)}%`}
          </text>
          <text x={RECV_X + 64} y={RECV_Y + 44} textAnchor="middle" className="fill-slate-500 text-[8px] font-mono">
            {sim.phase === "verifying" ? "sha256 verify…" : done ? "committed · exit 0" : "duplicates: 0"}
          </text>

          {/* Per-donor ingress bars */}
          {DONOR_COLORS.map((c, i) => (
            <g key={i}>
              <rect x={RECV_X + 14} y={RECV_Y + 54 + i * 10} width={100} height={5} rx={2.5} fill="#1e293b" />
              <motion.rect
                x={RECV_X + 14}
                y={RECV_Y + 54 + i * 10}
                height={5}
                rx={2.5}
                fill={c}
                initial={{ width: 0 }}
                animate={{ width: Math.min(100, sim.contrib[i]) }}
                transition={{ duration: reduced ? 0 : 0.2 }}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Kill buttons + live stats */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {DONOR_COLORS.map((c, i) => (
            <button
              key={i}
              onClick={() => kill(i)}
              disabled={!running || !sim.alive[i] || aliveCount <= 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-500/10 hover:border-red-500/40 text-slate-300 border-white/10 bg-slate-900"
            >
              <Skull className="h-3.5 w-3.5" style={{ color: sim.alive[i] ? c : RED }} />
              Kill donor {i + 1}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-center">
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Donors</div>
            <div className="text-sm font-mono font-bold text-white">{aliveCount}/3</div>
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Aggregate</div>
            <div className="text-sm font-mono font-bold text-white">
              {running ? `${aliveCount * RATE_PER_DONOR} Mbit/s` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Dup symbols</div>
            <div className="text-sm font-mono font-bold text-emerald-400">0</div>
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Windows moved</div>
            <div className={`text-sm font-mono font-bold ${sim.reallocated > 0 ? "text-amber-400" : "text-white"}`}>
              {sim.reallocated}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.4 }}
            className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              Committed and SHA-256 verified{sim.reallocated > 0 ? `, with ${sim.reallocated} repair windows reassigned after a donor died mid-transfer` : ""}.
              A single TCP stream cannot express any of this.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-4 text-[11px] text-slate-600 leading-relaxed">
        Every donor first proves it holds byte-identical data via a Merkle holding-proof, then enrollment hands it
        a residue-disjoint slice of the same fountain. Nobody coordinates about which bytes to send, and duplicate
        symbols are impossible by construction.{" "}
        <code className="text-blue-400/80 font-mono">
          atp bond-pull /data/big.tar ./inbox --donors ubuntu@h1,ubuntu@h2,ubuntu@h3
        </code>
      </p>
    </div>
  );
}
