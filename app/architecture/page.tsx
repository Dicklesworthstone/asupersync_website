"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import SectionShell from "@/components/section-shell";
import GlitchText from "@/components/glitch-text";
import { SyncContainer } from "@/components/sync-elements";
import RustCodeBlock from "@/components/rust-code-block";
import Timeline from "@/components/timeline";
import { Tooltip } from "@/components/tooltip";
import { changelog, codeExample, labOracles } from "@/lib/content";
import { specDocHref } from "@/lib/spec-docs";

const OracleDashboardViz = dynamic(() => import("@/components/viz/oracle-dashboard-viz"), { ssr: false });
const CancelStateMachineViz = dynamic(() => import("@/components/viz/cancel-state-machine-viz"), { ssr: false });
const EProcessMonitorViz = dynamic(() => import("@/components/viz/eprocess-monitor-viz"), { ssr: false });
const MacaroonCapabilityViz = dynamic(() => import("@/components/viz/macaroon-capability-viz"), { ssr: false });
const SagaCompensationViz = dynamic(() => import("@/components/viz/saga-compensation-viz"), { ssr: false });

const CORE_TYPES = `// src/types/outcome.rs (shape, not a program)
pub enum Outcome<T, E> {
    Ok(T),                    // success
    Err(E),                   // application error
    Cancelled(CancelReason),  // cancelled, with kind, origin, and cause chain
    Panicked(PanicPayload),   // the task panicked
}
// Severity: Ok < Err < Cancelled < Panicked

// src/types/budget.rs
pub struct Budget {
    pub deadline: Option<Time>,   // absolute deadline
    pub poll_quota: u32,          // max polls
    pub cost_quota: Option<u64>,  // abstract cost units
    pub priority: u8,             // 0-255
}
// outer.meet(inner): earlier deadline, smaller quotas, higher priority

// src/cx/cx.rs (signature sketch)
impl Cx {
    pub fn spawn<F, Fut>(&self, f: F) -> Result<TaskHandle<Fut::Output>, SpawnError>;
    pub fn checkpoint(&self) -> Result<(), Error>; // Err once cancel is requested
    pub fn masked<F, R>(&self, f: F) -> R;         // defer cancellation for a closure
    pub fn budget(&self) -> Budget;
    pub fn is_cancel_requested(&self) -> bool;
}`;

const CAPABILITIES = [
  { name: "SPAWN", what: "Start tasks in this context's region", color: "#22C55E" },
  { name: "TIME", what: "Read the clock and set timers", color: "#EAB308" },
  { name: "RANDOM", what: "Draw deterministic entropy", color: "#A855F7" },
  { name: "IO", what: "Sockets, files, and the reactor", color: "#3B82F6" },
  { name: "REMOTE", what: "Spawn on and talk to other nodes", color: "#F97316" },
];

const CANCEL_KINDS = [
  "User",
  "Timeout",
  "Deadline",
  "PollQuota",
  "CostBudget",
  "FailFast",
  "RaceLost",
  "LinkedExit",
  "ParentCancelled",
  "ResourceUnavailable",
  "Shutdown",
];

const SCHEDULER_FACTS = [
  "Cancel preemption is bounded. With the default cancel_streak_limit of 16, ready or timed work gets a dispatch slot within 17 steps per worker. While draining obligations or regions the bound widens to 32.",
  "Owners pop their local queue LIFO for cache locality; thieves steal FIFO, so stolen work is older work.",
  "!Send tasks are pinned to their owner worker on non-stealable queues.",
  "I/O polling is a leader/follower turn: whichever worker holds the driver lock runs the reactor while the others keep scheduling.",
  "Idle workers park on a permit-style Parker and recheck the queues after waking, which closes the lost-wakeup race.",
  "Workers count fairness_yields and max_cancel_streak, so starvation claims can be checked against counters.",
  "Two controls are opt-in and off by default: a Lyapunov governor that steers lane order from runtime snapshots, and an adaptive discounted-UCB1 cancel-streak selector. Measured against the fixed limit, the selector didn't win.",
];

