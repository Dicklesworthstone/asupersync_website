"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import { Play, RotateCcw, CheckCircle2, Timer } from "lucide-react";

const K = 20; // packets/symbols needed to reconstruct
const WINDOW = 4; // chunked sender's in-flight window
const FLIGHT_TICKS = 2; // one-way flight time
const TIMEOUT_TICKS = 7; // loss discovered by timeout, then re-request
const TICK_MS = 130;

type ChunkState = "missing" | "inflight" | "received";

interface Flight {
  chunk: number;
  arriveTick: number;
  timeoutTick: number;
  lost: boolean;
}

interface FountainFlight {
  arriveTick: number;
  lost: boolean;
}

interface Droplet {
  id: number;
  lost: boolean;
  lane: number;
}

interface Sim {
  started: boolean;
  tick: number;
  chunks: ChunkState[];
  flights: Flight[];
  chunkSent: number;
  chunkTimeouts: number;
  chunkDoneTick: number | null;
  fountainSent: number;
  fountainRecv: number;
  fountainInflight: FountainFlight[];
  fountainDoneTick: number | null;
  droplets: Droplet[];
  dropletSeq: number;
  lastTimeout: { chunk: number; tick: number } | null;
}

function freshSim(): Sim {
  return {
    started: false,
    tick: 0,
    chunks: Array.from({ length: K }, () => "missing" as ChunkState),
    flights: [],
    chunkSent: 0,
    chunkTimeouts: 0,
    chunkDoneTick: null,
    fountainSent: 0,
    fountainRecv: 0,
    fountainInflight: [],
    fountainDoneTick: null,
    droplets: [],
    dropletSeq: 0,
    lastTimeout: null,
  };
}

// One simulation tick. Both senders put exactly one packet on the wire per
// tick — the only difference is what a lost packet means to each of them.
function stepSim(prev: Sim, lossP: number): Sim {
  const t = prev.tick + 1;
  const chunks = [...prev.chunks];
  let flights = [...prev.flights];
  let { chunkSent, chunkTimeouts, chunkDoneTick, lastTimeout } = prev;

  if (chunkDoneTick === null) {
    // Arrivals + timeout discoveries
    const remaining: Flight[] = [];
    for (const f of flights) {
      if (!f.lost && f.arriveTick === t) {
        chunks[f.chunk] = "received";
      } else if (f.lost && f.timeoutTick === t) {
        chunks[f.chunk] = "missing";
        chunkTimeouts += 1;
        lastTimeout = { chunk: f.chunk, tick: t };
      } else if ((f.lost && f.timeoutTick > t) || (!f.lost && f.arriveTick > t)) {
        remaining.push(f);
      }
    }
    flights = remaining;

    // Send exactly one packet if the window allows — the *specific* lowest
    // missing chunk. This chunk and no other can fill this slot.
    if (flights.length < WINDOW) {
      const target = chunks.findIndex((c) => c === "missing");
      if (target !== -1) {
        chunks[target] = "inflight";
        flights.push({
          chunk: target,
          arriveTick: t + FLIGHT_TICKS,
          timeoutTick: t + TIMEOUT_TICKS,
          lost: Math.random() < lossP,
        });
        chunkSent += 1;
      }
    }

    if (chunks.every((c) => c === "received")) chunkDoneTick = t;
  }

  let { fountainSent, fountainRecv, fountainDoneTick, dropletSeq } = prev;
  let fountainInflight = prev.fountainInflight;
  let droplets = prev.droplets;
  if (fountainDoneTick === null) {
    // Same flight time as the chunks — only the semantics differ.
    const stillFlying: FountainFlight[] = [];
    for (const f of fountainInflight) {
      if (f.arriveTick === t) {
        if (!f.lost) fountainRecv += 1;
      } else {
        stillFlying.push(f);
      }
    }
    fountainInflight = stillFlying;
    if (fountainRecv >= K) {
      fountainDoneTick = t;
    } else {
      // One fungible symbol per tick. Any symbol that lands counts.
      fountainSent += 1;
      const lost = Math.random() < lossP;
      fountainInflight = [...fountainInflight, { arriveTick: t + FLIGHT_TICKS, lost }];
      dropletSeq += 1;
      droplets = [...droplets, { id: dropletSeq, lost, lane: dropletSeq % 5 }].slice(-8);
    }
  }

  return {
    started: prev.started,
    tick: t,
    chunks,
    flights,
    chunkSent,
    chunkTimeouts,
    chunkDoneTick,
    fountainSent,
    fountainRecv,
    fountainInflight,
    fountainDoneTick,
    droplets,
    dropletSeq,
    lastTimeout,
  };
}

