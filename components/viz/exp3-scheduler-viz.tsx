"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import { Zap, AlertTriangle } from "lucide-react";

type Workload = "mixed" | "cancel-heavy";

// Constants mirror the upstream policy (src/runtime/scheduler/three_lane.rs).
const ARMS = [4, 8, 16, 32, 64];
const DEFAULT_ARM = 2; // limit 16
const DISCOUNT = 0.95;
const CONFIDENCE = 2.0;
const EPOCH_DISPATCHES = 128;

// Synthetic per-epoch rewards in [0, 1]. Deterministic, for illustration only.
const SYNTHETIC_REWARD: Record<Workload, number[]> = {
  mixed: [0.5, 0.56, 0.6, 0.54, 0.46],
  "cancel-heavy": [0.4, 0.47, 0.55, 0.62, 0.58],
};

interface BanditState {
  means: number[];
  pulls: number[]; // discounted pull mass per arm
  selected: number;
  epoch: number;
}

const INITIAL_STATE: BanditState = {
  means: [0, 0, 0, 0, 0],
  pulls: [0, 0, 0, 0, 0],
  selected: DEFAULT_ARM,
  epoch: 0,
};

function syntheticReward(workload: Workload, arm: number, epoch: number): number {
  const wobble = (((epoch * 7 + arm * 13) % 11) - 5) * 0.01;
  return Math.min(1, Math.max(0, SYNTHETIC_REWARD[workload][arm] + wobble));
}

function ucbScores(means: number[], pulls: number[]): number[] {
  const total = pulls.reduce((a, b) => a + b, 0);
  const scale = total > 1 ? CONFIDENCE * Math.sqrt(Math.log(total)) : 0;
  return means.map((m, i) => (pulls[i] > 0 ? m + scale / Math.sqrt(pulls[i]) : Infinity));
}

function selectArm(means: number[], pulls: number[]): number {
  const total = pulls.reduce((a, b) => a + b, 0);
  if (total < 1e-9) return DEFAULT_ARM;
  const untried = pulls.findIndex((n) => n < 1e-9);
  if (untried !== -1) return untried;
  const scores = ucbScores(means, pulls);
  let best = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[best]) best = i;
  }
  return best;
}

function completeEpoch(state: BanditState, workload: Workload): BanditState {
  const chosen = state.selected;
  const reward = syntheticReward(workload, chosen, state.epoch);
  const pulls = state.pulls.map((n) => n * DISCOUNT);
  const means = [...state.means];
  const n = pulls[chosen] + 1;
  means[chosen] += (reward - means[chosen]) / n;
  pulls[chosen] = n;
  return { means, pulls, selected: selectArm(means, pulls), epoch: state.epoch + 1 };
}

export default function Exp3SchedulerViz() {
  const prefersReduced = useReducedMotion();
  const [workload, setWorkload] = useState<Workload>("mixed");
  const [bandit, setBandit] = useState<BanditState>(INITIAL_STATE);

  useEffect(() => {
    const interval = setInterval(() => {
      setBandit((prev) => completeEpoch(prev, workload));
    }, prefersReduced ? 800 : 300);

    return () => clearInterval(interval);
  }, [workload, prefersReduced]);

  const scores = ucbScores(bandit.means, bandit.pulls);
  const accent = workload === "mixed" ? "#3b82f6" : "#ec4899";

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Adaptive Cancel Streaks</h3>
          <p className="text-sm text-slate-400 mt-1">
            Opt-in discounted UCB1 over cancel-streak limits. Off by default.
          </p>
        </div>

        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/10">
           <button
             onClick={() => setWorkload("mixed")}
             className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${workload === "mixed" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
           >
             Mixed Load
           </button>
           <button
             onClick={() => setWorkload("cancel-heavy")}
             className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${workload === "cancel-heavy" ? "bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.5)]" : "text-slate-400 hover:text-slate-200"}`}
           >
             <AlertTriangle className="h-3 w-3" /> Cancel-Heavy
           </button>
        </div>
      </div>

      <div className="relative flex flex-col gap-6 p-6 border border-white/5 bg-black/40 rounded-xl overflow-hidden min-h-[220px]">

        {/* State indicator */}
        <div className="absolute top-4 left-6 flex items-center gap-2">
            <Zap className={`h-4 w-4 ${workload === "mixed" ? "text-blue-400" : "text-pink-500 animate-pulse"}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
               Synthetic reward: {workload === "mixed" ? "mixed load" : "cancel-heavy"}
            </span>
        </div>

        {/* Arms Chart: bar height = discounted mean reward */}
        <div className="flex items-end justify-around w-full h-32 mt-8 border-b border-slate-700 pb-2 relative">
           {/* Grid lines */}
           <div className="absolute top-[25%] left-0 w-full border-t border-dashed border-white/5 z-0" />
           <div className="absolute top-[50%] left-0 w-full border-t border-dashed border-white/5 z-0" />
           <div className="absolute top-[75%] left-0 w-full border-t border-dashed border-white/5 z-0" />

           {ARMS.map((arm, i) => {
              const mean = bandit.means[i];
              const isSelected = bandit.selected === i;
              const score = scores[i];

              return (
                 <div key={arm} className="flex flex-col items-center z-10 w-12 group">
                    <div className="relative w-full flex justify-center items-end h-full">
                       {/* UCB score label */}
                       <div className="absolute -top-6 text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          UCB {Number.isFinite(score) ? score.toFixed(2) : "∞"}
                       </div>

                       {/* Bar */}
                       <motion.div
                          className="w-8 rounded-t-md border border-slate-600/50"
                          style={{
                             backgroundColor: isSelected ? accent : "#1e293b",
                             boxShadow: isSelected ? `0 0 20px ${workload === "mixed" ? "rgba(59,130,246,0.3)" : "rgba(236,72,153,0.3)"}` : "none"
                          }}
                          animate={{ height: `${mean * 100}%` }}
                          transition={{ duration: prefersReduced ? 0 : 0.2 }}
                       />
                    </div>
                 </div>
              );
           })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-around w-full">
           {ARMS.map((arm, i) => (
              <div key={`label-${arm}`} className="w-12 text-center">
                 <div className="text-xs font-bold text-slate-500">{arm}</div>
                 <div className="text-[9px] font-mono text-slate-600">n={bandit.pulls[i].toFixed(1)}</div>
              </div>
           ))}
        </div>
        <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-1">
           Cancel-Streak Limits (Arms) · Bar = Mean Reward · n = Discounted Pulls
        </div>

      </div>

      {/* Metrics */}
      <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-center">
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Policy</div>
          <div className="text-sm font-medium text-slate-300">
             Discounted UCB1 (discount {DISCOUNT}, epoch {EPOCH_DISPATCHES} dispatches)
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Limit This Epoch</div>
          <div className={`text-sm font-black uppercase ${workload === "mixed" ? "text-blue-400" : "text-pink-400"}`}>
             {ARMS[bandit.selected]} <span className="text-[10px] font-mono font-normal text-slate-500">epoch {bandit.epoch}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Measured against the fixed limit of 16, it didn&apos;t win, so the fixed limit is the default.
      </p>
    </div>
  );
}
