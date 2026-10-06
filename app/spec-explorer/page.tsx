import type { Metadata } from "next";
import SpecViewerLoader from "@/components/spec-explorer/spec-viewer-loader";

export const metadata: Metadata = {
  title: "Spec Docs — Asupersync",
  description:
    "The design documents behind Asupersync: the on-ramp, the formal semantics, the Spork and RaptorQ specs, threat models, and the testing methodology, mirrored from the main repository.",
  openGraph: {
    title: "Spec Docs — Asupersync",
    description: "The design documents behind Asupersync, mirrored from the main repository.",
  },
};

export default function SpecExplorerPage() {
  return (
    <main id="main-content" className="mx-auto max-w-screen-2xl px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
          Specification Library
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
          Spec Explorer
        </h1>
        <p className="text-lg text-slate-400 font-medium max-w-2xl">
          The design documents from the main repository, readable here. New to
          Asupersync? Open the on-ramp under Start Here first.
        </p>
      </div>
      <SpecViewerLoader />
    </main>
  );
}
