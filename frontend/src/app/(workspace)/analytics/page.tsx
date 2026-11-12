"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Layers,
  Map,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DetailedAnalyticsDTO } from "@careerpilot/shared";
import { analyticsApi } from "@/services/applications.service";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DeepAnalyticsPage() {
  const [data, setData] = useState<DetailedAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await analyticsApi.detailed();
        if (active) setData(res);
      } catch {
        if (active) setError("Unable to load longitudinal career analytics.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error || "Analytics unavailable."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Readiness Index
              </p>
              <p className="text-2xl font-bold text-[#172033] mt-2 tabular-nums">
                {data.overview.readinessScore !== null ? `${data.overview.readinessScore}%` : "—"}
              </p>
            </div>
            <ProgressRing value={data.overview.readinessScore} size={56} strokeWidth={6} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Interview Avg
              </p>
              <p className="text-2xl font-bold text-[#172033] mt-2 tabular-nums">
                {data.overview.averageInterviewScore !== null
                  ? `${data.overview.averageInterviewScore}%`
                  : "—"}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Across {data.overview.totalMockInterviews} session(s)
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Interview Rate
              </p>
              <p className="text-2xl font-bold text-[#172033] mt-2 tabular-nums">
                {data.conversionMetrics.interviewRatePct}%
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                From {data.conversionMetrics.totalApps} application(s)
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Offer Conversion
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">
                {data.conversionMetrics.offerRatePct}%
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                {data.overview.applicationStats.offersReceived} offer(s) / selected
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader
            icon={<Activity className="h-4 w-4" />}
            title="Mock Interview Score Progression"
            subtitle="Chronological performance trajectory from completed sessions"
          />
          <CardContent>
            {data.interviewTrend.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.interviewTrend}
                    margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="ivGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6D5DFB" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6D5DFB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#6D5DFB"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#ivGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-medium text-[#172033]">
                  No completed mock interviews recorded yet
                </p>
                <Link href="/interview">
                  <Button variant="secondary" size="sm">
                    Launch Mock Interview
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader
            icon={<BarChart3 className="h-4 w-4" />}
            title="Application Pipeline Funnel"
            subtitle="Live breakdown across your active job application stages"
          />
          <CardContent>
            {data.conversionMetrics.totalApps > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.applicationFunnel}
                    margin={{ top: 10, right: 16, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B7CFF" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-medium text-[#172033]">
                  No job applications tracked yet
                </p>
                <Link href="/applications">
                  <Button variant="secondary" size="sm">
                    Open Application Tracker
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Insights: Skill Category Coverage + Weak Topics + Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5">
          <CardHeader
            icon={<Layers className="h-4 w-4" />}
            title="Verified Skill Portfolio by Domain"
            subtitle="Average confidence across UserSkill categories"
          />
          <CardContent className="space-y-3">
            {data.skillCategoryStats.length > 0 ? (
              data.skillCategoryStats.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172033]">
                      {cat.label} ({cat.count})
                    </span>
                    <span className="font-medium text-[#6D5DFB] tabular-nums">
                      {cat.avgConfidence}% avg confidence
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#6D5DFB]"
                      style={{ width: `${cat.avgConfidence}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#64748B] py-6 text-center">
                Add skills via Profile or Resume AI to visualize domain strengths.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader
            icon={<Target className="h-4 w-4" />}
            title="Focus Weak Topics & Skill Hotspots"
            subtitle="Aggregated across mock interviews & JD matches"
          />
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase text-[#64748B]">
                Recurring Interview Weak Topics
              </p>
              {data.recurringWeakTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.recurringWeakTopics.map((wt) => (
                    <Badge key={wt.topic} tone="danger">
                      {wt.topic} ({wt.count}x)
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">No recurring weak topics flagged yet.</p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase text-[#64748B]">
                Frequent Missing JD Skills
              </p>
              {data.missingSkillHotspots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.missingSkillHotspots.map((sk) => (
                    <Badge key={sk} tone="warning">
                      {sk}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">Run JD Matcher to surface missing skills.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            icon={<Map className="h-4 w-4" />}
            title="Active Roadmap Velocity"
            subtitle={data.roadmapStats.activeTitle || "No active sprint"}
          />
          <CardContent className="space-y-4">
            {data.roadmapStats.activeProgressPct !== null ? (
              <>
                <div className="flex justify-center">
                  <ProgressRing
                    value={data.roadmapStats.activeProgressPct}
                    size={90}
                    strokeWidth={8}
                    color="#16A34A"
                    label="Sprint"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
                    <p className="font-bold tabular-nums">{data.roadmapStats.completedTasks}</p>
                    <p className="text-[10px]">Done</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#EEF2FF] text-[#6D5DFB]">
                    <p className="font-bold tabular-nums">{data.roadmapStats.inProgressTasks}</p>
                    <p className="text-[10px]">Doing</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                    <p className="font-bold tabular-nums">{data.roadmapStats.pendingTasks}</p>
                    <p className="text-[10px]">Todo</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-[#64748B]">No active learning roadmap.</p>
                <Link href="/roadmap">
                  <Button variant="secondary" size="sm">
                    Create Roadmap
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Speed & Reliability */}
      {data.aiTelemetry && (
        <Card>
          <CardHeader
            icon={<Activity className="h-4 w-4" />}
            title="AI Assistant Speed &amp; Reliability"
            subtitle="Live response times, check completion rate, and backup model status for your AI requests"
          />
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  AI Requests Run
                </p>
                <p className="text-xl font-bold text-[#172033] mt-1 tabular-nums">
                  {data.aiTelemetry.totalCalls}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Average Wait Time
                </p>
                <p className="text-xl font-bold text-[#6D5DFB] mt-1 tabular-nums">
                  {data.aiTelemetry.avgLatencyMs} ms
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Successful Checks
                </p>
                <p className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                  {data.aiTelemetry.successRatePct}%
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Backup AI Used
                </p>
                <p className="text-xl font-bold text-[#172033] mt-1 tabular-nums">
                  {data.aiTelemetry.fallbackCount}
                </p>
              </div>
            </div>

            {data.aiTelemetry.byOperation.length > 0 && (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.aiTelemetry.byOperation}
                    margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="operation" tick={{ fill: "#64748B", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="avgLatencyMs"
                      name="Response Time (ms)"
                      fill="#6D5DFB"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.aiTelemetry.recentLogs.length > 0 ? (
              <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      <th className="py-2.5 px-4">Feature Used</th>
                      <th className="py-2.5 px-3">AI Engine</th>
                      <th className="py-2.5 px-3">Response Time</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.aiTelemetry.recentLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2 px-4 font-medium text-[#172033]">{log.operation}</td>
                        <td className="py-2 px-3 text-[#64748B]">
                          {log.provider} / {log.model}
                          {log.fallbackUsed && (
                            <Badge tone="warning" className="ml-2">
                              Fallback
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 px-3 tabular-nums text-[#172033]">
                          {log.latencyMs} ms
                        </td>
                        <td className="py-2 px-3">
                          <Badge tone={log.success ? "success" : "danger"}>
                            {log.success ? "OK" : log.errorCode || "ERR"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#64748B]">
                Run any AI evaluation (Resume, Match, Roadmap, Interview) to observe live model
                telemetry here.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
