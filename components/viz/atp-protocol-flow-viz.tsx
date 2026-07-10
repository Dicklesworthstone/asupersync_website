"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

const BLUE = "#3B82F6";
const VIOLET = "#8B5CF6";
const AMBER = "#f59e0b";
const GREEN = "#22c55e";
const RED = "#ef4444";
const SURFACE = "#0A1628";

const LANE_START = 150;
const LANE_END = 560;
const CONTROL_Y = 74;
const DATA_TOP = 186;
const DATA_H = 64;

interface Step {
  title: string;
  caption: string;
}

const STEPS: Step[] = [
  {
    title: "Handshake + manifest",
    caption:
      "One round trip on the control plane: file list, chunk plan, Merkle root, coding parameters. Ordered and reliable, because this is the only part of the transfer that needs to be.",
  },
  {
    title: "Spray source symbols",
    caption:
      "The data plane hoses RaptorQ symbols across in UDP datagrams. Unordered, per-packet unacknowledged. No window to collapse, no queue to block.",
  },
  {
    title: "Packets die. Nobody asks which.",
    caption:
      "A lossy link eats a slice of the datagrams mid-flight. No NACKs, no SACK ranges, no head-of-line blocking. The sender keeps pouring.",
  },
  {
    title: "Decode: any K of N",
    caption:
      "Each block decodes the moment any K(+ε) symbols land, whichever ones happen to survive. Block B sits at 97 of 100. Three short.",
  },
  {
    title: "NeedMore(B, 3)",
    caption:
      "The entire retransmission conversation, compressed into one tiny control frame: “I still need 3 symbols for block B.” Feedback stays bounded to a few rounds instead of a round trip per lost packet.",
  },
  {
    title: "Fresh repair symbols",
    caption:
      "The sender never re-sends the bytes that died. It mints brand-new repair symbols, and because the code is rateless, any fresh symbol repairs any loss.",
  },
  {
    title: "Proof → SHA-256 → commit",
    caption:
      "The receiver hash-verifies every chunk and file against the manifest's Merkle root, commits atomically, and returns a signed-off Proof. Exit 0 means verified; no flag exists to skip this.",
  },
];

function SymbolStream({
  mode,
  reduced,
}: {
  mode: "source" | "lossy" | "repair";
  reduced: boolean;
}) {
  const count = mode === "repair" ? 3 : 8;
  const midY = DATA_TOP + DATA_H / 2;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const lost = mode === "lossy" && i % 3 === 1;
        const y = midY + ((i % 4) - 1.5) * 12;
        const color = mode === "repair" ? VIOLET : lost ? RED : BLUE;
        if (reduced) {
          const x = LANE_START + 30 + (i / count) * (LANE_END - LANE_START - 60);
          return (
            <g key={i}>
              <rect x={x} y={y - 4} width={10} height={8} rx={2} fill={color} opacity={lost ? 0.5 : 0.9} />
              {lost && (
                <text x={x + 5} y={y + 2.5} textAnchor="middle" className="fill-red-200 text-[7px] font-bold">
                  ✕
                </text>
              )}
            </g>
          );
        }
        return (
          <motion.g
            key={`${mode}-${i}`}
            initial={{ x: 0, opacity: 0 }}
            animate={
              lost
                ? { x: [0, (LANE_END - LANE_START) * 0.45], opacity: [0, 1, 1, 0] }
                : { x: [0, LANE_END - LANE_START - 24], opacity: [0, 1, 1, 1] }
            }
            transition={{
              duration: lost ? 1.2 : 2.2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.28,
            }}
          >
            <rect x={LANE_START + 8} y={y - 4} width={10} height={8} rx={2} fill={color} />
          </motion.g>
        );
      })}
    </>
  );
}

