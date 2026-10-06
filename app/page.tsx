"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import {
  Github,
  ArrowRight,
  ArrowUpRight,
  Rocket,
  Package,
  Activity,
  Sparkles,
  Key,
  Droplets,
  Layers,
  Blocks,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import SectionShell from "@/components/section-shell";
import StatsGrid from "@/components/stats-grid";
import GlowOrbits from "@/components/glow-orbits";
import FeatureCard from "@/components/feature-card";
import ComparisonTable from "@/components/comparison-table";
import RustCodeBlock from "@/components/rust-code-block";
import Timeline from "@/components/timeline";
import RobotMascot from "@/components/robot-mascot";
import GlitchText from "@/components/glitch-text";
import { SyncContainer } from "@/components/sync-elements";
import { Magnetic, BorderBeam } from "@/components/motion-wrapper";
import { Tooltip } from "@/components/tooltip";
import {
  siteConfig,
  heroStats,
  features,
  codeExample,
  codeExampleTokio,
  codeExampleAsupersync,
  tokioMappings,
  benchMicro,
  benchServer,
  changelog,
  type BenchRow,
} from "@/lib/content";

const AgentFlywheel = dynamic(() => import("@/components/agent-flywheel"), { ssr: false });
const RegionTreeViz = dynamic(() => import("@/components/viz/region-tree-viz"), { ssr: false });
const CancelProtocolViz = dynamic(() => import("@/components/viz/cancel-protocol-viz"), { ssr: false });
const LabRuntimeViz = dynamic(() => import("@/components/viz/lab-runtime-viz"), { ssr: false });
const ObligationFlowViz = dynamic(() => import("@/components/viz/obligation-flow-viz"), { ssr: false });
const CapabilitySecurityViz = dynamic(() => import("@/components/viz/capability-security-viz"), { ssr: false });
const TwoPhaseEffectsViz = dynamic(() => import("@/components/viz/two-phase-effects-viz"), { ssr: false });
const FountainCodeViz = dynamic(() => import("@/components/viz/fountain-code-viz"), { ssr: false });
const SporkOtpViz = dynamic(() => import("@/components/viz/spork-otp-viz"), { ssr: false });

interface ConceptProps {
  badge: string;
  badgeIcon: LucideIcon;
  /** Tailwind color family for the badge, e.g. "orange". */
  tone: string;
  accentColor: string;
  title: ReactNode;
  reverse?: boolean;
  viz: ComponentType;
  children: ReactNode;
}

const BADGE_TONES: Record<string, string> = {
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  green: "border-green-500/30 bg-green-500/10 text-green-400",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  teal: "border-teal-500/30 bg-teal-500/10 text-teal-400",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
};

function Concept({ badge, badgeIcon: BadgeIcon, tone, accentColor, title, reverse, viz: Viz, children }: ConceptProps) {
  return (
    <div className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-20`}>
      <div className="flex-1 space-y-6 text-left">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.3em] ${BADGE_TONES[tone]}`}>
          <BadgeIcon className="h-3 w-3" /> {badge}
        </div>
        <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">{title}</h3>
        <div className="space-y-6 text-lg text-slate-400 leading-relaxed">{children}</div>
      </div>
      <div className="flex-1 w-full max-w-2xl">
        <SyncContainer withPulse={true} accentColor={accentColor} className="p-4 md:p-8 bg-black/40 shadow-2xl">
          <Viz />
        </SyncContainer>
      </div>
    </div>
  );
}

