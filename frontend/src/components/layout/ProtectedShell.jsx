"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { DarkSidebar } from "./DarkSidebar";
import { WorkspaceHeader } from "./WorkspaceHeader";
const ROUTE_TITLES = {
    "/dashboard": "Career Overview",
    "/onboarding": "Personalized Career Setup",
    "/resume": "AI Resume Analyzer",
    "/matcher": "AI Job Description Matcher",
    "/skills": "AI Skill Gap Analyzer",
    "/interview": "AI Mock & Voice Interview",
    "/roadmap": "Personalized Learning Roadmap",
    "/drills": "Daily Micro-Drills",
    "/applications": "Job Application Tracker",
    "/analytics": "Career Analytics",
    "/profile": "Candidate Profile",
    "/settings": "Settings & Preferences",
};
export function ProtectedShell({ children }) {
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
        return (<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 text-[#6D5DFB] animate-spin"/>
          <p className="text-xs font-medium text-[#64748B]">Loading CareerPilot AI workspace...</p>
        </div>
      </div>);
    }
    if (!user) {
        return null;
    }
    const pageTitle = ROUTE_TITLES[pathname] || "CareerPilot AI";
    return (<div className="min-h-screen bg-[#F8FAFC] flex">
      <DarkSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)}/>
      <div className="flex-1 min-w-0 flex flex-col">
        <WorkspaceHeader title={pageTitle} onOpenMobileSidebar={() => setMobileOpen(true)}/>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>);
}
