"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Compass,
  CornerDownLeft,
  FileText,
  Hash,
  HelpCircle,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useSite } from "@/lib/site-state";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { faq, glossaryTerms, navItems, showcaseDemos, siteConfig } from "@/lib/content";
import { specDocs, specDocHref } from "@/lib/spec-docs";

type Group = "Pages" | "Sections" | "Demos" | "Docs" | "Glossary" | "FAQ" | "Links";

interface Entry {
  id: string;
  group: Group;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string;
  external?: boolean;
}

const GROUP_ORDER: Group[] = ["Pages", "Sections", "Demos", "Docs", "Glossary", "FAQ", "Links"];

const GROUP_ICONS: Record<Group, LucideIcon> = {
  Pages: Compass,
  Sections: Hash,
  Demos: Sparkles,
  Docs: FileText,
  Glossary: BookOpen,
  FAQ: HelpCircle,
  Links: ArrowUpRight,
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/": "Overview, the tokio mapping, measured costs, and what ships",
  "/atp": "Fountain-coded file transfer built on the runtime",
  "/showcase": "25 interactive demos, each labeled with how it ships",
  "/architecture": "Regions, cancellation, obligations, capabilities, scheduler, formal model",
  "/spec-explorer": "The design documents, mirrored from the main repository",
  "/getting-started": "Install, the four-level on-ramp, habits to unlearn, feature flags",
  "/glossary": "Every term the site and the runtime use",
};

const SECTIONS: Omit<Entry, "id" | "group">[] = [
  { title: "Coming from tokio", subtitle: "What maps to what, and three surprises", href: "/#from-tokio", keywords: "migration spawn select joinset mapping" },
  { title: "What it costs", subtitle: "Same-process benchmarks against tokio", href: "/#performance", keywords: "performance benchmark speed slower overhead latency throughput" },
  { title: "What ships today", subtitle: "The built-in stack and each piece's support status", href: "/#features", keywords: "http grpc tls quic database actors browser wasm" },
  { title: "Runtime comparison", subtitle: "Asupersync, tokio, async-std, and smol", href: "/#comparison", keywords: "versus compare async-std smol" },
  { title: "Roadmap", subtitle: "Phases 0 through 6 and where each stands", href: "/#roadmap", keywords: "status phases progress" },
  { title: "Core types", subtitle: "Outcome, Budget, and the Cx signature", href: "/architecture#core-types", keywords: "outcome budget cx types" },
  { title: "The cancellation protocol", subtitle: "Request, drain, finalize, complete", href: "/architecture#cancel", keywords: "cancel kinds reason severity" },
  { title: "What the runtime counts", subtitle: "Obligation kinds, and what isn't one", href: "/architecture#obligations", keywords: "permit lease ack transaction leak" },
  { title: "The capability row", subtitle: "SPAWN, TIME, RANDOM, IO, REMOTE, and macaroons", href: "/architecture#capabilities", keywords: "capset restrict macaroon security" },
  { title: "Three lanes, work stealing", subtitle: "Scheduler bounds and fairness", href: "/architecture#scheduler", keywords: "scheduler lanes cancel streak" },
  { title: "What's actually been proved", subtitle: "Lean, TLA+, and the model-versus-code gap", href: "/architecture#formal-semantics", keywords: "lean proof formal verification tla" },
  { title: "24 oracles, 9 of them fed", subtitle: "The lab runtime's invariant checks", href: "/architecture#oracles", keywords: "oracle lab invariant" },
  { title: "Install", subtitle: "crates.io release or tracking main", href: "/getting-started#install", keywords: "cargo add version msrv rust nightly" },
  { title: "The on-ramp", subtitle: "Four example programs, one layer at a time", href: "/getting-started#onramp", keywords: "tutorial example first program" },
  { title: "What trips people up", subtitle: "tokio habits that break a guarantee here", href: "/getting-started#habits", keywords: "checkpoint instant random futurelock detach" },
  { title: "Feature flags", subtitle: "TLS, HTTP/3, databases, io_uring, and more", href: "/getting-started#features", keywords: "cargo features tls quic http3 postgres mysql sqlite" },
];

const LINKS: Omit<Entry, "id" | "group">[] = [
  { title: "Asupersync on GitHub", subtitle: "Source, issues, and the full README", href: siteConfig.github, external: true, keywords: "repository code" },
  { title: "Live WASM demo", subtitle: "21 browser exhibits of the lifecycle contract", href: siteConfig.demoUrl, external: true, keywords: "browser wasm try" },
  { title: "asupersync on crates.io", subtitle: `Latest release: v${siteConfig.version}`, href: siteConfig.cratesUrl, external: true, keywords: "crate cargo release" },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const INDEX: Entry[] = [
  ...navItems.map((item) => ({
    id: `page:${item.href}`,
    group: "Pages" as const,
    title: item.label,
    subtitle: PAGE_DESCRIPTIONS[item.href],
    href: item.href,
  })),
  ...SECTIONS.map((s) => ({ ...s, id: `section:${s.href}`, group: "Sections" as const })),
  ...showcaseDemos.map((demo) => ({
    id: `demo:${demo.id}`,
    group: "Demos" as const,
    title: demo.title,
    subtitle: demo.summary,
    href: `/showcase#${demo.id}`,
    keywords: `${demo.eyebrow} ${demo.chapter}`,
  })),
  ...specDocs.map((doc) => ({
    id: `doc:${doc.slug}`,
    group: "Docs" as const,
    title: doc.title,
    subtitle: doc.description,
    href: specDocHref(doc.slug),
    keywords: `${doc.category} ${doc.filename}`,
  })),
  ...glossaryTerms.map((t) => ({
    id: `term:${t.term}`,
    group: "Glossary" as const,
    title: t.term,
    subtitle: t.short,
    href: `/glossary?term=${encodeURIComponent(t.term)}`,
    keywords: t.long,
  })),
  ...faq.map((item) => ({
    id: `faq:${slugify(item.question)}`,
    group: "FAQ" as const,
    title: item.question,
    subtitle: item.answer,
    href: "/getting-started#faq",
  })),
  ...LINKS.map((l) => ({ ...l, id: `link:${l.href}`, group: "Links" as const })),
];

const DEFAULT_RESULTS: Entry[] = INDEX.filter(
  (e) => e.group === "Pages" || e.group === "Links" || e.id === "doc:onramp" || e.id === "section:/#from-tokio"
);

// Every query token has to appear somewhere; titles count most.
function rank(entry: Entry, query: string, tokens: string[]): number {
  const title = entry.title.toLowerCase();
  const subtitle = (entry.subtitle ?? "").toLowerCase();
  const keywords = (entry.keywords ?? "").toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += title.split(/[^a-z0-9]+/).some((w) => w.startsWith(token)) ? 24 : 16;
    else if (keywords.includes(token)) score += 6;
    else if (subtitle.includes(token)) score += 4;
    else return 0;
  }
  if (title === query) score += 120;
  else if (title.startsWith(query)) score += 80;
  else if (title.includes(query)) score += 40;
  return score;
}

