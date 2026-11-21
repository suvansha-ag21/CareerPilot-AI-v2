"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertCircle, ArrowRight, Brain, Briefcase, Calendar, CheckCircle2, Cpu, Database, FileSearch, GitCompare, Layers, Map, Mic, Sparkles, Target, UserCheck, } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, } from "recharts";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
function CustomSignalTooltip({ active, payload, label, }) {
    if (!active || !payload || !payload.length)
        return null;
    return (<div className="bg-[#111827] text-white px-3 py-2 rounded-lg shadow-lg border border-slate-700/80 text-xs">
      <p className="font-medium text-slate-300">{label}</p>
      <p className="font-semibold text-sm tabular-nums text-[#A59BFF] mt-0.5">
        {payload[0].value}%
      </p>
    </div>);
}
export default function UserDashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const res = await apiRequest("/analytics/dashboard");
                if (active)
                    setData(res);
            }
            catch {
                if (active)
                    setError("Unable to load dashboard analytics. Please try refreshing.");
            }
            finally {
                if (active)
                    setLoading(false);
            }
        }
        void load();
        return () => {
            active = false;
        };
    }, []);
    const firstName = user?.name?.split(" ")[0] || "Candidate";
    const targetRole = user?.targetRole?.trim() || null;
    const chartData = [
        { name: "Profile", value: data?.profileCompletenessPct ?? 0 },
        { name: "Resume Score", value: data?.latestResumeScore ?? 0 },
        { name: "Job Match", value: data?.latestJobMatchScore ?? 0 },
        { name: "Interview Avg", value: data?.averageInterviewScore ?? 0 },
        { name: "Roadmap", value: data?.roadmapProgressPct ?? 0 },
    ];
    const pipelineSteps = [
        {
            label: "Profile Setup",
            href: "/profile",
            done: (data?.profileCompletenessPct ?? 0) >= 60,
        },
        {
            label: "Resume AI",
            href: "/resume",
            done: data?.latestResumeScore !== null && data?.latestResumeScore !== undefined,
        },
        {
            label: "Job Matcher",
            href: "/matcher",
            done: data?.latestJobMatchScore !== null && data?.latestJobMatchScore !== undefined,
        },
        {
            label: "Skill Audit",
            href: "/skills",
            done: (data?.skillsCount ?? 0) >= 3,
        },
        {
            label: "Roadmap",
            href: "/roadmap",
            done: data?.roadmapProgressPct !== null && data?.roadmapProgressPct !== undefined,
        },
    ];
    const ACTIVITY_ICONS = {
        RESUME: FileSearch,
        MATCH: GitCompare,
        INTERVIEW: Mic,
        APPLICATION: Briefcase,
        PROFILE: UserCheck,
    };
    return (<div className="space-y-6">
      {/* Executive Welcome Hero + Readiness Ring */}
      <Card className="overflow-hidden border-[#E2E8F0]">
        <div className="relative p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-white via-white to-[#EEF2FF]/75">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              {targetRole ? (<Badge tone="brand">
                  <Sparkles className="h-3 w-3"/>
                  Active Track: {targetRole}
                </Badge>) : (<Link href="/onboarding">
                  <Badge tone="brand">
                    <Sparkles className="h-3 w-3"/>
                    Set Target Role
                  </Badge>
                </Link>)}
              {data && (<Badge tone={data?.serviceHealth?.aiService === "healthy" ? "success" : "warning"}>
                  <Cpu className="h-3 w-3"/>
                  {data?.serviceHealth?.aiService === "healthy"
                ? "AI Coach Ready"
                : "AI Coach Standby"}
                </Badge>)}
            </div>

            <h2 className="text-2xl sm:text-[26px] font-semibold text-[#172033] tracking-tight leading-snug">
              Welcome back, {firstName}
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Every score below reflects your real resumes, job matches, mock interviews, and weekly
              study progress—no artificial scores or preset progress.
            </p>

            {/* Personalized Onboarding Goals & Context Chips */}
            {(user?.careerPreferences?.userPersona ||
            (user?.careerPreferences?.careerGoals?.length ?? 0) > 0) && (<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {user?.careerPreferences?.userPersona && (<span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-[#172033]">
                    {user.careerPreferences.userPersona}
                  </span>)}
                {user?.careerPreferences?.experienceLevel && (<span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-[#64748B]">
                    {user.careerPreferences.experienceLevel}
                  </span>)}
                {(user?.careerPreferences?.careerGoals ?? []).slice(0, 3).map((goal) => (<span key={goal} className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#6D5DFB]/20 text-[11px] font-medium text-[#6D5DFB]">
                    {goal}
                  </span>))}
                <Link href="/onboarding" className="text-[11px] font-medium text-[#6D5DFB] hover:underline ml-1">
                  Edit Path
                </Link>
              </div>)}

            {/* Pipeline Readiness Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {pipelineSteps.map((step) => (<Link key={step.href} href={step.href} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${step.done
                ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70"
                : "bg-white text-slate-600 border-slate-200 hover:border-[#6D5DFB]/40 hover:text-[#6D5DFB]"}`}>
                  {step.done ? (<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600"/>) : (<span className="h-2 w-2 rounded-full bg-slate-300"/>)}
                  {step.label}
                </Link>))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 shrink-0">
            <div className="flex items-center gap-3.5 bg-white/90 px-4 py-3 rounded-xl border border-slate-200/80 shadow-sm">
              <ProgressRing value={loading ? null : data?.readinessScore ?? null} size={76} strokeWidth={7} label="Ready"/>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#172033]">Placement Readiness</p>
                <p className="text-[11px] text-[#64748B]">
                  {data?.readinessScore !== null && data?.readinessScore !== undefined
            ? "Combines your resume, interviews & study tasks"
            : "Upload a resume or start your roadmap"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/drills">
                <Button variant="outline">
                  <Brain className="h-4 w-4 text-[#6D5DFB]"/>
                  Flashcards
                </Button>
              </Link>
              <Link href="/skills">
                <Button variant="outline">
                  <Sparkles className="h-4 w-4 text-[#6D5DFB]"/>
                  Skill Check
                </Button>
              </Link>
              <Link href="/resume">
                <Button variant="primary">
                  Resume AI
                  <ArrowRight className="h-4 w-4"/>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {user && !user.careerPreferences?.onboardingCompleted && (<div className="p-4 rounded-xl bg-[#EEF2FF]/75 border border-[#6D5DFB]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-[#172033]">
              Finish your 3-step career setup
            </p>
            <p className="text-xs text-[#64748B]">
              Select your education, career goals, and baseline skills to personalize your dashboard,
              mock interviews, and roadmap.
            </p>
          </div>
          <Link href="/onboarding" className="shrink-0">
            <Button variant="primary" size="sm">
              Complete Setup
              <ArrowRight className="h-3.5 w-3.5"/>
            </Button>
          </Link>
        </div>)}

      {error && (<div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
          <AlertCircle className="h-4 w-4 shrink-0"/>
          <span>{error}</span>
        </div>)}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Skill Inventory
              </span>
              <div className="h-8 w-8 rounded-lg bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center">
                <Activity className="h-4 w-4"/>
              </div>
            </div>
            {loading ? (<div className="mt-3 space-y-2">
                <Skeleton className="h-7 w-24"/>
                <Skeleton className="h-3.5 w-36"/>
              </div>) : (<>
                <p className="text-2xl font-bold text-[#172033] mt-3 tabular-nums">
                  {data?.skillsCount ?? 0} Verified
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#6D5DFB] transition-all duration-500" style={{ width: `${data?.profileCompletenessPct ?? 0}%` }}/>
                </div>
                <p className="text-xs text-[#64748B] mt-1.5">
                  Profile completeness: {data?.profileCompletenessPct ?? 0}%
                </p>
              </>)}
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Resume &amp; Match
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSearch className="h-4 w-4"/>
              </div>
            </div>
            {loading ? (<div className="mt-3 space-y-2">
                <Skeleton className="h-7 w-24"/>
                <Skeleton className="h-3.5 w-36"/>
              </div>) : (<>
                <p className="text-2xl font-bold text-[#172033] mt-3 tabular-nums">
                  {data?.latestResumeScore !== null ? `${data?.latestResumeScore}%` : "0 Resumes"}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${data?.latestResumeScore ?? 0}%` }}/>
                </div>
                <p className="text-xs text-[#64748B] mt-1.5">
                  Latest JD Match:{" "}
                  {data?.latestJobMatchScore !== null ? `${data?.latestJobMatchScore}%` : "No match yet"}
                </p>
              </>)}
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Learning Roadmap
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Map className="h-4 w-4"/>
              </div>
            </div>
            {loading ? (<div className="mt-3 space-y-2">
                <Skeleton className="h-7 w-24"/>
                <Skeleton className="h-3.5 w-36"/>
              </div>) : (<>
                <p className="text-2xl font-bold text-[#172033] mt-3 tabular-nums">
                  {data?.roadmapProgressPct !== null ? `${data?.roadmapProgressPct}%` : "Not Started"}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${data?.roadmapProgressPct ?? 0}%` }}/>
                </div>
                <p className="text-xs text-[#64748B] mt-1.5">
                  <Link href="/roadmap" className="text-[#6D5DFB] hover:underline font-medium">
                    Manage study sprint
                  </Link>
                </p>
              </>)}
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Mock Interviews
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Mic className="h-4 w-4"/>
              </div>
            </div>
            {loading ? (<div className="mt-3 space-y-2">
                <Skeleton className="h-7 w-24"/>
                <Skeleton className="h-3.5 w-36"/>
              </div>) : (<>
                <p className="text-2xl font-bold text-[#172033] mt-3 tabular-nums">
                  {data?.totalMockInterviews ?? 0} Completed
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${data?.averageInterviewScore ?? 0}%` }}/>
                </div>
                <p className="text-xs text-[#64748B] mt-1.5">
                  Avg Score:{" "}
                  {data?.averageInterviewScore !== null
                ? `${data?.averageInterviewScore}%`
                : "Not assessed"}
                </p>
              </>)}
          </CardContent>
        </Card>
      </div>

      {/* Main Chart + AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader icon={<Activity className="h-4 w-4"/>} title="Preparation Signals Overview" subtitle="Live breakdown across Profile, Resume, JD Match, Interviews & Roadmap" action={<Badge tone="brand" className="tabular-nums">
                Profile {data?.profileCompletenessPct ?? 0}%
              </Badge>}/>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="careerpilotBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6D5DFB" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#8B7CFF" stopOpacity={0.85}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false}/>
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false}/>
                  <Tooltip cursor={{ fill: "#F1F5F9" }} content={<CustomSignalTooltip />}/>
                  <Bar dataKey="value" fill="url(#careerpilotBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={46}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader icon={<Target className="h-4 w-4"/>} title="AI Next Best Actions" subtitle="Prioritized dynamically from your live workspace state"/>
          <CardContent className="space-y-3">
            {loading ? (<div className="space-y-3">
                <Skeleton className="h-16 w-full"/>
                <Skeleton className="h-16 w-full"/>
                <Skeleton className="h-16 w-full"/>
              </div>) : (data?.recommendations ?? []).length > 0 ? (data?.recommendations.map((rec) => (<div key={rec.title || rec.id} className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/70 hover:bg-white hover:border-[#6D5DFB]/30 transition-all flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={rec.priority === "HIGH" ? "warning" : "brand"}>
                        {rec.priority || "RECOMMENDED"}
                      </Badge>
                      <p className="text-xs font-semibold text-[#172033]">{rec.title}</p>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">{rec.reason || rec.description || ""}</p>
                  </div>
                  {(rec.actionHref || rec.actionUrl) && (
                    <Link href={rec.actionHref || rec.actionUrl} className="shrink-0">
                      <Button variant="secondary" size="sm">
                        {rec.actionLabel || "View"}
                      </Button>
                    </Link>
                  )}
                </div>))) : (<div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto"/>
                <p className="text-sm font-medium text-[#172033]">All core milestones active</p>
                <p className="text-xs text-[#64748B]">
                  Keep completing weekly roadmap tasks and job comparisons.
                </p>
              </div>)}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Split: Recent Activities + Upcoming Interviews & Stack Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader icon={<Layers className="h-4 w-4"/>} title="Recent Activity Feed" subtitle="Chronological history of your evaluations & updates"/>
          <CardContent>
            {data?.recentActivities && data.recentActivities.length > 0 ? (<div className="divide-y divide-slate-100">
                {data.recentActivities.map((item) => {
                const Icon = ACTIVITY_ICONS[item.type] || Layers;
                return (<div key={`${item.type}-${item.id}`} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-[#6D5DFB] flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4"/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#172033] truncate">{item.title}</p>
                          <p className="text-xs text-[#64748B] mt-0.5 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 tabular-nums shrink-0">
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : (item.date || "Recent")}
                      </span>
                    </div>);
            })}
              </div>) : (<p className="text-sm text-[#64748B] py-4 text-center">
                No recent activity recorded yet.
              </p>)}
          </CardContent>
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader icon={<Calendar className="h-4 w-4"/>} title="Upcoming Company Interviews" subtitle="Scheduled interviews from Application Tracker"/>
            <CardContent>
              {data?.upcomingInterviews && data.upcomingInterviews.length > 0 ? (<div className="space-y-2.5">
                  {data.upcomingInterviews.map((item) => (<div key={item.id} className="p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#172033]">{item.company}</p>
                        <p className="text-[11px] text-[#64748B]">{item.jobRole}</p>
                      </div>
                      <Badge tone="brand" className="tabular-nums">
                        <Calendar className="h-3 w-3"/>
                        {new Date(item.interviewDate).toLocaleDateString()}
                      </Badge>
                    </div>))}
                </div>) : (<p className="text-xs text-[#64748B] py-2">
                  No upcoming interviews scheduled yet. Add company interviews in Applications
                  Tracker to track dates here.
                </p>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={<Database className="h-4 w-4"/>} title="Workspace Status" subtitle="Sync & AI Availability"/>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172033]">
                  <Database className="h-3.5 w-3.5 text-[#6D5DFB]"/>
                  Data Sync
                </div>
                <Badge tone={data?.serviceHealth?.database === "healthy" ? "success" : "neutral"}>
                  {data?.serviceHealth?.database === "healthy" ? "Connected" : "Checking"}
                </Badge>
              </div>
              <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172033]">
                  <Cpu className="h-3.5 w-3.5 text-[#6D5DFB]"/>
                  AI Engine
                </div>
                <Badge tone={data?.serviceHealth?.aiService === "healthy" ? "success" : "warning"}>
                  {data?.serviceHealth?.aiService === "healthy" ? "Online" : "Standby"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Navigation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
            { label: "Resume AI", href: "/resume", icon: FileSearch },
            { label: "Job Matcher", href: "/matcher", icon: GitCompare },
            { label: "Skill Gap Analyzer", href: "/skills", icon: Sparkles },
            { label: "Learning Roadmap", href: "/roadmap", icon: Map },
        ].map((item) => {
            const Icon = item.icon;
            return (<Link key={item.href} href={item.href} className="group p-3.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#6D5DFB]/40 hover:shadow-elevated shadow-card flex items-center justify-between text-xs font-semibold text-[#172033] transition-all">
              <span className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-lg bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center group-hover:bg-[#6D5DFB] group-hover:text-white transition-colors">
                  <Icon className="h-3.5 w-3.5"/>
                </span>
                {item.label}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[#64748B] group-hover:text-[#6D5DFB] group-hover:translate-x-0.5 transition-all"/>
            </Link>);
        })}
      </div>
    </div>);
}
