"use client";

import { useRef, useEffect, useCallback, Fragment } from "react";
import { Search, X, Loader2 } from "lucide-react";
import type { SpecDoc } from "@/lib/spec-docs";

interface SpecSearchProps {
  value: string;
  onChange: (value: string) => void;
}

// Fully controlled search input. The previous implementation held a
// separate form-store mirror of `value` via @tanstack/react-form and
// then ran two `useEffect`s that resynchronized prop ↔ form on every
// render with mutually-inverse conditions. The result was a feedback
// loop: a keystroke landed in the form store, effect-1 pushed it up
// to the parent, effect-2 (same render cycle, reading the parent's
// pre-update snapshot) reset the form back to the old prop, the next
// render saw the parent's new value mismatched with the reset form,
// and the cycle repeated until React tripped "Maximum update depth
// exceeded" (the minified error #185 surfaced as the spec-explorer
// Runtime_Fault on every keystroke — see asupersync#38).
//
// The fix is to drop the local form mirror entirely. The input is
// controlled directly by the parent's `value` prop and notifies via
// `onChange` on every keystroke. No internal state, no sync hops, no
// feedback loop.
export default function SpecSearch({ value, onChange }: SpecSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !isInputFocused()) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        handleClear();
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClear]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search docs…"
        aria-label="Search spec documents"
        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all font-medium"
      />
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-all"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      {!value && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded pointer-events-none">
          /
        </kbd>
      )}
    </div>
  );
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || (el as HTMLElement).isContentEditable;
}

// ── Full-text search ────────────────────────────────────────────────
// The title filter above only sees the registry. This indexes the docs
// themselves, one section per heading, from the same HTML the viewer renders,
// so every hit links to a heading id that exists.

/** Shortest query that searches doc text; shorter ones match too much. */
export const MIN_TEXT_QUERY = 3;

export interface SpecSection {
  doc: SpecDoc;
  /** Heading id in the rendered doc; null for the text before the first heading. */
  id: string | null;
  heading: string;
  text: string;
  headingLower: string;
  textLower: string;
}

export interface SpecHit {
  section: SpecSection;
  snippet: string;
  score: number;
}

export interface SpecHitGroup {
  doc: SpecDoc;
  hits: SpecHit[];
}

const BLOCK_TAGS = new Set(["P", "LI", "TR", "TD", "TH", "PRE", "BLOCKQUOTE", "DIV", "TABLE", "UL", "OL", "DT", "DD", "H5", "H6"]);
const SECTION_HEADING = /^H[1-4]$/;

/** Splits a rendered doc into one section per heading that carries an id. */
export function buildSections(doc: SpecDoc, html: string): SpecSection[] {
  const template = document.createElement("template");
  template.innerHTML = html;

  const sections: SpecSection[] = [];
  let current = { id: null as string | null, heading: doc.title, parts: [] as string[] };
  const flush = () => {
    const text = current.parts.join("").replace(/\s+/g, " ").trim();
    if (!text && current.id === null) return;
    sections.push({
      doc,
      id: current.id,
      heading: current.heading,
      text,
      headingLower: current.heading.toLowerCase(),
      textLower: text.toLowerCase(),
    });
  };

  const walk = (node: Node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        current.parts.push(child.textContent ?? "");
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as Element;
      if (el.tagName === "BR") {
        current.parts.push(" ");
        continue;
      }
      if (SECTION_HEADING.test(el.tagName) && el.id) {
        flush();
        // The viewer appends a "#" anchor to every heading.
        const heading = (el.textContent ?? "").replace(/#$/, "").trim();
        current = { id: el.id, heading, parts: [] };
        continue;
      }
      const block = BLOCK_TAGS.has(el.tagName);
      if (block) current.parts.push(" ");
      walk(el);
      if (block) current.parts.push(" ");
    }
  };
  walk(template.content);
  flush();
  return sections;
}

