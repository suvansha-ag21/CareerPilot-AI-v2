"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Target, ArrowUpRight, Sparkles } from "lucide-react";
import { useAuth } from "@/store/auth-context";

const ROUTE_SUBTITLES: Record<string, string> = {
  "/dashboard": "Real-time readiness intelligence synced with PostgreSQL",
  "/resume": "NLP extraction, ATS structural scoring & ChromaDB indexing",
  "/matcher": "Hybrid vector + TF-IDF job compatibility evaluator",
  "/skills": "Benchmark skills against role bars & prioritize learning",
  "/roadmap": "Structured weekly study sprints generated from skill gaps",
  "/profile": "Education, work history, projects & canonical skill inventory",
  "/settings": "Account security & workspace preferences",
};

export function WorkspaceHeader({
  title,
  onOpenMobileSidebar,
}: {
  title: string;
  onOpenMobileSidebar: () => void;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const subtitle = ROUTE_SUBTITLES[pathname];

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base font-semibold text-[#172033] tracking-tight truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-[11px] text-[#64748B] truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/skills"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#6D5DFB]/20 text-xs font-medium text-[#6D5DFB] transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Skill Audit
        </Link>

        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-xs font-medium text-[#172033] transition-colors"
        >
          <Target className="h-3.5 w-3.5 text-[#6D5DFB]" />
          <span className="max-w-[160px] sm:max-w-[220px] truncate">
            {user?.targetRole || "Set Target Role"}
          </span>
          <ArrowUpRight className="h-3 w-3 text-[#64748B]" />
        </Link>
      </div>
    </header>
  );
}