export default function AtpFountainRaceViz() {
  const prefersReduced = useReducedMotion();
  const [lossPct, setLossPct] = useState(20);
  const [sim, setSim] = useState<Sim>(freshSim);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const bothDone = sim.chunkDoneTick !== null && sim.fountainDoneTick !== null;
  const running = sim.started && !bothDone;

  useEffect(() => {
    if (bothDone) clearTimer();
  }, [bothDone, clearTimer]);

  const start = useCallback(() => {
    clearTimer();
    setSim({ ...freshSim(), started: true });
    const lossP = lossPct / 100;
    intervalRef.current = window.setInterval(() => {
      setSim((prev) =>
        prev.chunkDoneTick !== null && prev.fountainDoneTick !== null ? prev : stepSim(prev, lossP)
      );
    }, TICK_MS);
  }, [clearTimer, lossPct]);

  const reset = useCallback(() => {
    clearTimer();
    setSim(freshSim());
  }, [clearTimer]);

  const chunkPct = Math.floor((sim.chunks.filter((c) => c === "received").length / K) * 100);
  const fountainPct = Math.floor((Math.min(sim.fountainRecv, K) / K) * 100);
  const stuckChunk =
    sim.chunkDoneTick === null && chunkPct >= 80
      ? sim.chunks.findIndex((c) => c !== "received")
      : -1;
  const slower =
    bothDone && sim.fountainDoneTick ? (sim.chunkDoneTick as number) / (sim.fountainDoneTick as number) : 0;

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Chunks vs Droplets</h3>
          <p className="text-sm text-slate-400 mt-1">
            Same wire, same loss, one packet per tick each. Only the <em>meaning</em> of a lost packet differs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Loss
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              value={lossPct}
              disabled={running}
              onChange={(e) => setLossPct(Number(e.target.value))}
              className="w-24 accent-blue-500 disabled:opacity-40"
              aria-label="Packet loss percentage"
            />
            <span className="text-white font-mono text-sm tracking-normal w-10">{lossPct}%</span>
          </label>
          <button
            onClick={running ? reset : start}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {running ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? "Reset" : bothDone ? "Race Again" : "Start Race"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Chunked transfer (the BitTorrent/TCP mindset) ── */}
        <div
          className={`rounded-xl border p-5 transition-colors ${
            sim.chunkDoneTick !== null ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/20 bg-red-950/10"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
              Rigid chunks
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              sent {sim.chunkSent} · timeouts {sim.chunkTimeouts}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {sim.chunks.map((state, i) => {
              const justTimedOut =
                sim.lastTimeout !== null &&
                sim.lastTimeout.chunk === i &&
                sim.tick - sim.lastTimeout.tick < 3;
              return (
                <motion.div
                  key={`${i}-${state}`}
                  initial={prefersReduced ? false : { scale: state === "received" ? 1.3 : 1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-mono font-bold border transition-colors duration-200 ${
                    state === "received"
                      ? "bg-blue-500/70 border-blue-400/50 text-white"
                      : justTimedOut
                        ? "bg-red-500/40 border-red-500 text-red-200"
                        : state === "inflight"
                          ? "border-amber-400/60 text-amber-400 bg-amber-500/10"
                          : "bg-slate-900 border-white/5 text-slate-600"
                  } ${state === "inflight" && !prefersReduced ? "animate-pulse" : ""}`}
                >
                  {i + 1}
                </motion.div>
              );
            })}
          </div>

          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 mb-2">
            <motion.div
              className={`h-full ${sim.chunkDoneTick !== null ? "bg-emerald-500" : "bg-red-500/70"}`}
              animate={{ width: `${chunkPct}%` }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono min-h-[1.25rem]">
            <span className={sim.chunkDoneTick !== null ? "text-emerald-400" : "text-slate-400"}>{chunkPct}%</span>
            {stuckChunk !== -1 && (
              <span className="text-red-400 font-bold">
                waiting on chunk #{stuckChunk + 1}…
              </span>
            )}
            {sim.chunkDoneTick !== null && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Timer className="h-3 w-3" /> {sim.chunkDoneTick} ticks
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
            Each slot needs its <strong className="text-slate-300">exact</strong> chunk. A lost packet stays
            invisible until a timeout fires, and then that one chunk has to be re-requested. One full round trip
            per loss.
          </p>
        </div>

        {/* ── Fountain transfer (atp) ── */}
        <div
          className={`rounded-xl border p-5 transition-colors ${
            sim.fountainDoneTick !== null ? "border-emerald-500/30 bg-emerald-500/5" : "border-blue-500/20 bg-blue-950/10"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Fungible droplets
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              sent {sim.fountainSent} · re-requests 0
            </span>
          </div>

          {/* Fountain + glass */}
          <div className="relative h-[132px] mb-4 flex justify-center" aria-hidden="true">
            {/* Spout */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2.5 rounded-full bg-slate-800 border border-blue-500/30" />
            {/* Falling droplets */}
            {!prefersReduced &&
              running &&
              sim.fountainDoneTick === null &&
              sim.droplets.map((d) => (
                <motion.span
                  key={d.id}
                  initial={{ y: 6, opacity: 1 }}
                  animate={{ y: d.lost ? 52 : 96, opacity: d.lost ? 0 : 1 }}
                  transition={{ duration: 0.5, ease: "easeIn" }}
                  className={`absolute top-0 h-2 w-2 rounded-full ${d.lost ? "bg-red-500" : "bg-blue-400"}`}
                  style={{ left: `calc(50% + ${(d.lane - 2) * 9}px)` }}
                />
              ))}
            {/* Glass */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-[84px] border-2 border-t-0 border-blue-500/40 rounded-b-xl overflow-hidden bg-slate-900/60">
              <motion.div
                className={`absolute bottom-0 left-0 right-0 ${
                  sim.fountainDoneTick !== null ? "bg-emerald-500/70" : "bg-blue-500/50"
                }`}
                animate={{ height: `${fountainPct}%` }}
                transition={{ duration: prefersReduced ? 0 : 0.25 }}
              >
                <div
                  className={`absolute top-0 inset-x-0 h-[3px] ${
                    sim.fountainDoneTick !== null ? "bg-emerald-300/70" : "bg-blue-300/70"
                  }`}
                />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-white/80">
                  {Math.min(sim.fountainRecv, K)} / {K}
                </span>
              </div>
            </div>
          </div>

          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 mb-2">
            <motion.div
              className={`h-full ${sim.fountainDoneTick !== null ? "bg-emerald-500" : "bg-blue-500"}`}
              animate={{ width: `${fountainPct}%` }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono min-h-[1.25rem]">
            <span className={sim.fountainDoneTick !== null ? "text-emerald-400" : "text-slate-400"}>{fountainPct}%</span>
            {sim.fountainDoneTick !== null && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Timer className="h-3 w-3" /> {sim.fountainDoneTick} ticks
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
            Every droplet is interchangeable: <strong className="text-slate-300">any</strong> {K} of them fill the
            glass. There is no rarest chunk, no stall at 99%, nothing to re-request. Loss just means a few more
            drops.
          </p>
        </div>
      </div>

      {/* Verdict */}
      <AnimatePresence>
        {bothDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.4 }}
            className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              {lossPct === 0 ? (
                <>
                  Clean link: a dead heat, which is the point. When nothing is lost, atp runs a paced reliable
                  stream and pays <strong className="text-white">zero FEC tax</strong>. Add some loss and race again.
                </>
              ) : slower > 1.05 ? (
                <>
                  Same {lossPct}% loss. The fountain finished in{" "}
                  <strong className="text-emerald-400">{sim.fountainDoneTick} ticks</strong> with zero re-requests.
                  Rigid chunks took <strong className="text-red-400">{sim.chunkDoneTick} ticks</strong> and{" "}
                  {sim.chunkTimeouts} timeout round-trip{sim.chunkTimeouts === 1 ? "" : "s"},{" "}
                  <strong className="text-white">{slower.toFixed(1)}× longer</strong>. &ldquo;Which packets got
                  lost?&rdquo; stopped mattering. Only the count did.
                </>
              ) : (
                <>
                  Same {lossPct}% loss, and this run the chunks got lucky: {sim.chunkDoneTick} vs{" "}
                  {sim.fountainDoneTick} ticks, effectively a tie. The fountain still made zero re-requests
                  while the chunks burned {sim.chunkTimeouts} timeout round-trip
                  {sim.chunkTimeouts === 1 ? "" : "s"}. Race again.
                </>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
