"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSearch,
  GitCompare,
  Mic,
  Map,
  Briefcase,
  Settings,
  LogOut,
  X,
  Compass,
} from "lucide-react";
import { useAuth } from "@/store/auth-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "AI Intelligence",
    items: [
      { label: "Resume Analyzer", href: "/resume", icon: FileSearch, badge: "P2" },
      { label: "JD Matcher & Gaps", href: "/matcher", icon: GitCompare, badge: "P3" },
      { label: "Mock & Voice Interview", href: "/interview", icon: Mic, badge: "P4" },
    ],
  },
  {
    title: "Career Execution",
    items: [
      { label: "Learning Roadmap", href: "/roadmap", icon: Map, badge: "P5" },
      { label: "Application Tracker", href: "/tracker", icon: Briefcase, badge: "P6" },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Profile & Settings", href: "/settings", icon: Settings }],
  },
];

export function DarkSidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = (user?.profile?.fullName || user?.email || "CP")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const content = (
    <aside className="w-64 h-full bg-[#111827] text-slate-300 flex flex-col border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={onCloseMobile}>
          <div className="h-8 w-8 rounded-lg bg-[#6D5DFB] flex items-center justify-center shadow-sm group-hover:bg-[#8B7CFF] transition-colors">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="block text-sm font-semibold text-white tracking-tight leading-none">
              CareerPilot AI
            </span>
            <span className="block text-[10px] font-medium text-slate-400 mt-0.5 tracking-wide">
              INTERVIEW INTELLIGENCE
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {group.title}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? "bg-[#6D5DFB]/20 text-white border border-[#6D5DFB]/40"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-[#8B7CFF]" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/70">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer User Card */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#6D5DFB]/25 border border-[#8B7CFF]/40 text-[#8B7CFF] flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.profile?.fullName || "Candidate"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.profile?.targetRole || "Software Engineer"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            title="Sign out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0">{content}</div>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
