"use client";

import Link from "next/link";
import { Copy, Check, ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import SectionShell from "@/components/section-shell";
import RustCodeBlock from "@/components/rust-code-block";
import RobotMascot from "@/components/robot-mascot";
import { specDocHref } from "@/lib/spec-docs";
import GlitchText from "@/components/glitch-text";
import { SyncContainer } from "@/components/sync-elements";
import {
  faq,
  onrampLevels,
  codeExampleFibers,
  codeExampleLab,
  siteConfig,
} from "@/lib/content";

const INSTALL_CRATES = "cargo add asupersync";
const INSTALL_GIT = "cargo add asupersync --git https://github.com/Dicklesworthstone/asupersync";

function CopyCommand({ command, label }: { command: string; label: string }) {
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
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{label}</div>
      <SyncContainer className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-mono text-sm md:text-base min-w-0">
            <span className="text-blue-500 font-bold select-none">$</span>
            <code className="text-white font-bold truncate">{command}</code>
          </div>
          <button
            onClick={handleCopy}
            aria-label={`Copy: ${command}`}
            className="flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-blue-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </SyncContainer>
    </div>
  );
}

const HABITS = [
  {
    instead: "A long loop that never awaits anything cancel-aware",
    write: "cx.checkpoint()? inside the loop",
    why: "Cancellation is cooperative. A task that never reaches a cancellation point is never stopped, and its region can't close.",
  },
  {
    instead: "std::time::Instant::now()",
    write: "cx.now()",
    why: "The lab runtime runs on virtual time. Reading the wall clock makes a seed stop reproducing its schedule.",
  },
  {
    instead: "rand::random::<u64>()",
    write: "cx.random_u64()",
    why: "Ambient entropy breaks determinism the same way the wall clock does.",
  },
  {
    instead: "Awaiting something unrelated while holding a permit",
    write: "Reserve as late as you can, send right away",
    why: "A task parked on other work while it holds a permit or semaphore slot is what the lab reports as a futurelock.",
  },
  {
    instead: "Detaching a background task",
    write: "Spawn it into a scope or a JoinSet you own",
    why: "There's no detached spawn. Decide which region owns the work, and that region's close will wait for it.",
  },
];

const FEATURE_FLAGS = [
  { flag: "tls", what: "TLS through rustls with the ring provider. Add tls-native-roots or tls-webpki-roots for root certificates." },
  { flag: "http2-streaming", what: "Live HTTP/2 request bodies with bounded queues and consumption-based flow control." },
  { flag: "quic, http3", what: "Native QUIC and HTTP/3 (http3 implies quic). Partial: single-connection and listener paths are tested; deployment interop isn't." },
  { flag: "postgres, mysql, sqlite", what: "Database clients. PostgreSQL and MySQL speak the wire protocol directly; SQLite runs on the blocking pool." },
  { flag: "io-uring", what: "The Linux io_uring reactor (kernel 5.1+)." },
  { flag: "metrics, tracing-integration", what: "OpenTelemetry metrics and tracing spans. Neither pulls in tokio." },
  { flag: "tower", what: "Adapters for tower's Service trait." },
  { flag: "atp-cli", what: "The standalone atp file-transfer binary." },
];

