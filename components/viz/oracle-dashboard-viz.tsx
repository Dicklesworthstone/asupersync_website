"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "@/components/motion";
import { labOracles } from "@/lib/content";

type OracleStatus = "idle" | "checking" | "pass" | "fail" | "unfed";

interface Oracle {
  name: string;
  short: string;
  fed: boolean;
  example?: string;
  status: OracleStatus;
}

const ORACLES_INIT: Omit<Oracle, "status">[] = labOracles.map((o) => ({
  name: o.name,
  short: o.description,
  fed: o.fed,
  example: o.example,
}));

const FED_COUNT = ORACLES_INIT.filter((o) => o.fed).length;

// Simulate one lab run with a planted bug: one fed oracle fails, the other fed
// oracles pass, and the oracles nothing feeds yet report as not fed.
function simulateRun(): Oracle[] {
  const fedIndices = ORACLES_INIT.flatMap((o, i) => (o.fed ? [i] : []));
  const failIndex = fedIndices[Math.floor(Math.random() * fedIndices.length)];

  return ORACLES_INIT.map((o, i) => ({
    ...o,
    status: !o.fed ? ("unfed" as const) : i === failIndex ? ("fail" as const) : ("pass" as const),
  }));
}

export default function OracleDashboardViz() {
  const prefersReduced = useReducedMotion();
  const [oracles, setOracles] = useState<Oracle[]>(
    ORACLES_INIT.map((o) => ({ ...o, status: "idle" }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [violation, setViolation] = useState<{ name: string; message: string } | null>(null);
  const [passCount, setPassCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [unfedCount, setUnfedCount] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setOracles(ORACLES_INIT.map((o) => ({ ...o, status: "idle" })));
    setIsRunning(false);
    setViolation(null);
    setPassCount(0);
    setFailCount(0);
    setUnfedCount(0);
  }, [clearTimers]);

  const runTest = useCallback(() => {
    if (isRunning) return;
    reset();
    setIsRunning(true);

    const finalResults = simulateRun();

    // Animate oracles checking one by one
    ORACLES_INIT.forEach((_, i) => {
      const checkDelay = 80 + i * 70;
      const resultDelay = checkDelay + 200;

      const t1 = setTimeout(() => {
        setOracles((prev) => prev.map((o, j) => (j === i ? { ...o, status: "checking" } : o)));
      }, checkDelay);

      const t2 = setTimeout(() => {
        setOracles((prev) => prev.map((o, j) => (j === i ? { ...o, status: finalResults[i].status } : o)));
        if (finalResults[i].status === "pass") setPassCount((c) => c + 1);
        if (finalResults[i].status === "unfed") setUnfedCount((c) => c + 1);
        if (finalResults[i].status === "fail") {
          setFailCount((c) => c + 1);
          setViolation({
            name: finalResults[i].name,
            message: finalResults[i].example ?? "invariant violated",
          });
        }
      }, resultDelay);

      timersRef.current.push(t1, t2);
    });

    const tDone = setTimeout(() => setIsRunning(false), 80 + ORACLES_INIT.length * 70 + 400);
    timersRef.current.push(tDone);
  }, [isRunning, reset]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const dur = prefersReduced ? 0 : 0.2;

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Lab Oracle Dashboard</h3>
          <p className="text-sm text-purple-400">
            {ORACLES_INIT.length} built in · {FED_COUNT} fed by the lab runtime today
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-green-400">{passCount} pass</span>
          <span className="text-slate-600">/</span>
          <span className="text-red-400">{failCount} fail</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500">{unfedCount} not fed</span>
        </div>
      </div>

      {/* Oracle Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mb-6">
        {oracles.map((oracle) => {
          const statusColor = (() => {
            switch (oracle.status) {
              case "idle": return "#334155";
              case "checking": return "#EAB308";
              case "pass": return "#22C55E";
              case "fail": return "#EF4444";
              case "unfed": return "#475569";
            }
          })();

          return (
            <motion.div
              key={oracle.name}
              className="rounded-lg border p-2.5 text-center cursor-default"
              style={{
                borderColor: `${statusColor}44`,
                background: oracle.status !== "idle" ? `${statusColor}11` : "transparent",
              }}
              animate={{ scale: oracle.status === "checking" ? 1.05 : 1 }}
              transition={{ duration: dur }}
              title={oracle.fed ? oracle.short : `${oracle.short} (not fed by the lab runtime yet)`}
            >
              <motion.div
                className="mx-auto mb-1.5 h-3 w-3 rounded-full"
                style={{ backgroundColor: statusColor }}
                animate={{
                  boxShadow: oracle.status === "checking"
                    ? `0 0 12px ${statusColor}`
                    : oracle.status === "fail"
                      ? `0 0 8px ${statusColor}88`
                      : `0 0 4px ${statusColor}44`,
                }}
                transition={{ duration: dur }}
              />
              <div className={`text-[9px] font-bold leading-tight truncate ${oracle.fed ? "text-slate-300" : "text-slate-600"}`}>
                {oracle.name}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Violation Panel */}
      <AnimatePresence>
        {violation && (
          <motion.div
            className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 mb-6"
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-red-400">
                Violation Detected
              </span>
            </div>
            <p className="text-sm font-mono text-red-300">
              <span className="text-red-500 font-bold">{violation.name}:</span>{" "}
              {violation.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mb-6 text-xs text-slate-500 leading-relaxed">
        Brighter names are the oracles every <span className="font-mono">LabRuntime</span> report feeds from runtime
        state. The dimmer ones exist in the registry but nothing in the runtime feeds them yet, so a
        report lists them as passed and counts them as not fed. Each run here plants one bug.
      </p>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <button
          onClick={runTest}
          disabled={isRunning}
          className="rounded-lg px-6 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "#7C3AED" }}
        >
          Run Test
        </button>
        <button
          onClick={reset}
          className="rounded-lg border px-6 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
          style={{ borderColor: "#1e293b" }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
