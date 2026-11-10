"use client";

import React from "react";
import Link from "next/link";
import { Menu, Target, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/store/auth-context";

export function WorkspaceHeader({
  title,
  onOpenMobileSidebar,
}: {
  title: string;
  onOpenMobileSidebar: () => void;
}) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
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
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-xs font-medium text-[#172033] transition-colors"
        >
          <Target className="h-3.5 w-3.5 text-[#6D5DFB]" />
          <span className="max-w-[180px] sm:max-w-[240px] truncate">
            {user?.targetRole || "Set Target Role"}
          </span>
          <ArrowUpRight className="h-3 w-3 text-[#64748B]" />
        </Link>
      </div>
    </header>
  );
}
