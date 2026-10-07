# AGENTS.md — Asupersync Website

## RULE 0.5 - SUITE-WIDE RULES LIVE IN /data/projects/AGENTS.md

The suite-wide rules in **`/data/projects/AGENTS.md`** bind you here too. Read it. Two sections
are load-bearing for perf work and are NOT duplicated below, so they cannot drift out of sync:

- **`## Named Reward-Hacking Patterns (ALL FORBIDDEN)`** — 12 named patterns, several already
  observed in this suite: gate self-weakening (and the exact price of a legitimate gate fix),
  proof-class inflation, golden regeneration reflex, commit-stream pumping, tautological tests,
  easy-lever cherry-picking, close-pump abuse, scope-splitting, spec-editing as progress,
  conformance metastasis, dependency smuggling, bench-path hardcoding.
- **`### Work-Graph Discipline`** — JSONL is truth and `beads.db` is disposable, `br sync
  --import-only` after every pull, single-writer on graph structure, closure on cited evidence
  with blocker beads gated on their named probe, `br dep cycles` stays empty.

The three that most often decide whether a number here is real: a **self-speedup is
MAINTENANCE, not a win** — a win needs the incumbent live in the SAME invocation; **never
weaken a gate to land a change**, and if a gate is genuinely defective, meet the evidence
standard and publish the win/lose split of what the fix admits; and **reporting a loss is a
success** — one line, revert, next lever, no retraction narrative.

---

## RULE NUMBER 1 (NEVER EVER EVER FORGET THIS RULE!!!)

**YOU ARE NEVER ALLOWED TO DELETE A FILE WITHOUT EXPRESS PERMISSION FROM ME OR A DIRECT COMMAND FROM ME.**

Even a new file that you yourself created, such as a test code file. You have a horrible track record of deleting critically important files or otherwise throwing away tons of expensive work that I then need to pay to reproduce.

As a result, you have permanently lost any and all rights to determine that a file or folder should be deleted. You must **ALWAYS** ask and *receive* clear, written permission from me before ever even thinking of deleting a file or folder of any kind!

---

## IRREVERSIBLE GIT & FILESYSTEM ACTIONS — DO-NOT-EVER BREAK GLASS

1. **Absolutely forbidden commands:** `git reset --hard`, `git clean -fd`, `rm -rf`, or any command that can delete or overwrite code/data must never be run unless the user explicitly provides the exact command and states, in the same message, that they understand and want the irreversible consequences.

2. **No guessing:** If there is any uncertainty about what a command might delete or overwrite, stop immediately and ask the user for specific approval. "I think it's safe" is never acceptable.

3. **Safer alternatives first:** When cleanup or rollbacks are needed, request permission to use non-destructive options (`git status`, `git diff`, `git stash`, copying to backups) before ever considering a destructive command.

4. **Mandatory explicit plan:** Even after explicit user authorization, restate the command verbatim, list exactly what will be affected, and wait for a confirmation that your understanding is correct. Only then may you execute it—if anything remains ambiguous, refuse and escalate.

5. **Document the confirmation:** When running any approved destructive command, record (in the session notes / final response) the exact user text that authorized it, the command actually run, and the execution time. If that record is absent, the operation did not happen.

---

## Project Overview

This is the website for **asupersync**, a cancel-correct async runtime for Rust: a Next.js 16 site with interactive demos of the runtime's semantics, an architecture walkthrough, a getting-started guide, the ATP transport page, a glossary, and a browser for the design docs mirrored from upstream.

**Repository:** https://github.com/Dicklesworthstone/asupersync_website

**Upstream project (source of truth for every claim):** https://github.com/Dicklesworthstone/asupersync

**Live Site:** https://asupersync.com (Vercel)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Animations | framer-motion; demos are hand-built SVG/DOM (the ATP page adds one 2D canvas background), no WebGL |
| Data UI | TanStack Table, Virtual, Form, Query |
| Icons | lucide-react |
| Search | Hand-rolled token scorer in the command palette (no search library) |
| Markdown | marked + DOMPurify, client-side, for the mirrored spec docs |
| Testing | Playwright smoke suite (`tests/smoke.spec.ts`) |
| Package Manager | **bun** (NEVER npm, yarn, or pnpm) |
| Deployment | Vercel |

