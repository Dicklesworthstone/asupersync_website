"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import { PowerOff, Gauge, StepForward, RotateCcw } from "lucide-react";

// One task's path through the Lean model's cancellation protocol
// (formal/lean/Asupersync.lean: cancel_potential, cancel_protocol_terminates).
type Phase = "Running" | "CancelRequested" | "Cancelling" | "Finalizing" | "Completed";

const PHASES: Phase[] = ["Running", "CancelRequested", "Cancelling", "Finalizing", "Completed"];
const PHASE_LABELS: Record<Phase, string> = {
  Running: "Running",
  CancelRequested: "CancelRequested",
  Cancelling: "Cancelling",
  Finalizing: "Finalizing",
  Completed: "Completed(Cancelled)",
};
const MASK_CHOICES = [0, 1, 2, 3];

function potentialOf(phase: Phase, mask: number): number | null {
  switch (phase) {
    case "CancelRequested":
      return mask + 3;
    case "Cancelling":
      return 2;
    case "Finalizing":
      return 1;
    case "Completed":
      return 0;
    default:
      return null;
  }
}

export default function CancelFuelViz() {
  const prefersReduced = useReducedMotion();
  const [maskDepth, setMaskDepth] = useState(2);
  const [phase, setPhase] = useState<Phase>("Running");
  const [mask, setMask] = useState(2);
  const [log, setLog] = useState<string[]>([]);

  const potential = potentialOf(phase, mask);
  const entryPotential = maskDepth + 3;
  const phaseIndex = PHASES.indexOf(phase);

  const chooseMask = (m: number) => {
    if (phase !== "Running") return;
    setMaskDepth(m);
    setMask(m);
  };

  const reset = () => {
    setPhase("Running");
    setMask(maskDepth);
    setLog([]);
  };

  const advance = () => {
    if (phase === "Running") {
      setPhase("CancelRequested");
      setLog([`CANCEL-REQUEST: potential = mask + 3 = ${maskDepth + 3}`]);
      return;
    }
    if (phase === "CancelRequested" && mask > 0) {
      setMask(mask - 1);
      setLog((l) => [...l, `CHECKPOINT-MASKED: mask ${mask} → ${mask - 1}`]);
      return;
    }
    if (phase === "CancelRequested") {
      setPhase("Cancelling");
      setLog((l) => [...l, "CANCEL-ACKNOWLEDGE: → Cancelling"]);
      return;
    }
    if (phase === "Cancelling") {
      setPhase("Finalizing");
      setLog((l) => [...l, "CANCEL-DRAIN: → Finalizing"]);
      return;
    }
    if (phase === "Finalizing") {
      setPhase("Completed");
      setLog((l) => [...l, "CANCEL-FINALIZE: → Completed(Cancelled)"]);
      return;
    }
    reset();
  };

  const stepsTaken = Math.max(0, log.length - 1);
  const buttonLabel =
    phase === "Running" ? "Request Cancel" : phase === "Completed" ? "Reset" : "Step";

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Cancel Potential</h3>
          <p className="text-sm text-slate-400 mt-1">
            One task&apos;s cancellation in the Lean model: done in mask + 3 steps.
          </p>
        </div>

        <button
          onClick={advance}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all bg-orange-700 text-white hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50"
        >
          {phase === "Running" ? (
            <PowerOff className="h-4 w-4" />
          ) : phase === "Completed" ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <StepForward className="h-4 w-4" />
          )}
          {buttonLabel}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">

         {/* Task state track */}
         <div className="md:col-span-8 relative min-h-[16rem] p-6 border border-white/5 bg-black/40 rounded-xl overflow-hidden flex flex-col gap-6">
            {/* Mask depth picker */}
            <div className="flex flex-wrap items-center gap-3">
               <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500" id="cancel-mask-label">
                  Mask depth
               </span>
               <div className="flex gap-1" role="group" aria-labelledby="cancel-mask-label">
                  {MASK_CHOICES.map((m) => (
                     <button
                        key={m}
                        onClick={() => chooseMask(m)}
                        disabled={phase !== "Running"}
                        aria-pressed={maskDepth === m}
                        className={`h-7 w-7 rounded-md border text-xs font-mono font-bold transition-colors disabled:opacity-50 ${
                           maskDepth === m
                              ? "border-orange-500 bg-orange-500/20 text-orange-300"
                              : "border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}
                     >
                        {m}
                     </button>
                  ))}
               </div>
               <span className="text-[10px] text-slate-500">(real cap: 64)</span>
            </div>

            {/* Phases */}
            <div className="flex flex-wrap items-start justify-between gap-3">
               {PHASES.map((p, i) => (
                  <div key={p} className="flex flex-col items-center gap-2 min-w-[4.5rem]">
                     <Node status={i < phaseIndex ? "done" : i === phaseIndex ? "current" : "pending"} />
                     <span className={`text-[10px] font-mono text-center ${i === phaseIndex ? "text-orange-300" : "text-slate-500"}`}>
                        {PHASE_LABELS[p]}
                     </span>
                     {p === "CancelRequested" && (
                        <div className="flex gap-1" role="img" aria-label={`Mask units left: ${mask}`}>
                           {Array.from({ length: maskDepth }, (_, k) => (
                              <span
                                 key={k}
                                 className={`h-2 w-2 rounded-full ${k < mask ? "bg-orange-400" : "bg-slate-700"}`}
                              />
                           ))}
                        </div>
                     )}
                  </div>
               ))}
            </div>

            {/* Step log */}
            <ol className="flex flex-col gap-1 font-mono text-[11px] text-slate-400">
               {log.length === 0 && <li className="text-slate-600">Pick a mask depth, then request cancellation.</li>}
               {log.map((line, i) => (
                  <li key={i}>
                     <span className="text-slate-600">{i === 0 ? "·" : `${i}.`}</span> {line}
                  </li>
               ))}
            </ol>
         </div>

         {/* Potential gauge */}
         <div className="md:col-span-4 flex flex-col gap-4">
            <div className="flex-1 p-5 border border-slate-700 bg-slate-900/50 rounded-xl flex flex-col justify-center relative overflow-hidden">
               <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-1.5">
                  <Gauge className="h-3 w-3 text-orange-500" /> cancel_potential
               </div>

               <div className="relative h-8 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <motion.div
                     className="absolute top-0 left-0 h-full bg-orange-500"
                     initial={false}
                     animate={{ width: `${((potential ?? entryPotential) / entryPotential) * 100}%` }}
                     transition={{ duration: prefersReduced ? 0 : 0.2 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-black text-white mix-blend-difference" aria-live="polite">
                     {potential === null ? `starts at ${entryPotential}` : `${potential} step${potential === 1 ? "" : "s"} left`}
                  </div>
               </div>

               <div className="mt-4 text-[11px] text-slate-300 font-mono">
                  Completes in mask + 3 = {entryPotential} steps ({stepsTaken} taken)
               </div>

               <div className="mt-3 text-[11px] text-slate-400">
                  A theorem about the model (cancel_protocol_terminates). A task that never reaches a checkpoint never takes the first step.
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}

function Node({ status }: { status: "done" | "current" | "pending" }) {
   const prefersReduced = useReducedMotion();
   return (
      <motion.div
         initial={false}
         animate={{
            backgroundColor: status === "done" ? "#334155" : status === "current" ? "#f97316" : "#0f172a",
            scale: status === "current" ? 1.1 : 1,
            borderColor: status === "done" ? "#475569" : status === "current" ? "#fdba74" : "#334155"
         }}
         transition={{ duration: prefersReduced ? 0 : 0.2 }}
         className="h-6 w-6 rounded-full border-2 z-10 shadow-lg"
      />
   );
}
