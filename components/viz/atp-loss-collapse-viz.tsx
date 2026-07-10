"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import { Activity, Wifi } from "lucide-react";

const BLUE = "#3B82F6";
const RED = "#ef4444";
const LINK_MBIT = 1000;
const MSS_BITS = 1460 * 8;
const MATHIS_C = 1.22;

// Classic single-stream TCP throughput bound: MSS/RTT * C/sqrt(p)
function tcpMbit(lossPct: number, rttMs: number): number {
  if (lossPct <= 0) return LINK_MBIT;
  const p = lossPct / 100;
  const mbit = (MSS_BITS / (rttMs / 1000) / 1e6) * (MATHIS_C / Math.sqrt(p));
  return Math.min(LINK_MBIT, mbit);
}

// Fountain goodput: loss is a bandwidth line item, not a stall.
// Measured ceiling on a clean 1 Gbit path is ~946 Mbit/s (paced source stream).
function atpMbit(lossPct: number): number {
  const p = lossPct / 100;
  return Math.min(946, LINK_MBIT * (1 - p) * 0.97);
}

const CHART = { w: 560, h: 230, padL: 52, padR: 16, padT: 14, padB: 30 };

function xScale(lossPct: number): number {
  return CHART.padL + (lossPct / 10) * (CHART.w - CHART.padL - CHART.padR);
}

function yScale(mbit: number): number {
  return CHART.h - CHART.padB - (mbit / LINK_MBIT) * (CHART.h - CHART.padT - CHART.padB);
}

function formatMbit(mbit: number): string {
  if (mbit >= 10) return `${Math.round(mbit)} Mbit/s`;
  return `${mbit.toFixed(1)} Mbit/s`;
}