---

## Package Manager — BUN ONLY

We **only** use `bun` in this project. NEVER use `npm`, `yarn`, or `pnpm`.

```bash
# Install dependencies
bun install

# Run dev server
bun dev

# Build for production
bun run build

# Run linting
bun lint

# Run type checking
bun tsc --noEmit
```

Dependencies are managed **exclusively** via `package.json` + `bun.lock`. Do **not** introduce `package-lock.json`, `yarn.lock`, or any other lockfiles.

---

## Code Editing Discipline

**NEVER** run a script that processes/changes code files in this repo. No "code mods" you just invented, no giant regex-based `sed` one-liners, no auto-refactor scripts that touch large parts of the tree.

That sort of brittle, regex-based stuff is always a huge disaster and creates far more problems than it ever solves.

* If many changes are needed but they're **mechanical**, use several subagents in parallel to make the edits, but still apply them **manually** and review diffs.
* If changes are **subtle or complex**, you must methodically do them yourself, carefully, file by file.

---

## Backwards Compatibility & File Sprawl

We do **not** care about backwards compatibility — we want the cleanest possible architecture with **zero tech debt**:

* Do **not** create "compatibility shims".
* Do **not** keep old APIs around just in case. Migrate callers and delete the old API (subject to the no-deletion rule for files; code removal inside a file is fine).

**AVOID** uncontrolled proliferation of code files:

* If you want to change something or add a feature, you MUST revise the **existing** code file in place.
* You may NEVER create files like `componentV2.tsx`, `componentImproved.tsx`, `componentNew.tsx`, etc.
* New code files are reserved for **genuinely new domains** that make no sense to fold into any existing module.
* The bar for adding a new file should be **incredibly high**.

---

## Project Structure

```
├── app/                       # Next.js App Router pages
│   ├── page.tsx               # Homepage: tokio mapping, costs, features, roadmap
│   ├── showcase/              # The interactive demos, one section per demo
│   ├── architecture/          # Core types, cancel protocol, capabilities, proofs
│   ├── getting-started/       # Install, on-ramp, first programs
│   ├── atp/                   # ATP transport page (renders components/atp/)
│   ├── spec-explorer/         # Browser for the mirrored design docs
│   ├── glossary/              # Virtualized term list; ?term=Name deep links
│   └── layout.tsx             # Root layout, metadata, skip link
├── components/
│   ├── viz/                   # One component per demo (dynamically imported)
│   ├── spec-explorer/         # Doc sidebar, search, markdown viewer
│   ├── atp/                   # ATP page body
│   ├── command-palette.tsx    # Ctrl/Cmd+K search over pages, demos, docs, glossary, FAQ
│   ├── client-shell.tsx       # Header, footer, palette, page transitions
│   ├── site-header.tsx        # Navigation header
│   └── ...
├── lib/
│   ├── content.ts             # siteConfig, nav, showcase demos, glossary, FAQ, benchmarks, ...
│   ├── spec-docs.ts           # Registry of mirrored docs (slug, file, category)
│   ├── site-state.tsx         # Lab Mode + palette state, global shortcuts
│   └── utils.ts               # Helper functions
├── public/
│   ├── spec-docs/             # Docs mirrored verbatim from upstream (via sync:docs)
│   └── images/
├── scripts/sync-spec-docs.ts  # `bun run sync:docs <checkout>`: refresh docs, check versions
├── tests/smoke.spec.ts        # Playwright smoke suite
├── hooks/                     # Custom React hooks
└── .beads/                    # Issue tracking (br)
```

---

## Key Components & Patterns

### Interactive Demos (`components/viz/`)

Each demo is a self-contained client component that simulates one piece of runtime behavior (region trees, the cancel protocol, obligations, scheduler lanes, oracles, ...). Key considerations:

* **Accuracy first:** a demo illustrates what the upstream code does. Labels, numbers, and state names must match upstream source; when upstream changes, the demo changes.
* **Lazy Loading:** demos are imported with `dynamic(..., { ssr: false })` so they never block the first paint.
* **Reduced motion:** respect `prefers-reduced-motion`, but never branch server-rendered markup on `useReducedMotion()`; that causes hydration mismatches.
* **Error Boundaries:** `components/error-boundary.tsx` keeps one broken demo from taking down the page.

