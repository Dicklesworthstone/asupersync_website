"use client";

import { Suspense, useEffect, type ComponentType, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import SectionShell from "@/components/section-shell";
import GlitchText from "@/components/glitch-text";
import RobotMascot from "@/components/robot-mascot";
import { SyncContainer } from "@/components/sync-elements";
import { Tooltip } from "@/components/tooltip";
import { showcaseChapters, showcaseDemos, siteConfig, type DemoStatus, type ShowcaseDemoId } from "@/lib/content";
import { specDocs, specDocHref } from "@/lib/spec-docs";

const RegionTreeViz = dynamic(() => import("@/components/viz/region-tree-viz"), { ssr: false });
const CancelProtocolViz = dynamic(() => import("@/components/viz/cancel-protocol-viz"), { ssr: false });
const SchedulerLanesViz = dynamic(() => import("@/components/viz/scheduler-lanes-viz"), { ssr: false });
const ObligationFlowViz = dynamic(() => import("@/components/viz/obligation-flow-viz"), { ssr: false });
const LabRuntimeViz = dynamic(() => import("@/components/viz/lab-runtime-viz"), { ssr: false });
const TokioComparisonViz = dynamic(() => import("@/components/viz/tokio-comparison-viz"), { ssr: false });
const CapabilitySecurityViz = dynamic(() => import("@/components/viz/capability-security-viz"), { ssr: false });
const DporPruningViz = dynamic(() => import("@/components/viz/dpor-pruning-viz"), { ssr: false });
const TwoPhaseEffectsViz = dynamic(() => import("@/components/viz/two-phase-effects-viz"), { ssr: false });
const FountainCodeViz = dynamic(() => import("@/components/viz/fountain-code-viz"), { ssr: false });
const SpectralDeadlockViz = dynamic(() => import("@/components/viz/spectral-deadlock-viz"), { ssr: false });
const SporkOtpViz = dynamic(() => import("@/components/viz/spork-otp-viz"), { ssr: false });
const CalmViz = dynamic(() => import("@/components/viz/calm-theorem-viz"), { ssr: false });
const LyapunovPotentialViz = dynamic(() => import("@/components/viz/lyapunov-potential-viz"), { ssr: false });
const AdaptiveSchedulerViz = dynamic(() => import("@/components/viz/exp3-scheduler-viz"), { ssr: false });
const CancellationInjectionViz = dynamic(() => import("@/components/viz/cancellation-injection-viz"), { ssr: false });
const TestOraclesViz = dynamic(() => import("@/components/viz/test-oracles-viz"), { ssr: false });
const MacaroonCaveatViz = dynamic(() => import("@/components/viz/macaroon-caveat-viz"), { ssr: false });
const BudgetAlgebraViz = dynamic(() => import("@/components/viz/budget-algebra-viz"), { ssr: false });
const FoataFingerprintViz = dynamic(() => import("@/components/viz/foata-fingerprint-viz"), { ssr: false });
const ConformalCalibrationViz = dynamic(() => import("@/components/viz/conformal-calibration-viz"), { ssr: false });
const CancelPotentialViz = dynamic(() => import("@/components/viz/cancel-fuel-viz"), { ssr: false });
const TraceReplayStabilityViz = dynamic(() => import("@/components/viz/trace-replay-stability-viz"), { ssr: false });
const SagaCompensationViz = dynamic(() => import("@/components/viz/saga-compensation-viz"), { ssr: false });
const SmallStepSemanticsViz = dynamic(() => import("@/components/viz/small-step-semantics-viz"), { ssr: false });

function VizLoader() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-600 text-sm font-mono">
      Loading visualization...
    </div>
  );
}

function C({ children }: { children: ReactNode }) {
  return <code className="text-blue-400 font-mono">{children}</code>;
}

