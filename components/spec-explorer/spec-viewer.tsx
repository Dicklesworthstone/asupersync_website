"use client";

import { useState, useEffect, useMemo, useRef, useCallback, useDeferredValue } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ColumnDef, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, ChevronRight, ArrowLeft, Loader2, AlertCircle,
  BookOpen, Shield, Beaker, Wrench, Code2, Network, FlaskConical, Rocket,
} from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { specDocs, specCategories, specDocHref, specDocUpstreamPath, type SpecDoc, type SpecCategory } from "@/lib/spec-docs";
import { SyncContainer } from "@/components/sync-elements";
import GlitchText from "@/components/glitch-text";
import { Magnetic } from "@/components/motion-wrapper";
import SpecSearch, { buildSections, searchSections, SpecTextResults, MIN_TEXT_QUERY, type SpecHitGroup } from "./spec-search";

const categoryIcons: Record<SpecCategory, React.ComponentType<{ className?: string }>> = {
  "Start Here": Rocket,
  "Formal Semantics": BookOpen,
  "Testing": Beaker,
  "Security": Shield,
  "RaptorQ & ATP": Network,
  "Spork": FlaskConical,
  "Operations": Wrench,
  "Development": Code2,
};

marked.setOptions({
  gfm: true,
  breaks: true,
});

type GroupedDocs = Partial<Record<SpecCategory, SpecDoc[]>>;

type SidebarItem =
  | { id: string; type: "heading"; category: SpecCategory }
  | { id: string; type: "doc"; category: SpecCategory; doc: SpecDoc };

const UPSTREAM_BLOB = "https://github.com/Dicklesworthstone/asupersync/blob/main/";

const slugByFilename = new Map(specDocs.map((doc) => [doc.filename, doc.slug]));

// GitHub-style heading slug, so anchors copied from GitHub keep working.
function headingSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\- ]+/gu, "")
    .replace(/ /g, "-");
}