const MORE_DEMOS = [
  { href: "/showcase#cancellation-injection", title: "Cancellation injection", line: "Re-run a test once per await point, cancelling at each one, with oracles checking every run." },
  { href: "/showcase#test-oracles", title: "Lab oracles and e-processes", line: "Leak, quiescence, and protocol checks, summarized across seeds with an anytime-valid test." },
  { href: "/showcase#foata-fingerprints", title: "Foata fingerprints", line: "Recognize two schedules as the same behavior up to reordering of independent events." },
  { href: "/showcase#dpor-pruning", title: "Race-guided exploration", line: "Derive new seeds from detected races and skip schedules the explorer has already seen." },
  { href: "/showcase#budget-algebra", title: "Budget algebra", line: "Nested deadlines and quotas combine with meet: the tighter limit always wins." },
  { href: "/showcase#macaroon-caveats", title: "Macaroon attenuation", line: "HMAC-chained tokens that anyone can restrict and nobody can widen." },
  { href: "/showcase#scheduler", title: "Three-lane scheduler", line: "Cancel, timed, and ready lanes, with cancel preemption bounded at 16 in a row." },
  { href: "/showcase#saga-compensation", title: "Sagas and CALM", line: "Compensate completed steps in reverse; batch monotone steps without coordination." },
  { href: "/showcase#spectral-deadlock", title: "Spectral wait-graph health", line: "An on-demand early-warning diagnostic built on the wait graph's Fiedler value." },
  { href: "/showcase#small-step-semantics", title: "Small-step semantics", line: "The formal rules behind the runtime, and what Lean has actually checked." },
  { href: "/showcase#trace-replay-stability", title: "Trace replay", line: "Simultaneous failures arrive in a fixed order, so a replay is a replay." },
  { href: "/showcase#adaptive-scheduler", title: "Adaptive cancel streaks", line: "The opt-in discounted-UCB1 selector, and why it's off by default." },
];

const SURPRISES = [
  {
    title: "Every async operation takes &Cx",
    body: "tokio reads runtime state from thread-locals. Asupersync passes a capability context, so cancellation and budgets flow through the call graph and a function's signature shows what it can do.",
  },
  {
    title: "No fire-and-forget",
    body: "tokio::spawn detaches. Here every task lives in a region, and leaving a scope waits for its children. A task that never reaches a cancellation point holds up that close, which is the point: you find out.",
  },
  {
    title: "Outcome has four variants",
    body: "Ok, Err, Cancelled(reason), and Panicked(payload), ordered by severity. Combinators aggregate with that order, so a cancellation or panic can't be masked by a sibling's success.",
  },
];