function countUpTo(haystack: string, needle: string, cap: number): number {
  let count = 0;
  for (let i = haystack.indexOf(needle); i >= 0 && count < cap; i = haystack.indexOf(needle, i + needle.length)) count++;
  return count;
}

function snippetAround(text: string, textLower: string, needles: string[]): string {
  const at = needles.map((n) => textLower.indexOf(n)).filter((i) => i >= 0);
  if (at.length === 0) return text.slice(0, 160) + (text.length > 160 ? "…" : "");
  const first = Math.min(...at);
  let start = Math.max(0, first - 60);
  let end = Math.min(text.length, first + 140);
  if (start > 0) start = text.indexOf(" ", start) + 1 || start;
  if (end < text.length) end = text.lastIndexOf(" ", end) > first ? text.lastIndexOf(" ", end) : end;
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

/**
 * Sections containing every word of the query, grouped by doc. Heading matches
 * rank first, then exact-phrase matches, then how often the words appear.
 */
export function searchSections(sections: SpecSection[], query: string, maxHits = 40, perDoc = 3): SpecHitGroup[] {
  const phrase = query.trim().toLowerCase().replace(/\s+/g, " ");
  const words = [...new Set(phrase.split(" ").filter(Boolean))];
  if (phrase.length < MIN_TEXT_QUERY || words.length === 0) return [];

  const hits: SpecHit[] = [];
  for (const section of sections) {
    const { headingLower, textLower } = section;
    if (!words.every((w) => headingLower.includes(w) || textLower.includes(w))) continue;
    let score = 0;
    if (headingLower.includes(phrase)) score += 100;
    for (const w of words) if (headingLower.includes(w)) score += 20;
    if (textLower.includes(phrase)) score += 30;
    for (const w of words) score += countUpTo(textLower, w, 10);
    hits.push({ section, score, snippet: snippetAround(section.text, textLower, textLower.includes(phrase) ? [phrase] : words) });
  }
  hits.sort((a, b) => b.score - a.score || a.section.doc.order - b.section.doc.order);

  const groups = new Map<string, SpecHitGroup>();
  let kept = 0;
  for (const hit of hits) {
    if (kept >= maxHits) break;
    const slug = hit.section.doc.slug;
    const group = groups.get(slug) ?? { doc: hit.section.doc, hits: [] };
    if (group.hits.length >= perDoc) continue;
    group.hits.push(hit);
    groups.set(slug, group);
    kept++;
  }
  return [...groups.values()];
}

function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (words.length === 0) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-blue-500/20 text-blue-200 rounded-sm">{part}</mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

export function SpecTextResults({
  query,
  groups,
  loading,
  onOpen,
}: {
  query: string;
  groups: SpecHitGroup[];
  loading: boolean;
  onOpen: (doc: SpecDoc, headingId: string | null) => void;
}) {
  const total = groups.reduce((n, g) => n + g.hits.length, 0);
  return (
    <section aria-label="Matches in the text of the docs" className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">In the text</span>
        {loading ? (
          <Loader2 className="h-3 w-3 text-blue-500 animate-spin" aria-label="Searching" />
        ) : (
          <span className="text-[10px] font-bold text-slate-600">{total === 0 ? "no matches" : total}</span>
        )}
      </div>
      {groups.map(({ doc, hits }) => (
        <div key={doc.slug} className="space-y-1">
          <div className="px-1 text-[11px] font-bold text-slate-400">{doc.title}</div>
          {hits.map(({ section, snippet }) => (
            <button
              key={`${doc.slug}#${section.id ?? ""}`}
              onClick={() => onOpen(doc, section.id)}
              className="w-full text-left p-3 rounded-xl border border-transparent hover:bg-white/[0.03] hover:border-white/5 focus-visible:border-blue-500/30 transition-all"
            >
              <div className="text-xs font-bold text-white line-clamp-1">
                <Highlight text={section.heading} query={query} />
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 mt-1 line-clamp-3">
                <Highlight text={snippet} query={query} />
              </p>
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}