// Give headings ids, keep links between mirrored docs inside the explorer, and
// resolve every other relative link against the doc's location upstream.
function postProcessDocHtml(html: string, filename: string): string {
  const base = new URL(specDocUpstreamPath(filename), UPSTREAM_BLOB);
  const template = document.createElement("template");
  template.innerHTML = html;

  const seen = new Map<string, number>();
  for (const heading of template.content.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4")) {
    const slug = headingSlug(heading.textContent ?? "");
    if (!slug) continue;
    const count = seen.get(slug) ?? 0;
    seen.set(slug, count + 1);
    const id = count === 0 ? slug : `${slug}-${count}`;
    heading.id = id;
    const anchor = document.createElement("a");
    anchor.href = `#${id}`;
    anchor.className = "heading-anchor";
    anchor.setAttribute("aria-label", `Link to this section`);
    anchor.textContent = "#";
    heading.append(anchor);
  }

  for (const anchor of template.content.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = anchor.getAttribute("href") ?? "";
    if (href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    try {
      const resolved = new URL(href, base);
      const target = resolved.pathname.split("/").pop() ?? "";
      const slug = slugByFilename.get(target);
      if (slug) {
        anchor.setAttribute("href", specDocHref(slug, resolved.hash.slice(1) || undefined));
        continue;
      }
      anchor.setAttribute("href", resolved.toString());
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    } catch {
      // Leave malformed hrefs untouched.
    }
  }
  return template.innerHTML;
}

// Opening another doc changes the rendered html, and DocBody then scrolls to
// the URL's #heading. Inside the open doc nothing re-renders, so scroll here.
function navigateInExplorer(href: string) {
  const target = new URL(href, window.location.href);
  const sameDoc = target.searchParams.get("doc") === new URLSearchParams(window.location.search).get("doc");
  window.history.pushState(null, "", href);
  const id = decodeURIComponent(target.hash.slice(1));
  if (!sameDoc || !id) return;
  for (const body of document.querySelectorAll<HTMLElement>(".spec-prose")) {
    // Skip the copy in the layout that is hidden at this width.
    if (body.getClientRects().length === 0) continue;
    body.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

async function loadSpecDocHtml(filename: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`/spec-docs/${filename}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load ${filename}`);
  }

  const text = await res.text();
  const html = await marked.parse(text);
  return postProcessDocHtml(DOMPurify.sanitize(html), filename);
}

export default function SpecViewer() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  // The URL is the source of truth for the open doc, so links are shareable
  // and back/forward move between docs.
  const docParam = searchParams.get("doc");
  const activeDoc = useMemo(() => specDocs.find((doc) => doc.slug === docParam) ?? null, [docParam]);
  // Native pushState: the app router syncs it into useSearchParams without a
  // navigation transition, which stalls against AnimatePresence mode="wait"
  // when one open doc replaces another.
  const setActiveDoc = useCallback((doc: SpecDoc | null) => {
    window.history.pushState(null, "", doc ? specDocHref(doc.slug) : "/spec-explorer");
  }, []);
  const openSection = useCallback((doc: SpecDoc, headingId: string | null) => {
    navigateInExplorer(specDocHref(doc.slug, headingId ?? undefined));
  }, []);
  // ?q= (from the command palette) seeds the search box; it doesn't track it.
  const qParam = searchParams.get("q");
  const [searchQuery, setSearchQuery] = useState(qParam ?? "");
  const [seenQParam, setSeenQParam] = useState(qParam);
  if (qParam !== seenQParam) {
    setSeenQParam(qParam);
    if (qParam !== null) setSearchQuery(qParam);
  }
  const [activeCategory, setActiveCategory] = useState<SpecCategory | "All">("All");
  const specColumns = useMemo<ColumnDef<SpecDoc>[]>(
    () => [
      { accessorKey: "title" },
      { accessorKey: "description" },
      { accessorKey: "category" },
      { accessorKey: "order" },
      { accessorKey: "filename" },
    ],
    []
  );
  // Must be referentially stable: a fresh array on every render invalidates
  // the filtered row model, whose recompute auto-resets the page index, which
  // sets table state and renders again. Once a second render happened (the
  // doc query resolving, a keystroke), that loop ran ~200 times a second and
  // froze the page on any context update.
  const categoryFilter = useMemo(
    () => (activeCategory === "All" ? [] : [{ id: "category", value: activeCategory }]),
    [activeCategory]
  );
  // eslint-disable-next-line react-hooks/incompatible-library
  const specTable = useReactTable({
    data: specDocs,
    columns: specColumns,
    state: {
      globalFilter: searchQuery,
      columnFilters: categoryFilter,
    },
    // No pagination here, so nothing to reset when the filters change.
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").trim().toLowerCase();
      if (!q) return true;

      const { title, description, category } = row.original;
      return (
        title.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q)
      );
    },
  });

  const filteredDocs = specTable
    .getFilteredRowModel()
    .rows
    .map((row) => row.original)
    .toSorted((a, b) => a.order - b.order);

  const groupedDocs = useMemo<GroupedDocs>(() => {
    const groups: GroupedDocs = {};
    for (const doc of filteredDocs) {
      const category = doc.category as SpecCategory;
      if (!groups[category]) groups[category] = [];
      groups[category]!.push(doc);
    }
    return groups;
  }, [filteredDocs]);

  const activeFilename = activeDoc?.filename ?? null;
  const { data: markdown = "", isPending: loading, error: queryError } = useQuery({
    queryKey: ["spec-doc", activeFilename],
    queryFn: ({ signal }) => loadSpecDocHtml(activeFilename!, signal),
    enabled: !!activeFilename,
    staleTime: Infinity,
  });
  const error = queryError instanceof Error ? queryError.message : null;

  // Full-text search loads every doc on the first long-enough query. Going
  // through the per-doc cache means a hit opens instantly afterwards.
  const deferredQuery = useDeferredValue(searchQuery);
  const textSearchActive = deferredQuery.trim().length >= MIN_TEXT_QUERY;
  const { data: sections, isPending: indexing } = useQuery({
    queryKey: ["spec-sections"],
    queryFn: async () => {
      const htmls = await Promise.all(
        specDocs.map((doc) =>
          queryClient.ensureQueryData({
            queryKey: ["spec-doc", doc.filename],
            queryFn: ({ signal }) => loadSpecDocHtml(doc.filename, signal),
            staleTime: Infinity,
          })
        )
      );
      return specDocs.flatMap((doc, i) => buildSections(doc, htmls[i]!));
    },
    enabled: textSearchActive,
    staleTime: Infinity,
  });
  const textHits = useMemo<SpecHitGroup[]>(
    () => (textSearchActive && sections ? searchSections(sections, deferredQuery) : []),
    [textSearchActive, sections, deferredQuery]
  );
  const textSearch = textSearchActive
    ? { query: deferredQuery, groups: textHits, loading: indexing, onOpen: openSection }
    : null;

  const prefetchDoc = (doc: SpecDoc) => {
    void queryClient.prefetchQuery({
      queryKey: ["spec-doc", doc.filename],
      queryFn: ({ signal }) => loadSpecDocHtml(doc.filename, signal),
      staleTime: Infinity,
    });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeDoc && !e.defaultPrevented) {
        setActiveDoc(null);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [activeDoc, setActiveDoc]);

  return (
    <div className="min-h-[80vh]">
      {/* Mobile: full-width list → detail pattern */}
      <div className="lg:hidden">
        <AnimatePresence mode="wait">
          {activeDoc ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setActiveDoc(null)}
                className="flex items-center gap-2 text-sm font-bold text-blue-400 mb-6 hover:text-blue-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to docs
              </button>
              <DocHeader doc={activeDoc} />
              <DocContent html={markdown} loading={loading} error={error} />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <Sidebar
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                groupedDocs={groupedDocs}
                activeDoc={activeDoc}
                onSelect={setActiveDoc}
                onPrefetch={prefetchDoc}
                textSearch={textSearch}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: sidebar + panel */}
      <div className="hidden lg:grid lg:grid-cols-[340px_1fr] gap-0">
        <div className="border-r border-white/5 pr-0 overflow-y-auto max-h-[85vh] custom-scrollbar">
          <div className="pr-6">
            <Sidebar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              groupedDocs={groupedDocs}
              activeDoc={activeDoc}
              onSelect={setActiveDoc}
              onPrefetch={prefetchDoc}
              textSearch={textSearch}
            />
          </div>
        </div>
        <div className="pl-8 overflow-y-auto max-h-[85vh] custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeDoc ? (
              <motion.div
                key={activeDoc.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DocHeader doc={activeDoc} />
                <DocContent html={markdown} loading={loading} error={error} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center"
              >
                <FileText className="h-16 w-16 text-blue-500/20 mb-6" />
                <h2 className="text-2xl font-black text-white mb-3">Select a Document</h2>
                <p className="text-sm text-slate-500 max-w-sm">
                  Choose a spec doc from the sidebar to view its contents.
                  Use <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold">/</kbd> to search.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  groupedDocs,
  activeDoc,
  onSelect,
  onPrefetch,
  textSearch,
}: {
  activeCategory: SpecCategory | "All";
  setActiveCategory: (c: SpecCategory | "All") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  groupedDocs: GroupedDocs;
  activeDoc: SpecDoc | null;
  onSelect: (doc: SpecDoc) => void;
  onPrefetch: (doc: SpecDoc) => void;
  textSearch: React.ComponentProps<typeof SpecTextResults> | null;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    const items: SidebarItem[] = [];

    for (const category of specCategories) {
      const docs = groupedDocs[category];
      if (!docs || docs.length === 0) continue;

      items.push({ id: `heading-${category}`, type: "heading", category });
      for (const doc of docs) {
        items.push({ id: doc.slug, type: "doc", category, doc });
      }
    }

    return items;
  }, [groupedDocs]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: sidebarItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => (sidebarItems[index]?.type === "heading" ? 34 : 82),
    overscan: 8,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rowVirtualizer, sidebarItems.length]);

  return (
    <div className="space-y-6">
      <SpecSearch value={searchQuery} onChange={setSearchQuery} />

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        <CategoryTab
          label="All"
          active={activeCategory === "All"}
          onClick={() => setActiveCategory("All")}
          count={specDocs.length}
        />
        {specCategories.map((cat) => {
          const count = specDocs.filter((d) => d.category === cat).length;
          return (
            <CategoryTab
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              count={count}
            />
          );
        })}
      </div>

      {/* Doc list */}
      {sidebarItems.length > 0 ? (
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const item = sidebarItems[virtualItem.index]!;

              return (
                <div
                  key={item.id}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualItem.index}
                  className="absolute left-0 top-0 w-full"
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  {item.type === "heading" ? (
                    <CategoryHeading category={item.category} />
                  ) : (
                    <DocListItem
                      doc={item.doc}
                      active={activeDoc?.slug === item.doc.slug}
                      onSelect={onSelect}
                      onPrefetch={onPrefetch}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : textSearch ? (
        <p className="px-1 text-xs text-slate-600">No titles match.</p>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="h-8 w-8 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-600">No docs match your search.</p>
        </div>
      )}

      {textSearch && <SpecTextResults {...textSearch} />}
    </div>
  );
}

function CategoryHeading({ category }: { category: SpecCategory }) {
  const CatIcon = categoryIcons[category] || FileText;

  return (
    <div className="flex items-center gap-2 pb-2 pt-4 px-1">
      <CatIcon className="h-3.5 w-3.5 text-blue-500/60" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
        {category}
      </span>
    </div>
  );
}

function DocListItem({
  doc,
  active,
  onSelect,
  onPrefetch,
}: {
  doc: SpecDoc;
  active: boolean;
  onSelect: (doc: SpecDoc) => void;
  onPrefetch: (doc: SpecDoc) => void;
}) {
  return (
    <div className="pb-1">
      <Magnetic strength={0.05}>
        <button
          onClick={() => onSelect(doc)}
          onMouseEnter={() => onPrefetch(doc)}
          onFocus={() => onPrefetch(doc)}
          className={cn(
            "w-full text-left p-3 rounded-xl border transition-all group",
            active
              ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/5"
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm font-bold transition-colors line-clamp-1",
                active ? "text-blue-400" : "text-white group-hover:text-blue-400"
              )}
            >
              {doc.title}
            </span>
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-all",
                active ? "text-blue-400 translate-x-0.5" : "text-slate-700 group-hover:text-slate-500"
              )}
            />
          </div>
          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{doc.description}</p>
        </button>
      </Magnetic>
    </div>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
        active
          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
          : "bg-white/[0.03] text-slate-500 border border-transparent hover:bg-white/[0.06] hover:text-slate-400"
      )}
    >
      {label}
      <span className="ml-1 opacity-50">{count}</span>
    </button>
  );
}