function search(query: string): Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEFAULT_RESULTS;
  const tokens = q.split(/\s+/);
  return INDEX.map((entry) => ({ entry, score: rank(entry, q, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || GROUP_ORDER.indexOf(a.entry.group) - GROUP_ORDER.indexOf(b.entry.group))
    .slice(0, 40)
    .map((r) => r.entry);
}

interface ResultSection {
  group: Group;
  items: Entry[];
  /** Flat index of the section's first item, for keyboard navigation. */
  start: number;
}

// Group results for display while keeping one flat index for the keyboard.
// Results arrive best-first, so groups appear in order of their best match.
function groupResults(results: Entry[]): ResultSection[] {
  const groups = [...new Set(results.map((r) => r.group))];
  const sections: ResultSection[] = [];
  let start = 0;
  for (const group of groups) {
    const items = results.filter((r) => r.group === group);
    if (items.length === 0) continue;
    sections.push({ group, items, start });
    start += items.length;
  }
  return sections;
}

export default function CommandPalette() {
  const { isPaletteOpen, setPaletteOpen } = useSite();
  if (!isPaletteOpen) return null;
  return <PaletteDialog onClose={() => setPaletteOpen(false)} />;
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useBodyScrollLock(true);

  const sections = useMemo(() => groupResults(search(query)), [query]);
  const ordered = useMemo(() => sections.flatMap((section) => section.items), [sections]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = useCallback(
    (entry: Entry) => {
      onClose();
      if (entry.external) {
        window.open(entry.href, "_blank", "noopener,noreferrer");
        return;
      }
      const url = new URL(entry.href, window.location.origin);
      if (url.pathname !== window.location.pathname) {
        router.push(entry.href);
        return;
      }
      // Same page: update the URL without a navigation transition (the spec
      // explorer and glossary read it through useSearchParams) and scroll.
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      const target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (!url.search) window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [onClose, router]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Page-level shortcuts listen on document (the spec viewer closes its doc
    // on Escape). React's root listener is on document too and registered
    // first, so only stopImmediatePropagation keeps these keys from them.
    if (["Escape", "ArrowDown", "ArrowUp", "Enter", "Tab"].includes(e.key)) {
      e.nativeEvent.stopImmediatePropagation();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (ordered.length ? (i + 1) % ordered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (ordered.length ? (i - 1 + ordered.length) % ordered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = ordered[active];
      if (entry) go(entry);
    } else if (e.key === "Tab") {
      // Keep focus in the dialog; the input is its only focus stop.
      e.preventDefault();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 pt-[10vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the site"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-500/20 bg-[#050d1a] shadow-2xl shadow-blue-950/40"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-5">
          <Search className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search demos, docs, glossary terms, pages…"
            className="h-14 w-full bg-transparent text-base text-white placeholder:text-slate-600 focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={ordered[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">ESC</kbd>
        </div>

        <ul ref={listRef} id={listId} role="listbox" aria-label="Results" className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {ordered.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-slate-500">
              Nothing matches &ldquo;{query}&rdquo;.
            </li>
          )}
          {sections.map(({ group, items, start }) => {
            const Icon = GROUP_ICONS[group];
            return (
              <li key={group} role="presentation">
                <div className="px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">{group}</div>
                <ul role="presentation">
                  {items.map((entry, j) => {
                    const i = start + j;
                    const selected = i === active;
                    return (
                      <li
                        key={entry.id}
                        id={`${listId}-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={selected}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(entry)}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 ${selected ? "bg-blue-500/10" : ""}`}
                      >
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-blue-400" : "text-slate-600"}`} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <div className={`truncate text-sm font-bold ${selected ? "text-white" : "text-slate-300"}`}>{entry.title}</div>
                          {entry.subtitle && <div className="truncate text-xs text-slate-500">{entry.subtitle}</div>}
                        </div>
                        {selected && (
                          <span className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true">
                            {entry.external ? <ArrowUpRight className="h-4 w-4" /> : <CornerDownLeft className="h-4 w-4" />}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-white/5 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          <span>↑↓ to move · Enter to open</span>
          <span>{query.trim() ? `${ordered.length} results` : "Type to search"}</span>
        </div>
      </div>
    </div>
  );
}