const STATUS: Record<DemoStatus, { label: string; className: string; title: string }> = {
  default: { label: "On by default", className: "border-blue-500/30 bg-blue-500/10 text-blue-300", title: "Part of how the runtime behaves out of the box" },
  api: { label: "API", className: "border-teal-500/30 bg-teal-500/10 text-teal-300", title: "A library surface you call when you need it" },
  lab: { label: "Lab runtime", className: "border-purple-500/30 bg-purple-500/10 text-purple-300", title: "Part of the deterministic test runtime" },
  "opt-in": { label: "Opt-in", className: "border-amber-500/30 bg-amber-500/10 text-amber-300", title: "Off unless you turn it on" },
  diagnostic: { label: "Diagnostic", className: "border-slate-500/30 bg-slate-500/10 text-slate-300", title: "Computed when you ask for it; doesn't change behavior" },
  model: { label: "Formal model", className: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300", title: "A property of the formal model, not of the Rust code" },
};

type SectionIcon = "blocks" | "shield" | "gitCompare" | "package" | "activity" | "key" | "lock" | "calculator" |
  "sparkles" | "bomb" | "search" | "gitMerge" | "gitCommit" | "lineChart" | "layers" | "arrowRight" | "droplets" |
  "braces" | "flame" | "zap" | "network";

interface DemoUi {
  icon: SectionIcon;
  kicker: ReactNode;
  viz: ComponentType;
  body: ReactNode[];
}

// Visual parts of each demo, keyed by id. Titles, chapters, status, sources,
// and related docs live in showcaseDemos (lib/content.ts).
const DEMO_UI: Record<ShowcaseDemoId, DemoUi> = {
  "region-tree": {
    icon: "blocks",
    kicker: <>Click a <Tooltip term="Region">region</Tooltip> to close it and watch cancellation reach everything it owns.</>,
    viz: RegionTreeViz,
    body: [
      <>Every task belongs to a region, and regions nest. When you close a region, the runtime cancels whatever is still running inside it, waits for those tasks to finish, runs the region&apos;s finalizers, and resolves its obligations. Only then does the region report itself closed.</>,
      <>That&apos;s the difference from <C>tokio::spawn</C>, which returns a detached task nothing waits for. A task spawned through a <Tooltip term="Cx">Cx</Tooltip> belongs to that context&apos;s region; tasks spawned from a runtime handle belong to the root region, which is drained at shutdown. The <Link href="/architecture#regions" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">architecture page</Link> has the details.</>,
    ],
  },
  "cancel-protocol": {
    icon: "shield",
    kicker: <>Step through request, drain, and finalize, and compare it with dropping the future.</>,
    viz: CancelProtocolViz,
    body: [
      <>Cancellation starts as a request. It propagates down the region tree and marks each task with a reason and a cleanup <Tooltip term="Budget">budget</Tooltip>. The task notices at its next <Tooltip term="Cancellation Point">cancellation point</Tooltip> (<C>cx.checkpoint()</C> or a cancel-aware await), then drains: it runs its own async cleanup, can still await, and can still return a value. Finalizers run with cancellation masked, and the runtime publishes <C>Cancelled(reason)</C>.</>,
      <>The protocol is cooperative. A task stuck in a loop with no checkpoint is never forcibly stopped, and its region&apos;s close waits for it. Budgets are advisory on the production runtime, and <C>Runtime::shutdown_timeout</C> bounds how long the caller waits.</>,
    ],
  },
  "comparison": {
    icon: "gitCompare",
    kicker: <>Press Cancel Now and watch both runtimes shut down the same work.</>,
    viz: TokioComparisonViz,
    body: [
      <>In tokio, <C>abort()</C> or dropping a future stops it at its last await. Whatever it was in the middle of stays half-done, and there&apos;s no async cleanup hook. Dropping a <C>JoinHandle</C> doesn&apos;t cancel anything; the task keeps running, detached. tokio-util&apos;s <C>CancellationToken</C> gives you cooperative cancellation if you thread it through by hand.</>,
      <>Asupersync builds the cooperative version into every task: the request propagates on its own, the task drains, finalizers run, and the outcome records why it stopped. It takes longer than a drop, and it depends on the task reaching a checkpoint. In exchange you get a shutdown you can audit, and the <Tooltip term="Lab Runtime">lab runtime</Tooltip> can check it under many schedules.</>,
    ],
  },
  "two-phase-effects": {
    icon: "package",
    kicker: <>Cancel between the two phases and nothing happens.</>,
    viz: TwoPhaseEffectsViz,
    body: [
      <>The demo uses a bank transfer as the analogy. In the library the pattern is concrete: <C>tx.reserve(&amp;cx).await?</C> claims one slot of channel capacity and commits nothing, and <C>permit.send(value)</C> publishes the message. Cancelled while waiting to reserve? Nothing was sent. Dropped the <Tooltip term="Permit">permit</Tooltip>? The slot goes back.</>,
      <>The commit returns an <Tooltip term="Outcome">Outcome</Tooltip>; if the receiver has gone away you get the value back instead of losing it. The same shape appears in <C>TwoPhaseNetworkSend</C> and graded obligation tokens. It isn&apos;t a general transaction system, and partial I/O like <C>read_exact</C> and <C>write_all</C> documents its own weaker contract.</>,
    ],
  },
  "obligations": {
    icon: "package",
    kicker: <>Follow a permit down the happy path, the abort path, and the leak path.</>,
    viz: ObligationFlowViz,
    body: [
      <>A reserved channel slot, a semaphore permit, or a lease is an <Tooltip term="Obligation System">obligation</Tooltip> the runtime records. Sending, releasing, or aborting resolves it, and a region can&apos;t close cleanly with one outstanding.</>,
      <>Rust&apos;s types are affine, so the compiler can&apos;t stop a permit from being forgotten. The runtime catches it instead: the lab&apos;s <Tooltip term="ObligationLeak Oracle">obligation_leak oracle</Tooltip> reports the kind and the holder. On-ramp level 3 leaks one on purpose to show the report.</>,
    ],
  },
  "scheduler": {
    icon: "activity",
    kicker: <>Cancel, timed, and ready lanes, and the bound that keeps cancellation from starving everything else.</>,
    viz: SchedulerLanesViz,
    body: [
      <>Tasks that are cancelling go to the cancel lane, so cleanup isn&apos;t stuck behind new work. Deadline-driven tasks go to the timed lane, earliest deadline first. Everything else waits in the ready lane.</>,
      <>Cancel priority is bounded. With the default limit of 16, ready or timed work gets a slot within 17 dispatches per worker, and the limit widens to 32 while a region is draining. Workers count their longest cancel streak, so fairness can be checked against counters instead of guessed.</>,
    ],
  },
  "capability-security": {
    icon: "key",
    kicker: <>Narrow a context and see which operations it can still perform.</>,
    viz: CapabilitySecurityViz,
    body: [
      <>Async functions receive <C>&amp;Cx</C>, and spawning, time, randomness, I/O, and remote calls go through it. The context carries a <Tooltip term="Capability Row">capability row</Tooltip>, <C>CapSet&lt;SPAWN, TIME, RANDOM, IO, REMOTE&gt;</C>. <C>Cx::restrict</C> narrows it, and nothing widens it back.</>,
      <>Plain I/O entry points such as <C>TcpStream::connect</C> check the calling task&apos;s context and refuse with ASUP-E009 when the IO capability is missing. The boundary has documented gaps: threads outside the runtime aren&apos;t checked, and some host-boundary helpers stay outside it.</>,
    ],
  },
  "macaroon-caveats": {
    icon: "lock",
    kicker: <>Add caveats to a token. Each one narrows it, and none can be removed.</>,
    viz: MacaroonCaveatViz,
    body: [
      <>A <Tooltip term="Macaroon">macaroon</Tooltip> is a bearer token whose signature is an HMAC chain: every caveat re-keys it, so a holder can add restrictions but can&apos;t strip one off. Asupersync supports eight caveat types (<C>TimeBefore</C>, <C>TimeAfter</C>, <C>RegionScope</C>, <C>TaskScope</C>, <C>MaxUses</C>, <C>ResourceScope</C>, <C>RateLimit</C>, <C>Custom</C>) plus third-party caveats with discharges.</>,
      <><C>Cx::attenuate</C> applies a caveat to a context before you hand it to a child. Having the runtime check every spawn against a token is opt-in, through <C>RuntimeBuilder::with_spawn_authorization_key</C>.</>,
    ],
  },
  "budget-algebra": {
    icon: "calculator",
    kicker: <>Nest scopes with different limits and see which constraint wins.</>,
    viz: BudgetAlgebraViz,
    body: [
      <>A budget has a deadline, a poll quota, a cost quota, and a priority. When scopes nest, budgets combine with <C>meet</C>: the earlier deadline, the smaller quotas, and the higher priority. Each part is a min or a max, so the order you apply them in doesn&apos;t matter (<Tooltip term="Budget Algebra">budget algebra</Tooltip>).</>,
      <>A child never ends up with a looser budget than the scope it runs in. On the production runtime, budgets inform scheduling and cancellation, and cleanup budgets are advisory: a task that ignores its budget holds things up and gets reported, but it isn&apos;t killed.</>,
    ],
  },
  "lab-runtime": {
    icon: "sparkles",
    kicker: <>Change the <Tooltip term="Seed">seed</Tooltip> and the interleaving changes. Keep it and the run repeats exactly.</>,
    viz: LabRuntimeViz,
    body: [
      <>The lab runtime runs your code on virtual time with a seeded scheduler. Sleeps complete without waiting, timers fire in a fixed order, and the same seed reproduces the same schedule, so a failure that took a thousand CI runs to show up becomes a seed you can rerun.</>,
      <>It records traces, injects cancellation and chaos deterministically, flags <Tooltip term="Futurelock">futurelocks</Tooltip>, and attaches a crashpack with a replay command to failing runs. Code reads time and randomness through <C>Cx</C>, which is what lets the same code run in both places.</>,
    ],
  },
  "cancellation-injection": {
    icon: "bomb",
    kicker: <>Cancel at every await point, one run each, and check the oracles after every run.</>,
    viz: CancellationInjectionViz,
    body: [
      <>Most tests run code to completion, so they never see what happens when a task is cancelled halfway through. The injector first records a run to find the await points, then reruns the test once per point, cancelling there.</>,
      <><C>lab(seed).with_cancellation_injection(InjectionStrategy::AllPoints).with_all_oracles()</C> runs the whole sweep; other strategies sample points, take the first N, or target specific ones. After each run the oracles check for leaked tasks, leaked obligations, and protocol violations. It finds bugs. Passing means no oracle flagged one, which is good evidence but not a proof.</>,
    ],
  },
  "test-oracles": {
    icon: "search",
    kicker: <>Run a batch of seeds and watch the evidence accumulate.</>,
    viz: TestOraclesViz,
    body: [
      <>An <Tooltip term="Oracle">oracle</Tooltip> checks one invariant after a lab run. There are 24 in the registry, and the lab runtime feeds nine of them from its own state: task leaks, obligation leaks, quiescence, loser drain, finalizers, the region tree, deadline monotonicity, the cancellation protocol, and DOWN-message order.</>,
      <>An <Tooltip term="E-Process">e-process</Tooltip> summarizes those verdicts across runs. It&apos;s a betting martingale (λ = 0.5, null rate 0.001), and by Ville&apos;s inequality you can check it after every run and reject once it passes 1/α = 20 without inflating the false-alarm rate. It doesn&apos;t find bugs the oracles miss; it tells you how strong the evidence for a violation rate is.</>,
    ],
  },
  "dpor-pruning": {
    icon: "gitMerge",
    kicker: <>Toggle pruning to see how many schedules are really the same schedule.</>,
    viz: DporPruningViz,
    body: [
      <>Many interleavings differ only in the order of operations that don&apos;t interact, and running all of them wastes time. The schedule explorer detects races with vector clocks, derives new seeds aimed at them, and skips runs whose trace is equivalent to one it has already seen.</>,
      <>It borrows from <Tooltip term="DPOR">dynamic partial-order reduction</Tooltip>, but it doesn&apos;t backtrack to an exact prefix and force the alternative branch, so it can&apos;t promise it covered every class. The number of distinct classes measures the campaign. Treat it as a practical bug finder, not a proof.</>,
    ],
  },
  "foata-fingerprints": {
    icon: "gitCompare",
    kicker: <>Swap independent events and the fingerprint stays the same.</>,
    viz: FoataFingerprintViz,
    body: [
      <>Two traces are <Tooltip term="Mazurkiewicz Trace">Mazurkiewicz-equivalent</Tooltip> if you can turn one into the other by swapping adjacent events that touch different resources. Foata normal form picks one canonical representative by grouping events into layers of mutually independent steps.</>,
      <>Hash that form and you get a <Tooltip term="Foata Fingerprint">fingerprint</Tooltip> shared by every equivalent schedule. The explorer uses it to recognize runs it has already seen, and replay uses the same canonical form, so equivalent runs compare equal.</>,
    ],
  },
  "trace-replay-stability": {
    icon: "gitCommit",
    kicker: <>Crash several processes at the same virtual instant and watch the order their DOWN messages arrive in.</>,
    viz: TraceReplayStabilityViz,
    body: [
      <>On a real runtime, simultaneous failures reach a supervisor in whatever order threads happen to race. A bug that depends on that order may never reproduce.</>,
      <>Under the lab runtime, DOWN messages are ordered by completion time, then task ID, then monitor reference. Timers with the same deadline fire by timer ID, and equal-priority tasks follow FIFO order with a seeded tie-break. Replay the same seed and the arrivals repeat.</>,
    ],
  },
  "conformal-calibration": {
    icon: "lineChart",
    kicker: <>Calibrate across seeds and flag the runs whose metrics don&apos;t fit, even when no invariant failed.</>,
    viz: ConformalCalibrationViz,
    body: [
      <>Some lab runs pass every oracle and still look wrong: an unusual number of polls, a slow drain. <Tooltip term="Conformal Calibration">Split conformal prediction</Tooltip> sets a threshold from earlier runs that holds without assuming any distribution, as long as the runs are exchangeable.</>,
      <>With the default α of 0.05, a new run lands inside the prediction set at least 95% of the time. <C>ScheduleExplorer::with_conformal_calibration</C> feeds it each explored run&apos;s oracle report and lists the seeds that fall outside. No oracle consults it on its own, so no default verdict depends on it.</>,
    ],
  },
  "spork-otp": {
    icon: "layers",
    kicker: <>Send a call to a <Tooltip term="GenServer">GenServer</Tooltip> and see what happens when the handler forgets to reply.</>,
    viz: SporkOtpViz,
    body: [
      <><Tooltip term="Spork">Spork</Tooltip> is Asupersync&apos;s OTP-style layer: GenServers, actors with bounded <Tooltip term="Mailbox">mailboxes</Tooltip>, monitors, links, a name registry, and <Tooltip term="Supervisor">supervisors</Tooltip> that restart failed children one-for-one, one-for-all, or rest-for-one within intensity and backoff limits. Every process belongs to a region and can&apos;t be detached.</>,
      <>Each call hands the server a <C>Reply</C> that wraps a tracked obligation, and the server has to send it or abort it. Dropping one unanswered panics, which the supervisor sees (during unwinding or after cancellation it aborts cleanly instead), and the lab&apos;s reply_linearity oracle checks the same rule. The caller gets an answer or an error. The runtime enforces this, not the compiler.</>,
    ],
  },
  "saga-compensation": {
    icon: "arrowRight",
    kicker: <>Fail a step midway and watch the completed steps compensate in reverse.</>,
    viz: SagaCompensationViz,
    body: [
      <>A <Tooltip term="Saga">saga</Tooltip> pairs each forward step with a compensating action. <C>remote::Saga</C> records them as it goes, and if a later step fails, it runs the compensations for completed steps in reverse order.</>,
      <>It lives in the remote runtime alongside region-owned remote spawns, leases that count as obligations, and an idempotency store for retries. Compensations are ordinary code: they need to be idempotent and safe after a partial failure, and no saga can make an irreversible action reversible.</>,
    ],
  },
  "calm-theorem": {
    icon: "gitMerge",
    kicker: <>Some steps can be merged without coordination. Others need a barrier first.</>,
    viz: CalmViz,
    body: [
      <>The <Tooltip term="CALM Theorem">CALM theorem</Tooltip> says a computation can run consistently without coordination exactly when it&apos;s monotone: it only adds information and never has to retract a conclusion. Asupersync applies that to its saga model&apos;s 16 operation kinds.</>,
      <>Seven are <Tooltip term="Monotone Operation">monotone</Tooltip> (Reserve, Send, Acquire, Renew, Delegate, CrdtMerge, CancelRequest). Nine aren&apos;t, including Commit, Release, and RegionClose, because they depend on knowing nothing else will arrive. <C>MonotoneSagaExecutor</C> merges each run of monotone steps with a lattice join and places one <Tooltip term="Coordination Barrier">coordination barrier</Tooltip> before each non-monotone step.</>,
    ],
  },
  "fountain-codes": {
    icon: "droplets",
    kicker: <>Drop packets at random. The receiver needs enough of them, not particular ones.</>,
    viz: FountainCodeViz,
    body: [
      <>A <Tooltip term="Fountain Code">fountain code</Tooltip> turns K source symbols into as many encoded symbols as you like, and the receiver rebuilds the data from any sufficient set. With <Tooltip term="RaptorQ">RaptorQ</Tooltip> (RFC 6330), K symbols usually suffice and K + 2 almost always do. Which packets were lost stops mattering, so loss costs bandwidth instead of retransmission round trips.</>,
      <>Asupersync&apos;s codec is deterministic, with a decode planner that picks an elimination strategy from the matrix&apos;s structure and optional SIMD kernels for GF(256). Its main user is ATP; the <Link href="/atp" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">ATP page</Link> has the measurements, including where it loses to rsync.</>,
    ],
  },
  "small-step-semantics": {
    icon: "braces",
    kicker: <>Step through the rules that define spawning, cancellation, and region close.</>,
    viz: SmallStepSemanticsViz,
    body: [
      <>The runtime is designed against a <Tooltip term="Small-Step Semantics">small-step operational semantics</Tooltip>: <Tooltip term="Transition Rule">rules</Tooltip> of the form ⟨e, σ⟩ → ⟨e′, σ′⟩ for scheduling, the task lifecycle, the cancellation protocol, region close, obligations, joins, and time. There are 23 core rules, plus 10 for distributed deduplication and sagas.</>,
      <>A Lean project formalizes the core. Its Step relation has 22 constructors, and 189 theorems about it check six invariants with no sorry. That&apos;s a proof about the model. Nobody has proved the Rust runtime refines it; the link between the two is tests, oracles, and TLC checks of recorded traces.</>,
    ],
  },
  "cancel-potential": {
    icon: "flame",
    kicker: <>Pick a mask depth and count the steps to completion.</>,
    viz: CancelPotentialViz,
    body: [
      <>To show the cancellation protocol can&apos;t cycle, the Lean model gives each cancelled task a <Tooltip term="Cancel Potential">potential</Tooltip>: mask + 3 when cancellation is requested, 2 while cancelling, 1 while finalizing, and 0 when complete. Every protocol step lowers it. A masked checkpoint spends one unit of mask, and mask depth is capped at 64.</>,
      <>The theorem <C>cancel_protocol_terminates</C> follows: a cancelled task completes in exactly mask + 3 steps. It counts protocol steps in the model. A task that never reaches a checkpoint never takes the first step, which is why the runtime makes no wall-clock promise.</>,
    ],
  },
  "lyapunov-potential": {
    icon: "activity",
    kicker: <>Watch a weighted measure of outstanding work while the governor steers lane order.</>,
    viz: LyapunovPotentialViz,
    body: [
      <>The <Tooltip term="Lyapunov Potential">potential</Tooltip> adds up what&apos;s still outstanding: live tasks (weight 1), the total age of pending obligations (5), draining regions (3), and deadline pressure (2). It gives the scheduler one number to push down.</>,
      <>The optional Lyapunov governor reads runtime snapshots every 32 dispatches and steers lane ordering so the potential tends not to increase. It&apos;s off by default, and it&apos;s a scheduling heuristic with a principled objective, not a proof that the system makes progress.</>,
    ],
  },
  "adaptive-scheduler": {
    icon: "zap",
    kicker: <>A bandit picks how many cancelling tasks run in a row before other work gets a turn.</>,
    viz: AdaptiveSchedulerViz,
    body: [
      <>The fixed limit of 16 cancel-lane dispatches in a row is a judgment call. With <C>enable_adaptive_cancel_streak(true)</C>, each worker treats the limit as a choice among 4, 8, 16, 32, and 64 and picks with <Tooltip term="Discounted UCB1">discounted UCB1</Tooltip>: every 128 dispatches it discounts old evidence by 0.95, scores the arm it just used with a reward mixing Lyapunov decrease, fairness, and deadline pressure, and moves to the arm with the best upper confidence bound.</>,
      <>It&apos;s deterministic, with no randomness and no wall clock, so the same dispatch sequence makes the same choices. It&apos;s also off by default because it didn&apos;t earn its place: measured against the fixed limit on two hosts, it didn&apos;t win on cancel-heavy work and was 1–29% slower on spawn, yield, and channel round trips.</>,
    ],
  },
  "spectral-deadlock": {
    icon: "network",
    kicker: <>Build a cycle in the <Tooltip term="Wait-Graph">wait graph</Tooltip> and watch its connectivity fall.</>,
    viz: SpectralDeadlockViz,
    body: [
      <>The wait graph has a node per task and an edge for each &ldquo;waiting on&rdquo;. Its <Tooltip term="Fiedler Value">Fiedler value</Tooltip>, the second-smallest eigenvalue of the graph Laplacian, is zero when the graph comes apart and small when it has a bottleneck. The monitor tracks it with a stack of trend statistics, calibrated with split conformal bounds and an anytime-valid e-process, and reports none, watch, warning, or critical.</>,
      <>It&apos;s a diagnostic you call (<C>Diagnostics::analyze_structural_health</C>); the scheduler runs its own copy only with the opt-in governor. It doesn&apos;t intervene, and a falling value is a signal about the graph&apos;s shape, not proof of a deadlock. Trapped-cycle evidence is a separate check.</>,
    ],
  },
};

const CHAPTERS = showcaseChapters.map((title) => ({
  title,
  demos: showcaseDemos.filter((demo) => demo.chapter === title),
}));

function upstreamUrl(path: string): string {
  // Paths without an extension are directories.
  const kind = /\.[a-z]+$/i.test(path) ? "blob" : "tree";
  return `${siteConfig.github}/${kind}/main/${path}`;
}

function WhereItLives({ sources, docs }: { sources: readonly string[]; docs?: readonly string[] }) {
  const relatedDocs = (docs ?? []).flatMap((slug) => specDocs.filter((doc) => doc.slug === slug));
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.015] px-5 py-4 text-sm sm:flex-row sm:items-baseline sm:gap-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">In the code</span>
        {sources.map((path) => (
          <a
            key={path}
            href={upstreamUrl(path)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-slate-400 hover:text-blue-300 underline decoration-white/10 underline-offset-4 hover:decoration-blue-400/50"
          >
            {path}
          </a>
        ))}
      </div>
      {relatedDocs.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Read more</span>
          {relatedDocs.map((doc) => (
            <Link
              key={doc.slug}
              href={specDocHref(doc.slug)}
              className="text-xs text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-4"
            >
              {doc.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: DemoStatus }) {
  const s = STATUS[status];
  return (
    <span
      title={s.title}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${s.className}`}
    >
      {s.label}
    </span>
  );
}

// Sections renamed when their content was corrected; keep old links working.
const RENAMED_ANCHORS: Record<string, ShowcaseDemoId> = {
  "exp3-scheduler": "adaptive-scheduler",
  "cancel-fuel": "cancel-potential",
};

export default function ShowcasePage() {
  useEffect(() => {
    const renamed = RENAMED_ANCHORS[window.location.hash.slice(1)];
    if (!renamed) return;
    window.history.replaceState(window.history.state, "", `#${renamed}`);
    document.getElementById(renamed)?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <main id="main-content">
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-24">
              <RobotMascot />
            </div>
          </div>

          <GlitchText trigger="hover" intensity="medium">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
              Interactive Demos
            </h1>
          </GlitchText>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
            Each demo shows one mechanism. The badge says how it ships: on by default, an API you
            call, part of the lab runtime, opt-in, a diagnostic, or a property of the formal model.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {(Object.keys(STATUS) as DemoStatus[]).map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </div>
      </section>

      {/* Chapter index */}
      <nav aria-label="Demo index" className="mx-auto max-w-7xl px-6 mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CHAPTERS.map((chapter) => (
            <div key={chapter.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500/80 mb-3">{chapter.title}</div>
              <ul className="space-y-1.5">
                {chapter.demos.map((demo) => (
                  <li key={demo.id}>
                    <a href={`#${demo.id}`} className="text-sm text-slate-400 hover:text-blue-300 transition-colors">
                      {demo.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {showcaseDemos.map(({ id, eyebrow, title, status, sources, docs }) => {
        const { icon, kicker, viz: Viz, body } = DEMO_UI[id];
        return (
          <SectionShell key={id} id={id} icon={icon} eyebrow={eyebrow} title={title} kicker={kicker}>
            <div className="space-y-6">
              {status && <StatusBadge status={status} />}
              <SyncContainer withPulse={true} className="p-4 md:p-8">
                <Suspense fallback={<VizLoader />}>
                  <Viz />
                </Suspense>
              </SyncContainer>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                {body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              <WhereItLives sources={sources} docs={docs} />
            </div>
          </SectionShell>
        );
      })}
    </main>
  );
}
