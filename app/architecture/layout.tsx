import type { Metadata } from "next";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Architecture",
  description:
    "How Asupersync's regions, cancellation protocol, obligations, capability row, scheduler, and lab oracles work, and exactly what the Lean model does and doesn't prove.",
  openGraph: {
    title: "Architecture | Asupersync",
    description:
      "How Asupersync's regions, cancellation protocol, obligations, capability row, scheduler, and lab oracles work, and exactly what the Lean model does and doesn't prove.",
    url: "https://asupersync.com/architecture",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
