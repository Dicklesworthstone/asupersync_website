import type { Metadata } from "next";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Interactive Demos",
  description:
    "25 interactive visualizations of how Asupersync works: regions, cancellation, two-phase sends, obligations, the lab runtime, Spork, RaptorQ, and the formal model, each labeled with how it ships.",
  openGraph: {
    title: "Interactive Demos | Asupersync",
    description:
      "25 interactive visualizations of how Asupersync works: regions, cancellation, two-phase sends, obligations, the lab runtime, Spork, RaptorQ, and the formal model, each labeled with how it ships.",
    url: "https://asupersync.com/showcase",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