```tsx
const RegionTreeViz = dynamic(() => import("@/components/viz/region-tree-viz"), { ssr: false });
```

### Content Management

Site content lives in `lib/content.ts`:

* **siteConfig:** name, URLs, `version` (latest on crates.io) and `mainVersion` (unreleased line on main)
* **navItems:** header, footer, and palette navigation
* **showcaseChapters / showcaseDemos:** every showcase demo with its status and upstream `sources`/`docs`; `app/showcase/page.tsx` maps each id to its icon, viz, and prose
* **Homepage data:** features, tokio mappings, benchmark rows, comparison table, roadmap, changelog
* **glossaryTerms, labOracles, faq**

The mirrored doc registry is `lib/spec-docs.ts`. When adding content, edit these files directly — do NOT create separate data files.

### Spec Docs (Markdown)

The files in `public/spec-docs/` are upstream docs copied verbatim; never edit them by hand. `components/spec-explorer/spec-viewer.tsx` fetches one, renders it with marked, sanitizes it with DOMPurify, adds heading anchors, keeps links between mirrored docs inside the explorer, and resolves other relative links to GitHub. The open doc lives in the URL (`/spec-explorer?doc=<slug>#<heading>`).

Refresh them with `bun run sync:docs <path-to-asupersync-checkout>`; add `--check` to only report drift (exit 1). It also compares `siteConfig` versions with upstream `Cargo.toml` and `CHANGELOG.md`.

### Command Palette (Search)

