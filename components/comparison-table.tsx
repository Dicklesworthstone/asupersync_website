"use client";

import { useMemo } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { comparisonData } from "@/lib/content";
import type { ComparisonCell, ComparisonRow } from "@/lib/content";
import { cn } from "@/lib/utils";
import { SyncContainer } from "./sync-elements";
import GlitchText from "./glitch-text";
import { motion } from "framer-motion";

function StatusCell({ cell }: { cell: ComparisonCell }) {
  const { text, tone } = cell;
  return (
    <td
      className={cn(
        "px-4 py-3 text-sm font-medium min-w-[10rem]",
        tone === "yes" && "text-blue-400",
        tone === "partial" && "text-yellow-400/80",
        tone === "no" && "text-slate-500",
        tone === "neutral" && "text-slate-500"
      )}
    >
      {tone === "yes" && <span className="mr-1.5 shadow-[0_0_8px_#3B82F6]" aria-hidden="true">&#10003;</span>}
      {tone === "no" && <span className="mr-1.5" aria-hidden="true">&#10005;</span>}
      {tone === "partial" && <span className="mr-1.5" aria-hidden="true">&#9888;</span>}
      {text}
    </td>
  );
}

export default function ComparisonTable() {
  const columns = useMemo<ColumnDef<ComparisonRow>[]>(
    () => [
      { accessorKey: "feature", header: "Feature" },
      {
        accessorKey: "asupersync",
        header: () => (
          <GlitchText trigger="hover" intensity="low">
            Asupersync
          </GlitchText>
        ),
      },
      { accessorKey: "tokio", header: "Tokio" },
      { accessorKey: "asyncStd", header: "async-std" },
      { accessorKey: "smol", header: "smol" },
    ],
    []
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: comparisonData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.feature,
  });

  return (
    <SyncContainer withPulse={true} className="overflow-hidden border-blue-500/10">
      <div className="overflow-x-auto">
        <table className="w-full text-left" aria-label="Async runtime feature comparison">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-white/5 bg-white/[0.02]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-4 text-xs font-bold uppercase tracking-widest",
                      header.column.id === "asupersync" ? "text-blue-400" : "text-slate-500"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows.map((row) => (
              <motion.tr
                key={row.id}
                whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                className="transition-colors group"
              >
                {row.getVisibleCells().map((cell) => {
                  if (cell.column.id === "feature") {
                    return (
                      <td key={cell.id} className="px-4 py-3 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                        <GlitchText trigger="hover" intensity="low" className="w-full">
                          {String(cell.getValue())}
                        </GlitchText>
                      </td>
                    );
                  }

                  return <StatusCell key={cell.id} cell={cell.getValue() as ComparisonCell} />;
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </SyncContainer>
  );
}
