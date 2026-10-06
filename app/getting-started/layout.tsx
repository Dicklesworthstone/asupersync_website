import type { Metadata } from "next";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Install Asupersync, then work through the four on-ramp programs from a plain #[main] to a lab test that catches a leaked permit.",
  openGraph: {
    title: "Get Started | Asupersync",
    description:
      "Install Asupersync, then work through the four on-ramp programs from a plain #[main] to a lab test that catches a leaked permit.",
    url: "https://asupersync.com/getting-started",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
