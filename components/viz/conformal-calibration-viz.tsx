"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, AlertTriangle, ShieldCheck, Play, RotateCcw } from "lucide-react";

type DataPoint = { id: number; x: number; y: number; isAnomalous: boolean };

export default function ConformalCalibrationViz() {
  const [isRunning, setIsRunning] = useState(false);
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [anomalyCaught, setAnomalyCaught] = useState(false);

  const MAX_POINTS = 40;

  const startSimulation = () => {
    setIsRunning(true);
    setPoints([]);
    setAnomalyCaught(false);
  };

  useEffect(() => {
    if (!isRunning) return;

    let tickCounter = 0;
    const interval = setInterval(() => {
      tickCounter += 1;
      const nextTick = tickCounter;

      // Generate a new point
      let newY = 30 + Math.random() * 40; // Normal distribution roughly between 30-70
      let isAnomalous = false;

      // Inject an anomaly at tick 30
      if (nextTick === 30) {
        newY = 95; // Spikes way above the conformal bound
        isAnomalous = true;
      }

      const newPoint: DataPoint = { id: nextTick, x: nextTick, y: newY, isAnomalous };

      setPoints(prev => {
        const next = [...prev, newPoint];
        if (next.length > MAX_POINTS) next.shift();
        return next;
      });

      if (isAnomalous) {
        setAnomalyCaught(true);
        setIsRunning(false);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Conformal Calibration</h3>
          <p className="text-sm text-slate-400 mt-1">
            Opt-in on ScheduleExplorer. Flags seeds whose oracle metrics look unusual.
          </p>
        </div>
        
        <button
          onClick={startSimulation}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {anomalyCaught ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {anomalyCaught ? "Restart" : "Explore Seeds"}
        </button>
      </div>

      <div className="relative h-64 p-6 border border-white/5 bg-black/40 rounded-xl overflow-hidden flex flex-col justify-end">
        
        {/* Y-Axis Label */}
        <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-400">
            <LineChart className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Oracle Metric per Seed</span>
        </div>

        {/* Conformal Band (Shaded Area) */}
        <div className="absolute bottom-6 left-6 right-6 h-[70%] bg-sky-500/10 border-t border-dashed border-sky-500/50 flex items-start p-2">
            <span className="text-[9px] font-mono text-sky-400 font-bold uppercase">
               95% Prediction Set (α = 0.05)
            </span>
        </div>

        {/* Scatter Plot Points */}
        <div className="absolute bottom-6 left-6 right-6 h-[100%]">
           <AnimatePresence>
              {points.map((p) => {
                 // Calculate X position relative to max points
                 const leftPercent = ((p.x % MAX_POINTS) / MAX_POINTS) * 100;
                 
                 return (
                    <motion.div
                       key={p.id}
                       initial={{ scale: 0, opacity: 0 }}
                       animate={{ scale: p.isAnomalous ? 1.5 : 1, opacity: 1 }}
                       className={`absolute h-2 w-2 rounded-full -translate-x-1/2 translate-y-1/2 ${p.isAnomalous ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-20" : "bg-sky-400 z-10"}`}
                       style={{ 
                          left: `${leftPercent}%`, 
                          bottom: `${p.y}%` 
                       }}
                    />
                 );
              })}
           </AnimatePresence>
        </div>

        {/* Alert Overlay */}
        <AnimatePresence>
           {anomalyCaught && (
              <motion.div
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-30"
              >
                 <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
                 <h4 className="text-sm font-black text-white uppercase tracking-widest">Anomalous Seed Flagged</h4>
                 <p className="text-[10px] text-red-200 mt-1 max-w-[250px] text-center">
                    This seed&apos;s metrics fall outside the 95% set, so it is listed for review even though no invariant failed. Up to 5% of normal seeds can land outside too.
                 </p>
              </motion.div>
           )}
        </AnimatePresence>
      </div>

      {/* Description Panel */}
      <div className="mt-6 p-4 rounded-xl border border-white/5 bg-slate-800/30 text-sm text-slate-400 leading-relaxed flex items-start gap-4">
         <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
         <p>
            <strong className="text-white">Split conformal prediction</strong> over oracle-report metrics from explored seeds
            (<code className="text-slate-300">ScheduleExplorer::with_conformal_calibration</code>). With the default α = 0.05 and at least 5 calibration
            samples, a new seed lands inside the set at least 95% of the time <em className="text-slate-300">if runs are exchangeable</em>, with no assumption about the shape of the distribution.
         </p>
      </div>

    </div>
  );
}
