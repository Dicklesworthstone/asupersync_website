"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowDownRight, CheckCircle2, RotateCcw } from "lucide-react";

// Default PotentialWeights upstream (src/obligation/lyapunov.rs): 1, 5, 3, 2.
const WEIGHTS = { tasks: 1, obligationAge: 5, draining: 3, deadline: 2 } as const;

type Components = { tasks: number; obligationAge: number; draining: number; deadline: number };

const INITIAL: Components = { tasks: 40, obligationAge: 8, draining: 6, deadline: 8 };

function potential(c: Components): number {
  return (
    WEIGHTS.tasks * c.tasks +
    WEIGHTS.obligationAge * c.obligationAge +
    WEIGHTS.draining * c.draining +
    WEIGHTS.deadline * c.deadline
  );
}

// Deterministic illustrative trajectory. Most steps lower one component; some
// trade one component against another, and V stays flat when the chosen
// component is already zero. V never rises along this trajectory.
function nextComponents(prev: Components, t: number): Components {
  const next = { ...prev };
  switch (t % 5) {
    case 0:
      next.tasks = Math.max(0, next.tasks - 4);
      break;
    case 1:
      next.obligationAge = Math.max(0, next.obligationAge - 1);
      break;
    case 2:
      // A region finishes draining (-3) while a deadline gets closer (+2).
      if (next.draining > 0) {
        next.draining -= 1;
        next.deadline += 1;
      }
      break;
    case 3:
      next.deadline = Math.max(0, next.deadline - 2);
      break;
    default:
      next.tasks = Math.max(0, next.tasks - 2);
      break;
  }
  return next;
}

export default function LyapunovPotentialViz() {
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState<Components>(INITIAL);
  const stepRef = useRef(0);

  const totalEnergy = potential(energy);
  const isQuiescent = totalEnergy <= 0;
  const barMax = WEIGHTS.obligationAge * INITIAL.obligationAge;

  useEffect(() => {
    if (isQuiescent) return;

    const interval = setInterval(() => {
      const t = stepRef.current;
      stepRef.current = t + 1;
      setStep(t + 1);
      setEnergy((prev) => nextComponents(prev, t));
    }, 400);

    return () => clearInterval(interval);
  }, [isQuiescent]);

  const reset = () => {
    stepRef.current = 0;
    setStep(0);
    setEnergy(INITIAL);
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Lyapunov Potential</h3>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            V = 1·tasks + 5·obligation age + 3·draining + 2·deadline
          </p>
        </div>
        
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all bg-white/10 text-slate-300 hover:bg-white/20"
        >
          <RotateCcw className="h-4 w-4" />
          Reset System
        </button>
      </div>

      <div className="relative flex flex-col gap-6 p-6 border border-white/5 bg-black/40 rounded-xl overflow-hidden min-h-[260px]">
        
        <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
                <Activity className={`h-5 w-5 ${isQuiescent ? "text-green-500" : "text-fuchsia-500 animate-pulse"}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Potential V</span>
            </div>
            <span className={`text-2xl font-black font-mono ${isQuiescent ? "text-green-400" : "text-fuchsia-400"}`}>
                {totalEnergy}
            </span>
        </div>

        {/* Weighted contribution of each component */}
        <div className="flex flex-col gap-3">
            <EnergyBar label="Live Tasks ×1" value={WEIGHTS.tasks * energy.tasks} max={barMax} color="#3b82f6" />
            <EnergyBar label="Oblig. Age ×5" value={WEIGHTS.obligationAge * energy.obligationAge} max={barMax} color="#eab308" />
            <EnergyBar label="Draining ×3" value={WEIGHTS.draining * energy.draining} max={barMax} color="#f97316" />
            <EnergyBar label="Deadline ×2" value={WEIGHTS.deadline * energy.deadline} max={barMax} color="#ef4444" />
        </div>

        {/* Quiescence Overlay */}
        <AnimatePresence>
          {isQuiescent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10"
            >
              <div className="h-16 w-16 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="text-xl font-black text-white tracking-tight">Quiescence Reached</h4>
              <p className="text-sm text-slate-300 mt-2 max-w-sm text-center">
                V = 0: no live tasks, no pending obligations, no draining regions, no deadline pressure.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-center">
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Governor</div>
          <div className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
             <ArrowDownRight className="h-4 w-4 text-fuchsia-400" />
             Optional, off by default
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Scheduler Steps</div>
          <div className="text-xl font-black font-mono text-white">
            {step}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        When enabled, the governor steers lane order so V tends not to increase. It is a heuristic, not a proof of progress, and this trajectory is illustrative.
      </p>
    </div>
  );
}

function EnergyBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const percentage = (value / max) * 100;
    
    return (
        <div className="flex items-center gap-4">
            <div className="w-32 text-right text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                {label}
            </div>
            <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                <motion.div 
                    className="absolute top-0 left-0 h-full"
                    style={{ backgroundColor: color }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
            </div>
            <div className="w-8 text-left text-xs font-mono text-slate-500">
                {value}
            </div>
        </div>
    )
}
