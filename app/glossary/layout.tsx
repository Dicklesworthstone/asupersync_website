import type { Metadata } from "next";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Definitions of the terms Asupersync uses: regions, Cx, obligations, the cancellation protocol, oracles, e-processes, Spork, and more.",
  openGraph: {
    title: "Glossary | Asupersync",
    description:
      "Definitions of the terms Asupersync uses: regions, Cx, obligations, the cancellation protocol, oracles, e-processes, Spork, and more.",
    url: "https://asupersync.com/glossary",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