const TRANSITION_RULES = [
  {
    name: "SPAWN",
    rule: "R[r].state = Open  ⟹  Σ —spawn(r,t)→ Σ′,  T′[t] = Created,  R′[r].children ∪= {t}",
    explanation: "A task can only be created in an open region, and it becomes one of that region's children.",
  },
  {
    name: "CANCEL-REQUEST",
    rule: "Σ —cancel(r, reason)→ Σ′,  R′[r].cancel = strengthen(R[r].cancel, reason),  ∀r′ ∈ desc(r): ParentCancelled,  ∀t ∈ children(r): CancelRequested(reason, budget)",
    explanation: "Cancelling a region keeps the more severe reason, propagates ParentCancelled to every descendant, and marks its live tasks with a cleanup budget.",
  },
  {
    name: "CANCEL-ACKNOWLEDGE",
    rule: "T[t] = CancelRequested ∧ mask = 0 ∧ await(checkpoint)  ⟹  T′[t] = Cancelling,  resume(Cancelled(reason))",
    explanation: "An unmasked task sees the cancellation at a checkpoint and starts draining.",
  },
  {
    name: "CHECKPOINT-MASKED",
    rule: "T[t] = CancelRequested ∧ mask > 0 ∧ await(checkpoint)  ⟹  mask′ = mask − 1,  resume(Ok(()))",
    explanation: "Masking defers cancellation, but each deferral spends one unit of a finite mask budget (capped at 64).",
  },
  {
    name: "CLOSE-CANCEL-CHILDREN",
    rule: "R[r].state = Closing ∧ ∃t ∈ children(r) incomplete  ⟹  Σ —cancel(r, implicit_close)→ Σ′,  R′[r].state = Draining",
    explanation: "A closing region cancels whatever is still running in it before it can finish.",
  },
  {
    name: "RESERVE / COMMIT / ABORT",
    rule: "reserve(o): O′[o] = Reserved  ·  commit(o): Reserved → Committed  ·  abort(o): Reserved → Aborted",
    explanation: "Two-phase effects: reserving commits nothing, the commit performs the effect, and an abort (explicit or by drop) releases capacity with no effect.",
  },
];

const LEAN_FACTS = [
  { value: "23 + 10", label: "Spec rules", helper: "Core lifecycle, cancel, close, obligations, join, and time, plus distributed dedup and saga rules" },
  { value: "22", label: "Lean Step constructors", helper: "All 22 covered; JOIN and the distributed rules aren't in Lean's Step" },
  { value: "189", label: "Lean theorems", helper: "No sorry, on Lean 4.27" },
  { value: "6 / 6", label: "Core invariants proven", helper: "In the model. No proof that the Rust code refines it" },
];

const LEAN_INVARIANTS = [
  "Structured concurrency: every task has exactly one owning region",
  "Region close implies quiescence",
  "The cancellation protocol's transitions",
  "Race losers are drained",
  "No obligation leaks",
  "No ambient authority",
];

