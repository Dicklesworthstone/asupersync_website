// Site configuration
export const siteConfig = {
  name: "Asupersync",
  title: "Asupersync — Cancel-Correct Async for Rust",
  description:
    "An async runtime for Rust where every task belongs to a region, cancellation is a protocol instead of a silent drop, effects go through an explicit capability context, and a lab runtime replays any schedule from its seed.",
  url: "https://asupersync.com",
  github: "https://github.com/Dicklesworthstone/asupersync",
  demoUrl: "https://dicklesworthstone.github.io/asupersync/asupersync_web_demo.html",
  cratesUrl: "https://crates.io/crates/asupersync",
  // Latest version published to crates.io, and the unreleased line on main.
  version: "0.5.0",
  mainVersion: "0.6.0",
  social: {
    github: "https://github.com/Dicklesworthstone/asupersync",
    x: "https://x.com/doodlestein",
    authorGithub: "https://github.com/Dicklesworthstone",
  },
};

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/atp", label: "ATP" },
  { href: "/showcase", label: "Interactive Demos" },
  { href: "/architecture", label: "Architecture" },
  { href: "/spec-explorer", label: "Spec Docs" },
  { href: "/getting-started", label: "Get Started" },
  { href: "/glossary", label: "Glossary" },
];

// Types
export interface Stat {
  label: string;
  value: string;
  helper?: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
  category?: string;
}

export type ComparisonTone = "yes" | "partial" | "no" | "neutral";

export interface ComparisonCell {
  text: string;
  tone: ComparisonTone;
}

export interface ComparisonRow {
  feature: string;
  asupersync: ComparisonCell;
  tokio: ComparisonCell;
  asyncStd: ComparisonCell;
  smol: ComparisonCell;
}

export interface ChangelogEntry {
  period: string;
  title: string;
  items: string[];
}