function ControlFrame({
  label,
  color,
  reverse,
  reduced,
}: {
  label: string;
  color: string;
  reverse?: boolean;
  reduced: boolean;
}) {
  const from = reverse ? LANE_END - 90 : LANE_START + 4;
  const to = reverse ? LANE_START + 4 : LANE_END - 90;
  return (
    <motion.g
      initial={reduced ? { x: to - from } : { x: 0 }}
      animate={{ x: to - from }}
      transition={{ duration: reduced ? 0 : 1.4, ease: [0.19, 1, 0.22, 1] }}
    >
      <rect x={from} y={CONTROL_Y - 11} width={86} height={22} rx={6} fill={SURFACE} stroke={color} strokeWidth={1.5} />
      <text x={from + 43} y={CONTROL_Y + 3.5} textAnchor="middle" className="text-[9px] font-mono font-bold" fill={color}>
        {label}
      </text>
    </motion.g>
  );
}

export default function AtpProtocolFlowViz() {
  const prefersReduced = useReducedMotion();
  const reduced = prefersReduced ?? false;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (!playing) {
      clearTimer();
      return;
    }
    intervalRef.current = window.setInterval(() => {
      if (stepRef.current >= STEPS.length - 1) {
        setPlaying(false);
        return;
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 3000);
    return () => clearTimer();
  }, [playing, clearTimer]);

  const goTo = useCallback((s: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(STEPS.length - 1, s)));
  }, []);

  const decodeProgress = step >= 6 ? 1 : step >= 5 ? 0.99 : step >= 3 ? 0.97 : step >= 2 ? 0.6 : step >= 1 ? 0.25 : 0;
  const ringCirc = 2 * Math.PI * 30;

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Two Planes, Bounded Feedback</h3>
          <p className="text-sm text-slate-400 mt-1">
            Reliability where it&rsquo;s cheap, coding where it counts. Step through one transfer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            aria-label="Previous step"
            className="p-2.5 rounded-lg border border-white/10 bg-slate-800/50 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (step >= STEPS.length - 1) setStep(0);
              setPlaying((p) => !p);
            }}
            aria-label={playing ? "Pause" : "Play all steps"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => goTo(step + 1)}
            disabled={step === STEPS.length - 1}
            aria-label="Next step"
            className="p-2.5 rounded-lg border border-white/10 bg-slate-800/50 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-black/40 p-2 overflow-x-auto">
        <svg viewBox="0 0 720 300" className="w-full h-auto min-w-[560px]" role="img" aria-label={`Protocol step ${step + 1} of ${STEPS.length}: ${STEPS[step].title}`}>
          {/* Lane labels */}
          <text x={(LANE_START + LANE_END) / 2} y={CONTROL_Y - 24} textAnchor="middle" className="fill-slate-500 text-[9px] font-black tracking-widest uppercase">
            Control plane · ordered · authenticated
          </text>
          <text x={(LANE_START + LANE_END) / 2} y={DATA_TOP + DATA_H + 22} textAnchor="middle" className="fill-slate-500 text-[9px] font-black tracking-widest uppercase">
            Data plane · unordered · fountain-coded UDP
          </text>

          {/* Control lane */}
          <line x1={LANE_START} x2={LANE_END} y1={CONTROL_Y} y2={CONTROL_Y} stroke={VIOLET} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="6 4" />

          {/* Data band */}
          <rect x={LANE_START} y={DATA_TOP} width={LANE_END - LANE_START} height={DATA_H} rx={10} fill={BLUE} fillOpacity={0.05} stroke={BLUE} strokeOpacity={0.2} strokeWidth={1} />

          {/* Sender */}
          <rect x={26} y={100} width={108} height={124} rx={12} fill={SURFACE} stroke={step >= 6 ? GREEN : BLUE} strokeOpacity={0.5} strokeWidth={1.5} />
          <text x={80} y={128} textAnchor="middle" className="fill-white text-[11px] font-black">SENDER</text>
          <text x={80} y={146} textAnchor="middle" className="fill-slate-500 text-[8px] font-mono">atp send</text>
          <text x={80} y={172} textAnchor="middle" className="fill-slate-400 text-[8px] font-mono">
            {step >= 5 ? "minting repair" : step >= 1 ? "spraying" : "manifest"}
          </text>
          {step >= 5 && step < 6 && (
            <text x={80} y={188} textAnchor="middle" className="fill-violet-400 text-[8px] font-mono">fresh symbols only</text>
          )}

          {/* Receiver */}
          <rect x={586} y={100} width={108} height={124} rx={12} fill={SURFACE} stroke={step >= 6 ? GREEN : BLUE} strokeOpacity={0.5} strokeWidth={1.5} />
          <text x={640} y={122} textAnchor="middle" className="fill-white text-[11px] font-black">RECEIVER</text>
          {/* Decode ring */}
          <circle cx={640} cy={168} r={30} fill="none" stroke="#1e293b" strokeWidth={5} />
          <motion.circle
            cx={640}
            cy={168}
            r={30}
            fill="none"
            stroke={step >= 6 ? GREEN : BLUE}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={ringCirc}
            initial={{ strokeDashoffset: ringCirc }}
            animate={{ strokeDashoffset: ringCirc * (1 - decodeProgress) }}
            transition={{ duration: reduced ? 0 : 0.8, ease: "easeOut" }}
            transform="rotate(-90 640 168)"
          />
          <text x={640} y={165} textAnchor="middle" className={`text-[10px] font-mono font-bold ${step >= 6 ? "fill-emerald-400" : "fill-white"}`}>
            {step >= 6 ? "✓" : `${Math.round(decodeProgress * 100)}%`}
          </text>
          <text x={640} y={180} textAnchor="middle" className="fill-slate-500 text-[7px] font-mono">
            {step >= 6 ? "committed" : step === 5 ? "repair landing…" : step >= 3 ? "block B: 97/100" : "decoding"}
          </text>

          {/* Step-specific traffic */}
          {step === 0 && <ControlFrame label="manifest" color="#e2e8f0" reduced={reduced} />}
          {(step === 1 || step === 2) && <SymbolStream mode={step === 2 ? "lossy" : "source"} reduced={reduced} />}
          {step === 3 && <SymbolStream mode="source" reduced={true} />}
          {step === 4 && <ControlFrame label="NeedMore(B,3)" color={AMBER} reverse reduced={reduced} />}
          {step === 5 && <SymbolStream mode="repair" reduced={reduced} />}
          {step === 6 && <ControlFrame label="Proof ✓" color={GREEN} reverse reduced={reduced} />}

          {step === 2 && (
            <text x={(LANE_START + LANE_END) / 2} y={DATA_TOP - 8} textAnchor="middle" className="fill-red-400 text-[9px] font-mono font-bold">
              ~10% eaten mid-flight · nobody asks which
            </text>
          )}
          {step === 6 && (
            <text x={(LANE_START + LANE_END) / 2} y={DATA_TOP - 8} textAnchor="middle" className="fill-emerald-400 text-[9px] font-mono font-bold">
              sha256 OK · merkle OK · exit 0
            </text>
          )}
        </svg>
      </div>

      {/* Step dots + caption */}
      <div className="mt-5 flex items-center gap-0.5" role="group" aria-label="Protocol steps">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            onClick={() => goTo(i)}
            aria-current={i === step ? "step" : undefined}
            aria-label={`Step ${i + 1}: ${s.title}`}
            className="group/dot flex items-center px-1 py-2.5"
          >
            <span
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-blue-400"
                  : i < step
                    ? "w-2 bg-slate-500 group-hover/dot:bg-slate-400"
                    : "w-2 bg-slate-700 group-hover/dot:bg-slate-600"
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-[10px] font-mono text-slate-600">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          className="mt-4 rounded-xl border border-white/5 bg-black/40 p-5"
        >
          <div className="text-sm font-black text-white mb-1.5">
            <span className="text-blue-400 font-mono mr-2">{String(step + 1).padStart(2, "0")}</span>
            {STEPS[step].title}
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{STEPS[step].caption}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
