"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { cn, isTextInputLike } from "./utils";

interface SiteContextType {
  isLabMode: boolean;
  toggleLabMode: () => void;
  isPaletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [isLabMode, setIsLabMode] = useState(false);
  const [isPaletteOpen, setPaletteOpen] = useState(false);

  const toggleLabMode = useCallback(() => {
    setIsLabMode((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+K toggles the command palette, even from a text field.
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        if (isTextInputLike(document.activeElement)) return;
        e.preventDefault();
        toggleLabMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleLabMode]);

  return (
    <SiteContext.Provider
      value={{
        isLabMode,
        toggleLabMode,
        isPaletteOpen,
        setPaletteOpen,
      }}
    >
      <div className={cn("min-h-screen transition-colors duration-700", isLabMode ? "lab-mode" : "")}>
        {children}
      </div>

      <style jsx global>{`
        .lab-mode .glass-modern,
        .lab-mode header,
        .lab-mode section {
          outline: 1.5px solid rgba(59, 130, 246, 0.3) !important;
          outline-offset: 6px;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.1) !important;
        }
        .lab-mode img, .lab-mode video {
          filter: grayscale(0.6) opacity(0.7) contrast(1.1);
          transition: filter 0.8s ease;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .lab-mode::before {
          content: "";
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 40;
          opacity: 0.6;
        }
        .lab-mode::after {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(59, 130, 246, 0.04) 50%,
            transparent 100%
          );
          background-size: 100% 15px;
          pointer-events: none;
          z-index: 41;
          animation: scanline 12s linear infinite;
        }
      `}</style>
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error("useSite must be used within a SiteProvider");
  }
  return context;
}