function BenchTable({ rows, ratioHeader, caption }: { rows: BenchRow[]; ratioHeader: string; caption: string }) {
  return (
    <SyncContainer className="overflow-hidden border-blue-500/10">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold uppercase tracking-widest text-slate-500">
              <th scope="col" className="px-4 py-4">Workload</th>
              <th scope="col" className="px-4 py-4 text-blue-400">Asupersync</th>
              <th scope="col" className="px-4 py-4">tokio</th>
              <th scope="col" className="px-4 py-4">{ratioHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.workload} className="hover:bg-white/[0.02] transition-colors">
                <th scope="row" className="px-4 py-3 font-medium text-slate-300 min-w-[16rem]">{row.workload}</th>
                <td className="px-4 py-3 font-mono text-slate-200 whitespace-nowrap">{row.asupersync}</td>
                <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{row.tokio}</td>
                <td className="px-4 py-3 font-mono font-bold text-orange-300 whitespace-nowrap">{row.ratio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SyncContainer>
  );
}

export default function HomePage() {
  return (
    <main id="main-content">
      {/* ================================================================
          1. HERO
          ================================================================ */}
      <section className="relative flex flex-col items-center pt-24 pb-32 overflow-hidden text-left">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]" />
          <GlowOrbits />
        </div>

        <div className="relative z-10 mx-auto max-w-screen-2xl px-6 lg:px-8 w-full mt-12 md:mt-0">
          <div className="flex flex-col items-start max-w-4xl">
            <motion.a
              href={siteConfig.cratesUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-8 hover:border-blue-500/60 transition-colors"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
              v{siteConfig.version} on crates.io · {siteConfig.mainVersion} on main
            </motion.a>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(3.5rem,10vw,7rem)] font-black tracking-tight leading-[0.85] text-white mb-10 text-left"
            >
              The <br />
              <span className="text-blue-500">
                Cancel-Correct
              </span> <br />
              Async Runtime.
            </motion.h1>

            <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mb-12">
              An async runtime for Rust. Every task belongs to a region, and a region doesn&apos;t
              close until everything in it has finished. Cancelling a task asks it to stop
              instead of dropping it mid-poll. Effects go through an explicit capability context,
              and a lab runtime replays any schedule from its seed.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Magnetic strength={0.1}>
                <Link
                  href="/getting-started"
                  data-magnetic="true"
                  className="relative px-10 py-5 rounded-2xl bg-blue-500 text-white font-black text-lg hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(59,130,246,0.3)] active:scale-95"
                >
                  <span className="absolute inset-0 rounded-2xl animate-pulse bg-blue-400/20" />
                  <Rocket className="relative h-5 w-5" />
                  <span className="relative">GET STARTED</span>
                </Link>
              </Magnetic>
              <Magnetic strength={0.1}>
                <a
                  href={siteConfig.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-magnetic="true"
                  className="px-10 py-5 rounded-2xl bg-white/5 border border-blue-500/20 text-white font-black text-lg hover:bg-blue-500/10 hover:border-blue-500/40 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <MonitorPlay className="h-5 w-5 text-blue-400" />
                  WASM DEMO
                </a>
              </Magnetic>
              <Magnetic strength={0.1}>
                <a
                  href={siteConfig.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-magnetic="true"
                  className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Github className="h-5 w-5" />
                  SOURCE
                </a>
              </Magnetic>
            </div>
          </div>

          {/* Hero Visual — Robot Mascot + Illustration */}
          <div className="relative mt-16 w-full max-w-[1200px] mx-auto group">
            <div className="absolute -top-8 right-4 md:top-[-60px] md:right-[8%] z-20 w-20 h-28 md:w-28 md:h-40 animate-float">
              <RobotMascot />
            </div>

            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-orange-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <SyncContainer withNodes={false} className="relative glass-modern p-0 overflow-hidden shadow-2xl w-full">
              <BorderBeam />

              <div className="relative bg-[#020a14] p-8 md:p-16 overflow-hidden min-h-[300px] md:min-h-[400px]">
                <svg viewBox="0 0 800 350" className="w-full h-auto" aria-label="Asupersync architecture overview">
                  <text x="400" y="30" textAnchor="middle" fill="#60A5FA" fontSize="14" fontWeight="bold" fontFamily="monospace">ASUPERSYNC RUNTIME</text>

                  <rect x="300" y="50" width="200" height="40" rx="8" fill="#0A1628" stroke="#3B82F6" strokeWidth="1.5" />
                  <text x="400" y="75" textAnchor="middle" fill="#93C5FD" fontSize="11" fontFamily="monospace">Root Region</text>

                  <line x1="350" y1="90" x2="200" y2="130" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                  <line x1="400" y1="90" x2="400" y2="130" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                  <line x1="450" y1="90" x2="600" y2="130" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />

                  <rect x="120" y="130" width="160" height="35" rx="6" fill="#0A1628" stroke="#60A5FA" strokeWidth="1" />
                  <text x="200" y="152" textAnchor="middle" fill="#93C5FD" fontSize="10" fontFamily="monospace">Server Region</text>

                  <rect x="320" y="130" width="160" height="35" rx="6" fill="#0A1628" stroke="#60A5FA" strokeWidth="1" />
                  <text x="400" y="152" textAnchor="middle" fill="#93C5FD" fontSize="10" fontFamily="monospace">Worker Region</text>

                  <rect x="520" y="130" width="160" height="35" rx="6" fill="#0A1628" stroke="#F97316" strokeWidth="1" />
                  <text x="600" y="152" textAnchor="middle" fill="#FB923C" fontSize="10" fontFamily="monospace">Closing Region</text>

                  <circle cx="160" cy="195" r="6" fill="#22c55e" opacity="0.8" />
                  <circle cx="185" cy="195" r="6" fill="#22c55e" opacity="0.8" />
                  <circle cx="210" cy="195" r="6" fill="#22c55e" opacity="0.6" />
                  <circle cx="235" cy="195" r="6" fill="#fbbf24" opacity="0.6" />
                  <text x="200" y="220" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">tasks (owned)</text>

                  <rect x="100" y="250" width="600" height="80" rx="10" fill="#0A1628" stroke="#3B82F6" strokeWidth="1" opacity="0.8" />
                  <text x="400" y="272" textAnchor="middle" fill="#60A5FA" fontSize="11" fontWeight="bold" fontFamily="monospace">THREE-LANE SCHEDULER</text>

                  <rect x="130" y="282" width="150" height="30" rx="4" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="0.5" />
                  <text x="205" y="301" textAnchor="middle" fill="#f87171" fontSize="9" fontFamily="monospace">Cancel Lane</text>

                  <rect x="310" y="282" width="150" height="30" rx="4" fill="#fbbf24" fillOpacity="0.15" stroke="#fbbf24" strokeWidth="0.5" />
                  <text x="385" y="301" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace">Timed Lane (EDF)</text>

                  <rect x="490" y="282" width="150" height="30" rx="4" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="0.5" />
                  <text x="565" y="301" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">Ready Lane</text>

                  <text x="600" y="188" textAnchor="middle" fill="#FB923C" fontSize="9" fontFamily="monospace">Request → Drain → Finalize</text>

                  <rect x="340" y="185" width="120" height="30" rx="6" fill="#F97316" fillOpacity="0.1" stroke="#F97316" strokeWidth="0.5" />
                  <text x="400" y="204" textAnchor="middle" fill="#FB923C" fontSize="9" fontFamily="monospace">Cx (capabilities)</text>
                </svg>

                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Runtime_Architecture</span>
                </div>
              </div>
            </SyncContainer>

            <div className="absolute -bottom-6 left-4 md:-bottom-10 md:left-6 z-30 glass-modern p-4 md:p-6 rounded-2xl border border-blue-500/20 shadow-2xl animate-float flex">
              <div className="flex flex-col text-left">
                <span className="text-2xl md:text-4xl font-black text-blue-400 tabular-nums tracking-tighter">0</span>
                <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Orphan tasks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 mb-32">
        <StatsGrid stats={heroStats} />
      </div>

      {/* ================================================================
          2. THE CORE IDEAS
          ================================================================ */}
      <section className="relative py-24 md:py-32 overflow-hidden border-y border-white/5 bg-white/[0.01]">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-950/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center mb-24">
            <GlitchText trigger="hover" intensity="medium">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">
                What the runtime <br className="hidden md:block" /> <span className="text-blue-500">keeps track of</span>
              </h2>
            </GlitchText>
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
              Most executors leave task ownership, cancellation, and cleanup to convention. Asupersync
              makes them part of the runtime: who owns each task, what it still has to finish, and
              what it&apos;s allowed to do. These guarantees cost time per task, and they&apos;re enforced by
              the runtime rather than proven by the type system.
            </p>
          </div>

          <div className="space-y-32">
            <Concept
              badge="Structured concurrency"
              badgeIcon={Blocks}
              tone="blue"
              accentColor="#3B82F6"
              title={<>No orphan tasks</>}
              viz={RegionTreeViz}
            >
              <p>
                Every task you spawn through a <Tooltip term="Cx">Cx</Tooltip> belongs to that context&apos;s{" "}
                <Tooltip term="Region">region</Tooltip>, and regions nest into a tree. Closing a region
                cancels whatever is still running in it, waits for those tasks, runs finalizers, and
                resolves outstanding obligations before it reports done.
              </p>
              <p>
                There&apos;s no detached spawn. Tasks started from a runtime handle belong to the root region
                and are drained at shutdown. Click a region in the demo to watch a close cascade down
                the tree.
              </p>
            </Concept>

            <Concept
              badge="Cancellation"
              badgeIcon={Activity}
              tone="orange"
              accentColor="#F97316"
              title={<>Cancellation is a request</>}
              viz={CancelProtocolViz}
              reverse
            >
              <p>
                Dropping a future stops it at its last await, whatever it was in the middle of. Here,
                cancelling a task asks it to stop. It keeps running until it reaches a{" "}
                <Tooltip term="Cancellation Point">cancellation point</Tooltip>, drains its own work
                (it can still await, and it can still return a value), and then its finalizers run.
                The outcome records <code className="text-orange-300 font-mono text-base">Cancelled(reason)</code> with the cause chain.
              </p>
              <p>
                The flip side: a task that never checks in is never forcibly stopped. It holds up its
                region&apos;s close. Cleanup <Tooltip term="Budget">budgets</Tooltip> are advisory on the
                production runtime, and <code className="text-orange-300 font-mono text-base">Runtime::shutdown_timeout</code> bounds how long you wait.
              </p>
            </Concept>

            <Concept
              badge="Two-phase effects"
              badgeIcon={Package}
              tone="yellow"
              accentColor="#EAB308"
              title={<>Reserve, then commit</>}
              viz={TwoPhaseEffectsViz}
            >
              <p>
                If a task is cancelled halfway through sending a message, the message shouldn&apos;t be
                lost or half-sent. Channel sends are split in two:{" "}
                <code className="text-yellow-300 font-mono text-base">tx.reserve(&amp;cx).await?</code> claims capacity
                and commits nothing, and <code className="text-yellow-300 font-mono text-base">permit.send(v)</code> publishes.
                Cancelled while reserving? Nothing happened. Dropped the permit? The slot is released.
              </p>
              <p>
                The demo uses a bank transfer as the analogy. In the library, the pattern covers
                channels, network sends, and obligation tokens. It isn&apos;t a transaction system:
                partial I/O like <code className="text-yellow-300 font-mono text-base">write_all</code> documents
                its own weaker contract.
              </p>
            </Concept>

            <Concept
              badge="Obligations"
              badgeIcon={Package}
              tone="green"
              accentColor="#22C55E"
              title={<>Permits the runtime can count</>}
              viz={ObligationFlowViz}
              reverse
            >
              <p>
                Reserving a channel slot, taking a semaphore permit, or holding a lease records an{" "}
                <Tooltip term="Obligation System">obligation</Tooltip>. Sending, releasing, or aborting
                resolves it. A region can&apos;t close cleanly while one is outstanding.
              </p>
              <p>
                Rust can&apos;t enforce &ldquo;use exactly once&rdquo; at compile time (its types are affine,
                not linear), so this is runtime bookkeeping: a permit that escapes through{" "}
                <code className="text-green-300 font-mono text-base">mem::forget</code> is reported by the lab&apos;s
                leak oracle, by kind and holder.
              </p>
            </Concept>

            <Concept
              badge="Capabilities"
              badgeIcon={Key}
              tone="teal"
              accentColor="#14B8A6"
              title={<>Effects go through Cx</>}
              viz={CapabilitySecurityViz}
            >
              <p>
                Async functions take <code className="text-teal-300 font-mono text-base">&amp;Cx</code>. Spawning, reading
                time, randomness, tracing, and runtime-managed I/O go through it, so a function&apos;s
                signature says what it can do, and handing it a lab <code className="text-teal-300 font-mono text-base">Cx</code> runs
                the same code on virtual time.
              </p>
              <p>
                A context can be narrowed (<code className="text-teal-300 font-mono text-base">Cx::restrict</code>) but not widened
                again, and plain I/O entry points refuse when the calling task lacks the IO capability.
                Some host-boundary code, like OS entropy for temp-file names, is documented as outside
                the boundary.
              </p>
            </Concept>

            <Concept
              badge="Deterministic testing"
              badgeIcon={Sparkles}
              tone="purple"
              accentColor="#A855F7"
              title={<>The <Tooltip term="Lab Runtime">lab runtime</Tooltip></>}
              viz={LabRuntimeViz}
              reverse
            >
              <p>
                Run your async code on virtual time with a seeded scheduler and the same{" "}
                <Tooltip term="Seed">seed</Tooltip> reproduces the same interleaving. Sleeps complete
                instantly, traces are captured, and oracles check every run for leaked tasks, leaked
                obligations, undrained race losers, and protocol violations.
              </p>
              <p>
                A schedule explorer derives new seeds from the races it detects and skips schedules
                equivalent to ones it has seen. It&apos;s a bug finder, not a proof of exhaustive coverage,
                but a failing seed is a reproducible test instead of a flake.
              </p>
            </Concept>

            <Concept
              badge="Spork"
              badgeIcon={Layers}
              tone="indigo"
              accentColor="#6366F1"
              title={<>OTP-style actors that can&apos;t be orphaned</>}
              viz={SporkOtpViz}
            >
              <p>
                <Tooltip term="Spork">Spork</Tooltip> brings Erlang&apos;s vocabulary to regions:{" "}
                <Tooltip term="GenServer">GenServers</Tooltip>, actors with bounded mailboxes, monitors,
                links, and <Tooltip term="Supervisor">supervisors</Tooltip> that restart children
                one-for-one, one-for-all, or rest-for-one. Every process belongs to a region.
              </p>
              <p>
                Each call hands the server a reply obligation. Dropping it unanswered fails loudly
                instead of leaving the caller waiting, and under the lab runtime restarts and DOWN
                messages arrive in a fixed order.
              </p>
            </Concept>

            <Concept
              badge="RaptorQ"
              badgeIcon={Droplets}
              tone="sky"
              accentColor="#0EA5E9"
              title={<>Fountain codes, and a transfer protocol on top</>}
              viz={FountainCodeViz}
              reverse
            >
              <p>
                The runtime includes an RFC 6330 <Tooltip term="RaptorQ">RaptorQ</Tooltip> codec: the
                sender produces as many encoded symbols as it likes, and any sufficient set rebuilds
                the data, so packet loss costs bandwidth instead of round trips.
              </p>
              <p>
                Its main user is ATP, a file-transfer protocol with Merkle-verified commits, resumable
                journals, and multi-donor pulls.{" "}
                <Link href="/atp" className="text-sky-400 hover:text-sky-300 underline underline-offset-4">
                  See the ATP page
                </Link>{" "}
                for measurements, including where it loses to rsync.
              </p>
            </Concept>
          </div>

          {/* More demos */}
          <div className="mt-32">
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">More in the demos</h3>
            <p className="text-slate-400 mb-10 max-w-2xl">
              The testing machinery, the scheduler internals, and the math, each with an interactive
              visualization and a plain account of what&apos;s on by default.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MORE_DEMOS.map((demo) => (
                <Link
                  key={demo.href}
                  href={demo.href}
                  className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{demo.title}</span>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{demo.line}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          3. COMING FROM TOKIO
          ================================================================ */}
      <SectionShell
        id="from-tokio"
        icon="gitCompare"
        eyebrow="Coming from tokio"
        title="What maps to what"
        kicker="The APIs are deliberately different: Asupersync trades implicit convenience for explicit cancellation. The concepts still line up."
      >
        <div className="space-y-12">
          <SyncContainer className="overflow-hidden border-blue-500/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">tokio primitives and their Asupersync equivalents</caption>
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold uppercase tracking-widest text-slate-500">
                    <th scope="col" className="px-4 py-4">tokio</th>
                    <th scope="col" className="px-4 py-4 text-blue-400">Asupersync</th>
                    <th scope="col" className="px-4 py-4">What changes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tokioMappings.map((m) => (
                    <tr key={m.tokio} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{m.tokio}</td>
                      <td className="px-4 py-3 font-mono text-blue-300 whitespace-nowrap">{m.asupersync}</td>
                      <td className="px-4 py-3 text-slate-400 min-w-[18rem]">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SyncContainer>

          <div className="grid gap-6 md:grid-cols-3">
            {SURPRISES.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/70 mb-3">
                  Surprise {i + 1}
                </div>
                <h3 className="text-xl font-black text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SyncContainer className="p-1 md:p-2 bg-black/40">
              <RustCodeBlock code={codeExampleTokio} title="tokio" />
            </SyncContainer>
            <SyncContainer withPulse={true} accentColor="#3B82F6" className="p-1 md:p-2 bg-black/40">
              <RustCodeBlock code={codeExampleAsupersync} title="asupersync" />
            </SyncContainer>
          </div>
          <p className="text-slate-400 leading-relaxed max-w-3xl">
            The same producer and consumer. The Asupersync version is longer for three reasons:
            the send reserves capacity first so a cancelled producer never loses a message,{" "}
            <code className="text-blue-300 font-mono">&amp;cx</code> is threaded through every wait, and the producer
            is owned by the caller&apos;s region and joined instead of detached.
          </p>
        </div>
      </SectionShell>

      {/* ================================================================
          4. WHAT IT COSTS
          ================================================================ */}
      <SectionShell
        id="performance"
        icon="activity"
        eyebrow="Measured against tokio"
        title="What it costs"
        kicker="Every task carries a region membership, a cancellation state machine, and a terminal-result channel, and permits are tracked as obligations. That bookkeeping isn't free."
      >
        <div className="space-y-10">
          <BenchTable rows={benchMicro} ratioHeader="Ratio" caption="Per-operation cost, Asupersync vs tokio" />
          <BenchTable rows={benchServer} ratioHeader="tokio faster by" caption="Server-shaped throughput, Asupersync vs tokio" />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 text-slate-400 leading-relaxed">
              <p>
                Spawning a task, a current-thread yield, and a channel round trip are still several
                times slower than tokio. A yield on four workers is within 2×. Loopback TCP is 1.1–1.7×
                slower, and the HTTP/1.1 server handles about half of hyper&apos;s requests per second.
              </p>
              <p>
                For most servers, a few microseconds per task disappear next to network and disk
                latency. If you spawn millions of tiny tasks per second or exchange messages in a tight
                loop, the difference matters. For fan-out inside one task,{" "}
                <code className="text-blue-300 font-mono">fiber::scope</code> costs about what a tokio task does.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-slate-500 leading-relaxed">
              <p className="mb-3">
                <strong className="text-slate-300">How these were measured:</strong> both runtimes in one process,
                release build with default features, p50 per operation at n = 1,000, on 2026-10-05.
                Ranges span three hosts (16, 10, and 64 CPUs), two of them shared with other builds,
                so host noise is part of the range. The HTTP rows come from one 64-CPU host and
                compare against hyper 1.x.
              </p>
              <p>
                Reproduce with <code className="text-slate-300 font-mono">benches/runtime_vs_tokio.rs</code>.
                The numbers already include this month&apos;s cuts: an O(1) region task set, an
                obligation-free one-call <code className="font-mono">mpsc::send</code>, a LIFO wake slot, and no global
                lock per dispatch.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ================================================================
          5. WHAT SHIPS
          ================================================================ */}
      <SectionShell
        id="features"
        icon="sparkles"
        eyebrow="In the box"
        title="What ships today"
        kicker="Asupersync brings its own stack instead of wrapping tokio's. Each card says where that piece stands, because support varies by surface."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </SectionShell>

      {/* ================================================================
          6. HOW IT COMPARES
          ================================================================ */}
      <SectionShell
        id="comparison"
        icon="gitCompare"
        eyebrow="How it compares"
        title="Runtime comparison"
        kicker="Where Asupersync is stronger, where it's weaker, and where the honest answer is a caveat."
      >
        <ComparisonTable />
      </SectionShell>

      {/* ================================================================
          7. THE CODE
          ================================================================ */}
      <SectionShell
        id="code"
        icon="terminal"
        eyebrow="The code"
        title="A scope that cleans up after itself"
        kicker="A budgeted scope, a JoinSet that owns its fan-out, and a join that can't return while any child is still running."
      >
        <SyncContainer withPulse={true} accentColor="#3B82F6" className="p-1 md:p-2 bg-black/40">
          <RustCodeBlock code={codeExample} title="src/main.rs" />
        </SyncContainer>
      </SectionShell>

      {/* ================================================================
          8. ROADMAP
          ================================================================ */}
      <SectionShell
        id="roadmap"
        icon="clock"
        eyebrow="Roadmap"
        title="Where things stand"
        kicker="Seven phases, from a single-thread deterministic kernel to ongoing hardening. Partial means partial."
      >
        <Timeline items={changelog} />

        <div className="mt-10 flex justify-center">
          <Link
            href="/architecture"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white"
          >
            Read the architecture guide
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </SectionShell>

      {/* ================================================================
          9. GET STARTED CTA
          ================================================================ */}
      <section className="relative overflow-hidden py-28 md:py-36 lg:py-44">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-900/60 bg-gradient-to-br from-blue-950/80 to-blue-900/50 text-blue-400 shadow-lg shadow-blue-900/10">
              <Rocket className="h-6 w-6" />
            </div>
          </div>

          <GlitchText trigger="hover" intensity="medium">
            <h2 className="font-bold tracking-tighter text-white text-4xl md:text-6xl">
              Try it
            </h2>
          </GlitchText>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400 md:text-xl font-medium">
            The first program needs one import and an attribute. Default features build on stable
            Rust 1.95 or newer.
          </p>

          <div className="mx-auto mt-10 max-w-md">
            <div className="glow-blue overflow-hidden rounded-2xl border border-blue-500/20 bg-black/60 shadow-xl shadow-blue-950/30">
              <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-blue-500/60" />
                </div>
                <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">terminal</span>
              </div>

              <div className="px-6 py-5">
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="select-none text-blue-500 font-bold">$</span>
                  <code className="text-slate-200 font-bold tracking-tight">cargo add asupersync</code>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Package className="h-3 w-3 text-blue-400" />
              MIT license (with an OpenAI/Anthropic rider) &middot; pre-1.0
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/getting-started"
                data-magnetic="true"
                className="glow-blue group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020a14]"
              >
                <Rocket className="h-5 w-5" />
                Walk through the on-ramp
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href={siteConfig.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-slate-300 hover:border-blue-500/30 hover:text-white transition-all"
              >
                Open the WASM demo
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          10. AGENT FLYWHEEL + AUTHOR CREDIT
          ================================================================ */}
      <section id="flywheel" className="relative border-t border-white/5">
        <AgentFlywheel />
      </section>
    </main>
  );
}
