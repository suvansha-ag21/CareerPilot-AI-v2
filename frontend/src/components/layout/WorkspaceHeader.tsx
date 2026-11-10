"use client";

import React from "react";
import Link from "next/link";
import { Menu, Target, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { Badge } from "@/components/ui/Badge";

export function WorkspaceHeader({
  title,
  onOpenMobileSidebar,
  aiHealthy,
}: {
  title: string;
  onOpenMobileSidebar: () => void;
  aiHealthy?: boolean;
}) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base font-semibold text-[#172033] tracking-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {typeof aiHealthy === "boolean" && (
          <Badge tone={aiHealthy ? "success" : "warning"} className="hidden sm:inline-flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                aiHealthy ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {aiHealthy ? "AI Engine Online" : "AI Engine Standby"}
          </Badge>
        )}

        <Link
          href="/settings"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200/90 text-xs font-medium text-[#172033] transition-colors"
        >
          <Target className="h-3.5 w-3.5 text-[#6D5DFB]" />
          <span className="max-w-[200px] truncate">
            {user?.profile?.targetRole || "Set Target Role"}
          </span>
          <ArrowUpRight className="h-3 w-3 text-slate-400" />
        </Link>
      </div>
    </header>
  );
}
