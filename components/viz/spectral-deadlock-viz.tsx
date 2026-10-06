"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import { Activity, AlertOctagon, RefreshCw } from "lucide-react";

// Severity levels reported by the spectral health diagnostic.
type Severity = "none" | "watch" | "warning" | "critical";

const SEVERITY_TARGET: Record<Severity, number> = { none: 1.0, watch: 0.6, warning: 0.3, critical: 0.06 };
const SEVERITY_COLOR: Record<Severity, string> = { none: "#3b82f6", watch: "#eab308", warning: "#f97316", critical: "#ef4444" };

export default function SpectralDeadlockViz() {
  const prefersReduced = useReducedMotion();
  const [stage, setStage] = useState<Severity>("none");
  const [finished, setFinished] = useState(false);
  const [fiedlerValue, setFiedlerValue] = useState(1.0);
  const elapsedRef = useRef(0);

  const startSimulation = () => {
    setStage("none");
    setFinished(false);
    setFiedlerValue(1.0);
    elapsedRef.current = 0;
  };

  useEffect(() => {
    if (finished) return;

    const interval = setInterval(() => {
      elapsedRef.current += 1;
      const e = elapsedRef.current;

      if (e > 45 && stage === "critical") {
         setFinished(true);
         clearInterval(interval);
         return;
      }

      if (e > 28 && stage === "warning") {
         setStage("critical");
      } else if (e > 15 && stage === "watch") {
         setStage("warning");
      } else if (e > 5 && stage === "none") {
         setStage("watch");
      }

      setFiedlerValue(prev => prev + (SEVERITY_TARGET[stage] - prev) * 0.1);

    }, 100);

    return () => clearInterval(interval);
  }, [stage, finished]);

  // The graph thins out as severity rises: D→A weakens then disappears,
  // then B→C becomes the only link between {A, B} and {C, D}.
  const nodeColor = SEVERITY_COLOR[stage];
  const edgeColor = `${SEVERITY_COLOR[stage]}99`;
  const closingEdgeGone = stage === "warning" || stage === "critical";
  const bottleneck = stage === "critical";

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Spectral Wait-Graph Health</h3>
          <p className="text-sm text-slate-400 mt-1">
            On-demand, advisory diagnostic over the task wait graph.
          </p>
        </div>
        
        <button
          onClick={startSimulation}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all bg-white/10 text-slate-300 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <RefreshCw className="h-4 w-4" />
          Restart Simulation
        </button>
      </div>

      <div className="relative min-h-[16rem] w-full grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:py-8 border border-white/5 bg-black/40 rounded-xl overflow-hidden">
        
        {/* Wait-Graph Visualization */}
        <div className="relative flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-4 min-h-[200px]">
           <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 absolute top-0 left-0 md:left-0 z-10">Wait-Graph</div>
           
           <svg viewBox="0 0 200 200" className="w-full h-full max-w-[180px]">
              <defs>
                 <marker id="arrow" viewBox="0 0 10 10" refX="25" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeColor} />
                 </marker>
                 <marker id="arrow-broken" viewBox="0 0 10 10" refX="25" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
                 </marker>
              </defs>

              {/* Edges */}
              <motion.line x1="100" y1="40" x2="160" y2="100" stroke={edgeColor} strokeWidth="2" markerEnd="url(#arrow)" animate={{ stroke: edgeColor }} />
              {/* B→C: becomes the bottleneck link at critical */}
              <motion.line
                x1="160" y1="100" x2="100" y2="160"
                stroke={edgeColor}
                strokeWidth={bottleneck ? 1 : 2}
                strokeDasharray={bottleneck ? "2 4" : "0"}
                markerEnd="url(#arrow)"
                animate={{ stroke: edgeColor }}
              />
              <motion.line x1="100" y1="160" x2="40" y2="100" stroke={edgeColor} strokeWidth="2" markerEnd="url(#arrow)" animate={{ stroke: edgeColor }} />

              {/* D→A: weakens at watch, gone from warning on */}
              <motion.line
                x1="40" y1="100" x2="100" y2="40"
                stroke={closingEdgeGone ? "#334155" : edgeColor}
                strokeWidth="2"
                strokeDasharray={stage === "watch" ? "4 4" : closingEdgeGone ? "1 6" : "0"}
                markerEnd={closingEdgeGone ? "url(#arrow-broken)" : "url(#arrow)"}
                animate={{ stroke: closingEdgeGone ? "#334155" : edgeColor }}
              />

              {/* Nodes */}
              <motion.circle cx="100" cy="40" r="15" fill="#0A1628" stroke={nodeColor} strokeWidth="3" animate={{ stroke: nodeColor }} />
              <text x="100" y="44" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace">A</text>

              <motion.circle cx="160" cy="100" r="15" fill="#0A1628" stroke={nodeColor} strokeWidth="3" animate={{ stroke: nodeColor }} />
              <text x="160" y="104" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace">B</text>

              <motion.circle cx="100" cy="160" r="15" fill="#0A1628" stroke={nodeColor} strokeWidth="3" animate={{ stroke: nodeColor }} />
              <text x="100" y="164" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace">C</text>

              <motion.circle cx="40" cy="100" r="15" fill="#0A1628" stroke={nodeColor} strokeWidth="3" animate={{ stroke: nodeColor }} />
              <text x="40" y="104" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace">D</text>
           </svg>
        </div>

        {/* Fiedler Value Chart */}
        <div className="relative flex flex-col items-center justify-center pt-6 md:pt-0 md:pl-4 min-h-[200px]">
           <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 absolute top-0 left-0 md:left-4 z-10">Laplacian Eigenvalues</div>
           
           <div className="w-full flex-1 mt-6 flex flex-col justify-end relative">
              {/* Threshold lines */}
              <div className="absolute top-[20%] left-0 w-full border-t border-dashed border-slate-700" />
              <div className="absolute top-[60%] left-0 w-full border-t border-dashed border-yellow-900/50" />
              <div className="absolute top-[90%] left-0 w-full border-t border-dashed border-red-900/50" />

              {/* Fiedler Value Bar */}
              <div className="w-16 mx-auto bg-slate-800 rounded-t-sm relative flex flex-col justify-end h-full border border-slate-700 overflow-hidden min-h-[140px]">
                 <motion.div 
                    className="w-full"
                    style={{ background: nodeColor }}
                    animate={{ height: `${fiedlerValue * 100}%` }}
                    transition={{ duration: prefersReduced ? 0 : 0.1 }}
                 />
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white font-mono font-black text-sm drop-shadow-md">
                    {fiedlerValue.toFixed(2)}
                 </div>
              </div>

              <div className="text-center mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                 Fiedler Value (λ₂)
              </div>
           </div>
        </div>

        {/* Report note */}
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
              className="absolute bottom-3 left-3 right-3 z-10 rounded-lg border border-red-500/40 bg-black/80 backdrop-blur-sm p-3 text-left"
            >
              <p className="text-xs text-slate-300">
                <span className="font-bold text-red-400">Report: critical.</span> The graph is close to splitting at B→C. The diagnostic reports this; it does not cancel or restart anything.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Metrics */}
      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Severity</div>
          <div className="flex justify-center items-center gap-1.5" aria-live="polite">
             {stage === "none" && <><Activity className="h-3 w-3 text-blue-400" /><span className="text-sm font-black text-blue-400 uppercase tracking-wide">None</span></>}
             {stage === "watch" && <><AlertOctagon className="h-3 w-3 text-yellow-400" /><span className="text-sm font-black text-yellow-400 uppercase tracking-wide">Watch</span></>}
             {stage === "warning" && <><AlertOctagon className="h-3 w-3 text-orange-400" /><span className="text-sm font-black text-orange-400 uppercase tracking-wide">Warning</span></>}
             {stage === "critical" && <><AlertOctagon className="h-3 w-3 text-red-400" /><span className="text-sm font-black text-red-400 uppercase tracking-wide">Critical</span></>}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Mode</div>
          <div className="text-sm font-black uppercase tracking-wide text-white">
            On demand, advisory
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        A falling Fiedler value means the wait graph is close to splitting: a topology signal, not proof of a deadlock. The scheduler runs its own copy only when the opt-in governor is on.
      </p>
    </div>
  );
}