The site has a Ctrl/Cmd+K command palette (also the header's search button):

* Searches pages, homepage/architecture sections, showcase demos, spec docs, glossary terms, and the FAQ
* Implemented in `components/command-palette.tsx`; the index is built from `lib/content.ts` and `lib/spec-docs.ts`, so new demos, docs, and terms show up without extra wiring
* Open state and the global shortcut live in `lib/site-state.tsx`

---

## Static Analysis & Type Safety

**CRITICAL:** After any substantive changes to TypeScript/React code, verify no lint or type errors:

```bash
# Type-check (no emit)
bun tsc --noEmit

# Lint
bun lint
```

If there are errors:
* Read enough context around each one to understand the *real* problem.
* Fix issues at the root cause rather than just silencing rules.
* Re-run until clean.

---

## Testing

We use **Playwright** for end-to-end testing:

```bash
# Install Playwright browsers (one-time)
bunx playwright install

# Build, serve on port 3100, and run the suite
bun run test:e2e

# Against a server you already started on port 3100
PLAYWRIGHT_REUSE_SERVER=1 bunx playwright test
```

Tests live in `tests/`. Tests should:
* Cover critical user flows (every route renders with a clean console and no horizontal overflow, spec doc deep links, palette search, showcase anchors)
* Use realistic scenarios, not mocked data
* Verify the site works across viewport sizes

---

## Deployment (Vercel)

The site deploys automatically to Vercel on push to `main`.

**Before pushing:**
1. Ensure `bun run build` succeeds locally
2. Check for TypeScript errors with `bun tsc --noEmit`
3. Verify the dev server works: `bun dev`

**Vercel Configuration:**
* Framework: Next.js
* Build Command: `bun run build`
* Install Command: `bun install`
* Output Directory: `.next`

---

## Issue Tracking with br (beads_rust)

**IMPORTANT**: This project uses **br (beads_rust)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

**Note:** `br` is non-invasive and never executes git commands. After syncing, you must manually commit the `.beads/` directory.

**CRITICAL GIT RULE**: The `.beads/` directory contains issue tracking state and **MUST ALWAYS BE COMMITTED** with code changes. When committing code changes, you MUST also commit the corresponding `.beads/` files in the same commit to keep issue state synchronized with code state.

**NEVER FORGET THIS**: The ONLY allowed way to interact with beads is via the `br` command. DO NOT TRY TO DIRECTLY READ, CREATE, OR MODIFY BEADS BY MODIFYING JSON OR JSONL FILES. ONLY VIA `br`!

### Why br?

* Dependency-aware: Track blockers and relationships between issues.
* Git-friendly: Exports to JSONL for version control.
* Agent-optimized: JSON output, ready work detection, discovered-from links.
* Prevents duplicate tracking systems and confusion.

### Quick Start

```bash
# Check for ready work
br ready --json

# Create new issues
br create "Issue title" -t bug|feature|task -p 0-4 --json
br create "Issue title" -p 1 --deps discovered-from:br-123 --json

# Claim and update
br update br-42 --status in_progress --json
br update br-42 --priority 1 --json

# Complete work
br close br-42 --reason "Completed" --json

# View statistics
br stats
```

### Issue Types

* `bug` - Something broken
* `feature` - New functionality
* `task` - Work item (tests, docs, refactoring)
* `epic` - Large feature with subtasks
* `chore` - Maintenance (dependencies, tooling)

### Priorities

* `0` - Critical (security, broken builds)
* `1` - High (major features, important bugs)
* `2` - Medium (default, nice-to-have)
* `3` - Low (polish, optimization)
* `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `br ready` shows unblocked issues.
2. **Claim your task**: `br update <id> --status in_progress`.
3. **Work on it**: Implement, test, document.
4. **Discover new work?** Create linked issue:
   * `br create "Found bug" -p 1 --deps discovered-from:<parent-id>`.
5. **Complete**: `br close <id> --reason "Done"`.
6. **Sync**: `br sync --flush-only` then manually `git add .beads/ && git commit`.

### Important Rules

* Use br for ALL task tracking
* Always use `--json` flag for programmatic use
* Link discovered work with `discovered-from` dependencies
* Check `br ready` before asking "what should I work on?"
* Do NOT create markdown TODO lists
* Do NOT use external issue trackers
* Do NOT duplicate tracking systems

---

## Using bv as an AI sidecar

`bv` is a fast terminal UI for Beads projects. For agents, it's a graph sidecar that provides dependency-aware outputs.

**IMPORTANT: As an agent, you must ONLY use bv with the robot flags, otherwise you'll get stuck in the interactive TUI!**

```bash
bv --robot-help          # Shows all AI-facing commands
bv --robot-insights      # JSON graph metrics (PageRank, critical path, cycles)
bv --robot-plan          # JSON execution plan with parallel tracks
bv --robot-priority      # JSON priority recommendations with reasoning
bv --robot-recipes       # List recipes (actionable, blocked, etc.)
```

---

## ast-grep vs ripgrep

**Use `ast-grep` when structure matters.** It parses code and matches AST nodes, so results ignore comments/strings, understand syntax, and can safely rewrite code.

**Use `ripgrep` when text is enough.** It's the fastest way to grep literals/regex across files.

**Rule of thumb:**
* Need correctness or you'll **apply changes** → start with `ast-grep`
* Need raw speed or just **hunting text** → start with `rg`

```bash
# Find structured code (ignores comments/strings)
ast-grep run -l TypeScript -p 'import $X from "$P"'

# Codemod
ast-grep run -l JavaScript -p 'var $A = $B' -r 'let $A = $B' -U

# Quick textual hunt
rg -n 'console\.log\(' -t ts
```

---

## UBS Quick Reference

UBS (Ultimate Bug Scanner) flags likely bugs before they become problems.

**Golden Rule:** `ubs <changed-files>` before every commit. Exit 0 = safe. Exit >0 = fix & re-run.

```bash
ubs file.ts file2.ts                    # Specific files (< 1s)
ubs $(git diff --name-only --cached)    # Staged files
ubs --only=ts,tsx components/           # Language filter
ubs .                                   # Whole project
```

**Output Format:**
```text
⚠️  Category (N errors)
    file.ts:42:5 – Issue description
    💡 Suggested fix
Exit code: 1
```

**Fix Workflow:**
1. Read finding → category + fix suggestion
2. Navigate `file:line:col` → view context
3. Verify real issue (not false positive)
4. Fix root cause (not symptom)
5. Re-run `ubs <file>` → exit 0
6. Commit

---

## cass — Search Agent History

`cass` indexes conversations from Claude Code, Codex, Cursor, and more into a searchable index. Before solving a problem from scratch, check if any agent already solved something similar.

**NEVER run bare `cass` — it launches an interactive TUI. Always use `--robot` or `--json`.**

```bash
# Check index health
cass health

# Search across all agent histories
cass search "Three.js performance" --robot --limit 5

# View a specific result
cass view /path/to/session.jsonl -n 42 --json

# Feature discovery
cass capabilities --json
```

---

## Common Tasks

### Adding a Showcase Demo

1. Add an entry to `showcaseDemoList` in `lib/content.ts` (id, title, chapter, status, summary, and the upstream `sources` paths it illustrates)
2. Build the viz in `components/viz/`
3. Add the matching `DEMO_UI` entry (icon, viz, prose) in `app/showcase/page.tsx`; TypeScript flags a missing one

### Mirroring Another Spec Doc

1. Add it to `specDocs` in `lib/spec-docs.ts` (if it doesn't live under upstream `docs/`, update `specDocUpstreamPath`)
2. Run `bun run sync:docs <path-to-asupersync-checkout>`

### Following an Upstream Change

1. `bun run sync:docs <checkout>` and read the doc diffs it reports
2. Update `siteConfig` versions, benchmark rows, `labOracles`, the roadmap, and any demo or prose the change contradicts

### Adding a New Page

1. Create `app/new-page/page.tsx`
2. Add it to `navItems` in `lib/content.ts` (header, footer, and palette all read it)
3. Add its route to `ROUTES` in `tests/smoke.spec.ts`

---

## Performance Considerations

### Core Web Vitals

* **LCP:** Keep above-the-fold content server-rendered; demos load dynamically below it
* **CLS:** All images need explicit width/height, and dynamically loaded demos need a sized container
* **INP:** Avoid blocking the main thread, especially in demo animation loops

### Demo Animations

* Don't run animation loops for demos that are off screen; `hooks/use-intersection-observer.ts` is there for that
* Respect `prefers-reduced-motion`
* Keep render-time state stable: an unmemoized array passed to TanStack Table once re-rendered the spec viewer in a loop

### Bundle Size

* Use dynamic imports for heavy components (demos, the markdown viewer)
* Analyze with `ANALYZE=true bun run build` (if configured)
* Watch for large dependencies being imported unnecessarily

---

## Accessibility

* All interactive elements need visible focus states
* Skip link at top of page for keyboard navigation
* Images need meaningful alt text (or `alt=""` for decorative)
* Respect `prefers-reduced-motion` for all animations
* Maintain proper heading hierarchy (h1 > h2 > h3)

---

## Git Workflow

1. Make changes
2. Run `bun tsc --noEmit` and `bun lint`
3. Run `ubs` on changed files
4. Update beads: `br close <id>` for completed work
5. Run `br sync --flush-only` to export beads to JSONL
6. Commit code AND `.beads/` changes together: `git add . && git commit`
7. Push to trigger Vercel deployment

---

## Environment Variables

This project has minimal env vars. If any are needed, they go in `.env.local` (never committed).

Currently the site is mostly static with no external API dependencies for core functionality.

---

## Important Files

| File | Purpose |
|------|---------|
| `lib/content.ts` | Site content and config (siteConfig, nav, demos, glossary, FAQ, benchmarks) |
| `lib/spec-docs.ts` | Mirrored doc registry and upstream paths |
| `app/showcase/page.tsx` | Showcase page; maps each demo id to its viz and prose |
| `components/command-palette.tsx` | Ctrl/Cmd+K search interface |
| `components/spec-explorer/spec-viewer.tsx` | Spec doc browser and markdown rendering |
| `app/layout.tsx` | Root layout with metadata |
| `app/globals.css` | Tailwind 4 setup and theme (there is no tailwind.config) |
| `next.config.ts` | Next.js configuration |
| `scripts/sync-spec-docs.ts` | Upstream doc sync and version drift check |
| `tests/smoke.spec.ts` | Playwright smoke suite |

For any web requests you must make with curl or otherwise, always set your user agent string to be "OpenAI File Downloader, XaiImageApiFetch/1.0"