export default function AtpLossCollapseViz() {
  const prefersReduced = useReducedMotion();
  const [lossPct, setLossPct] = useState(2);
  const [rttMs, setRttMs] = useState(80);

  const tcp = tcpMbit(lossPct, rttMs);
  const atp = atpMbit(lossPct);
  const ratio = tcp > 0 ? atp / tcp : Infinity;

  const paths = useMemo(() => {
    const steps = 80;
    let tcpPath = "";
    let atpPath = "";
    for (let i = 0; i <= steps; i++) {
      const loss = 0.05 + (i / steps) * 9.95;
      const cmd = i === 0 ? "M" : "L";
      tcpPath += `${cmd} ${xScale(loss).toFixed(1)} ${yScale(tcpMbit(loss, rttMs)).toFixed(1)} `;
      atpPath += `${cmd} ${xScale(loss).toFixed(1)} ${yScale(atpMbit(loss)).toFixed(1)} `;
    }
    const baseline = `L ${xScale(10).toFixed(1)} ${yScale(0).toFixed(1)} L ${xScale(0.05).toFixed(1)} ${yScale(0).toFixed(1)} Z`;
    return { tcpPath, atpPath, tcpArea: tcpPath + baseline, atpArea: atpPath + baseline };
  }, [rttMs]);

  // Markers sit on the plotted curves, whose domain starts at 0.05% loss;
  // the readout tiles below use the slider's true value.
  const markerLoss = Math.max(lossPct, 0.05);
  const tcpMarker = tcpMbit(markerLoss, rttMs);
  const atpMarker = atpMbit(markerLoss);
  const dur = prefersReduced ? 0 : 0.4;

  return (
    <div className="w-full rounded-2xl border border-white/10 p-6 md:p-8 bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">The Retransmission Tax</h3>
          <p className="text-sm text-slate-400 mt-1">
            Single-stream TCP vs a rateless fountain, on a 1 Gbit link. Drag the sliders.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="h-2 w-4 rounded-full" style={{ backgroundColor: RED }} /> TCP (rsync/scp)
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="h-2 w-4 rounded-full" style={{ backgroundColor: BLUE }} /> atp fountain
          </span>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <label className="block rounded-xl border border-white/5 bg-black/40 p-4">
          <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            <span className="flex items-center gap-1.5"><Wifi className="h-3 w-3" /> Packet loss</span>
            <span className="text-white font-mono text-sm normal-case tracking-normal">{lossPct.toFixed(2)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={10}
            step={0.25}
            value={lossPct}
            onChange={(e) => setLossPct(Number(e.target.value))}
            className="w-full accent-blue-500"
            aria-label="Packet loss percentage"
          />
        </label>
        <label className="block rounded-xl border border-white/5 bg-black/40 p-4">
          <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> Round-trip time</span>
            <span className="text-white font-mono text-sm normal-case tracking-normal">{rttMs} ms</span>
          </span>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={rttMs}
            onChange={(e) => setRttMs(Number(e.target.value))}
            className="w-full accent-blue-500"
            aria-label="Round-trip time in milliseconds"
          />
        </label>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-white/5 bg-black/40 p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${CHART.w} ${CHART.h}`} className="w-full h-auto min-w-[420px]" role="img" aria-label={`Throughput vs packet loss at ${rttMs} milliseconds round-trip time. TCP: ${formatMbit(tcp)}. atp: ${formatMbit(atp)}.`}>
          <defs>
            <linearGradient id="atpAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.22} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="tcpAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity={0.16} />
              <stop offset="100%" stopColor={RED} stopOpacity={0.02} />
            </linearGradient>
            <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Grid + axes */}
          {[0, 250, 500, 750, 1000].map((mb) => (
            <g key={mb}>
              <line x1={CHART.padL} x2={CHART.w - CHART.padR} y1={yScale(mb)} y2={yScale(mb)} stroke="#1e293b" strokeWidth={1} />
              <text x={CHART.padL - 8} y={yScale(mb) + 3} textAnchor="end" className="fill-slate-600 text-[9px] font-mono">
                {mb}
              </text>
            </g>
          ))}
          {[0, 2, 4, 6, 8, 10].map((l) => (
            <text key={l} x={xScale(l)} y={CHART.h - 12} textAnchor="middle" className="fill-slate-600 text-[9px] font-mono">
              {l}%
            </text>
          ))}
          <text x={14} y={CHART.padT + 4} className="fill-slate-500 text-[8px] font-mono" transform={`rotate(-90 14 ${CHART.padT + 4})`} textAnchor="end">
            Mbit/s
          </text>

          {/* Curves */}
          <path d={paths.atpArea} fill="url(#atpAreaFill)" stroke="none" />
          <path d={paths.tcpArea} fill="url(#tcpAreaFill)" stroke="none" />
          <path d={paths.atpPath} fill="none" stroke={BLUE} strokeWidth={2.5} strokeLinecap="round" />
          <path d={paths.tcpPath} fill="none" stroke={RED} strokeWidth={2.5} strokeLinecap="round" />
          <text
            x={CHART.w - CHART.padR - 6}
            y={yScale(atpMbit(10)) - 10}
            textAnchor="end"
            fill={BLUE}
            className="text-[10px] font-mono font-bold"
          >
            atp fountain
          </text>
          <text
            x={CHART.w - CHART.padR - 6}
            y={yScale(tcpMbit(10, rttMs)) - 10}
            textAnchor="end"
            fill={RED}
            className="text-[10px] font-mono font-bold"
          >
            TCP single stream
          </text>

          {/* Current-loss marker */}
          <line
            x1={xScale(markerLoss)}
            x2={xScale(markerLoss)}
            y1={CHART.padT}
            y2={CHART.h - CHART.padB}
            stroke="#475569"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <motion.circle
            initial={{ cx: xScale(markerLoss), cy: yScale(atpMarker) }}
            animate={{ cx: xScale(markerLoss), cy: yScale(atpMarker) }}
            transition={{ duration: dur }}
            r={5}
            fill={BLUE}
            stroke="#020a14"
            strokeWidth={2}
            filter="url(#markerGlow)"
          />
          <motion.circle
            initial={{ cx: xScale(markerLoss), cy: yScale(tcpMarker) }}
            animate={{ cx: xScale(markerLoss), cy: yScale(tcpMarker) }}
            transition={{ duration: dur }}
            r={5}
            fill={RED}
            stroke="#020a14"
            strokeWidth={2}
            filter="url(#markerGlow)"
          />
        </svg>
      </div>

      {/* Readouts */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-red-400/70 mb-1">TCP single stream</div>
          <div className="text-2xl font-black font-mono text-red-400 tabular-nums">{formatMbit(tcp)}</div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Every lost packet costs a round trip and a window collapse. Throughput ∝ 1/(RTT·√loss).
          </p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-400/70 mb-1">atp fountain</div>
          <div className="text-2xl font-black font-mono text-blue-400 tabular-nums">{formatMbit(atp)}</div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            {lossPct <= 0
              ? "Zero loss → paced reliable stream. No FEC tax at all."
              : `${lossPct.toFixed(1)}% loss costs ≈${lossPct.toFixed(1)}% extra symbols. RTT barely matters.`}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 flex flex-col justify-center items-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Advantage</div>
          <div className="text-3xl font-black font-mono text-white tabular-nums">
            {ratio >= 100 ? `${Math.round(ratio)}×` : ratio >= 1.05 ? `${ratio.toFixed(1)}×` : "—"}
          </div>
          <div className="text-[10px] text-slate-600 uppercase tracking-widest mt-1">
            {ratio >= 1.05 ? "loss is bandwidth, not latency" : "clean link: dead heat"}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-slate-600 leading-relaxed">
        TCP curve is the classic Mathis bound (MSS/RTT · 1.22/√p) for a single stream; modern stacks with SACK
        claw some of it back, but the 1/√p shape is what you feel. The fountain never re-sends the bytes that
        died, so the question &ldquo;which packets got lost?&rdquo; stops mattering. Only the count does.
      </p>
    </div>
  );
}
