export interface SpecDoc {
  slug: string;
  title: string;
  filename: string;
  category: string;
  description: string;
  order: number;
}

/**
 * Where a mirrored doc lives in the upstream repo. Everything is under docs/
 * except the formal semantics, whose canonical copy is at the repo root
 * (docs/ holds only a redirect stub).
 */
export function specDocUpstreamPath(filename: string): string {
  return filename === "asupersync_v4_formal_semantics.md" ? filename : `docs/${filename}`;
}

/** Link to a mirrored doc in the spec explorer, optionally at a heading. */
export function specDocHref(slug: string, hash?: string): string {
  return `/spec-explorer?doc=${slug}${hash ? `#${hash}` : ""}`;
}

export const specCategories = [
  "Start Here",
  "Formal Semantics",
  "Testing",
  "Security",
  "RaptorQ & ATP",
  "Spork",
  "Operations",
  "Development",
] as const;

export type SpecCategory = (typeof specCategories)[number];

export const specDocs: SpecDoc[] = [
  // ── Start Here ───────────────────────────────────────────────────
  {
    slug: "onramp",
    title: "Graduated On-Ramp",
    filename: "onramp.md",
    category: "Start Here",
    description: "Four levels, each a complete program in examples/: #[main], then Cx and budgets, then scopes and fibers, then obligations and lab oracles.",
    order: 1,
  },
  {
    slug: "integration",
    title: "Integration Guide",
    filename: "integration.md",
    category: "Start Here",
    description: "Architecture, API orientation, tutorials, the Tokio migration playbook, and the per-lane support matrix.",
    order: 2,
  },
  {
    slug: "macro-dsl",
    title: "Macro DSL",
    filename: "macro-dsl.md",
    category: "Start Here",
    description: "#[main], #[test], scope!, spawn!, join!, join_all!, race!, and select!, including which forms drain losers and which drop them.",
    order: 3,
  },
  {
    slug: "wasm",
    title: "Browser Edition (WASM)",
    filename: "WASM.md",
    category: "Start Here",
    description: "What the browser build does today, what it doesn't, and the preview Rust-to-WASM lane.",
    order: 4,
  },

  // ── Formal Semantics ─────────────────────────────────────────────
  {
    slug: "formal-semantics",
    title: "V4 Formal Semantics",
    filename: "asupersync_v4_formal_semantics.md",
    category: "Formal Semantics",
    description: "The small-step operational semantics the runtime is designed against, plus the TLA+ sketch.",
    order: 10,
  },
  {
    slug: "calm-analysis",
    title: "CALM Analysis",
    filename: "calm_analysis.md",
    category: "Formal Semantics",
    description: "Which saga operations are monotone (coordination-free) and which need a barrier.",
    order: 11,
  },
  {
    slug: "otp-comparison",
    title: "OTP Comparison",
    filename: "otp_comparison.md",
    category: "Formal Semantics",
    description: "How Spork's supervision model lines up with Erlang/OTP, and where it differs.",
    order: 12,
  },

  // ── Testing ──────────────────────────────────────────────────────
  {
    slug: "cancellation-testing",
    title: "Cancellation Testing",
    filename: "cancellation-testing.md",
    category: "Testing",
    description: "Deterministic cancellation injection at await points, checked by the lab oracles.",
    order: 20,
  },
  {
    slug: "benchmarking",
    title: "Benchmarking",
    filename: "benchmarking.md",
    category: "Testing",
    description: "Benchmark suites, methodology, and how the baseline gate compares runs.",
    order: 21,
  },
  {
    slug: "replay-debugging",
    title: "Replay Debugging",
    filename: "replay-debugging.md",
    category: "Testing",
    description: "Recording lab traces and replaying them to reproduce a concurrency bug.",
    order: 22,
  },

  // ── Security ─────────────────────────────────────────────────────
  {
    slug: "security-threat-model",
    title: "Security Threat Model",
    filename: "security_threat_model.md",
    category: "Security",
    description: "Threat model and security invariants for capabilities, resource exhaustion, and protocol surfaces.",
    order: 30,
  },
  {
    slug: "threat-model",
    title: "THREAT_MODEL",
    filename: "THREAT_MODEL.md",
    category: "Security",
    description: "Top-level threat model with attack trees and mitigations.",
    order: 31,
  },

  // ── RaptorQ & ATP ────────────────────────────────────────────────
  {
    slug: "atp-architecture",
    title: "ATP Architecture",
    filename: "atp_architecture.md",
    category: "RaptorQ & ATP",
    description: "The Asupersync Transfer Protocol: object-graph transfer, the QUIC boundary, verification, and the CLI/daemon/SDK surfaces.",
    order: 40,
  },
  {
    slug: "quic-atp-threat-model",
    title: "ATP-over-QUIC Threat Model",
    filename: "quic_atp_threat_model.md",
    category: "RaptorQ & ATP",
    description: "What ATP over QUIC protects against (X.509, verified control channel, symbol auth, replay, downgrade) and what it doesn't claim.",
    order: 41,
  },
  {
    slug: "raptorq-baseline-bench",
    title: "RaptorQ Baseline Bench Profile",
    filename: "raptorq_baseline_bench_profile.md",
    category: "RaptorQ & ATP",
    description: "Deterministic bench and profile corpus for the RFC 6330 codec, with repro commands.",
    order: 42,
  },
  {
    slug: "raptorq-rollout-policy",
    title: "RaptorQ Controlled Rollout Policy",
    filename: "raptorq_controlled_rollout_policy.md",
    category: "RaptorQ & ATP",
    description: "Staged rollout plan for enabling RaptorQ in production paths.",
    order: 43,
  },
  {
    slug: "raptorq-expected-loss",
    title: "RaptorQ Expected Loss Contract",
    filename: "raptorq_expected_loss_decision_contract.md",
    category: "RaptorQ & ATP",
    description: "Decision contract for choosing repair overhead under expected packet loss.",
    order: 44,
  },
  {
    slug: "raptorq-optimization",
    title: "RaptorQ Optimization Records",
    filename: "raptorq_optimization_decision_records.md",
    category: "RaptorQ & ATP",
    description: "Decision records for each codec optimization, including the ones that didn't pay off.",
    order: 45,
  },
  {
    slug: "raptorq-closure-backlog",
    title: "RaptorQ Closure Backlog",
    filename: "raptorq_post_closure_opportunity_backlog.md",
    category: "RaptorQ & ATP",
    description: "Remaining codec opportunities after the main program closed.",
    order: 46,
  },
  {
    slug: "raptorq-closure-signoff",
    title: "RaptorQ Closure Signoff",
    filename: "raptorq_program_closure_signoff_packet.md",
    category: "RaptorQ & ATP",
    description: "Signoff packet for the RaptorQ implementation program.",
    order: 47,
  },
  {
    slug: "raptorq-rfc6330",
    title: "RaptorQ RFC 6330 Clause Matrix",
    filename: "raptorq_rfc6330_clause_matrix.md",
    category: "RaptorQ & ATP",
    description: "RFC 6330 clauses mapped to the code and tests that implement them.",
    order: 48,
  },
  {
    slug: "raptorq-unit-tests",
    title: "RaptorQ Unit Test Matrix",
    filename: "raptorq_unit_test_matrix.md",
    category: "RaptorQ & ATP",
    description: "Unit and end-to-end scenario coverage for the codec, with the log schema each emits.",
    order: 49,
  },

  // ── Spork ────────────────────────────────────────────────────────
  {
    slug: "spork-deterministic-ordering",
    title: "Spork Deterministic Ordering",
    filename: "spork_deterministic_ordering.md",
    category: "Spork",
    description: "Ordering rules that make DOWN messages, exits, and restarts replay identically.",
    order: 50,
  },
  {
    slug: "spork-glossary-invariants",
    title: "Spork Glossary & Invariants",
    filename: "spork_glossary_invariants.md",
    category: "Spork",
    description: "Spork's vocabulary (processes, supervisors, links, monitors, name leases) and the invariants each must keep.",
    order: 51,
  },
  {
    slug: "spork-operational-semantics",
    title: "Spork Operational Semantics",
    filename: "spork_operational_semantics.md",
    category: "Spork",
    description: "Operational semantics for Spork's OTP-style layer on top of regions and obligations.",
    order: 52,
  },

  // ── Operations ───────────────────────────────────────────────────
  {
    slug: "deadline-monitoring",
    title: "Deadline Monitoring",
    filename: "deadline-monitoring.md",
    category: "Operations",
    description: "The background deadline monitor: check cadence, warning thresholds, and callbacks.",
    order: 60,
  },
  {
    slug: "runtime-state-contention",
    title: "Runtime State Contention Inventory",
    filename: "runtime_state_contention_inventory.md",
    category: "Operations",
    description: "Every contention point in the runtime's shared state, and what was done about it.",
    order: 61,
  },
  {
    slug: "scheduler-arena-plan",
    title: "Scheduler Arena Plan",
    filename: "scheduler_arena_plan.md",
    category: "Operations",
    description: "Arena allocation plan for the three-lane scheduler.",
    order: 62,
  },

  // ── Development ──────────────────────────────────────────────────
  {
    slug: "api-audit",
    title: "API Audit",
    filename: "api_audit.md",
    category: "Development",
    description: "Audit of the public API surface and its stability notes.",
    order: 70,
  },
  {
    slug: "bead-harmonization",
    title: "Bead Harmonization Migration",
    filename: "bead-harmonization-migration.md",
    category: "Development",
    description: "Migration plan for harmonizing the project's bead-based issue tracking.",
    order: 71,
  },
];
