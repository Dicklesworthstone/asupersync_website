"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/components/motion";
import {
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  Copy,
  FlaskConical,
  KeyRound,
  LockKeyhole,
  Server,
  Terminal,
} from "lucide-react";
import SectionShell from "@/components/section-shell";
import StatsGrid from "@/components/stats-grid";
import GlitchText from "@/components/glitch-text";
import GlowOrbits from "@/components/glow-orbits";
import { SyncContainer } from "@/components/sync-elements";
import { Magnetic, BorderBeam } from "@/components/motion-wrapper";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import type { Stat } from "@/lib/content";

// minHeight approximates each viz's rendered height so the page doesn't jump
// when a dynamic chunk resolves.
const VizLoader = ({ minHeight }: { minHeight: number }) => (
  <div
    className="flex items-center justify-center text-slate-600 text-sm font-mono"
    style={{ minHeight }}
  >
    Loading visualization...
  </div>
);

const AtpLossCollapseViz = dynamic(() => import("@/components/viz/atp-loss-collapse-viz"), {
  ssr: false,
  loading: () => <VizLoader minHeight={680} />,
});
const AtpFountainRaceViz = dynamic(() => import("@/components/viz/atp-fountain-race-viz"), {
  ssr: false,
  loading: () => <VizLoader minHeight={620} />,
});
const AtpProtocolFlowViz = dynamic(() => import("@/components/viz/atp-protocol-flow-viz"), {
  ssr: false,
  loading: () => <VizLoader minHeight={680} />,
});
const AtpBenchmarkExplorerViz = dynamic(() => import("@/components/viz/atp-benchmark-explorer-viz"), {
  ssr: false,
  loading: () => <VizLoader minHeight={900} />,
});
const AtpBondingViz = dynamic(() => import("@/components/viz/atp-bonding-viz"), {
  ssr: false,
  loading: () => <VizLoader minHeight={680} />,
});

const INSTALL_LINUX = "curl -fsSL https://raw.githubusercontent.com/Dicklesworthstone/atp/main/install.sh | bash";
const INSTALL_WINDOWS = "irm https://raw.githubusercontent.com/Dicklesworthstone/atp/main/install.ps1 | iex";
const INSTALL_SKILL = "curl -fsSL https://raw.githubusercontent.com/Dicklesworthstone/atp/main/install.sh | bash -s -- --skill";
const ATP_GITHUB = "https://github.com/Dicklesworthstone/atp";
const RAPTORQ_ESSAY = "https://jeffreyemanuel.com/writing/raptorq";

const atpStats: Stat[] = [
  { label: "Clean 1 Gbit path", value: "946", helper: "Mbit/s sustained · effectively line rate" },
  { label: "Small-file speedup", value: "4.8", helper: "× vs tuned rsync · at least 2.9× in every regime" },
  { label: "Ledger experiments", value: "230+", helper: "Append-only · failed hypotheses stay on the record" },
  { label: "Unverified bytes landed", value: "0", helper: "SHA-256 + Merkle on every transfer · fails closed" },
];