export default function GettingStartedPage() {
  return (
    <main id="main-content">
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-28">
              <RobotMascot />
            </div>
          </div>

          <GlitchText trigger="hover" intensity="medium">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
              Get Started
            </h1>
          </GlitchText>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
            Four short programs take you from a plain <code className="text-blue-300 font-mono">#[main]</code> to
            a lab test that catches a leaked permit. Each one is a real file in the repository&apos;s{" "}
            <code className="text-blue-300 font-mono">examples/</code> directory.
          </p>
        </div>
      </section>

      {/* Installation */}
      <SectionShell
        id="install"
        icon="rocket"
        eyebrow="Step 1"
        title="Install"
        kicker={`v${siteConfig.version} is the latest release on crates.io. The main branch carries the unreleased ${siteConfig.mainVersion} line.`}
      >
        <div className="space-y-6">
          <CopyCommand command={INSTALL_CRATES} label={`Latest release (${siteConfig.version})`} />
          <CopyCommand command={INSTALL_GIT} label={`Tracking main (${siteConfig.mainVersion}, unreleased)`} />
          <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-400 leading-relaxed">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <strong className="block text-white mb-2">Rust version</strong>
              Default features build on stable Rust 1.95 or newer, edition 2024. The one nightly-only
              piece is <code className="text-blue-300 font-mono">?</code> on <code className="text-blue-300 font-mono">Outcome</code>; on
              stable it&apos;s inactive and the crate builds without it. The repository pins{" "}
              <code className="text-blue-300 font-mono">nightly-2026-08-31</code> for its own tests.
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <strong className="block text-white mb-2">Default features</strong>
              The macros (<code className="text-blue-300 font-mono">#[main]</code>, <code className="text-blue-300 font-mono">join!</code>,{" "}
              <code className="text-blue-300 font-mono">race!</code>, and friends) and the lab runtime come with
              the default build. TLS, HTTP/3, databases, and io_uring are opt-in features, listed below.
            </div>
          </div>
        </div>
      </SectionShell>

      {/* On-ramp */}
      <SectionShell
        id="onramp"
        icon="terminal"
        eyebrow="Step 2"
        title="The on-ramp"
        kicker="Each level adds one layer. Run any of them from a checkout with cargo run --example onramp_level0 (through 3)."
      >
        <div className="space-y-16">
          {onrampLevels.map((level) => (
            <div key={level.level} className="grid gap-8 lg:grid-cols-12 items-start">
              <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-28">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/80">
                  Level {level.level}
                </div>
                <h3 className="text-2xl font-black text-white">{level.title}</h3>
                <p className="text-slate-400 leading-relaxed">{level.adds}</p>
                <a
                  href={`${siteConfig.github}/blob/main/${level.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-mono text-blue-400 hover:text-blue-300"
                >
                  {level.file}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="lg:col-span-8">
                <SyncContainer withPulse={level.level === 3} accentColor="#3B82F6" className="p-1 md:p-2 bg-black/40">
                  <RustCodeBlock code={level.code} title={level.file.replace("examples/", "")} />
                </SyncContainer>
              </div>
            </div>
          ))}
          <p className="text-slate-500 text-sm">
            The full walkthrough, with what each level&apos;s output means, is the{" "}
            <Link href={specDocHref("onramp")} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              on-ramp guide
            </Link>{" "}
            in the spec docs.
          </p>
        </div>
      </SectionShell>

      {/* Two more */}
      <SectionShell
        id="more-examples"
        icon="sparkles"
        eyebrow="Step 3"
        title="Two more worth reading"
        kicker="Fibers for cheap fan-out over borrowed data, and the lab runtime proving a run replays."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-slate-400 leading-relaxed">
              <code className="text-blue-300 font-mono">fiber::scope</code> runs its fibers inside the calling task, so
              they can borrow from the stack and need no <code className="text-blue-300 font-mono">&apos;static</code> bound.
              The scope returns only after every fiber finishes.
            </p>
            <SyncContainer className="p-1 md:p-2 bg-black/40">
              <RustCodeBlock code={codeExampleFibers} title="fibers_borrowing.rs" />
            </SyncContainer>
          </div>
          <div className="space-y-4">
            <p className="text-slate-400 leading-relaxed">
              The same seed replays the same execution, and the report says whether the run reached
              quiescence and whether any invariant was violated.
            </p>
            <SyncContainer withPulse={true} accentColor="#A855F7" className="p-1 md:p-2 bg-black/40">
              <RustCodeBlock code={codeExampleLab} title="deterministic_test.rs" />
            </SyncContainer>
          </div>
        </div>
      </SectionShell>

      {/* Habits */}
      <SectionShell
        id="habits"
        icon="shield"
        eyebrow="Habits to unlearn"
        title="What trips people up"
        kicker="Most early surprises come from tokio habits that are harmless there and break a guarantee here."
      >
        <div className="space-y-3">
          {HABITS.map((habit) => (
            <div key={habit.write} className="grid gap-4 md:grid-cols-12 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <div className="md:col-span-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Instead of</div>
                <div className="text-slate-400 font-mono text-sm">{habit.instead}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/70 mb-1">Write</div>
                <div className="text-blue-300 font-mono text-sm">{habit.write}</div>
              </div>
              <p className="md:col-span-6 text-slate-400 leading-relaxed text-sm">{habit.why}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* Feature flags */}
      <SectionShell
        id="features"
        icon="package"
        eyebrow="Feature flags"
        title="Turning on the rest"
        kicker="The default build is deliberately small. These are the features applications reach for most."
      >
        <SyncContainer className="overflow-hidden border-blue-500/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Common Cargo features</caption>
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold uppercase tracking-widest text-slate-500">
                  <th scope="col" className="px-4 py-4">Feature</th>
                  <th scope="col" className="px-4 py-4">What it enables</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {FEATURE_FLAGS.map((f) => (
                  <tr key={f.flag}>
                    <td className="px-4 py-3 font-mono text-blue-300 whitespace-nowrap align-top">{f.flag}</td>
                    <td className="px-4 py-3 text-slate-400 min-w-[18rem]">{f.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SyncContainer>
        <p className="mt-6 text-sm text-slate-500">
          The full list, including the browser profiles and the test-only features, is in the{" "}
          <a href={`${siteConfig.github}#feature-flags`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            upstream README
          </a>
          . Migrating an existing tokio service? Start with the{" "}
          <Link href={specDocHref("integration", "tokio-migration-playbook")} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            Tokio migration playbook
          </Link>{" "}
          and its{" "}
          <Link href={specDocHref("integration", "migration-readiness-planner")} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            read-only readiness planner
          </Link>
          , and the repository&apos;s{" "}
          <a href={`${siteConfig.github}/tree/main/skills/asupersync-mega-skill`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            agent skill
          </a>{" "}
          if you work with Claude Code or Codex.
        </p>
      </SectionShell>

      {/* FAQ */}
      <SectionShell
        id="faq"
        icon="fileText"
        eyebrow="FAQ"
        title="Common questions"
        kicker="Including the ones with unflattering answers."
      >
        <div className="space-y-4">
          {faq.map((item) => (
            <details key={item.question} className="group rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-8 py-6 cursor-pointer text-white font-bold hover:text-blue-400 transition-colors">
                {item.question}
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-8 pb-6 text-slate-400 leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </SectionShell>

      <div className="mx-auto max-w-7xl px-6 py-20 flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/architecture" className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 hover:border-blue-500/30 hover:text-white transition-all">
          <BookOpen className="h-4 w-4" />
          Read the architecture guide
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <a href={siteConfig.demoUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 hover:border-blue-500/30 hover:text-white transition-all">
          Open the WASM demo
          <ArrowUpRight className="h-4 w-4" />
        </a>
        <Link href="/glossary" className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 hover:border-blue-500/30 hover:text-white transition-all">
          Browse the glossary
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </main>
  );
}
