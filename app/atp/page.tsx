import type { Metadata } from "next";
import AtpPage from "@/components/atp/atp-page";

export const metadata: Metadata = {
  title: "ATP — Fountain-Coded File Transfer",
  description:
    "atp encodes files into RaptorQ fountain symbols so packet loss costs bandwidth instead of round trips. 2.9–4.8× faster than tuned rsync on small files, line rate on clean gigabit, SHA-256-verified always.",
  openGraph: {
    title: "ATP — Fountain-Coded File Transfer",
    description:
      "Fountain-coded file transfer that outruns tuned rsync on real networks. Any K symbols rebuild the file; loss becomes a bandwidth line item, not a stall.",
    url: "https://asupersync.com/atp",
    siteName: "Asupersync",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ATP — Fountain-Coded File Transfer",
    description:
      "Fountain-coded file transfer that outruns tuned rsync on real networks. Any K symbols rebuild the file; loss becomes a bandwidth line item, not a stall.",
  },
};

export default function Page() {
  return <AtpPage />;
}
