"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import { Search, ShieldAlert, CheckCircle2, LineChart, Play } from "lucide-react";

type OracleState = "idle" | "monitoring" | "rejected";

// Upstream defaults (src/lab/oracle/eprocess.rs).
const P0 = 0.001;
const LAMBDA = 0.5;
const ALPHA = 0.05;

export default function TestOraclesViz() {
  const prefersReduced = useReducedMotion();
  const [testState, setTestState] = useState<OracleState>("idle");
  const [eProcessValue, setEProcessValue] = useState(1.0); // Starts at 1.0
  const [seeds, setSeeds] = useState(0);
  const timeRef = useRef(0);
  const eRef = useRef(1.0);

  const threshold = 1 / ALPHA; // 20

  const startTest = () => {
    setTestState("monitoring");
    setEProcessValue(1.0);
    setSeeds(0);
    timeRef.current = 0;
    eRef.current = 1.0;
  };

  useEffect(() => {
    if (testState !== "monitoring") return;

    const interval = setInterval(() => {
      timeRef.current += 1;
      const t = timeRef.current;

      // One observation per seed: obligation_leak's own pass/fail verdict.
      // In this illustration the leak shows up on every other seed after seed 10.
      const violated = t > 10 && t % 2 === 0 ? 1 : 0;

      // E_t = E_{t-1} * (1 + λ (X_t - p₀))
      const next = eRef.current * (1 + LAMBDA * (violated - P0));
      eRef.current = next;
      setSeeds(t);
      setEProcessValue(next);

      if (next >= threshold) {
        setTestState("rejected");
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [testState, threshold]);

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Oracles Across Seeds</h3>
          <p className="text-sm text-slate-400 mt-1">
            Each seed&apos;s oracle verdicts feed an anytime-valid e-process.
          </p>
        </div>
        
        <button
          onClick={startTest}
          disabled={testState === "monitoring"}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {testState === "rejected" ? <RotateCcwIcon className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {testState === "rejected" ? "Restart" : "Run Seeds"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

         {/* Standard e-process monitor: three oracles */}
         <div className="flex flex-col gap-3">
            <OracleCard name="task_leak" active={testState === "monitoring"} status={testState === "rejected" ? "passed" : "pending"} />
            <OracleCard name="obligation_leak" active={testState === "monitoring"} status={testState === "rejected" ? "failed" : "pending"} />
            <OracleCard name="quiescence" active={testState === "monitoring"} status={testState === "rejected" ? "passed" : "pending"} />
            <div className="text-[10px] font-mono text-slate-500">
               Seeds run: {seeds} · p₀ = {P0}, λ = {LAMBDA}, α = {ALPHA}
            </div>
         </div>

         {/* E-Process Chart */}
         <div className="relative border border-white/5 bg-black/40 rounded-xl p-4 flex flex-col justify-end min-h-[200px] overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-400">
               <LineChart className="h-4 w-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest">E-Value (obligation_leak)</span>
            </div>

            {/* Threshold Line */}
            <div className="absolute top-[20%] left-0 w-full border-t border-dashed border-red-500/50 flex items-center">
               <span className="bg-[#020a14] text-red-400 text-[9px] font-mono px-1 ml-2">Reject at 1/α = 20</span>
            </div>

            {/* Data Bar (Simulating a single current value instead of drawing a full line graph for simplicity) */}
            <div className="w-16 mx-auto bg-slate-800 rounded-t-sm relative flex flex-col justify-end h-[150px] border border-slate-700 overflow-hidden mt-8">
               <motion.div 
                  className="w-full"
                  style={{ background: testState === "rejected" ? "#ef4444" : "#10b981" }}
                  animate={{ height: `${Math.min((eProcessValue / (threshold + 5)) * 100, 100)}%` }}
                  transition={{ duration: prefersReduced ? 0 : 0.1 }}
               />
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white font-mono font-black text-sm drop-shadow-md">
                  {eProcessValue.toFixed(1)}
               </div>
            </div>

            {/* Reject Overlay */}
            <AnimatePresence>
               {testState === "rejected" && (
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10"
                  >
                     <ShieldAlert className="h-10 w-10 text-red-500 mb-2" />
                     <h4 className="text-sm font-black text-white uppercase tracking-widest">H₀ Rejected</h4>
                     <p className="text-[10px] text-red-200 mt-1 max-w-[200px] text-center">
                        Enough obligation_leak failures across seeds to reject H₀ (violation rate ≤ p₀) at α = 0.05.
                     </p>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

      </div>

      <p className="mt-4 text-xs text-slate-500">
        The oracle flags each failing run itself. The e-process summarizes those verdicts across seeds; it does not find new bugs.
      </p>
    </div>
  );
}

function OracleCard({ name, active, status }: { name: string, active: boolean, status: "pending" | "passed" | "failed" }) {
   return (
      <div className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
         status === "failed" ? "border-red-500/50 bg-red-500/10" :
         active ? "border-emerald-500/30 bg-emerald-500/5" :
         "border-white/5 bg-slate-800/30"
      }`}>
         <div className="flex items-center gap-3">
            <Search className={`h-4 w-4 ${active && status === "pending" ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <span className={`text-xs font-mono font-bold ${status === "failed" ? "text-red-400" : "text-slate-300"}`}>{name}</span>
         </div>
         <div>
            {status === "failed" && <ShieldAlert className="h-4 w-4 text-red-500" />}
            {status === "passed" && <CheckCircle2 className="h-4 w-4 text-slate-600" />}
            {status === "pending" && active && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />}
         </div>
      </div>
   );
}

function RotateCcwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}