function DocHeader({ doc }: { doc: SpecDoc }) {
  const CatIcon = categoryIcons[doc.category as SpecCategory] || FileText;
  return (
    <div className="mb-8 pb-8 border-b border-white/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <CatIcon className="h-3 w-3 text-blue-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">{doc.category}</span>
        </div>
        <span className="text-[9px] font-mono text-slate-700">{doc.filename}</span>
      </div>
      <GlitchText trigger="hover" intensity="low">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{doc.title}</h1>
      </GlitchText>
      <p className="text-sm text-slate-400 mt-3 font-medium">{doc.description}</p>
    </div>
  );
}

function DocContent({
  html,
  loading,
  error,
}: {
  html: string;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <SyncContainer className="p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
        <p className="text-sm text-red-400 font-bold">{error}</p>
      </SyncContainer>
    );
  }

  return <DocBody html={html} />;
}

function DocBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // The doc is rendered once per layout (mobile and desktop, one hidden by
  // CSS), so ids repeat in the document. Resolve in-doc anchors within this
  // copy, and keep links to other mirrored docs as client-side navigation.
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement).closest("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href) return;
      if (href.startsWith("#")) {
        const target = ref.current?.querySelector<HTMLElement>(`[id="${CSS.escape(decodeURIComponent(href.slice(1)))}"]`);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ block: "start", behavior: "smooth" });
        window.history.replaceState(window.history.state, "", href);
      } else if (href.startsWith("/spec-explorer?")) {
        e.preventDefault();
        navigateInExplorer(href);
      }
    },
    []
  );

  // Once a doc renders, jump to the #heading in the URL if there is one;
  // otherwise start the doc at its top.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const target = hash ? el.querySelector<HTMLElement>(`[id="${CSS.escape(hash)}"]`) : null;
    if (target) {
      target.scrollIntoView({ block: "start" });
    } else {
      el.closest(".custom-scrollbar")?.scrollTo({ top: 0 });
    }
  }, [html]);

  return (
    // Clicks are delegated to the links inside the rendered markdown, which
    // stay keyboard-reachable as ordinary anchors.
    <div
      ref={ref}
      onClick={handleClick}
      className="spec-prose pb-16"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