export interface GlossaryTerm {
  term: string;
  short: string;
  long: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface TokioMapping {
  tokio: string;
  asupersync: string;
  note: string;
}

export interface BenchRow {
  workload: string;
  asupersync: string;
  tokio: string;
  ratio: string;
}

export interface OnrampLevel {
  level: number;
  title: string;
  adds: string;
  file: string;
  code: string;
}

// Hero stats
export const heroStats: Stat[] = [
  { label: "Outcome variants", value: "4", helper: "Ok, Err, Cancelled, Panicked" },
  { label: "Built-in lab oracles", value: "24", helper: "9 are fed from runtime state today" },
  { label: "Lean-checked invariants", value: "6", helper: "Of the abstract model, not the Rust code" },
  { label: "tokio in the default build", value: "0", helper: "No normal-edge dependency" },
];

// What ships in the box. `category` is the support status shown on each card.
export const features: Feature[] = [
  {
    title: "Runtime and scheduler",
    description:
      "A multi-thread work-stealing scheduler with three lanes (cancel, timed, ready), a current-thread flavor, and an on-demand blocking pool. Linux epoll is the main reactor, with optional io_uring; the BSD and Windows reactors accept fewer interest flags.",
    icon: "cpu",
    category: "Built in",
  },
  {
    title: "Channels and sync",
    description:
      "mpsc, oneshot, broadcast, watch, and session channels with reserve-then-send. Mutex, RwLock, Semaphore, Barrier, Notify, OnceCell, and an object pool. Every wait takes &Cx and can be cancelled.",
    icon: "blocks",
    category: "Built in",
  },
  {
    title: "Combinators",
    description:
      "join, race, and timeout drain their losers instead of dropping them. Beyond those: quorum, hedge, first_ok, pipeline, map_reduce, circuit_breaker, bulkhead, rate_limit, bracket, and retry.",
    icon: "layers",
    category: "Built in",
  },
  {
    title: "Fibers",
    description:
      "cx::fiber::scope runs futures that borrow from the task's stack concurrently, each with its own cancellation. A fiber costs about what a tokio task does. Fibers share one thread, so reach for tasks when you want parallelism.",
    icon: "sparkles",
    category: "Built in",
  },
  {
    title: "Networking",
    description:
      "TCP, UDP, and Unix sockets, DNS, TLS 1.2/1.3 through rustls, and WebSocket with an RFC 6455 conformance suite. Under the lab runtime, a virtual TCP stack replaces kernel sockets.",
    icon: "globe",
    category: "Built in · TLS behind a feature",
  },
  {
    title: "HTTP and gRPC",
    description:
      "HTTP/1.1 and HTTP/2 servers, a pooled HTTP/1.1 client, gRPC, and a small router with extractors, middleware, and SSE. It isn't axum: handlers use Asupersync's own Request and Response types.",
    icon: "network",
    category: "Built in",
  },
  {
    title: "QUIC and HTTP/3",
    description:
      "Native QUIC and HTTP/3 with no tokio underneath, including a multi-peer listener over real UDP with streaming request bodies. Multi-connection deployment, 0-RTT, migration, and interop with other stacks are still unproven.",
    icon: "zap",
    category: "Feature-gated · partial",
  },
  {
    title: "Databases",
    description:
      "PostgreSQL (binary protocol, SCRAM-SHA-256) and MySQL clients that speak the wire protocol directly over TcpStream, plus SQLite on the blocking pool. Prepared statements, transactions, and connection reuse.",
    icon: "database",
    category: "Feature-gated",
  },
  {
    title: "Actors and supervision",
    description:
      "Spork, the OTP-style layer: GenServers, actors, monitors, and links that run as tasks in the caller's region. Supervision trees restart failed children one-for-one, one-for-all, or rest-for-one with intensity and backoff limits.",
    icon: "shield",
    category: "Built in",
  },
  {
    title: "Remote tasks",
    description:
      "Region-owned remote spawn over a native TCP + mutual-TLS protocol, with leases that count as obligations, an idempotency store for retries, and saga compensation. Route persistence and WAN reliability are open work.",
    icon: "globe",
    category: "Built in · scoped",
  },
  {
    title: "RaptorQ and ATP",
    description:
      "An RFC 6330 fountain codec with a deterministic decode planner. Its main consumer is ATP, the file-transfer protocol: QUIC or TCP, Merkle-verified commits, resumable journals, and multi-donor bonded pulls.",
    icon: "activity",
    category: "Built in",
  },
  {
    title: "Browser Edition",
    description:
      "A wasm32 build with JS/TS packages for the main thread and dedicated workers. In the browser it's a ledger of regions, scopes, and task handles over the host's promises, with fetch, WebSocket, and WebTransport behind capabilities.",
    icon: "terminal",
    category: "Release candidate",
  },
  {
    title: "Observability",
    description:
      "Structured logs carrying task and region IDs, counters, gauges, and histograms with an optional OpenTelemetry exporter, a live task inspector, and diagnostics that explain why a task is blocked or why it was cancelled.",
    icon: "eye",
    category: "Built in",
  },
  {
    title: "Lab runtime",
    description:
      "Virtual time, seeded scheduling, trace capture and replay, deterministic chaos injection, futurelock detection, crashpacks, and race-guided schedule exploration that skips runs equivalent to ones it has already seen.",
    icon: "lock",
    category: "Built in",
  },
];

// Comparison data, following the upstream README's own table.
export const comparisonData: ComparisonRow[] = [
  {
    feature: "Structured concurrency",
    asupersync: { text: "Every task belongs to a region", tone: "yes" },
    tokio: { text: "Opt-in (JoinSet, TaskTracker)", tone: "partial" },
    asyncStd: { text: "Manual", tone: "no" },
    smol: { text: "Manual", tone: "no" },
  },
  {
    feature: "Cancellation",
    asupersync: { text: "Request → drain → finalize, cooperative", tone: "partial" },
    tokio: { text: "Drop, or CancellationToken", tone: "partial" },
    asyncStd: { text: "Drop", tone: "partial" },
    smol: { text: "Drop", tone: "partial" },
  },
  {
    feature: "Orphan tasks",
    asupersync: { text: "None from Cx spawns", tone: "yes" },
    tokio: { text: "spawn detaches", tone: "no" },
    asyncStd: { text: "spawn detaches", tone: "no" },
    smol: { text: "spawn detaches", tone: "no" },
  },
  {
    feature: "Bounded cleanup",
    asupersync: { text: "Advisory budgets", tone: "partial" },
    tokio: { text: "Best-effort", tone: "no" },
    asyncStd: { text: "Best-effort", tone: "no" },
    smol: { text: "Best-effort", tone: "no" },
  },
  {
    feature: "Deterministic testing",
    asupersync: { text: "Built-in lab runtime", tone: "yes" },
    tokio: { text: "Paused time; loom, turmoil", tone: "partial" },
    asyncStd: { text: "External tools", tone: "no" },
    smol: { text: "External tools", tone: "no" },
  },
  {
    feature: "Obligation tracking",
    asupersync: { text: "Permits tracked, leaks reported", tone: "yes" },
    tokio: { text: "None", tone: "no" },
    asyncStd: { text: "None", tone: "no" },
    smol: { text: "None", tone: "no" },
  },
  {
    feature: "Per-task cost",
    asupersync: { text: "Several times tokio's", tone: "partial" },
    tokio: { text: "The reference point", tone: "yes" },
    asyncStd: { text: "—", tone: "neutral" },
    smol: { text: "—", tone: "neutral" },
  },
  {
    feature: "Ecosystem",
    asupersync: { text: "Broad built-in stack; tokio crates need adapters", tone: "partial" },
    tokio: { text: "Largest; most crates assume it", tone: "yes" },
    asyncStd: { text: "Medium", tone: "partial" },
    smol: { text: "Small", tone: "partial" },
  },
  {
    feature: "Maturity",
    asupersync: { text: "Pre-1.0, experimental", tone: "partial" },
    tokio: { text: "Production", tone: "yes" },
    asyncStd: { text: "Discontinued in 2025", tone: "neutral" },
    smol: { text: "Production", tone: "yes" },
  },
];

// Structured concurrency in its smallest real form (from the upstream README).
export const codeExample = `use asupersync::{main, prelude::*};

#[main]
async fn main(cx: &Cx) {
    // A scope whose tasks get at most 64 polls each.
    let scope = cx.scope_with_budget(Budget::new().with_poll_quota(64));
    let mut tasks = JoinSet::new(&scope);

    for value in 1..=2_u32 {
        tasks
            .spawn(cx, move |_| async move { Ok::<_, Error>(value) })
            .expect("spawn region-owned task");
    }

    let results = tasks.join_all(cx).await;
    // Nothing spawned into the set is still running here.
    assert_eq!(results.len(), 2);
}`;

// The same producer/consumer program in both runtimes (from the upstream README).
export const codeExampleTokio = `use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(10);

    tokio::spawn(async move {
        for i in 0..5 {
            tx.send(i).await.unwrap();
            sleep(Duration::from_millis(100)).await;
        }
    });

    while let Some(val) = rx.recv().await {
        println!("got: {val}");
    }
}`;

export const codeExampleAsupersync = `use asupersync::channel::mpsc;
use asupersync::{Cx, Outcome};
use asupersync::time::sleep;
use std::time::Duration;

async fn run(cx: &Cx) {
    let (tx, mut rx) = mpsc::channel::<i32>(10);

    let mut producer = cx.spawn(move |cx| async move {
        for i in 0..5 {
            let Ok(permit) = tx.reserve(&cx).await else {
                break; // cancelled, or the receiver closed
            };
            let Outcome::Ok(()) = permit.send(i) else {
                break; // the receiver left after we reserved
            };
            sleep(cx.now(), Duration::from_millis(100)).await;
        }
    }).expect("spawn producer");

    while let Ok(val) = rx.recv(&cx).await {
        println!("got: {val}");
    }

    let _ = producer.join(cx).await;
}`;

// Coming from tokio: the primitives people use daily.
export const tokioMappings: TokioMapping[] = [
  {
    tokio: "tokio::spawn(fut)",
    asupersync: "cx.spawn(|cx| async move { … })",
    note: "The task belongs to the caller's region, and the closure gets its own Cx.",
  },
  {
    tokio: "JoinHandle<T>",
    asupersync: "TaskHandle<T>",
    note: ".join(cx).await keeps cancellation and panic as separate outcomes.",
  },
  {
    tokio: "JoinSet<T>",
    asupersync: "JoinSet::in_cx(cx)",
    note: "join_next, join_all, and cancel_all all keep ownership of the drain.",
  },
  {
    tokio: "tokio::select!",
    asupersync: "race!(cx, { … })",
    note: "Returns only after the losers have been cancelled and drained.",
  },
  {
    tokio: "FuturesUnordered",
    asupersync: "cx::fiber::scope(|s| …)",
    note: "Borrowing futures, no 'static bound, all on the calling task's thread.",
  },
  {
    tokio: "time::sleep(dur)",
    asupersync: "sleep(cx.now(), dur)",
    note: "Takes the current time explicitly, so the lab can run it on virtual time.",
  },
  {
    tokio: "time::timeout(dur, fut)",
    asupersync: "scope.timeout(&cx, dur, |cx| op)",
    note: "On expiry the operation is cancelled and drained, and a late result is reported.",
  },
  {
    tokio: "mpsc::channel(n)",
    asupersync: "channel::mpsc::channel(n)",
    note: "tx.reserve(&cx).await?.send(v). A one-call send() exists for the common case.",
  },
  {
    tokio: "sync::Mutex",
    asupersync: "sync::Mutex",
    note: "lock(&cx).await? can be cancelled while waiting, so it returns a Result.",
  },
  {
    tokio: "sync::Semaphore",
    asupersync: "sync::Semaphore",
    note: "acquire(&cx, n).await?. Each permit is an obligation the runtime tracks.",
  },
];

// Measured against tokio: p50 per operation, n = 1,000, release build with
// default features, both runtimes in one process, 2026-10-05, three hosts.
export const benchMicro: BenchRow[] = [
  { workload: "spawn + join from a task, 4 workers", asupersync: "4.2–12.4 µs", tokio: "0.31–0.68 µs", ratio: "9–27×" },
  { workload: "spawn + join from block_on, current-thread", asupersync: "3.0–7.1 µs", tokio: "0.21–0.51 µs", ratio: "10–14×" },
  { workload: "yield_now, 4 workers", asupersync: "0.35–0.58 µs", tokio: "0.23–0.56 µs", ratio: "1.0–2.0×" },
  { workload: "yield_now, current-thread", asupersync: "0.30–0.57 µs", tokio: "0.09–0.15 µs", ratio: "3.2–3.9×" },
  { workload: "mpsc ping-pong round trip, 4 workers", asupersync: "1.26–1.77 µs", tokio: "0.20–0.57 µs", ratio: "3.1–6.3×" },
  { workload: "mpsc ping-pong round trip, current-thread", asupersync: "1.26–1.76 µs", tokio: "0.17–0.30 µs", ratio: "5.8–7.5×" },
  { workload: "fan-out child: fiber::scope vs spawn + join, current-thread", asupersync: "0.21–0.56 µs", tokio: "0.21–0.51 µs", ratio: "0.9–1.1×" },
  { workload: "fan-out child: fiber::scope vs spawn + join, 4 workers", asupersync: "0.20–0.39 µs", tokio: "0.31–0.68 µs", ratio: "0.55–0.85×" },
];

// Server-shaped workloads. `ratio` is how much faster tokio is.
export const benchServer: BenchRow[] = [
  { workload: "TCP request/response, 1 connection", asupersync: "30–44K round trips/s", tokio: "46–76K", ratio: "1.55–1.7×" },
  { workload: "TCP request/response, 64 connections", asupersync: "93–129K round trips/s", tokio: "123–144K", ratio: "1.1–1.3×" },
  { workload: "HTTP/1.1 keep-alive GET, 1 connection (vs hyper)", asupersync: "22K requests/s", tokio: "44K", ratio: "2.0×" },
  { workload: "HTTP/1.1 keep-alive GET, 64 connections (vs hyper)", asupersync: "64K requests/s", tokio: "134K", ratio: "2.1×" },
];

// The graduated on-ramp. Each level is a complete program in the upstream
// examples/ directory, copied verbatim (minus the leading doc comment).
export const onrampLevels: OnrampLevel[] = [
  {
    level: 0,
    title: "Enter the runtime",
    adds: "The attribute entry point. No builder, executor handle, or capability to learn yet.",
    file: "examples/onramp_level0.rs",
    code: `use asupersync::main;

#[main]
async fn main() {
    println!("hello from asupersync");
}`,
  },
  {
    level: 1,
    title: "Cx, Outcome, and Budget",
    adds: "main receives the capability context. Budgets combine with meet, and the tighter one wins.",
    file: "examples/onramp_level1.rs",
    code: `use asupersync::{main, prelude::*};

#[main]
async fn main(cx: &Cx) {
    let service = Budget::new().with_poll_quota(64);
    let request = Budget::new().with_poll_quota(16);
    let effective = service.meet(request);
    assert_eq!(effective.remaining_polls(), 16);

    cx.checkpoint()
        .expect("budget and cancellation permit work");
    let outcome: Outcome<u32, Error> = Outcome::ok(42);
    assert_eq!(outcome.expect("work succeeds"), 42);
}`,
  },
  {
    level: 2,
    title: "Scopes and region-owned fan-out",
    adds: "A JoinSet owns dynamic fan-out inside one region; nothing outlives the join.",
    file: "examples/onramp_level2.rs",
    code: `use asupersync::{main, prelude::*};

#[main]
async fn main(cx: &Cx) {
    let scope = cx.scope_with_budget(Budget::new().with_poll_quota(64));
    let mut tasks = JoinSet::new(&scope);

    for value in 1..=3_u32 {
        tasks
            .spawn(cx, move |_| async move { Ok::<_, Error>(value) })
            .expect("spawn region-owned task");
    }

    let sum = tasks
        .join_all(cx)
        .await
        .into_iter()
        .map(|outcome| outcome.expect("child succeeds"))
        .sum::<u32>();
    assert_eq!(sum, 6);
}`,
  },
  {
    level: 3,
    title: "Two-phase sends and a lab oracle",
    adds: "Reserve, then send. Then leak a permit on purpose inside the lab and watch the obligation-leak oracle name it.",
    file: "examples/onramp_level3.rs",
    code: `use asupersync::{LabConfig, LabRuntime, main, prelude::*};

#[main]
async fn main(cx: &Cx) {
    let (tx, mut rx) = mpsc::channel::<u8>(1);
    let permit = tx.reserve(cx).await.expect("reserve channel capacity");
    permit.send(7);
    assert_eq!(rx.recv(cx).await.expect("receive committed value"), 7);

    // The same reservation inside a deterministic lab task, except that this
    // permit escapes without \`send\` or \`abort\`. Stock permits are runtime
    // obligations, so the lab's obligation-leak oracle catches it by kind
    // without any hand-built obligation record.
    let mut lab = LabRuntime::new(LabConfig::new(7).panic_on_leak(false));
    let region = lab.state.create_root_region(Budget::INFINITE);
    let (task, _handle) = lab
        .state
        .create_task(region, Budget::INFINITE, async {
            let cx = Cx::current().expect("lab task installs a current Cx");
            let (tx, _rx) = mpsc::channel::<u8>(1);
            let permit = tx.reserve(&cx).await.expect("reserve channel capacity");
            std::mem::forget(permit); // deliberate on-ramp leak
        })
        .expect("create lab task");
    lab.scheduler.lock().schedule(task, 0);
    lab.run_until_quiescent();

    let report = lab.report();
    let leak = report
        .oracle_report
        .entry("obligation_leak")
        .expect("obligation leak oracle is registered");
    assert!(!leak.passed, "the lab must catch the deliberate leak");
    let violation = leak.violation.as_deref().unwrap_or_default();
    assert!(
        violation.contains("SendPermit"),
        "the oracle names the leaked permit kind: {violation}"
    );
}`,
  },
];

// Fibers: concurrent child futures that borrow the caller's data.
export const codeExampleFibers = `use asupersync::cx::fiber;
use asupersync::main;

#[main]
async fn main() {
    let words = vec!["structured", "concurrency", "over", "borrowed", "data"];
    let words = &words;
    let letters = fiber::scope(|scope| async move {
        let handles: Vec<_> = words
            .iter()
            .map(|word| scope.spawn(async move { word.len() }))
            .collect();
        let mut letters = 0;
        for handle in handles {
            letters += handle.await.expect("fiber finished");
        }
        letters
    })
    .await;
    assert_eq!(letters, words.iter().map(|word| word.len()).sum::<usize>());
    println!("{letters} letters counted by {} fibers", words.len());
}`;

// The same seed replays the same execution (examples/deterministic_test.rs).
export const codeExampleLab = `use asupersync::lab::{LabRunReport, run_async_under_lab};
use asupersync::prelude::*;

fn main() {
    let (total, report) = fanout(7);
    assert_eq!(total, fanout(7).0, "same seed must replay identically");
    assert!(report.quiescent, "region close implies quiescence");
    assert!(report.invariant_violations.is_empty(), "nothing leaked");
    println!("deterministic: replayed {total} under seed 7, quiescent, 0 violations");
}

/// Sums a fan-out of 8 children under the deterministic lab runtime.
fn fanout(seed: u64) -> (u32, LabRunReport) {
    run_async_under_lab(seed, |cx| async move {
        let mut set = JoinSet::in_cx(&cx);
        for i in 0..8_u32 {
            set.spawn(&cx, move |_| async move { Ok::<_, ()>(i) })
                .expect("spawn");
        }
        let outcomes = set.join_all(&cx).await;
        outcomes.into_iter().map(|o| o.expect("member ok")).sum()
    })
}`;

// Roadmap, from the upstream README.
export const changelog: ChangelogEntry[] = [
  {
    period: "Phase 0 · Complete",
    title: "Deterministic single-thread kernel",
    items: [
      "Regions, tasks, and the cancellation state machine",
      "A four-valued Outcome ordered by severity: Ok < Err < Cancelled < Panicked",
      "The lab runtime: virtual time, seeded scheduling, trace capture",
    ],
  },
  {
    period: "Phase 1 · Complete",
    title: "Parallel scheduler and region heap",
    items: [
      "Three-lane work-stealing scheduler: cancel, timed (EDF), and ready",
      "Region heap with generation-checked handles, reclaimed when the region closes",
      "Optional sharded runtime state with a fixed lock order",
    ],
  },
  {
    period: "Phase 2 · Partial",
    title: "I/O and protocols",
    items: [
      "epoll reactor with optional io_uring; narrower BSD and Windows reactors",
      "TCP, HTTP/1.1, HTTP/2, TLS, WebSocket, gRPC, and database clients",
      "Native QUIC and HTTP/3; deployment and interop evidence still open",
    ],
  },
  {
    period: "Phase 3 · Complete",
    title: "Actors and supervision",
    items: [
      "GenServers, actors, monitors, and links, on the native runtime and in the lab",
      "Live supervision trees: one-for-one, one-for-all, rest-for-one",
      "Restart intensity and backoff limits",
    ],
  },
  {
    period: "Phase 4 · Core complete",
    title: "Distributed structured concurrency",
    items: [
      "Region-owned remote spawn over TCP with mutual TLS",
      "Leases as obligations, an idempotency store, saga compensation",
      "RaptorQ snapshot distribution with quorum recovery",
    ],
  },
  {
    period: "Phase 5 · Partial",
    title: "Schedule exploration and formal tooling",
    items: [
      "Race-guided seed exploration that skips equivalent traces",
      "TLA+ export of lab traces, checked by TLC",
      "Lean checks six model invariants; there is no Rust refinement proof yet",
    ],
  },
  {
    period: "Phase 6 · Ongoing",
    title: "Hardening",
    items: [
      "Benchmark, golden-output, flamegraph, and proof-note gates before each commit to main",
      "Browser Edition packages, currently a release candidate",
      "Cutting per-task overhead, measured against tokio in the same process",
    ],
  },
];

// Glossary terms, kept alphabetical. Tooltip looks them up by name.
export const glossaryTerms: GlossaryTerm[] = [
  { term: "Ambient Authority", short: "Effects a task can perform without being handed the right to", long: "The ability to open a socket, read the clock, or spawn a task just because a global runtime is reachable. Asupersync routes runtime-managed effects through Cx instead. One of the six invariants Lean checks on the abstract model is \"no ambient authority\". In the Rust code the boundary is narrower: host-boundary helpers such as OS entropy for temporary file names stay outside it and are documented as such." },
  { term: "Budget", short: "Deadline, poll quota, cost quota, and priority for a piece of work", long: "A small Copy struct: an optional absolute deadline, a poll quota, an optional abstract cost quota, and a priority from 0 to 255. Scopes and tasks carry one, and nested budgets combine with meet, so the tighter constraint always wins. On the production runtime, cleanup budgets are advisory: a task that runs past its budget is not killed." },
  { term: "Budget Algebra", short: "How nested budgets combine", long: "meet(a, b) takes the earlier deadline, the smaller poll quota, the smaller cost quota, and the higher priority. Because each component is a min or a max, the operation is associative and commutative, so it doesn't matter in which order nested scopes apply their limits. A child can never end up with a looser budget than the scope it runs in." },
  { term: "CALM Analysis", short: "Sorting saga steps into coordination-free and barrier-requiring", long: "Consistency As Logical Monotonicity applied to obligations. Asupersync's saga operations come in 16 kinds: 7 are monotone (Reserve, Send, Acquire, Renew, Delegate, CrdtMerge, CancelRequest) and 9 are not (Commit, Abort, Recv, Release, RegionClose, CancelDrain, MarkLeaked, BudgetCheck, LeakDetection). MonotoneSagaExecutor merges runs of monotone steps with a lattice join and puts a coordination barrier before each non-monotone one." },
  { term: "CALM Theorem", short: "Consistency As Logical Monotonicity", long: "A result from distributed systems (Hellerstein and Alvaro): a program has a consistent, coordination-free implementation exactly when it is monotone, meaning it never has to retract a conclusion it already drew. Asupersync uses it to decide which saga steps can be batched without synchronization." },
  { term: "Cancel Potential", short: "The quantity Lean uses to prove the cancel protocol terminates", long: "In the Lean model, a task in cancelRequested has potential mask + 3, cancelling 2, finalizing 1, and completed 0. Every protocol step lowers it, so a cancelled task completes in exactly mask + 3 steps, with the mask depth capped at 64. This is a per-task termination proof about the model; it says nothing about a task that never reaches a cancellation point." },
  { term: "Cancel-Correct", short: "Cancellation that doesn't lose work or leak resources on covered paths", long: "Cancelling a task asks it to stop instead of dropping it mid-poll. The task runs to its next cancellation point, does its own async cleanup, and can return a value; finalizers run; the outcome is Cancelled(reason). Covered surfaces like channel sends use reserve/commit so a cancelled send never half-happens. Partial I/O such as read_exact and write_all states its own, weaker contract." },
  { term: "Cancellation Point", short: "Where a task notices it has been cancelled", long: "cx.checkpoint() returns an error once cancellation has been requested, and cancel-aware awaits such as channel receives and lock acquisitions return early the same way. A task that never reaches one is never forcibly stopped, and it holds up its region's close. Loops that do real work should call cx.checkpoint()." },
  { term: "CancelProtocol Oracle", short: "Checks that tasks follow the cancellation state machine", long: "The cancellation_protocol oracle, one of the nine the lab runtime feeds on every run. It watches each task's transitions through CancelRequested, Cancelling, Finalizing, and Completed and reports any skipped or out-of-order step." },
  { term: "CancelReason", short: "Why a task was cancelled, with the cause chain", long: "Carries a CancelKind (User, Timeout, Deadline, PollQuota, CostBudget, FailFast, RaceLost, ParentCancelled, ResourceUnavailable, Shutdown, LinkedExit), where it came from, and a bounded chain of causes. The error from cx.checkpoint() carries it, so a joiner can tell why a task stopped. Kinds are ordered by severity, and cleanup budgets shrink as severity rises." },
  { term: "Capability Gate", short: "The check before a runtime-managed effect", long: "Before spawning, reading time, drawing randomness, doing I/O, or talking to a remote node through Cx, the runtime checks the context's capability set. A context narrowed with Cx::restrict can't widen itself again. Most plain I/O entry points such as TcpStream::connect check the calling task's context and refuse with ASUP-E009 when the IO capability is missing." },
  { term: "Capability Row", short: "The five effects a Cx can carry", long: "CapSet<SPAWN, TIME, RANDOM, IO, REMOTE> is a type-level record of which effects a context may perform. Cx::restrict narrows it to a subset, and sealed traits such as HasSpawn and HasIo let a function require a capability in its signature. Separately, Macaroon tokens can attenuate a context at runtime with caveats." },
  { term: "Capability Security", short: "Effects go through an explicit context", long: "Instead of reading a global runtime from thread-local state, async functions take &Cx, and spawning, timers, randomness, tracing, and runtime-managed I/O go through it. You can see what a function is able to do from its signature, and swapping the Cx swaps the interpretation: production, lab, or distributed. It is enforced by the runtime, not proven by the type system." },
  { term: "Conformal Calibration", short: "Distribution-free anomaly thresholds for lab runs", long: "Split conformal prediction over oracle-report metrics across explored seeds. With the default alpha of 0.05, the prediction set covers a new exchangeable run with probability at least 95%, whatever the underlying distribution. It's opt-in through ScheduleExplorer::with_conformal_calibration, which lists seeds whose metrics fall outside the set even when no invariant failed." },
  { term: "Coordination Barrier", short: "A sync point before a non-monotone saga step", long: "MonotoneSagaExecutor runs consecutive monotone steps as one coordination-free batch and inserts a barrier before each non-monotone step such as Commit or Release. The number of barriers is exactly the number of non-monotone steps in the plan." },
  { term: "Cx", short: "The capability context every async function receives", long: "Cx is how a task spawns children, checks for cancellation, reads its budget and the current time, draws randomness, and records traces. It belongs to a region, so anything spawned through it is owned by that region. A test can hand in a lab Cx and the same code runs on virtual time." },
  { term: "Discounted UCB1", short: "The opt-in adaptive cancel-streak selector", long: "With enable_adaptive_cancel_streak(true), each worker picks its cancel-streak limit from {4, 8, 16, 32, 64} with a discounted upper-confidence-bound bandit, updated every 128 dispatches from a reward mixing Lyapunov decrease, fairness, and deadline pressure. It is deterministic (no RNG, no wall clock). It is off by default: measured against the fixed limit of 16, it didn't win on cancel-heavy work and was 1–29% slower elsewhere." },
  { term: "DPOR", short: "Dynamic partial-order reduction, as used here: race-guided search", long: "Classic DPOR explores one schedule per class of equivalent interleavings. Asupersync's explorer borrows the ideas: it detects races with vector clocks, derives new seeds that target them, and skips runs whose Foata fingerprint it has already seen. It doesn't backtrack to an exact prefix, so it is useful bug-finding machinery rather than a proof that every class was covered." },
  { term: "Drain Phase", short: "The cancelled task finishing its own cleanup", long: "After a cancel request is acknowledged, the task is Cancelling: it runs its own async cleanup, can still await, and can still produce a value. The scheduler gives cancelling tasks priority on the cancel lane. Drain ends when the task's future completes." },
  { term: "E-Process", short: "A test statistic you can check after every run", long: "A nonnegative supermartingale under the null hypothesis. By Ville's inequality, the chance it ever exceeds 1/α is at most α, so you can look after every observation without inflating the false-alarm rate. The lab's standard monitor tracks task_leak, obligation_leak, and quiescence; each observation is that oracle's own verdict for a run, so it summarizes violation rates across seeds rather than finding new bugs." },
  { term: "EXP3", short: "Adversarial bandit used by ATP's RaptorQ transport", long: "Exponential weights for exploration and exploitation. ATP's opt-in adaptive RaptorQ adapter uses it to choose a block size and fan-out, with η = 0.1 as both the exploration mix and the learning rate. It is not the scheduler's selector; that one is discounted UCB1." },
  { term: "Fiber", short: "A borrowing future that runs inside the calling task", long: "cx::fiber::scope(|s| …) runs fibers concurrently on the calling task's thread. They can borrow from the task's stack (no 'static bound), each has its own cancellation, a panicking fiber cancels its siblings, and the scope waits for all of them. A fiber costs about what a tokio task does. They are concurrent, not parallel." },
  { term: "Fiedler Value", short: "Algebraic connectivity of the wait graph", long: "The second-smallest eigenvalue of a graph's Laplacian. It's zero exactly when the graph is disconnected and small when the graph has a bottleneck. Asupersync's spectral health monitor tracks its trend on the live wait graph as one early-warning signal. A falling value is a topology signal, not proof of a deadlock." },
  { term: "Finalize Phase", short: "Finalizers run, masked from further cancellation", long: "Once a cancelled task's future completes, the runtime runs its registered finalizers with cancellation masked, then publishes the terminal outcome. Region close works the same way at a larger scale: children first, then the region's finalizers, then Completed." },
  { term: "Foata Fingerprint", short: "A canonical hash of an execution up to reordering", long: "Two traces that differ only by swapping adjacent independent events are equivalent (Mazurkiewicz equivalence). Foata normal form picks one canonical representative by grouping events into layers. Hashing it gives a fingerprint the schedule explorer uses to skip runs that are equivalent to one it has already seen." },
  { term: "Fountain Code", short: "A rateless erasure code", long: "The sender can produce as many encoded symbols as it likes, and the receiver rebuilds the data from any sufficient set of them, regardless of which ones arrived. Lost packets cost bandwidth instead of round trips. RaptorQ is the standardized one." },
  { term: "Futurelock", short: "A task holding obligations that has stopped making progress", long: "The lab runtime flags a task that still holds pending obligations but hasn't been polled for longer than futurelock_max_idle_steps, for example one parked while holding a semaphore permit. It emits a FuturelockDetected trace event with the task, region, and held obligations, and can panic on the spot." },
  { term: "GenServer", short: "An OTP-style stateful server", long: "A task that owns state and handles call, cast, and info messages from a bounded mailbox, spawned with cx.spawn_gen_server. Each call hands the server a Reply that wraps a tracked obligation: the server must send or abort it. Dropping it unanswered panics outside of cancellation and unwinding, and the lab's reply_linearity oracle checks the same rule. This is enforced at runtime, not by the compiler." },
  { term: "Hedge", short: "Start a backup request after a delay; first answer wins", long: "Scope::hedge starts the primary, waits a delay, starts a backup if the primary hasn't answered, and returns whichever finishes first, then aborts and joins the other. The standalone hedge() future drops the loser instead." },
  { term: "IoCap", short: "The I/O capability trait", long: "A trait object for I/O authority. Production code uses the real one; the lab substitutes LabIoCap, which is how virtual TCP and other deterministic I/O get in without changing call sites." },
  { term: "JoinSet", short: "Dynamic fan-out owned by one region", long: "JoinSet::in_cx(cx) or JoinSet::new(&scope) collects tasks spawned at runtime. join_next, join_all, and cancel_all all keep ownership of the drain, so nothing in the set outlives it unnoticed. join_all returns outcomes in spawn order." },
  { term: "Lab Runtime", short: "The deterministic test runtime", long: "Runs async code on virtual time with a seeded scheduler, so the same seed reproduces the same schedule. It captures traces, injects cancellation and chaos deterministically, detects futurelocks, writes crashpacks for failing runs, and checks oracles. Concurrency bugs become reproducible test failures instead of flakes." },
  { term: "Lease", short: "A time-bounded claim that counts as an obligation", long: "Remote leases are obligation-backed: they must be renewed or allowed to expire, and a region can't close while one is unresolved. Name leases in the Spork registry are reserve/commit tokens that panic if dropped unresolved, but region close doesn't wait for them yet." },
  { term: "Linear Obligations", short: "Things that must be resolved exactly once", long: "Linear logic's rule applied to permits, acks, and leases. Rust's type system is affine (values can be dropped), so Asupersync enforces the \"exactly once\" part at runtime: #[must_use], drop behavior, an obligation table, and leak oracles. A forgotten obligation is reported loudly at region close or by the lab, not caught by the compiler." },
  { term: "Luby Transform", short: "The first practical fountain code", long: "LT codes combine random subsets of source symbols, with the subset size drawn from a carefully shaped degree distribution (Michael Luby, 2002). RaptorQ adds a precode on top so decoding needs only a small, fixed overhead." },
  { term: "Lyapunov Potential", short: "A weighted measure of outstanding work", long: "V = 1.0·live tasks + 5.0·total obligation age + 3.0·draining regions + 2.0·deadline pressure, with those default weights. The optional Lyapunov governor uses it to steer lane ordering so that V tends not to increase. The governor is off by default." },
  { term: "Macaroon", short: "A bearer token that can only gain restrictions", long: "An HMAC-SHA256 chained token: each added caveat re-keys the signature, so anyone can attenuate a token but nobody can remove a caveat. Asupersync's caveats are TimeBefore, TimeAfter, RegionScope, TaskScope, MaxUses, ResourceScope (a glob), RateLimit, and Custom. Cx::attenuate applies them to a context. Checking spawns against a macaroon is opt-in via RuntimeBuilder::with_spawn_authorization_key." },
  { term: "Mailbox", short: "A bounded message queue for an actor or server", long: "Actors and GenServers receive messages through a mailbox with a fixed capacity, so a slow consumer applies backpressure instead of growing without bound. The capacity is the second argument to spawn_actor and spawn_gen_server." },
  { term: "Mazurkiewicz Trace", short: "An execution modulo reordering of independent events", long: "If two adjacent events touch different resources, swapping them can't change the result. Mazurkiewicz traces are the equivalence classes this swapping produces. The lab treats executions this way so it can recognize two schedules as the same behavior." },
  { term: "Monotone Operation", short: "A step that only adds information", long: "An operation whose effect never has to be retracted, so its order relative to other monotone operations doesn't matter. In Asupersync's saga model the monotone kinds are Reserve, Send, Acquire, Renew, Delegate, CrdtMerge, and CancelRequest. Runs of them can be merged without coordination." },
  { term: "Non-Monotone Operation", short: "A step that depends on absence or finality", long: "An operation such as Commit, Release, or RegionClose that relies on knowing nothing else will arrive, like closing a region only if zero tasks remain. Those need a coordination barrier first. Nine of the sixteen saga operation kinds are non-monotone." },
  { term: "Obligation System", short: "The runtime's table of permits, acks, and leases", long: "When a task reserves a channel slot, takes a semaphore permit, or holds a lease through a runtime-built Cx, the runtime records an obligation. Sending, releasing, or aborting resolves it. A region can't close with unresolved registered obligations, and the obligation_leak oracle names any that escape, by kind and holder." },
  { term: "ObligationLeak Oracle", short: "Reports permits that escaped unresolved", long: "The obligation_leak oracle. If a permit escapes its task, for example through mem::forget, the oracle reports its kind (such as SendPermit) and its holder. On-ramp level 3 leaks one on purpose to show the report." },
  { term: "Oracle", short: "A lab-runtime invariant check", long: "A monitor that inspects runtime state after a lab run and reports pass or fail for one invariant. There are 24 built in; the lab runtime feeds 9 of them from its own state today (task leak, obligation leak, quiescence, loser drain, finalizer, region tree, deadline monotonicity, cancellation protocol, DOWN order). The other 15 report as passed and are counted as not fed." },
  { term: "Outcome", short: "A four-valued result: Ok, Err, Cancelled, Panicked", long: "Outcome<T, E> keeps cancellation and panics separate from ordinary errors. The variants are ordered by severity, Ok < Err < Cancelled < Panicked, and combinators aggregate with that order, so a worse outcome is never hidden by a better one. HTTP layers map them to 200, 4xx/5xx, 499, and 500." },
  { term: "Permit", short: "A reservation you must commit or abort", long: "tx.reserve(&cx).await gives you a permit for one slot of channel capacity. permit.send(value) commits it; dropping it aborts the reservation and frees the slot. Reserving is cancel-safe, which is how a cancelled send avoids losing or half-sending a message." },
  { term: "Product Semiring", short: "The algebra behind budget composition", long: "Each budget component lives in its own min- or max-based algebra, and a budget is the product of those. The upstream docs call it semiring-like: what matters in practice is that meet is associative, commutative, and idempotent, so nested limits compose without surprises." },
  { term: "Progress Certificate", short: "Diagnostics for whether a drain is converging", long: "Tracks the potential during a drain and labels the phase: warmup, rapid_drain, slow_tail, stalled, or quiescent. It also computes Azuma and Freedman concentration bounds, which at the current horizon are the trivial bound 1, so the phase labels carry the signal. The HTTP/1 and HTTP/2 graceful-drain supervisor uses it; region close does not." },
  { term: "Quiescence", short: "Nothing left running in a region", long: "A region is quiescent when every task it owns has finished, every finalizer has run, and every registered obligation is resolved. Region close waits for quiescence, which is what \"no orphan tasks\" means in practice." },
  { term: "RaptorQ", short: "The RFC 6330 fountain code", long: "A systematic fountain code: the first symbols are the source data itself, and repair symbols can be generated without limit. With K source symbols, receiving K usually suffices and K + 2 almost always does. Asupersync's implementation is deterministic, with a policy-driven decode planner and optional SIMD GF(256) kernels." },
  { term: "Region", short: "The scope that owns tasks", long: "Every task belongs to a region, and regions nest into a tree. Closing a region cancels whatever is still running in it, waits for those tasks to finish, runs finalizers, and resolves obligations before it reports done. Tasks spawned through a Cx belong to that Cx's region; tasks spawned through a RuntimeHandle belong to the root region." },
  { term: "Region Tree", short: "The hierarchy of regions", long: "Regions form a tree rooted at the runtime's root region. Cancelling a region propagates down to its subregions and tasks; completion propagates up. The region_tree oracle checks the tree's structure on every lab run." },
  { term: "Saga", short: "Multi-step work with compensation", long: "Each step has a forward action and a compensating action; if a later step fails, completed steps are compensated in reverse order. remote::Saga provides this for distributed workflows. Separately, the obligation saga planner uses CALM analysis to batch monotone steps between coordination barriers." },
  { term: "Scope", short: "A handle for spawning into a region", long: "cx.scope() gives you a Scope for the current region; scope.region(…) opens a child region that must reach quiescence before it returns. Scopes also host the drain-correct combinators: race, timeout, hedge, quorum, first_ok, pipeline, and map_reduce." },
  { term: "Seed", short: "The number that fixes a lab schedule", long: "The lab scheduler's choices come from a seeded deterministic RNG, so the same seed reproduces the same interleaving, timer order, and chaos injections. A failing seed is a reproducible bug report." },
  { term: "Small-Step Semantics", short: "The formal rules the runtime is designed against", long: "Rules of the form ⟨e, σ⟩ → ⟨e′, σ′⟩. The spec has 23 core rules (spawn, scheduling, the cancel protocol, region close, reserve/commit/abort, join, tick) plus 10 for distributed dedup and sagas. Lean's Step relation has 22 constructors, and the Lean project proves 189 theorems about it with no sorry. That is a proof about the model, not about the Rust code." },
  { term: "Spectral Wait-Graph Analysis", short: "Early-warning diagnostics on the wait graph", long: "Treats the live wait graph as a signal: the Fiedler value trend, spectral gap, and a stack of nonparametric indicators, calibrated with split conformal bounds and an anytime-valid e-process, give a severity of none, watch, warning, or critical. It runs when Diagnostics::analyze_structural_health is called, or continuously only with the opt-in governor. It is advisory, not a deadlock proof." },
  { term: "Spork", short: "Asupersync's OTP-style layer", long: "Supervision, a name registry, and actors on top of regions, obligations, and explicit cancellation: GenServers, supervisors, links, monitors, process groups, and AppSpec for declarative topologies. Processes always belong to a region and can't be detached, and restart and DOWN-message order is deterministic under the lab runtime." },
  { term: "Supermartingale", short: "A process that doesn't increase on average", long: "A sequence whose expected next value, given the past, is at most its current value. Nonnegative supermartingales are the backbone of e-processes: Ville's inequality bounds the chance one ever climbs above 1/α." },
  { term: "Supervisor", short: "Restarts failed children by policy", long: "A Spork supervisor compiles a restart topology over regions: boot order, dependencies, and shutdown budgets. Run live with CompiledSupervisor::bind_managed, it cancels and drains a failed child, then restarts it one-for-one, one-for-all, or rest-for-one, within shared intensity and backoff limits." },
  { term: "TaskHandle", short: "What spawning returns", long: "TaskHandle<T> is the handle for a spawned task. handle.join(cx).await returns Result<T, JoinError>, and JoinError keeps cancellation and panic apart. The task is owned by its region whether or not you join it." },
  { term: "TaskLeak Oracle", short: "Reports tasks still alive after their region closed", long: "The task_leak oracle, fed on every lab run. A task that outlives its region would be an orphan, the bug structured concurrency is meant to rule out." },
  { term: "Test Oracle", short: "An invariant check the lab runs for you", long: "See Oracle. Besides the nine fed checks, the registry includes oracles for channel atomicity, waker dedup, actors, supervision, mailboxes, reply linearity, and registry leases that aren't wired into the lab runtime yet." },
  { term: "Three-Lane Scheduler", short: "Cancel, timed, and ready queues", long: "Cancelling tasks go to the cancel lane, deadline-driven tasks to the timed lane (earliest deadline first), everything else to the ready lane. Cancel preemption is bounded: with the default cancel_streak_limit of 16, ready or timed work gets a slot within 17 dispatches per worker, widened to 32 while draining." },
  { term: "Three-Phase Cancel Protocol", short: "Request → drain → finalize", long: "A task moves Running → CancelRequested → Cancelling → Finalizing → Completed(Cancelled). The request propagates down the region tree; the task acknowledges it at a cancellation point and drains its own work; finalizers run masked; then the runtime publishes the outcome. Nothing in it can stop a task that never checks in." },
  { term: "Transition Rule", short: "One rule of the small-step semantics", long: "Each rule says how one kind of step changes the state, for example CANCEL-REQUEST marking a task and propagating to its region's children, or CLOSE-RUN-FINALIZER popping one finalizer. The rule names in the spec match constructors in Lean's Step relation, with a few merged or split." },
  { term: "Two-Phase Effect", short: "Reserve first, commit separately", long: "For surfaces where cancellation could otherwise lose data, the effect is split: reserving is cancel-safe and commits nothing; the commit publishes. Channels work this way, as do TwoPhaseNetworkSend and graded obligation tokens. It isn't a general transaction system: there's no API that rolls back arbitrary side effects." },
  { term: "Wait-Graph", short: "Who is waiting on whom", long: "A directed graph whose nodes are tasks and whose edges mean \"A is waiting on B\". The task inspector reports wait dependencies, and the spectral health monitor analyzes the graph's Laplacian when you ask it to." },
];

// Flywheel
export interface FlywheelTool {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  icon: string;
  color: string;
  href: string;
  features: string[];
  connectsTo: string[];
  connectionDescriptions: Record<string, string>;
  projectSlug?: string;
  demoUrl?: string;
  stars?: number;
}

export const flywheelDescription = {
  title: "The AI Flywheel",
  subtitle: "The agent tooling Asupersync was built with.",
  description: "Jeffrey Emanuel wrote Asupersync with swarms of coding agents working in parallel on one repository. These are the tools that keep them coordinated: messaging and file reservations, an issue graph, session search, safety guards for destructive commands, and a bug scanner that runs before every commit.",
};

export const flywheelTools: FlywheelTool[] = [
  {
    id: "ntm",
    name: "Named Tmux Manager",
    shortName: "NTM",
    href: "https://github.com/Dicklesworthstone/ntm",
    icon: "LayoutGrid",
    color: "from-sky-500 to-blue-600",
    tagline: "Multi-agent tmux orchestration",
    connectsTo: ["slb", "mail", "cass", "bv"],
    connectionDescriptions: {
      slb: "Routes dangerous commands through safety checks",
      mail: "Human Overseer messaging and file reservations",
      cass: "Duplicate detection and session history search",
      bv: "Dashboard shows beads status; --robot-triage for dispatch",
    },
    stars: 133,
    projectSlug: "named-tmux-manager",
    features: [
      "Spawn 10+ Claude/Codex/Gemini agents in parallel",
      "Smart broadcast with type/variant/tag filtering",
      "60fps animated dashboard with health monitoring",
    ],
  },
  {
    id: "slb",
    name: "Simultaneous Launch Button",
    shortName: "SLB",
    href: "https://github.com/Dicklesworthstone/slb",
    icon: "ShieldCheck",
    color: "from-red-500 to-rose-600",
    tagline: "Peer review for dangerous commands",
    connectsTo: ["mail", "ubs"],
    connectionDescriptions: {
      mail: "Notifications sent to reviewer inboxes",
      ubs: "Pre-flight scans before execution",
    },
    stars: 56,
    projectSlug: "simultaneous-launch-button",
    features: [
      "Three-tier risk classification (CRITICAL/DANGEROUS/CAUTION)",
      "Cryptographic command binding with SHA256+HMAC",
      "Dynamic quorum based on active agents",
    ],
  },
  {
    id: "mail",
    name: "MCP Agent Mail",
    shortName: "Mail",
    href: "https://github.com/Dicklesworthstone/mcp_agent_mail",
    icon: "Mail",
    color: "from-amber-500 to-yellow-600",
    tagline: "Inter-agent messaging & coordination",
    connectsTo: ["bv", "cm", "slb"],
    connectionDescriptions: {
      bv: "Task IDs link conversations to Beads issues",
      cm: "Shared context across agent sessions",
      slb: "Approval requests delivered to inboxes",
    },
    stars: 1654,
    demoUrl: "https://dicklesworthstone.github.io/cass-memory-system-agent-mailbox-viewer/viewer/",
    projectSlug: "mcp-agent-mail",
    features: [
      "GitHub-flavored Markdown messaging between agents",
      "Advisory file reservations to prevent conflicts",
      "SQLite-backed storage for complete audit trails",
    ],
  },
  {
    id: "bv",
    name: "Beads Viewer",
    shortName: "BV",
    href: "https://github.com/Dicklesworthstone/beads_viewer",
    icon: "GitBranch",
    color: "from-violet-500 to-purple-600",
    tagline: "Graph analytics for task dependencies",
    connectsTo: ["mail", "ubs", "cass"],
    connectionDescriptions: {
      mail: "Task updates trigger mail notifications",
      ubs: "Bug scanner results create blocking issues",
      cass: "Search prior sessions for task context",
    },
    stars: 1211,
    demoUrl: "https://dicklesworthstone.github.io/beads_viewer-pages/",
    projectSlug: "beads-viewer",
    features: [
      "9 graph metrics: PageRank, Betweenness, Critical Path",
      "Robot protocol (--robot-*) for AI-ready JSON",
      "60fps TUI rendering via Bubble Tea",
    ],
  },
  {
    id: "ubs",
    name: "Ultimate Bug Scanner",
    shortName: "UBS",
    href: "https://github.com/Dicklesworthstone/ultimate_bug_scanner",
    icon: "Bug",
    color: "from-orange-500 to-amber-600",
    tagline: "Pattern-based bug detection",
    connectsTo: ["bv", "slb"],
    connectionDescriptions: {
      bv: "Creates issues for discovered bugs",
      slb: "Validates code before risky commits",
    },
    stars: 152,
    projectSlug: "ultimate-bug-scanner",
    features: [
      "1,000+ custom detection patterns across languages",
      "Consistent JSON output for all languages",
      "Perfect for pre-commit hooks and CI/CD",
    ],
  },
  {
    id: "cm",
    name: "CASS Memory System",
    shortName: "CM",
    href: "https://github.com/Dicklesworthstone/cass_memory_system",
    icon: "Brain",
    color: "from-emerald-500 to-green-600",
    tagline: "Persistent memory across sessions",
    connectsTo: ["mail", "cass", "bv"],
    connectionDescriptions: {
      mail: "Stores conversation summaries for recall",
      cass: "Semantic search over stored memories",
      bv: "Remembers task patterns and solutions",
    },
    stars: 212,
    demoUrl: "https://dicklesworthstone.github.io/cass-memory-system-agent-mailbox-viewer/viewer/",
    projectSlug: "cass-memory-system",
    features: [
      "Three-layer cognitive: episodic, working, procedural memory",
      "MCP tools for cross-session context persistence",
      "Built on top of CASS for semantic search",
    ],
  },
  {
    id: "cass",
    name: "Coding Agent Session Search",
    shortName: "CASS",
    href: "https://github.com/Dicklesworthstone/coding_agent_session_search",
    icon: "Search",
    color: "from-cyan-500 to-sky-600",
    tagline: "Unified search across 11+ agent formats",
    connectsTo: ["cm", "ntm", "bv", "mail"],
    connectionDescriptions: {
      cm: "CM integrates CASS for memory retrieval",
      ntm: "Duplicate detection before broadcasting",
      bv: "Links search results to related tasks",
      mail: "Agents query history before asking colleagues",
    },
    stars: 446,
    projectSlug: "cass",
    features: [
      "11 formats: Claude Code, Codex, Cursor, Gemini, ChatGPT, Aider, etc.",
      "Sub-5ms cached search, hybrid semantic + keyword",
      "Multi-machine sync via SSH with path mapping",
    ],
  },
  {
    id: "acfs",
    name: "Flywheel Setup",
    shortName: "ACFS",
    href: "https://github.com/Dicklesworthstone/agentic_coding_flywheel_setup",
    icon: "Cog",
    color: "from-blue-500 to-indigo-600",
    tagline: "One-command environment bootstrap",
    connectsTo: ["ntm", "mail", "dcg"],
    connectionDescriptions: {
      ntm: "Installs and configures NTM",
      mail: "Sets up Agent Mail MCP server",
      dcg: "Installs DCG safety hooks",
    },
    stars: 1006,
    projectSlug: "agentic-coding-flywheel-setup",
    features: [
      "30-minute zero-to-hero setup",
      "Installs Claude Code, Codex, Gemini CLI",
      "All flywheel tools pre-configured",
    ],
  },
  {
    id: "dcg",
    name: "Destructive Command Guard",
    shortName: "DCG",
    href: "https://github.com/Dicklesworthstone/destructive_command_guard",
    icon: "ShieldAlert",
    color: "from-red-600 to-orange-600",
    tagline: "Intercepts dangerous shell commands",
    connectsTo: ["slb", "ntm"],
    connectionDescriptions: {
      slb: "Works alongside SLB for layered command safety",
      ntm: "Guards all commands in NTM-managed sessions",
    },
    stars: 349,
    projectSlug: "destructive-command-guard",
    features: [
      "Intercepts rm -rf, git reset --hard, etc.",
      "SIMD-accelerated pattern matching",
      "Command audit logging",
    ],
  },
  {
    id: "ru",
    name: "Repo Updater",
    shortName: "RU",
    href: "https://github.com/Dicklesworthstone/repo_updater",
    icon: "RefreshCw",
    color: "from-teal-500 to-cyan-600",
    tagline: "Multi-repo sync in one command",
    connectsTo: ["ubs", "ntm"],
    connectionDescriptions: {
      ubs: "Run bug scans across all synced repos",
      ntm: "NTM integration for agent-driven sweeps",
    },
    stars: 49,
    features: [
      "One-command multi-repo sync",
      "Parallel operations with conflict detection",
      "AI code review integration",
    ],
  },
  {
    id: "giil",
    name: "Get Image from Internet Link",
    shortName: "GIIL",
    href: "https://github.com/Dicklesworthstone/giil",
    icon: "Image",
    color: "from-fuchsia-500 to-pink-600",
    tagline: "Download images from share links",
    connectsTo: ["mail", "cass"],
    connectionDescriptions: {
      mail: "Downloaded images can be referenced in Agent Mail",
      cass: "Image analysis sessions are searchable",
    },
    stars: 27,
    features: [
      "iCloud share link support",
      "CLI-based image download",
      "Works over SSH without GUI",
    ],
  },
  {
    id: "xf",
    name: "X Archive Search",
    shortName: "XF",
    href: "https://github.com/Dicklesworthstone/xf",
    icon: "Archive",
    color: "from-indigo-500 to-violet-600",
    tagline: "Ultra-fast X/Twitter archive search",
    connectsTo: ["cass", "cm"],
    connectionDescriptions: {
      cass: "Similar search architecture and patterns",
      cm: "Found tweets can become memories",
    },
    stars: 67,
    features: [
      "Sub-second search over large archives",
      "Semantic + keyword hybrid search",
      "Privacy-preserving local processing",
    ],
  },
  {
    id: "s2p",
    name: "Source to Prompt TUI",
    shortName: "s2p",
    href: "https://github.com/Dicklesworthstone/source_to_prompt_tui",
    icon: "FileCode",
    color: "from-lime-500 to-green-600",
    tagline: "Combine source files into LLM prompts",
    connectsTo: ["cass", "cm"],
    connectionDescriptions: {
      cass: "Generated prompts can be searched later",
      cm: "Effective prompts stored as memories",
    },
    stars: 13,
    features: [
      "Interactive file selection TUI",
      "Real-time token counting",
      "Gitignore-aware filtering",
    ],
  },
  {
    id: "ms",
    name: "Meta Skill",
    shortName: "MS",
    href: "https://github.com/Dicklesworthstone/meta_skill",
    icon: "Sparkles",
    color: "from-pink-500 to-rose-600",
    tagline: "Skill management with effectiveness tracking",
    connectsTo: ["cass", "cm", "bv"],
    connectionDescriptions: {
      cass: "One input source for skill extraction",
      cm: "Skills and CM memories are complementary layers",
      bv: "Graph analysis for skill dependency insights",
    },
    stars: 108,
    features: [
      "MCP server for native AI agent integration",
      "Thompson sampling optimizes suggestions",
      "Multi-layer security (ACIP, DCG, path policy)",
    ],
  },
];

// FAQ
export const faq: FaqItem[] = [
  {
    question: "When should I pick Asupersync over tokio?",
    answer:
      "When structured shutdown, obligation tracking, and reproducible concurrency bugs matter more to you than the last microsecond per task. It suits internal systems that can test their own adapters and cancellation boundaries against their workload. If you need the lowest per-task overhead, or drop-in compatibility with crates hard-wired to tokio, use tokio.",
  },
  {
    question: "How does performance compare to tokio?",
    answer:
      "It's slower per task. Every task carries a region membership, a cancellation state machine, and a terminal-result channel, and that bookkeeping costs time. In a same-process comparison from October 2026, spawn + join was 9–27× slower than tokio and an mpsc round trip 3–7× slower, while a yield on four workers was within 2×. Loopback TCP request/response was 1.1–1.7× slower, and the HTTP/1.1 server handled about half of hyper's requests per second. For fan-out inside one task, fiber::scope costs about the same as a tokio task. For most servers a few microseconds per task disappears next to network and disk latency; for millions of tiny tasks per second, it doesn't.",
  },
  {
    question: "Is it production-ready?",
    answer:
      "Not in the sense tokio is. It's pre-1.0 and experimental. The author's own projects run on it in production, and no independent production user is known. v0.5.0 is on crates.io; main carries the unreleased 0.6.0 line.",
  },
  {
    question: "Can I use tokio crates with it?",
    answer:
      "Not directly. A crate that needs tokio's runtime traits needs a boundary adapter, and the separate asupersync-tokio-compat crate has them for hyper, reqwest, tonic, tower, and axum stacks. The intended order is native Asupersync first, adapters only where a third-party crate insists on tokio. The default build of the runtime itself has no normal dependency on tokio.",
  },
  {
    question: "What does \"cancel-correct\" actually mean here?",
    answer:
      "Cancelling a task asks it to stop. The task keeps running until it reaches a cancellation point, either cx.checkpoint() or a cancel-aware await, then finishes its own async cleanup and can still return a value. The runtime runs finalizers and publishes Cancelled(reason) with the cause chain. Surfaces like channel sends use reserve/commit, so a cancelled send never half-happens. What it won't do is forcibly stop a task that never checks in: that task holds up its region's close.",
  },
  {
    question: "Are cleanup budgets enforced?",
    answer:
      "On the production runtime they're advisory. A task that runs past its budget isn't killed; Runtime::shutdown_timeout bounds how long the caller waits for teardown. Budgets still compose predictably when scopes nest (the earlier deadline, the smaller quota, and the higher priority win), and the scheduler and lab use them.",
  },
  {
    question: "How much of my code has to change?",
    answer:
      "Async functions take &Cx. Spawns go through cx.spawn, a scope, or a JoinSet. sleep and timeout take the current time. Channel sends reserve first, or use the one-call send(). It's still ordinary async/await. The on-ramp covers it in four levels, each a complete program, starting from a plain #[main] that needs no runtime concepts at all.",
  },
  {
    question: "What Rust version do I need?",
    answer:
      "Default features build on stable Rust 1.95 or newer, edition 2024. The one nightly-only piece is the ? operator on Outcome, from the default nightly-outcome-try feature; on stable it's simply inactive and the crate builds without it. The repository's own tests use the nightly pinned in rust-toolchain.toml.",
  },
  {
    question: "How does the lab runtime find bugs?",
    answer:
      "It runs your code on virtual time with a seeded scheduler, so a seed reproduces a schedule exactly. The schedule explorer derives new seeds from the races it detects and skips runs whose traces are equivalent to one it has seen, up to reordering of independent events. On every run, oracles check for task leaks, obligation leaks, quiescence, loser drain, finalizers, the region tree, deadline monotonicity, the cancellation protocol, and DOWN-message order. It's race-guided search, not exhaustive model checking: the number of classes explored is a campaign metric, not a completeness proof.",
  },
  {
    question: "What is formally verified?",
    answer:
      "There's a small-step operational semantics, and a Lean project checks six invariants of that abstract model: single-owner structured concurrency, quiescence at region close, the cancellation protocol, race loser drain, no obligation leaks, and no ambient authority. The Rust runtime hasn't been proved to refine the model. Lab traces can be exported to TLA+ and checked by TLC. Everything else is tests, oracles, and conformance suites.",
  },
  {
    question: "Does it run in the browser?",
    answer:
      "Partly. The Browser Edition compiles to wasm32 and ships JS/TS packages (@asupersync/browser, with React and Next adapters) for the main thread and dedicated workers. They're a release candidate and not yet on npm. In the browser it isn't the native scheduler: it's a ledger of regions, scopes, and task handles over the host's own promises, with fetch, WebSocket, and WebTransport behind capabilities. There's a live WASM demo linked from the home page.",
  },
  {
    question: "Are the fancy algorithms on by default?",
    answer:
      "Mostly not. The adaptive cancel-streak selector (discounted UCB1) and the Lyapunov governor are opt-in; when the adaptive selector was measured against the fixed limit, it didn't win, so the fixed limit stays the default. The spectral wait-graph monitor is a diagnostic you call. E-processes, conformal calibration, and Foata fingerprints live in the lab runtime. They exist to make testing and debugging auditable, not to speed up the production scheduler.",
  },
  {
    question: "Why the name?",
    answer: "\"A super sync\": structured concurrency done right.",
  },
];