function CopyCommand({ command, label, prompt = "$" }: { command: string; label?: string; prompt?: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = command;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div className="w-full">
      {label && (
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mb-2">{label}</div>
      )}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/60 px-4 py-3">
        <div className="flex items-center gap-2.5 font-mono text-xs sm:text-sm min-w-0">
          <span className="text-blue-500 font-bold select-none shrink-0">{prompt}</span>
          <code className="text-slate-200 truncate">{command}</code>
        </div>
        <button
          onClick={handleCopy}
          aria-label={`Copy command${label ? ` for ${label}` : ""}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all shrink-0"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

const FOUNTAIN_COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#F97316"];

interface FountainParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
}

// Ambient hero background: droplets arcing out of a center spout, like the
// fountain the page is named for. Canvas + rAF, gated on visibility and
// prefers-reduced-motion, capped DPR, no trails or offscreen work.
function HeroFountainField() {
  const prefersReduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { ref: observerRef, isIntersecting } = useIntersectionObserver<HTMLCanvasElement>({
    threshold: 0,
    triggerOnce: false,
  });

  useEffect(() => {
    if (prefersReduced || !isIntersecting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const COUNT = coarse ? 40 : 85;
    const GRAVITY = 30;

    const spawn = (p: FountainParticle, initial: boolean) => {
      p.x = width / 2 + (Math.random() - 0.5) * width * 0.05;
      p.y = initial ? Math.random() * height : -8;
      p.vx = (Math.random() - 0.5) * width * 0.18;
      p.vy = 8 + Math.random() * 34;
      p.r = 0.9 + Math.random() * 1.7;
      p.color = FOUNTAIN_COLORS[Math.floor(Math.random() * FOUNTAIN_COLORS.length)];
      p.alpha = 0.2 + Math.random() * 0.45;
      if (initial) {
        p.x = Math.random() * width;
        p.vx = (Math.random() - 0.5) * width * 0.08;
        p.vy = 20 + Math.random() * 60;
      }
    };

    const particles: FountainParticle[] = Array.from({ length: COUNT }, () => {
      const p: FountainParticle = { x: 0, y: 0, vx: 0, vy: 0, r: 1, color: FOUNTAIN_COLORS[0], alpha: 0.3 };
      spawn(p, true);
      return p;
    });

    let frameId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > height + 10 || p.x < -10 || p.x > width + 10) spawn(p, false);
        // Short streak along the velocity vector reads as a falling droplet
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.r;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, [prefersReduced, isIntersecting]);

  return (
    <canvas
      ref={(node) => {
        canvasRef.current = node;
        observerRef.current = node;
      }}
      className="absolute inset-0 h-full w-full opacity-60"
      aria-hidden="true"
    />
  );
}

const TERMINAL_LINES = 6;

function HeroTerminal() {
  const prefersReduced = useReducedMotion();
  const reduced = prefersReduced ?? false;
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ threshold: 0.3, triggerOnce: true });
  const [revealed, setRevealed] = useState(0);

  const revealedRef = useRef(0);

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  // Markup below must never branch on `reduced` directly: this component is
  // SSR'd, and the server can't know the visitor's motion preference. The
  // interval reveals everything at once for reduced-motion visitors instead.
  useEffect(() => {
    if (!isIntersecting) return;
    const id = window.setInterval(
      () => {
        if (revealedRef.current >= TERMINAL_LINES) {
          window.clearInterval(id);
          return;
        }
        setRevealed((s) => Math.min(reduced ? TERMINAL_LINES : s + 1, TERMINAL_LINES));
      },
      reduced ? 50 : 620
    );
    return () => window.clearInterval(id);
  }, [isIntersecting, reduced]);

  const shown = revealed;

  const line = (idx: number, node: React.ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={shown > idx ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: reduced ? 0 : 0.3 }}
      className="min-h-[1.4rem]"
    >
      {shown > idx ? node : null}
    </motion.div>
  );

  return (
    <div ref={ref} className="font-mono text-[11px] sm:text-xs leading-relaxed p-5 sm:p-6" role="group" aria-label="Example atp transfer">
      <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        <span className="ml-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">atp · live transfer</span>
      </div>
      {line(0, <span><span className="text-blue-500 font-bold">$</span> <span className="text-white">atp send ./dataset gpu-box:8472 --transport rq</span></span>)}
      {line(1, <span className="text-slate-400"><span className="text-slate-600">manifest</span>  1 entry · 500 MB · merkle <span className="text-blue-400">9f3ac1…</span></span>)}
      {line(2, <span className="text-slate-400"><span className="text-slate-600">link</span>      clean · zero-loss hint → paced source stream</span>)}
      {line(
        3,
        <span className="flex items-center gap-2 text-slate-400">
          <span className="text-slate-600">stream</span>
          <span className="relative h-2 w-32 sm:w-44 rounded-full bg-slate-800 overflow-hidden inline-block">
            <motion.span
              className="absolute inset-y-0 left-0 bg-blue-500"
              initial={{ width: "0%" }}
              animate={shown > 3 ? { width: "100%" } : {}}
              transition={{ duration: reduced ? 0 : 1.1, ease: "easeOut" }}
            />
          </span>
          <span className="text-blue-400 font-bold">946 Mbit/s</span>
        </span>
      )}
      {line(4, <span className="text-slate-400"><span className="text-slate-600">verify</span>    sha256 <span className="text-emerald-400">OK</span> · merkle <span className="text-emerald-400">OK</span> · feedback_rounds: 0</span>)}
      {line(5, <span className="text-emerald-400 font-bold">✓ committed in 4.52 s · exit 0</span>)}
      <div className="min-h-[1.4rem] flex items-center gap-2">
        {shown >= TERMINAL_LINES && (
          <>
            <span className="text-blue-500 font-bold select-none">$</span>
            <motion.span
              animate={reduced ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              className="inline-block h-3.5 w-2 bg-slate-400"
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function AtpPage() {
  return (
    <main id="main-content">
      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GlowOrbits />
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
          <HeroFountainField />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-8"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                Asupersync Transfer Protocol
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <GlitchText trigger="hover" intensity="medium">
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
                    Any <span className="text-blue-500">K</span> drops fill the glass.
                  </h1>
                </GlitchText>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed mb-8"
              >
                atp turns every file into a fountain of interchangeable RaptorQ symbols (RFC 6330). Any K of
                them, plus a little slack, rebuild the original. Which packets die stops mattering, so loss
                costs bandwidth instead of round trips. It outruns tuned rsync by 2.9&ndash;4.8&times; on small
                files, holds line rate on clean gigabit, and refuses to land a single unverified byte.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <CopyCommand command={INSTALL_LINUX} />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Linux &amp; macOS · SHA-256-checked install · Windows one-liner below
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Magnetic strength={0.1}>
                    <a
                      href={ATP_GITHUB}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-magnetic="true"
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:bg-blue-400 transition-all active:scale-95"
                    >
                      GitHub
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Magnetic>
                  <Magnetic strength={0.1}>
                    <a
                      href={RAPTORQ_ESSAY}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-magnetic="true"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-black text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    >
                      <BookOpen className="h-4 w-4" />
                      The RaptorQ essay
                    </a>
                  </Magnetic>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <SyncContainer withPulse accentColor="#3B82F6" className="glass-modern p-0 overflow-hidden">
                <BorderBeam />
                <HeroTerminal />
              </SyncContainer>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="mx-auto max-w-7xl px-6 mb-8">
        <StatsGrid stats={atpStats} />
      </div>

      {/* ── 01 · The Problem ── */}
      <SectionShell
        id="problem"
        icon="activity"
        eyebrow="01 · The Problem"
        title="TCP pays for loss in round trips"
        kicker={
          <>
            rsync, scp, and sftp all ride a single TCP stream, and TCP reads every lost packet as congestion.
            Throughput falls off roughly with 1/(RTT·&radic;loss): on an 80 ms link, a 2% loss rate can cost you
            10&times; your throughput, or all of it.
          </>
        }
      >
        <SyncContainer withPulse accentColor="#ef4444" className="p-4 md:p-8 bg-black/40 shadow-2xl shadow-red-900/20">
          <AtpLossCollapseViz />
        </SyncContainer>
      </SectionShell>

      {/* ── 02 · The Idea ── */}
      <SectionShell
        id="fountain"
        icon="droplets"
        eyebrow="02 · The Idea"
        title="Any K of N"
        kicker={
          <>
            RaptorQ turns a file into a stream of fungible symbols, like water droplets from a fountain. Any K
            of them fill your glass. BitTorrent can strand you at 99% hunting one rare chunk; a fountain has no
            rarest chunk to hunt.
          </>
        }
      >
        <SyncContainer withPulse accentColor="#3B82F6" className="p-4 md:p-8 bg-black/40 shadow-2xl shadow-blue-900/20">
          <AtpFountainRaceViz />
        </SyncContainer>
      </SectionShell>

      {/* ── 03 · The Protocol ── */}
      <SectionShell
        id="protocol"
        icon="network"
        eyebrow="03 · The Protocol"
        title="Reliability where it belongs"
        kicker={
          <>
            A tiny ordered control plane carries the manifest and feedback. A fire-hose data plane carries
            symbols. TCP-style reliability never fights the fountain code, and the fountain never has to
            reimplement ordering for the metadata that genuinely needs it.
          </>
        }
      >
        <SyncContainer withPulse accentColor="#8B5CF6" className="p-4 md:p-8 bg-black/40 shadow-2xl shadow-purple-900/20">
          <AtpProtocolFlowViz />
        </SyncContainer>
      </SectionShell>

      {/* ── 04 · The Brain ── */}
      <SectionShell
        id="adaptive"
        icon="zap"
        eyebrow="04 · The Brain"
        title="Zero FEC tax on clean links"
        kicker={
          <>
            Carmack&rsquo;s objection was fair: the kernel knows things user code can&rsquo;t. So atp measures
            what it can actually observe and picks its path per transfer.
          </>
        }
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            {
              title: "Clean link? Paced stream",
              desc: "A BBR-style delivery-rate sampler paces a reliable source stream: per-packet delivered counters, a PROBE_BW-style gain cycle, a measured 2 MiB flow window. 946 Mbit/s on a 1 Gbit path, with zero repair symbols sent.",
              color: "#3B82F6",
            },
            {
              title: "Lossy link? Fountain spray",
              desc: "Give it a loss hint and round-0 repair overhead is sized from that hint. Feedback stays bounded: a few NeedMore rounds, never a per-loss conversation.",
              color: "#F97316",
            },
            {
              title: "2,000 tiny files? One wire entry",
              desc: "Small trees get packed so tiny files skip the per-file round-trip floor. The Merkle commitment still covers every logical file on both ends.",
              color: "#22c55e",
            },
            {
              title: "Seen it before? Send the delta",
              desc: "FastCDC chunking plus IBLT set reconciliation finds what changed, with traffic proportional to the delta. A rolling-hash diff works below chunk level. rsync's best trick, kept.",
              color: "#8B5CF6",
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-7 hover:border-blue-500/20 transition-all"
            >
              <div
                className="h-1 w-10 rounded-full mb-5"
                style={{ backgroundColor: card.color }}
                aria-hidden="true"
              />
              <h3 className="text-lg font-black text-white mb-2.5">{card.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      {/* ── 05 · The Receipts ── */}
      <SectionShell
        id="benchmarks"
        icon="barChart3"
        eyebrow="05 · The Receipts"
        title="Benchmarked against a tuned opponent"
        kicker={
          <>
            Hermetic network namespaces, netem impairments on both ends, SHA-256 verification of every single
            transfer, medians of 3 to 5 reps, and an rsync configured for maximum speed. Where rsync still wins,
            the same table says so.
          </>
        }
      >
        <SyncContainer withPulse accentColor="#22c55e" className="p-4 md:p-8 bg-black/40 shadow-2xl shadow-green-900/20">
          <AtpBenchmarkExplorerViz />
        </SyncContainer>
      </SectionShell>

      {/* ── 06 · Bonding ── */}
      <SectionShell
        id="bonding"
        icon="gitMerge"
        eyebrow="06 · Bonding"
        title="One file, many fountains"
        kicker={
          <>
            A single TCP stream cannot express this at all. Every machine that holds the file feeds the same
            receiver at once, each spraying a disjoint slice of one fountain. Kill a donor mid-transfer and
            watch what happens.
          </>
        }
      >
        <SyncContainer withPulse accentColor="#F97316" className="p-4 md:p-8 bg-black/40 shadow-2xl shadow-orange-900/20">
          <AtpBondingViz />
        </SyncContainer>
      </SectionShell>

      {/* ── 07 · Security ── */}
      <SectionShell
        id="security"
        icon="shield"
        eyebrow="07 · Security"
        title="Three tiers, zero silent downgrades"
        kicker={
          <>
            Security is an explicit axis, not a default you discover later. Each tier gets benchmarked only
            against the crypto-equivalent rsync setup; anything else would be a strawman.
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: FlaskConical,
              title: "Lab plaintext",
              flag: "--rq-allow-unauthenticated-lab",
              desc: "No crypto at all, for benchmarks and airgapped labs. The flag name is deliberately embarrassing to type in production.",
              color: "#eab308",
            },
            {
              icon: KeyRound,
              title: "Symbol-authenticated",
              flag: "--rq-auth-key-hex $(atp rq-keygen)",
              desc: "Per-symbol HMAC over raw UDP. Forged payloads are dropped before they ever reach the decoder.",
              color: "#F97316",
            },
            {
              icon: LockKeyhole,
              title: "QUIC + TLS 1.3",
              flag: "--transport quic",
              desc: "Real X.509 verification through rustls: chain, hostname, expiry. All of it fails closed, and no insecure skip-verify escape hatch exists to fat-finger.",
              color: "#22c55e",
            },
          ].map((tier) => (
            <motion.div
              key={tier.title}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-7 hover:border-blue-500/20 transition-all flex flex-col"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl mb-5"
                style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
              >
                <tier.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">{tier.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">{tier.desc}</p>
              <code className="text-[10px] font-mono text-blue-400/80 bg-black/40 border border-white/5 rounded-lg px-3 py-2 block overflow-x-auto whitespace-nowrap">
                {tier.flag}
              </code>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            Every tier shares one invariant: stage, hash-verify, commit. Corrupt or partial data never lands in
            the destination, and exit 0 always means verified. On hostile networks, use the QUIC tier; the
            HMAC tier authenticates symbols, not the control stream.
          </p>
        </div>
      </SectionShell>

      {/* ── 08 · For Agents ── */}
      <SectionShell
        id="agents"
        icon="sparkles"
        eyebrow="08 · For Agents"
        title="Your agents already know how to use it"
        kicker={
          <>
            The installer offers an agent skill for Claude Code and Codex that teaches your agents to run atp
            well, so you never have to learn the flags yourself.
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {[
            {
              icon: Terminal,
              title: "One flag away",
              desc: "Take the skill with --skill (or say yes at the interactive prompt). It carries transport policy, peer profiles, troubleshooting playbooks, and a smoke test.",
            },
            {
              icon: Server,
              title: "Fleet install",
              desc: "atp has to sit on both ends, so the skill ships fleet-install.sh to roll it across every ssh-reachable machine you already use.",
            },
            {
              icon: Braces,
              title: "Reports, not logs",
              desc: "JSON on stdout, diagnostics on stderr, exit 0 only after verification. feedback_rounds tells your agent exactly what the link did.",
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-7 hover:border-blue-500/20 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-5 bg-blue-500/5 border border-blue-500/20 text-blue-400">
                <card.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2.5">{card.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
        <CopyCommand command={INSTALL_SKILL} label="Install with the agent skill" />
      </SectionShell>

      {/* ── CTA ── */}
      <section className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10">
          <div className="text-center mb-10">
            <GlitchText trigger="hover" intensity="low">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                Install it on both ends
              </h2>
            </GlitchText>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
              One static binary, no daemon required. atp is the standalone transfer CLI of the Asupersync
              runtime, built on the same cancel-correct machinery documented across this site.
            </p>
          </div>

          <SyncContainer withPulse accentColor="#3B82F6" className="p-6 md:p-8 space-y-5">
            <CopyCommand command={INSTALL_LINUX} label="Linux / macOS" />
            <CopyCommand command={INSTALL_WINDOWS} label="Windows (PowerShell)" prompt=">" />
            <CopyCommand
              command="cargo install --git https://github.com/Dicklesworthstone/asupersync asupersync --bin atp --features atp-cli"
              label="From source"
            />
          </SyncContainer>

          <details className="group mt-6 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <summary className="flex items-center justify-between px-8 py-5 cursor-pointer text-white font-bold hover:text-blue-400 transition-colors">
              Still reach for rsync when&hellip;
              <ArrowRight className="h-4 w-4 text-slate-600 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="px-8 pb-6 text-slate-400 leading-relaxed text-sm space-y-3">
              <p>
                You&rsquo;re pushing huge single encrypted files over pristine fast links. Kernel TCP still
                beats userspace QUIC there by about 1.5&times;.
              </p>
              <p>
                You need <code className="text-blue-400 font-mono">--exclude</code>,{" "}
                <code className="text-blue-400 font-mono">--delete</code>, or mirror semantics. atp is a mover,
                not a mirror.
              </p>
              <p>You can&rsquo;t put a binary on both ends. atp has to run on each side.</p>
              <p className="text-slate-500">
                These losses are printed in the README&rsquo;s tables too, right next to the wins.
              </p>
            </div>
          </details>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={ATP_GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 hover:border-blue-500/30 hover:text-white transition-all"
            >
              Star it on GitHub
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/architecture"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 hover:border-blue-500/30 hover:text-white transition-all"
            >
              <BookOpen className="h-4 w-4" />
              See the runtime underneath
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
