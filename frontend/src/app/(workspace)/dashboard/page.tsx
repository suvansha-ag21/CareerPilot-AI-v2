"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  Cpu,
  Database,
  FileSearch,
  GitCompare,
  Layers,
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
import { DashboardAnalyticsDTO } from "@careerpilot/shared";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await apiRequest<DashboardAnalyticsDTO>("/analytics/dashboard");
        if (active) setData(res);
      } catch {
        if (active) setError("Could not load dashboard analytics from API Gateway.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Candidate";
  const targetRole = user?.targetRole || "Full Stack Developer";

  const chartData = [
    { name: "Profile", value: data?.profileCompletenessPct ?? 0 },
    { name: "Resume Score", value: data?.latestResumeScore ?? 0 },
    { name: "Job Match", value: data?.latestJobMatchScore ?? 0 },
    { name: "Interview Avg", value: data?.averageInterviewScore ?? 0 },
    { name: "Roadmap", value: data?.roadmapProgressPct ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="overflow-hidden">
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-white via-white to-[#EEF2FF]/60">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="brand">
                <Sparkles className="h-3 w-3" />
                Active Track: {targetRole}
              </Badge>
              {data && (
                <Badge tone={data.serviceHealth.aiService === "healthy" ? "success" : "warning"}>
                  <Cpu className="h-3 w-3" />
                  {data.serviceHealth.aiService === "healthy"
                    ? "FastAPI AI Connected"
                    : "AI Service Standby"}
                </Badge>
              )}
            </div>

            <h2 className="text-2xl font-semibold text-[#172033] tracking-tight">
              Welcome back, {firstName}
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Your career preparation metrics are computed directly from PostgreSQL records. New
              accounts begin cleanly at zero—no synthetic scores or dummy progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/profile">
              <Button variant="outline">
                <Target className="h-4 w-4 text-[#6D5DFB]" />
                Update Profile
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Career Readiness
              </span>
              <Activity className="h-4 w-4 text-[#6D5DFB]" />
            </div>
            <p className="text-2xl font-semibold text-[#172033] mt-3 tabular-nums">
              {loading
                ? "—"
                : data?.readinessScore !== null
                ? `${data?.readinessScore}%`
                : "Not Assessed"}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              {data?.skillsCount ?? 0} verified skill(s) on profile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Resume &amp; Match
              </span>
              <FileSearch className="h-4 w-4 text-[#6D5DFB]" />
            </div>
            <p className="text-2xl font-semibold text-[#172033] mt-3 tabular-nums">
              {loading
                ? "—"
                : data?.latestResumeScore !== null
                ? `${data?.latestResumeScore}%`
                : "0 Resumes"}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              JD Compatibility:{" "}
              {data?.latestJobMatchScore !== null ? `${data?.latestJobMatchScore}%` : "No match yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Mock Interviews
              </span>
              <Mic className="h-4 w-4 text-[#6D5DFB]" />
            </div>
            <p className="text-2xl font-semibold text-[#172033] mt-3 tabular-nums">
              {loading ? "—" : data?.totalMockInterviews ?? 0}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Avg Score:{" "}
              {data?.averageInterviewScore !== null
                ? `${data?.averageInterviewScore}%`
                : "Not assessed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Applications &amp; Roadmap
              </span>
              <Briefcase className="h-4 w-4 text-[#6D5DFB]" />
            </div>
            <p className="text-2xl font-semibold text-[#172033] mt-3 tabular-nums">
              {loading ? "—" : `${data?.applicationStats.total ?? 0} Applied`}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Roadmap:{" "}
              {data?.roadmapProgressPct !== null ? `${data?.roadmapProgressPct}%` : "Not started"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart + AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader
            title="Preparation Signals Overview"
            subtitle="Live breakdown across Profile, Resume, JD Match, Interviews & Roadmap"
            action={
              <Badge tone="neutral" className="tabular-nums">
                Profile {data?.profileCompletenessPct ?? 0}%
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
                  <Bar dataKey="value" fill="#6D5DFB" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader
            title="AI Career Recommendations"
            subtitle="Dynamic next steps prioritized for your current state"
          />
          <CardContent className="space-y-3">
            {(data?.recommendations ?? []).length > 0 ? (
              data?.recommendations.map((rec) => (
                <div
                  key={rec.title}
                  className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/60 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={rec.priority === "HIGH" ? "warning" : "brand"}>
                        {rec.priority}
                      </Badge>
                      <p className="text-xs font-semibold text-[#172033]">{rec.title}</p>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">{rec.reason}</p>
                  </div>
                  <Link href={rec.actionHref} className="shrink-0">
                    <Button variant="ghost" size="sm" className="text-[#6D5DFB]">
                      {rec.actionLabel}
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#64748B] py-4 text-center">
                All core setup recommendations completed.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Split: Recent Activities + Upcoming Interviews & Stack Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader
            title="Recent Activities"
            subtitle="Verified PostgreSQL timeline of your profile & evaluations"
          />
          <CardContent>
            {data?.recentActivities && data.recentActivities.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recentActivities.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#172033]">{item.title}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{item.subtitle}</p>
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums shrink-0">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748B] py-4 text-center">
                No recent activity recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader
              title="Upcoming Company Interviews"
              subtitle="Scheduled interviews from Application Tracker"
            />
            <CardContent>
              {data?.upcomingInterviews && data.upcomingInterviews.length > 0 ? (
                <div className="space-y-2.5">
                  {data.upcomingInterviews.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#172033]">{item.company}</p>
                        <p className="text-[11px] text-[#64748B]">{item.jobRole}</p>
                      </div>
                      <Badge tone="brand" className="tabular-nums">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.interviewDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B] py-2">
                  No upcoming interviews scheduled. Add applications in Phase 7 to track dates.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Service Telemetry" subtitle="Backend & AI Infrastructure" />
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-[#E2E8F0] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172033]">
                  <Database className="h-3.5 w-3.5 text-[#6D5DFB]" />
                  PostgreSQL
                </div>
                <Badge tone={data?.serviceHealth.database === "healthy" ? "success" : "neutral"}>
                  {data?.serviceHealth.database === "healthy" ? "Connected" : "Checking"}
                </Badge>
              </div>
              <div className="p-3 rounded-lg border border-[#E2E8F0] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172033]">
                  <Layers className="h-3.5 w-3.5 text-[#6D5DFB]" />
                  FastAPI AI
                </div>
                <Badge tone={data?.serviceHealth.aiService === "healthy" ? "success" : "warning"}>
                  {data?.serviceHealth.aiService === "healthy" ? "Online" : "Standby"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Resume AI", href: "/resume", icon: FileSearch },
          { label: "Job Matcher", href: "/matcher", icon: GitCompare },
          { label: "Mock Interview", href: "/interview", icon: Mic },
          { label: "Learning Roadmap", href: "/roadmap", icon: Map },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#6D5DFB]/40 shadow-card flex items-center justify-between text-xs font-semibold text-[#172033] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#6D5DFB]" />
                {item.label}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[#64748B]" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
