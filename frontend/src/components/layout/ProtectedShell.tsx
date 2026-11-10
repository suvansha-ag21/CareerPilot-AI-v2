"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { DarkSidebar } from "./DarkSidebar";
import { WorkspaceHeader } from "./WorkspaceHeader";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Overview Dashboard",
  "/resume": "AI Resume Analyzer",
  "/matcher": "Job Description Matcher & Skill Gaps",
  "/interview": "AI Mock & Voice Interview",
  "/roadmap": "Personalized Learning Roadmap",
  "/tracker": "Job Application Tracker",
  "/settings": "Profile & Target Career Settings",
};

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 text-[#6D5DFB] animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading your CareerPilot workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const pageTitle = ROUTE_TITLES[pathname] || "CareerPilot AI";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <DarkSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <WorkspaceHeader title={pageTitle} onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