export default function ArchitecturePage() {
  return (
    <main id="main-content">
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <GlitchText trigger="hover" intensity="medium">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
              Architecture
            </h1>
          </GlitchText>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
            Regions, the cancellation protocol, obligations, capabilities, the scheduler, and the lab
            runtime: how each works, and where each one&apos;s guarantee stops.
          </p>
        </div>
      </section>

      {/* Overview */}
      <SectionShell
        id="overview"
        icon="cpu"
        eyebrow="Overview"
        title="The layers"
        kicker="Tasks, actors, fibers, and remote work all hang off one region tree. Obligations are tracked per region, and the scheduler gives cancelling tasks their own lane."
      >
        <SyncContainer withPulse={true} className="p-8 md:p-12">
          <svg viewBox="0 0 700 360" className="w-full h-auto" aria-label="Runtime architecture diagram">
            <text x="350" y="22" textAnchor="middle" fill="#60A5FA" fontSize="13" fontWeight="bold" fontFamily="monospace">EXECUTION TIERS</text>
            {["Fibers", "Tasks", "Actors", "Remote"].map((label, i) => (
              <g key={label}>
                <rect x={50 + i * 152} y={34} width={140} height={40} rx={8} fill="#0A1628" stroke="#3B82F6" strokeWidth={1} />
                <text x={120 + i * 152} y={59} textAnchor="middle" fill="#93C5FD" fontSize={11} fontFamily="monospace">{label}</text>
              </g>
            ))}
            <line x1="350" y1="74" x2="350" y2="96" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />

            <text x="350" y="112" textAnchor="middle" fill="#60A5FA" fontSize="13" fontWeight="bold" fontFamily="monospace">REGION TREE</text>
            <rect x="50" y="122" width="600" height="40" rx="8" fill="#0A1628" stroke="#3B82F6" strokeWidth="1" />
            <text x="350" y="147" textAnchor="middle" fill="#93C5FD" fontSize="11" fontFamily="monospace">close(region) ⟹ quiescence of every descendant</text>
            <line x1="350" y1="162" x2="350" y2="184" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />

            <text x="350" y="200" textAnchor="middle" fill="#22C55E" fontSize="13" fontWeight="bold" fontFamily="monospace">OBLIGATION REGISTRY</text>
            <rect x="50" y="210" width="600" height="40" rx="8" fill="#0A1628" stroke="#22C55E" strokeWidth="1" strokeOpacity="0.6" />
            <text x="350" y="235" textAnchor="middle" fill="#86EFAC" fontSize="11" fontFamily="monospace">SendPermit → send | abort · Ack → commit | nack · Lease → renew | expire</text>
            <line x1="350" y1="250" x2="350" y2="272" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />

            <text x="350" y="288" textAnchor="middle" fill="#60A5FA" fontSize="13" fontWeight="bold" fontFamily="monospace">SCHEDULER</text>
            <rect x="50" y="298" width="600" height="48" rx="8" fill="#0A1628" stroke="#3B82F6" strokeWidth="1" />
            <text x="175" y="327" textAnchor="middle" fill="#f87171" fontSize="10" fontFamily="monospace">Cancel lane</text>
            <text x="350" y="327" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace">Timed lane (EDF)</text>
            <text x="525" y="327" textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="monospace">Ready lane</text>
          </svg>
        </SyncContainer>
      </SectionShell>

      {/* Regions */}
      <SectionShell
        id="regions"
        icon="blocks"
        eyebrow="Core model"
        title="Regions and scopes"
        kicker="Every task belongs to a region. A region doesn't finish closing until its children have finished, its finalizers have run, and its registered obligations are resolved."
      >
        <div className="space-y-6">
          <SyncContainer className="p-1 md:p-2 bg-black/40">
            <RustCodeBlock code={codeExample} title="src/main.rs" />
          </SyncContainer>
          <div className="grid gap-4 md:grid-cols-2 text-slate-400 leading-relaxed">
            <p>
              <code className="text-blue-400 font-mono">cx.spawn</code> puts the task in the calling context&apos;s{" "}
              <Tooltip term="Region">region</Tooltip>. <code className="text-blue-400 font-mono">cx.scope()</code> gives you a{" "}
              <Tooltip term="Scope">Scope</Tooltip> for that region, and{" "}
              <code className="text-blue-400 font-mono">scope.region(…)</code> opens a child region that must reach
              quiescence before it returns. <code className="text-blue-400 font-mono">JoinSet</code> owns dynamic fan-out.
              Tasks spawned through a <code className="text-blue-400 font-mono">RuntimeHandle</code> belong to the root
              region and are drained at shutdown.
            </p>
            <p>
              The &ldquo;no orphans&rdquo; property comes from the shape of the API, region accounting, and runtime
              and oracle checks, not from discipline. It also isn&apos;t a claim that Rust&apos;s type system proves
              every adapter path. Region memory uses generation-checked handles, reclaimed when the region
              closes; there&apos;s no public allocation API for it yet.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* Core types */}
      <SectionShell
        id="core-types"
        icon="braces"
        eyebrow="Core types"
        title="Outcome, Budget, Cx"
        kicker="Three types carry most of the model: a four-valued result, a budget that composes, and the context every async function receives."
      >
        <SyncContainer className="p-1 md:p-2 bg-black/40">
          <RustCodeBlock code={CORE_TYPES} title="core types" />
        </SyncContainer>
      </SectionShell>

      {/* Cancel protocol */}
      <SectionShell
        id="cancel"
        icon="shield"
        eyebrow="Cancellation"
        title="The cancellation protocol"
        kicker="Request, drain, finalize, complete. Cooperative all the way down: the runtime never stops a task that won't check in."
      >
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { phase: "1. Request", color: "#ef4444", desc: "The request propagates down the region tree. Each task is marked CancelRequested with a reason and a cleanup budget." },
              { phase: "2. Drain", color: "#fbbf24", desc: "At its next checkpoint the task sees Cancelled and runs its own cleanup. It can still await, and it can still return a value." },
              { phase: "3. Finalize", color: "#22c55e", desc: "Registered finalizers run with cancellation masked. Region finalizers run LIFO." },
              { phase: "4. Complete", color: "#3b82f6", desc: "The runtime publishes the outcome: Cancelled(reason) when cancellation won, or the task's own value if it finished." },
            ].map((p) => (
              <div key={p.phase} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <div className="text-sm font-black mb-3" style={{ color: p.color }}>{p.phase}</div>
                <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <SyncContainer withPulse={true} accentColor="#F97316" className="p-1 md:p-2 bg-black/40 shadow-2xl shadow-orange-900/20">
            <CancelStateMachineViz />
          </SyncContainer>

          <div className="grid gap-6 md:grid-cols-2 text-slate-400 leading-relaxed">
            <div className="space-y-4">
              <p>
                <strong className="text-white">Reasons are ordered.</strong> A{" "}
                <Tooltip term="CancelReason">CancelReason</Tooltip> carries one of eleven kinds, from least to most
                severe, and when two requests meet, the more severe kind wins. Cleanup budgets shrink as severity
                rises, and the error from <code className="text-orange-300 font-mono">cx.checkpoint()</code> carries the
                reason, so a joiner can tell why a task stopped.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CANCEL_KINDS.map((kind) => (
                  <span key={kind} className="rounded-md border border-orange-500/20 bg-orange-500/5 px-2 py-1 text-[11px] font-mono text-orange-300">
                    {kind}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <p>
                <strong className="text-white">Bounds are conditional.</strong> Stock operations publish what they
                can promise through a responsiveness registry: a finite number of polls or checkpoints under stated
                assumptions, or a typed refusal for masked, blocking, external, or unknown work. Budgets are
                sufficient conditions only where a concrete bound exists.
              </p>
              <p>
                In the Lean model, a cancelled task completes in exactly mask + 3 protocol steps (the{" "}
                <Tooltip term="Cancel Potential">cancel potential</Tooltip>). On the production runtime, budgets are
                advisory and <code className="text-orange-300 font-mono">Runtime::shutdown_timeout</code> bounds how long you wait.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Obligations */}
      <SectionShell
        id="obligations"
        icon="package"
        eyebrow="Obligations"
        title="What the runtime counts"
        kicker="Permits, acks, and leases taken through a runtime-built Cx are recorded in an obligation table and must be resolved before their region can close."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-6">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-green-400 mb-3">Tracked (ObligationKind)</div>
            <ul className="space-y-2 text-sm text-slate-400 leading-relaxed">
              <li><span className="font-mono text-green-300">SendPermit</span>: mpsc, oneshot, and broadcast reservations</li>
              <li><span className="font-mono text-green-300">SemaphorePermit</span>: released when capacity returns</li>
              <li><span className="font-mono text-green-300">Ack</span>: acknowledgement for a received message</li>
              <li><span className="font-mono text-green-300">Lease</span>: remote leases, renewed or expired</li>
              <li><span className="font-mono text-green-300">IoOp</span>: a pending I/O operation</li>
              <li><span className="font-mono text-green-300">Transaction</span>: an open database transaction, rolled back on drain if never committed</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Not obligations</div>
            <ul className="space-y-2 text-sm text-slate-400 leading-relaxed">
              <li>Mutex and RwLock guards, which release on drop and have their own queue-cleanup tests</li>
              <li>Session-channel permits, which are standalone typestate tokens the oracles don&apos;t see</li>
              <li>Spork name leases, which panic if dropped unresolved but aren&apos;t checked at region close yet</li>
              <li>Anything taken through a Cx built without a runtime</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">How leaks surface</div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A permit that escapes its task through <code className="font-mono text-green-300">mem::forget</code> is reported
              by the obligation_leak oracle by kind and holder. A task parked while holding one is flagged as a{" "}
              <Tooltip term="Futurelock">futurelock</Tooltip>. An opt-in Shiryaev–Roberts monitor can watch
              obligation ages on the production runtime.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* Capabilities */}
      <SectionShell
        id="capabilities"
        icon="lock"
        eyebrow="Capabilities"
        title="The capability row"
        kicker="A Cx carries a type-level record of five effects. You can narrow it; you can't widen it back."
      >
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-5">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.name}
                className="rounded-2xl border p-5 text-center"
                style={{ borderColor: `${cap.color}40`, backgroundColor: `${cap.color}0d` }}
              >
                <div className="font-mono font-black text-sm mb-2" style={{ color: cap.color }}>{cap.name}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{cap.what}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 text-slate-400 leading-relaxed">
            <p>
              <code className="text-blue-400 font-mono">CapSet&lt;SPAWN, TIME, RANDOM, IO, REMOTE&gt;</code> is a set of
              const-generic flags. <code className="text-blue-400 font-mono">Cx::restrict</code> narrows a context to a
              subset, and sealed traits such as <code className="text-blue-400 font-mono">HasSpawn</code> and{" "}
              <code className="text-blue-400 font-mono">HasIo</code> let a function demand an effect in its signature.
              Reinstalling a narrowed context with <code className="text-blue-400 font-mono">Cx::set_current</code> keeps
              its restrictions.
            </p>
            <p>
              The boundary has documented gaps. Plain I/O entry points like{" "}
              <code className="text-blue-400 font-mono">TcpStream::connect</code> check the calling task&apos;s context and
              refuse with ASUP-E009 without the IO capability, but threads outside the runtime aren&apos;t affected,
              and host-boundary helpers such as OS entropy for temp-file names stay outside the deterministic
              guarantee.
            </p>
          </div>

          <SyncContainer withPulse={true} accentColor="#14B8A6" className="p-1 md:p-2 bg-black/40 shadow-2xl shadow-teal-900/20">
            <MacaroonCapabilityViz />
          </SyncContainer>
          <p className="text-slate-400 leading-relaxed">
            On top of the static row, a context can carry a <Tooltip term="Macaroon">macaroon</Tooltip>: an
            HMAC-SHA256 chained bearer token with eight caveat types (<code className="text-teal-400 font-mono">TimeBefore</code>,{" "}
            <code className="text-teal-400 font-mono">TimeAfter</code>, <code className="text-teal-400 font-mono">RegionScope</code>,{" "}
            <code className="text-teal-400 font-mono">TaskScope</code>, <code className="text-teal-400 font-mono">MaxUses</code>,{" "}
            <code className="text-teal-400 font-mono">ResourceScope</code>, <code className="text-teal-400 font-mono">RateLimit</code>,{" "}
            <code className="text-teal-400 font-mono">Custom</code>), plus third-party caveats with discharges.{" "}
            <code className="text-teal-400 font-mono">Cx::attenuate</code> adds a caveat. Having the runtime check spawns
            against a token is opt-in through <code className="text-teal-400 font-mono">with_spawn_authorization_key</code>.
          </p>
        </div>
      </SectionShell>

      {/* Scheduler */}
      <SectionShell
        id="scheduler"
        icon="activity"
        eyebrow="Scheduler"
        title="Three lanes, work stealing"
        kicker="Cancelling tasks run first so cleanup isn't starved, deadline work runs earliest-deadline-first, and everything else waits its turn, within explicit bounds."
      >
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-3">
            {[
              { lane: "Cancel lane", color: "#ef4444", desc: "Tasks in cancellation states. Priority 200–255." },
              { lane: "Timed lane", color: "#fbbf24", desc: "Deadline-driven tasks, earliest deadline first." },
              { lane: "Ready lane", color: "#22c55e", desc: "Everything else runnable, at default priority." },
            ].map((l) => (
              <div key={l.lane} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="text-sm font-black mb-1" style={{ color: l.color }}>{l.lane}</div>
                <p className="text-sm text-slate-400">{l.desc}</p>
              </div>
            ))}
          </div>
          <ul className="lg:col-span-8 space-y-3">
            {SCHEDULER_FACTS.map((fact) => (
              <li key={fact} className="flex gap-3 text-slate-400 leading-relaxed">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span>{fact}</span>
              </li>
            ))}
            <li className="flex gap-3 text-slate-400 leading-relaxed">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span>
                Runtime state can be split into independently locked shards (tasks, regions, obligations,
                instrumentation, config) with <code className="text-blue-300 font-mono">with_sharded_state(true)</code>.
                The default keeps it behind one lock.
              </span>
            </li>
          </ul>
        </div>
      </SectionShell>

      {/* Formal semantics */}
      <SectionShell
        id="formal-semantics"
        icon="fileText"
        eyebrow="Formal foundations"
        title="What's actually been proved"
        kicker="A small-step operational semantics, a Lean project that checks six invariants of it, and TLA+ export for recorded traces. Precisely scoped, because the gap between model and code matters."
      >
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEAN_FACTS.map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <div className="text-3xl font-black text-blue-400 tabular-nums mb-1">{f.value}</div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{f.label}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{f.helper}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-black text-white mb-3">The six invariants Lean checks</h3>
              <ul className="space-y-2">
                {LEAN_INVARIANTS.map((inv) => (
                  <li key={inv} className="flex gap-3 text-slate-400">
                    <span className="text-blue-400">✓</span>
                    <span>{inv}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 text-slate-400 leading-relaxed">
              <p>
                These are theorems about the abstract model, linked to executable tests. The production Rust
                runtime hasn&apos;t been proved to refine that model, so this isn&apos;t a mechanized proof of the
                executor, the adapters, the protocol implementations, or the network transports.
              </p>
              <p>
                Lab traces can be exported as TLA+ behaviors, and a test runs TLC on a real trace (and on a planted
                violation it must reject). TLC checks the recorded behavior, not a parametric model of the runtime.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-white mb-4">A few of the <Tooltip term="Transition Rule">rules</Tooltip></h3>
            <div className="space-y-3">
              {TRANSITION_RULES.map((rule) => (
                <div key={rule.name} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-2">{rule.name}</div>
                  <code className="block text-sm font-mono text-slate-300 mb-2 overflow-x-auto whitespace-pre-wrap">{rule.rule}</code>
                  <p className="text-xs text-slate-500 leading-relaxed">{rule.explanation}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              The full rule set, with proof sketches and the mapping to runtime state, is in the{" "}
              <Link href={specDocHref("formal-semantics")} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                formal semantics
              </Link>{" "}
              document.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* Oracles */}
      <SectionShell
        id="oracles"
        icon="sparkles"
        eyebrow="Lab runtime"
        title="24 oracles, 9 of them fed"
        kicker="Every LabRuntime report runs the oracle registry. Nine oracles are fed from runtime state today; the rest are registered but nothing feeds them yet."
      >
        <div className="space-y-6">
          <SyncContainer withPulse={true} accentColor="#8B5CF6" className="p-1 md:p-2 bg-black/40 shadow-2xl shadow-purple-900/20">
            <OracleDashboardViz />
          </SyncContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {labOracles.map((oracle) => (
              <div
                key={oracle.name}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${oracle.fed ? "bg-purple-500" : "bg-slate-700"}`} />
                <div>
                  <span className={`text-xs font-bold font-mono ${oracle.fed ? "text-purple-300" : "text-slate-500"}`}>
                    {oracle.name}
                  </span>
                  {!oracle.fed && <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-600">not fed</span>}
                  <span className="block text-xs text-slate-500 mt-0.5">{oracle.description}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            Four more FABRIC messaging oracles exist behind the <code className="font-mono">messaging-fabric</code> feature.
          </p>
        </div>
      </SectionShell>

      {/* E-process */}
      <SectionShell
        id="eprocess-monitoring"
        icon="activity"
        eyebrow="Statistical testing"
        title="E-process monitoring"
        kicker="Summarize oracle verdicts across many seeds with a test you can check after every run without inflating the false-alarm rate."
      >
        <div className="space-y-6">
          <SyncContainer withPulse={true} accentColor="#A855F7" className="p-1 md:p-2 bg-black/40 shadow-2xl shadow-purple-900/20">
            <EProcessMonitorViz />
          </SyncContainer>

          <div className="grid gap-6 md:grid-cols-2 text-slate-400 leading-relaxed">
            <p>
              A fixed-sample test is invalidated if you peek early. An <Tooltip term="E-Process">e-process</Tooltip>{" "}
              isn&apos;t: it&apos;s a betting martingale, <code className="text-purple-400 font-mono">E_t = E_(t-1) × (1 + λ(X_t − p₀))</code>,
              and by Ville&apos;s inequality the chance it ever exceeds 1/α under the null is at most α. The standard
              monitor watches task_leak, obligation_leak, and quiescence with λ = 0.5, p₀ = 0.001, and α = 0.05.
            </p>
            <p>
              What it doesn&apos;t do is find bugs on its own. Each observation is an oracle&apos;s pass/fail verdict for
              one run, and a lab run is deterministic, so the e-process can only reject an invariant some oracle has
              already flagged. It summarizes violation rates across seeds with an anytime-valid bound.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* Sagas */}
      <SectionShell
        id="saga-compensation"
        icon="globe"
        eyebrow="Distributed"
        title="Sagas and CALM"
        kicker="Two separate pieces: compensating sagas for remote workflows, and a planner that uses CALM analysis to batch obligation steps between coordination barriers."
      >
        <div className="space-y-6">
          <SyncContainer withPulse={true} accentColor="#10B981" className="p-1 md:p-2 bg-black/40 shadow-2xl shadow-emerald-900/20">
            <SagaCompensationViz />
          </SyncContainer>

          <div className="grid gap-6 md:grid-cols-2 text-slate-400 leading-relaxed">
            <p>
              <code className="text-emerald-300 font-mono">remote::Saga</code> records a forward action and a compensation
              for each step. If a later step fails, completed steps are compensated in reverse order. It sits next to
              the remote runtime&apos;s region-owned spawns, obligation-backed leases, and idempotency store.
            </p>
            <p>
              Separately, the obligation saga model has 16 operation kinds. <Tooltip term="CALM Analysis">CALM analysis</Tooltip>{" "}
              marks 7 as monotone (Reserve, Send, Acquire, Renew, Delegate, CrdtMerge, CancelRequest) and 9 as not.{" "}
              <code className="text-emerald-300 font-mono">MonotoneSagaExecutor</code> merges each run of monotone steps
              with a lattice join and puts a <Tooltip term="Coordination Barrier">barrier</Tooltip> before every
              non-monotone one. A sheaf-style consistency checker for saga observations exists as an API; nothing runs
              it automatically.
            </p>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        id="timeline"
        icon="clock"
        eyebrow="Roadmap"
        title="Where things stand"
        kicker="From the upstream README. Partial means partial."
      >
        <Timeline items={changelog} />
      </SectionShell>

      <div className="mx-auto max-w-7xl px-6 py-20 flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/showcase" className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 hover:border-blue-500/30 hover:text-white transition-all">
          Interactive demos
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link href="/getting-started" className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-400 transition-all active:scale-95">
          Get started
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </main>
  );
}
