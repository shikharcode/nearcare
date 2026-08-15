"use client";

import React from "react";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className={cn(
        "print:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
        "bg-white/20 hover:bg-white/30 active:bg-white/10 transition-colors",
        "text-white font-semibold text-sm border border-white/30",
        "min-h-[44px]"
      )}
    >
      <Printer className="h-4 w-4" />
      Print / Save PDF
    </button>
  );
}
