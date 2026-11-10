"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Circle,
  Cpu,
  Database,
  FileSearch,
  GitCompare,
  Map,
  Mic,
  Sparkles,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DashboardOverviewDTO } from "@careerpilot/shared";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function OverviewDashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      try {
        const data = await apiRequest<DashboardOverviewDTO>("/analytics/overview");
        if (active) setOverview(data);
      } catch {
        if (active) setError("Could not load dashboard metrics from API Gateway.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadOverview();
    return () => {
      active = false;
    };
  }, []);

  const firstName = user?.profile?.fullName?.split(" ")[0] || "Engineer";
  const targetRole = user?.profile?.targetRole || "Full Stack Software Engineer";

  const chartData = [
    {
      name: "Profile",
      score: overview?.profileCompletenessPct ?? 0,
    },
    {
      name: "Avg ATS",
      score: overview?.averageAtsScore ?? 0,
    },
    {
      name: "Roadmap",
      score: overview?.roadmapProgressPct ?? 0,
    },
    {
      name: "Readiness",
      score: overview?.readinessScore ?? 0,
    },
  ];

  const onboardingSteps = [
    {
      title: "Configure career track & engineering profile",
      description: `Active track: ${targetRole}`,
      completed: (overview?.profileCompletenessPct ?? 0) >= 60,
      href: "/settings",
      cta: "Edit Profile",
    },
    {
      title: "Upload primary resume for ATS & AI audit (Phase 2)",
      description: "Parse PDF layout, score ATS fitness, and index sections in ChromaDB.",
      completed: (overview?.resumesCount ?? 0) > 0,
      href: "/resume",
      cta: "Open Resume Analyzer",
    },
    {
      title: "Match resume against target Job Description (Phase 3)",
      description: "Compute hybrid semantic + skill coverage score and detect gaps.",
      completed: (overview?.matchesCount ?? 0) > 0,
      href: "/matcher",
      cta: "Open JD Matcher",
    },
    {
      title: "Complete adaptive text or voice mock interview (Phase 4)",
      description: "Evaluate technical accuracy, communication clarity, and speech pace.",
      completed: (overview?.completedInterviewsCount ?? 0) > 0,
      href: "/interview",
      cta: "Open Interview Studio",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Target Role Hero Banner */}
      <Card className="overflow-hidden">
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-white via-white to-[#EEF2FF]/60">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="brand">
                <Sparkles className="h-3 w-3" />
                CareerPilot AI Workspace
              </Badge>
              {overview && (
                <Badge tone={overview.serviceHealth.aiService === "healthy" ? "success" : "warning"}>
                  <Cpu className="h-3 w-3" />
                  {overview.serviceHealth.aiService === "healthy"
                    ? "FastAPI AI Connected"
                    : "AI Service Standby"}
                </Badge>
              )}
            </div>

            <h2 className="text-2xl font-semibold text-[#172033] tracking-tight">
              Welcome, {firstName}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your intelligence workspace is calibrated for{" "}
              <span className="font-semibold text-[#172033]">{targetRole}</span>. Metrics start
              clean at zero and evolve automatically as you analyze resumes, run JD matches, and
              complete mock interviews.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/settings">
              <Button variant="outline">
                <Target className="h-4 w-4 text-[#6D5DFB]" />
                Update Career Track
              </Button>
            </Link>
            <Link href="/resume">
              <Button variant="primary">
                Upload Resume
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Composite Readiness
              </span>
              <Activity className="h-4 w-4 text-[#6D5DFB]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[#172033] tabular-nums">
                {loading ? "—" : overview?.readinessScore !== null ? `${overview?.readinessScore}%` : "Not Assessed"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Derived from interviews, ATS scores, and roadmap milestones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Average ATS Score
              </span>
              <FileSearch className="h-4 w-4 text-[#6D5DFB]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[#172033] tabular-nums">
                {loading
                  ? "—"
                  : overview?.averageAtsScore !== null
                  ? `${overview?.averageAtsScore}%`
                  : "0 Resumes"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {overview?.resumesCount ?? 0} resume document(s) analyzed in PostgreSQL
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Open Skill Gaps
              </span>
              <GitCompare className="h-4 w-4 text-[#6D5DFB]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[#172033] tabular-nums">
                {loading ? "—" : overview?.openSkillGapsCount ?? 0}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tracked across JD matches &amp; mock evaluations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Active Applications
              </span>
              <Briefcase className="h-4 w-4 text-[#6D5DFB]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[#172033] tabular-nums">
                {loading ? "—" : overview?.activeApplicationsCount ?? 0}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {overview?.completedInterviewsCount ?? 0} mock interviews completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Split: Analytics Chart + Onboarding Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Readiness Signal Breakdown Chart */}
        <Card className="lg:col-span-7">
          <CardHeader
            title="Career Readiness Signal Breakdown"
            subtitle="Live metrics computed from PostgreSQL records (0% baseline until assessed)"
            action={
              <Badge tone="neutral" className="tabular-nums">
                Profile {overview?.profileCompletenessPct ?? 0}%
              </Badge>
            }
          />
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="score" fill="#6D5DFB" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Execution Checklist */}
        <Card className="lg:col-span-5">
          <CardHeader
            title="Preparation Launchpad"
            subtitle="Sequential AI intelligence workflow"
          />
          <CardContent className="space-y-3">
            {onboardingSteps.map((step) => (
              <div
                key={step.title}
                className="p-3.5 rounded-lg border border-slate-200/80 bg-[#F8FAFC]/70 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-[#172033]">{step.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
                <Link href={step.href} className="shrink-0">
                  <Button variant="ghost" size="sm" className="text-[#6D5DFB]">
                    Open
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Split: Recent Activity + Infrastructure Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8">
          <CardHeader
            title="Recent Workspace Activity"
            subtitle="Chronological audit trail synced from PostgreSQL"
          />
          <CardContent>
            {overview?.recentActivity && overview.recentActivity.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {overview.recentActivity.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#172033]">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums shrink-0">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-4 text-center">
                No activity recorded yet. Start by completing your career profile.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader
            title="Platform Architecture Status"
            subtitle="Live microservices telemetry"
          />
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-[#6D5DFB]" />
                <div>
                  <p className="text-xs font-semibold text-[#172033]">PostgreSQL + Prisma</p>
                  <p className="text-[11px] text-slate-500">Relational Persistence</p>
                </div>
              </div>
              <Badge tone={overview?.serviceHealth.database === "healthy" ? "success" : "neutral"}>
                {overview?.serviceHealth.database === "healthy" ? "Connected" : "Checking"}
              </Badge>
            </div>

            <div className="p-3 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-[#6D5DFB]" />
                <div>
                  <p className="text-xs font-semibold text-[#172033]">FastAPI AI Engine</p>
                  <p className="text-[11px] text-slate-500">Python ML &amp; LLM Worker</p>
                </div>
              </div>
              <Badge tone={overview?.serviceHealth.aiService === "healthy" ? "success" : "warning"}>
                {overview?.serviceHealth.aiService === "healthy" ? "Online" : "Standby"}
              </Badge>
            </div>

            <div className="pt-1 grid grid-cols-2 gap-2">
              <Link
                href="/interview"
                className="p-2.5 rounded-lg border border-slate-200/80 hover:border-[#6D5DFB]/40 text-xs font-medium text-[#172033] flex items-center gap-2 transition-colors"
              >
                <Mic className="h-3.5 w-3.5 text-[#6D5DFB]" />
                Mock Studio
              </Link>
              <Link
                href="/roadmap"
                className="p-2.5 rounded-lg border border-slate-200/80 hover:border-[#6D5DFB]/40 text-xs font-medium text-[#172033] flex items-center gap-2 transition-colors"
              >
                <Map className="h-3.5 w-3.5 text-[#6D5DFB]" />
                Roadmap
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
