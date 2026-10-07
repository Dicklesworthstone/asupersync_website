// Mirrors the spec explorer's docs from an asupersync checkout into
// public/spec-docs/ and reports version drift against siteConfig.
//
//   bun run sync:docs ../asupersync           copy every doc that changed
//   bun run sync:docs ../asupersync --check   report only; exit 1 on any drift
//
// The doc list comes from lib/spec-docs.ts, so adding a doc there is the only
// step needed to start mirroring it.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig } from "../lib/content";
import { specDocs, specDocUpstreamPath } from "../lib/spec-docs";

const args = process.argv.slice(2);
const check = args.includes("--check");
const upstreamArg = args.find((arg) => !arg.startsWith("--"));

if (!upstreamArg) {
  console.error("usage: bun run sync:docs <path-to-asupersync-checkout> [--check]");
  process.exit(2);
}

const upstream = resolve(upstreamArg);
const cargoToml = join(upstream, "Cargo.toml");
if (!existsSync(cargoToml)) {
  console.error(`${upstream} has no Cargo.toml; point this at an asupersync checkout.`);
  process.exit(2);
}

const mirror = fileURLToPath(new URL("../public/spec-docs/", import.meta.url));

try {
  const head = execFileSync("git", ["-C", upstream, "log", "-1", "--format=%h %cs %s"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  console.log(`upstream: ${head}`);
} catch {
  console.log(`upstream: ${upstream} (not a git checkout)`);
}

let drift = 0;

// ── Docs ────────────────────────────────────────────────────────────
const updated: string[] = [];
const missing: string[] = [];
for (const doc of specDocs) {
  const source = specDocUpstreamPath(doc.filename);
  const sourcePath = join(upstream, source);
  if (!existsSync(sourcePath)) {
    missing.push(source);
    continue;
  }
  const next = readFileSync(sourcePath);
  const destPath = join(mirror, doc.filename);
  const current = existsSync(destPath) ? readFileSync(destPath) : null;
  if (current?.equals(next)) continue;
  updated.push(current ? source : `${source} (new)`);
  if (!check) writeFileSync(destPath, next);
}

drift += updated.length + missing.length;
const verb = check ? "out of date" : "updated";
console.log(`\ndocs: ${specDocs.length - updated.length - missing.length} current, ${updated.length} ${verb}, ${missing.length} missing upstream`);
for (const path of updated) console.log(`  ${verb}: ${path}`);
for (const path of missing) console.log(`  missing: ${path} (moved or deleted? fix lib/spec-docs.ts)`);

// ── Versions ────────────────────────────────────────────────────────
// mainVersion tracks Cargo.toml on main; version tracks the newest dated
// release in CHANGELOG.md (an unreleased line has no date).
const packageSection = readFileSync(cargoToml, "utf8").split(/^\[package\]$/m)[1]?.split(/^\[/m)[0] ?? "";
const cargoVersion = /^version\s*=\s*"([^"]+)"/m.exec(packageSection)?.[1];

const changelogPath = join(upstream, "CHANGELOG.md");
const releasedVersion = existsSync(changelogPath)
  ? /^## \[v?(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}/m.exec(readFileSync(changelogPath, "utf8"))?.[1]
  : undefined;

console.log("\nversions:");
for (const [label, site, actual] of [
  ["siteConfig.mainVersion vs Cargo.toml", siteConfig.mainVersion, cargoVersion],
  ["siteConfig.version vs newest dated CHANGELOG release", siteConfig.version, releasedVersion],
] as const) {
  if (!actual) {
    console.log(`  ${label}: couldn't read upstream value`);
    drift++;
  } else if (actual !== site) {
    console.log(`  ${label}: site says ${site}, upstream says ${actual}  <-- update lib/content.ts`);
    drift++;
  } else {
    console.log(`  ${label}: ${site}`);
  }
}

if (drift > 0 && !check && updated.length > 0) {
  console.log("\nReview the doc diffs: claims on the site may need to follow them.");
}
if (check && drift > 0) process.exit(1);
