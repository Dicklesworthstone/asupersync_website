import type { Metadata } from "next";
import AtpPage from "@/components/atp/atp-page";

export const metadata: Metadata = {
  title: "ATP — Fountain-Coded File Transfer",
  description:
    "atp encodes files into RaptorQ fountain symbols so packet loss costs bandwidth instead of round trips. On the plaintext tier, 500 KB files move 2.9–4.8× faster than a tuned rsync daemon; line rate on clean gigabit; SHA-256 verified on every transfer.",
  openGraph: {
    title: "ATP — Fountain-Coded File Transfer",
    description:
      "Fountain-coded file transfer. Any K symbols rebuild the file, so packet loss becomes a bandwidth line item instead of a stall. Measured against tuned rsync, losses included.",
    url: "https://asupersync.com/atp",
    siteName: "Asupersync",
    locale: "en_US",
    type: "website",
    // X drops twitter:image/og:image URLs with query strings often enough
    // that we bypass the file-convention routes (which append a cache-bust
    // query) in favor of clean static paths.
    images: [
      {
        url: "https://asupersync.com/images/atp-og.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "ATP — Asupersync Transfer Protocol",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ATP — Fountain-Coded File Transfer",
    description:
      "Fountain-coded file transfer. Any K symbols rebuild the file, so packet loss becomes a bandwidth line item instead of a stall. Measured against tuned rsync, losses included.",
    images: ["https://asupersync.com/images/atp-twitter.jpg"],
  },
};

export default function Page() {
  return <AtpPage />;
}
