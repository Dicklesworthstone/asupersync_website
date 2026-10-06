"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Braces, Terminal } from "lucide-react";

export default function SmallStepSemanticsViz() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // A region r closing over one task t that holds one obligation o.
  // Each entry is the state after applying `rule` (rule names from
  // asupersync_v4_formal_semantics.md, sections 3.1-3.4).
  const trace = [
    { rule: "", region: "r: Open", task: "t ∉ dom(T)", obligation: "—" },
    { rule: "SPAWN", region: "r: Open", task: "t: Created", obligation: "—" },
    { rule: "SCHEDULE", region: "r: Open", task: "t: Running", obligation: "—" },
    { rule: "RESERVE", region: "r: Open", task: "t: Running", obligation: "o: Reserved" },
    { rule: "CLOSE-BEGIN", region: "r: Closing", task: "t: Running", obligation: "o: Reserved" },
    { rule: "CLOSE-CANCEL-CHILDREN", region: "r: Draining", task: "t: CancelRequested", obligation: "o: Reserved" },
    { rule: "CANCEL-ACKNOWLEDGE", region: "r: Draining", task: "t: Cancelling", obligation: "o: Reserved" },
    { rule: "ABORT", region: "r: Draining", task: "t: Cancelling", obligation: "o: Aborted" },
    { rule: "CANCEL-DRAIN", region: "r: Draining", task: "t: Finalizing", obligation: "o: Aborted" },
    { rule: "CANCEL-FINALIZE", region: "r: Draining", task: "t: Completed(Cancelled)", obligation: "o: Aborted" },
    { rule: "CLOSE-CHILDREN-DONE", region: "r: Finalizing", task: "t: Completed(Cancelled)", obligation: "o: Aborted" },
    { rule: "CLOSE-COMPLETE", region: "r: Closed", task: "t: Completed(Cancelled)", obligation: "o: Aborted" },
  ];

  const togglePlay = () => {
    if (step >= trace.length - 1) {
       setStep(0);
       setIsPlaying(true);
    } else {
       setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
       setStep(s => {
          if (s >= trace.length - 1) {
             setIsPlaying(false);
             return s;
          }
          return s + 1;
       });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, trace.length]);

  const current = trace[step];
  const next = step < trace.length - 1 ? trace[step + 1] : null;

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Small-Step Operational Semantics</h3>
          <p className="text-sm text-slate-400 mt-1">
            A region closing over one task, one spec rule per step.
          </p>
        </div>
        
        <div className="flex gap-2">
           <button
             onClick={() => { setStep(0); setIsPlaying(false); }}
             className="p-2.5 rounded-lg border border-white/10 bg-slate-800/50 text-slate-400 hover:text-white transition-all"
             aria-label="Reset"
           >
             <RotateCcw className="h-4 w-4" />
           </button>
           <button
             onClick={togglePlay}
             className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all bg-indigo-600 text-white hover:bg-indigo-500"
           >
             {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
             {isPlaying ? "Pause Evaluation" : step >= trace.length - 1 ? "Replay Trace" : "Step Forward"}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         
         {/* Formal Rule Panel */}
         <div className="relative border border-indigo-500/30 bg-indigo-950/20 rounded-xl overflow-hidden flex flex-col min-h-[220px]">
            <div className="bg-indigo-900/40 px-4 py-2 border-b border-indigo-500/20 flex justify-between items-center">
               <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                  <Braces className="h-3 w-3" /> Transition Rule
               </span>
               <span className="text-[10px] font-mono text-indigo-400 border border-indigo-500/30 px-1.5 rounded bg-indigo-950">
                  {next ? next.rule : "none applies"}
               </span>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-center items-center font-serif text-lg lg:text-xl text-slate-200">
               {/* Transition: ⟨R, T, O⟩ → ⟨R', T', O'⟩ */}
               <div className="flex flex-col items-center">
                  <div className="flex flex-wrap justify-center items-center gap-2">
                     <span className="text-slate-500">⟨</span>
                     <motion.span key={`region1-${step}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-blue-400 font-mono text-sm">{current.region}</motion.span>
                     <span className="text-slate-500">,</span>
                     <motion.span key={`task1-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 font-mono text-sm">{current.task}</motion.span>
                     <span className="text-slate-500">,</span>
                     <motion.span key={`obl1-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-orange-400 font-mono text-sm">{current.obligation}</motion.span>
                     <span className="text-slate-500">⟩</span>
                  </div>

                  <div className="my-2 text-indigo-500 font-black">
                     ↓
                  </div>

                  {next ? (
                     <div className="flex flex-wrap justify-center items-center gap-2">
                        <span className="text-slate-500">⟨</span>
                        <motion.span key={`region2-${step}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-blue-400 font-mono text-sm">{next.region}</motion.span>
                        <span className="text-slate-500">,</span>
                        <motion.span key={`task2-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 font-mono text-sm">{next.task}</motion.span>
                        <span className="text-slate-500">,</span>
                        <motion.span key={`obl2-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-orange-400 font-mono text-sm">{next.obligation}</motion.span>
                        <span className="text-slate-500">⟩</span>
                     </div>
                  ) : (
                     <div className="text-emerald-500 font-black tracking-widest uppercase text-sm mt-2 flex items-center gap-2">
                        Region Closed
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* State Explorer Panel */}
         <div className="border border-white/5 bg-black/40 rounded-xl overflow-hidden flex flex-col min-h-[220px]">
            <div className="bg-slate-900/50 px-4 py-2 border-b border-white/5 flex items-center gap-2">
               <Terminal className="h-3 w-3 text-slate-500" />
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  State (Σ)
               </span>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-4 font-mono text-xs">
               <div>
                  <span className="text-slate-500 mb-1 block">{"// Region R[r]"}</span>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-blue-300">
                     {current.region}
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <span className="text-slate-500 mb-1 block">{"// Task T[t]"}</span>
                     <div className="bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300 h-12 flex items-center break-all">
                        {current.task}
                     </div>
                  </div>
                  <div>
                     <span className="text-slate-500 mb-1 block">{"// Obligation O[o]"}</span>
                     <div className="bg-slate-950 p-2 rounded border border-slate-800 text-orange-300 h-12 flex items-center">
                        {current.obligation}
                     </div>
                  </div>
               </div>
               <div className="text-slate-500">
                  Step {step} of {trace.length - 1}
               </div>
            </div>
         </div>

      </div>

      <div className="mt-4 p-4 rounded-xl border border-white/5 bg-slate-800/30 text-sm text-slate-400 leading-relaxed text-center max-w-3xl mx-auto">
         The spec defines 23 core rules plus 10 for distributed dedup and sagas. The Lean model has 22 Step constructors and machine-checks six invariants of the model. Nothing proves that the Rust runtime refines the model.
      </div>
    </div>
  );
}
