"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  Layers,
  Loader2,
  Map,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
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
import {
  CAREER_ROLE_PRESETS,
  CurrentCandidateSkillDTO,
  JobMatchDTO,
  ProficiencyLevel,
  ResumeDTO,
  SkillBenchmarkStatus,
  SkillCategory,
  SkillGapReportDTO,
} from "@careerpilot/shared";
import { ApiClientError } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { resumeApi } from "@/services/resume.service";
import { matcherApi } from "@/services/matcher.service";
import { skillsApi, SkillCatalogEntry } from "@/services/skills.service";
import { roadmapApi } from "@/services/roadmap.service";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";

function CategoryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload?: { covered: number; total: number } }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const meta = payload[0].payload;
  return (
    <div className="bg-[#111827] text-white px-3 py-2 rounded-lg shadow-lg border border-slate-700 text-xs">
      <p className="font-semibold text-slate-200">{label}</p>
      <p className="text-[#A59BFF] font-semibold mt-0.5 tabular-nums">
        {payload[0].value}% covered ({meta?.covered ?? 0}/{meta?.total ?? 0})
      </p>
    </div>
  );
}

export default function SkillGapAnalyzerPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [userSkills, setUserSkills] = useState<CurrentCandidateSkillDTO[]>([]);
  const [catalog, setCatalog] = useState<SkillCatalogEntry[]>([]);
  const [resumes, setResumes] = useState<ResumeDTO[]>([]);
  const [matches, setMatches] = useState<JobMatchDTO[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const [targetRole, setTargetRole] = useState<string>(
    user?.targetRole || CAREER_ROLE_PRESETS[0]
  );
  const [resumeId, setResumeId] = useState<string>("");
  const [jobMatchId, setJobMatchId] = useState<string>("");

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>(SkillCategory.BACKEND);
  const [newSkillLevel, setNewSkillLevel] = useState<ProficiencyLevel>(
    ProficiencyLevel.INTERMEDIATE
  );
  const [updatingSkill, setUpdatingSkill] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [report, setReport] = useState<SkillGapReportDTO | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | SkillBenchmarkStatus>("ALL");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [inv, rList, mList] = await Promise.all([
        skillsApi.getInventory(),
        resumeApi.list(),
        matcherApi.list(),
      ]);
      setUserSkills(inv.userSkills);
      setCatalog(inv.catalog);
      setResumes(rList.filter((r) => Boolean(r.analyzedAt)));
      setMatches(mList);

      const primary = rList.find((r) => r.isPrimary && r.analyzedAt) || rList.find((r) => r.analyzedAt);
      if (primary) setResumeId(primary.id);
      if (mList[0]) setJobMatchId(mList[0].id);
    } catch {
      setErrorMsg("Unable to load your skill inventory and benchmark inputs.");
    } finally {
      setLoadingInit(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (user?.targetRole) {
      setTargetRole(user.targetRole);
    }
  }, [user?.targetRole]);

  async function handleAnalyze(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setAnalyzing(true);
    try {
      const res = await skillsApi.analyzeGap({
        targetRole: targetRole.trim() || undefined,
        resumeId: resumeId || undefined,
        jobMatchId: jobMatchId || undefined,
      });
      setReport(res);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError
          ? err.message
          : "Skill gap analysis failed. Please verify the FastAPI AI service is running."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleQuickUpsert(
    name: string,
    category: SkillCategory,
    proficiencyLevel: ProficiencyLevel
  ) {
    setUpdatingSkill(name);
    setErrorMsg(null);
    try {
      await skillsApi.upsertSkill({ name, category, proficiencyLevel });
      const inv = await skillsApi.getInventory();
      setUserSkills(inv.userSkills);
      await refreshProfile();
      setInfoMsg(`Saved ${name} (${proficiencyLevel.toLowerCase()}) to your PostgreSQL skill profile.`);
      if (report) {
        const refreshed = await skillsApi.analyzeGap({
          targetRole: targetRole.trim() || undefined,
          resumeId: resumeId || undefined,
          jobMatchId: jobMatchId || undefined,
        });
        setReport(refreshed);
      }
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Failed to update skill.");
    } finally {
      setUpdatingSkill(null);
    }
  }

  async function handleAddCustomSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    await handleQuickUpsert(newSkillName.trim(), newSkillCategory, newSkillLevel);
    setNewSkillName("");
  }

  async function handleRemoveSkill(id: string) {
    setErrorMsg(null);
    try {
      await skillsApi.removeSkill(id);
      setUserSkills((prev) => prev.filter((s) => s.id !== id));
      await refreshProfile();
    } catch {
      setErrorMsg("Unable to remove skill from profile.");
    }
  }

  async function handleGenerateRoadmapFromGaps() {
    setGeneratingPlan(true);
    setErrorMsg(null);
    try {
      await roadmapApi.generate({
        targetRole: targetRole.trim() || undefined,
        estimatedWeeks: 4,
        hoursPerWeek: 10,
        resumeId: resumeId || undefined,
        jobMatchId: jobMatchId || undefined,
      });
      router.push("/roadmap");
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError ? err.message : "Unable to generate personalized roadmap."
      );
      setGeneratingPlan(false);
    }
  }

  const filteredBenchmarks =
    report?.benchmarks.filter((b) =>
      statusFilter === "ALL" ? true : b.status === statusFilter
    ) ?? [];

  const ROLE_OPTIONS = Array.from(
    new Set([...CAREER_ROLE_PRESETS, ...(user?.targetRole ? [user.targetRole] : [])])
  );

  return (
    <div className="space-y-6">
      {/* Top Benchmark Control Bar */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-white via-white to-[#EEF2FF]/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge tone="brand">
                  <Sparkles className="h-3 w-3" />
                  Dependency-Aware Gap Engine
                </Badge>
                <Badge tone="neutral" className="tabular-nums">
                  {userSkills.length} Profile Skills
                </Badge>
              </div>
              <h2 className="text-lg font-semibold text-[#172033] tracking-tight">
                AI Skill Gap Analyzer &amp; Role Benchmark
              </h2>
              <p className="text-xs text-[#64748B]">
                Compare your PostgreSQL skills, analyzed resume, and job description matches against
                role benchmarks to prioritize what to study next.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="primary"
                onClick={() => void handleAnalyze()}
                loading={analyzing}
                disabled={loadingInit}
              >
                <Compass className="h-4 w-4" />
                {report ? "Re-Run Skill Audit" : "Analyze Skill Gaps"}
              </Button>

              {report && (
                <Button
                  variant="secondary"
                  onClick={() => void handleGenerateRoadmapFromGaps()}
                  loading={generatingPlan}
                >
                  <Map className="h-4 w-4" />
                  Build 4-Week Roadmap
                </Button>
              )}
            </div>
          </div>

          <form
            onSubmit={handleAnalyze}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80"
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">Target Job Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">
                Analyzed Resume Context (Optional)
              </label>
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
              >
                <option value="">None (Use Profile Skills Only)</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({Math.round(r.estimatedScore)}% ATS)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">
                Saved Job Match Benchmark (Optional)
              </label>
              <select
                value={jobMatchId}
                onChange={(e) => setJobMatchId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
              >
                <option value="">Role Standard Benchmark</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.companyName ? `${m.companyName} — ` : ""}
                    {m.targetRole} ({Math.round(m.matchScore)}% Match)
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* Analysis Loading Skeleton */}
      {analyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-7">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-56 w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skill Gap Report View */}
      {!analyzing && report && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Readiness Summary & Quick Wins */}
            <Card className="lg:col-span-5">
              <CardHeader
                icon={<TrendingUp className="h-4 w-4" />}
                title={`Readiness: ${report.targetRole}`}
                subtitle={`${report.masteredCount} mastered · ${report.needsLevelUpCount} level-up · ${report.missingCount} missing`}
              />
              <CardContent className="space-y-5">
                <div className="flex items-center gap-5">
                  <ProgressRing
                    value={report.readinessPct}
                    size={96}
                    strokeWidth={8}
                    color={
                      report.readinessPct >= 75
                        ? "#16A34A"
                        : report.readinessPct >= 45
                        ? "#6D5DFB"
                        : "#F59E0B"
                    }
                    label="Role Fit"
                  />
                  <div className="grid grid-cols-3 gap-2 flex-1 text-center">
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/70">
                      <p className="text-lg font-bold text-emerald-700 tabular-nums">
                        {report.masteredCount}
                      </p>
                      <p className="text-[10px] font-medium text-emerald-700">Mastered</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/70">
                      <p className="text-lg font-bold text-amber-700 tabular-nums">
                        {report.needsLevelUpCount}
                      </p>
                      <p className="text-[10px] font-medium text-amber-700">Level Up</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200/70">
                      <p className="text-lg font-bold text-rose-700 tabular-nums">
                        {report.missingCount}
                      </p>
                      <p className="text-[10px] font-medium text-rose-700">Missing</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                    AI Diagnostic Summary
                  </p>
                  <p className="text-xs text-[#172033] leading-relaxed">{report.aiSummary}</p>
                </div>

                {report.quickWins.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#172033]">7-Day Quick Wins</p>
                    <ul className="space-y-1.5">
                      {report.quickWins.map((win, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-[#64748B] leading-relaxed"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#6D5DFB] shrink-0 mt-0.5" />
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Coverage Chart */}
            <Card className="lg:col-span-7">
              <CardHeader
                icon={<Layers className="h-4 w-4" />}
                title="Skill Category Coverage"
                subtitle="Percentage of required role competencies met per engineering domain"
              />
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.categoryBreakdown}
                      margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="skillCatGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6D5DFB" />
                          <stop offset="100%" stopColor="#8B7CFF" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip cursor={{ fill: "#F1F5F9" }} content={<CategoryTooltip />} />
                      <Bar
                        dataKey="coveragePct"
                        fill="url(#skillCatGrad)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Dependency-Ordered Study Sequence */}
                {report.learningOrder.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#172033]">
                        Recommended Prerequisite Learning Sequence
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleGenerateRoadmapFromGaps()}
                        loading={generatingPlan}
                      >
                        Turn into Weekly Roadmap
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {report.learningOrder.map((skill, idx) => (
                        <React.Fragment key={skill}>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF2FF] border border-[#6D5DFB]/20 text-xs font-medium text-[#6D5DFB]">
                            <span className="h-4 w-4 rounded-full bg-[#6D5DFB] text-white text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            {skill}
                          </span>
                          {idx < report.learningOrder.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Skill Benchmarks Table / Cards */}
          <Card>
            <CardHeader
              icon={<BookOpen className="h-4 w-4" />}
              title="Detailed Skill Benchmarks & Resources"
              subtitle="Adjust proficiency directly to reflect new practice—scores re-sync to PostgreSQL"
              action={
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { key: "ALL", label: `All (${report.benchmarks.length})` },
                      { key: "MISSING", label: `Missing (${report.missingCount})` },
                      {
                        key: "NEEDS_LEVEL_UP",
                        label: `Level Up (${report.needsLevelUpCount})`,
                      },
                      { key: "MASTERED", label: `Mastered (${report.masteredCount})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setStatusFilter(tab.key)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        statusFilter === tab.key
                          ? "bg-[#6D5DFB] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              }
            />
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBenchmarks.map((b) => (
                <div
                  key={b.skill}
                  className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/50 hover:bg-white transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-[#172033]">{b.skill}</h4>
                        <Badge
                          tone={
                            b.status === "MASTERED"
                              ? "success"
                              : b.status === "NEEDS_LEVEL_UP"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {b.status === "MASTERED"
                            ? "Mastered"
                            : b.status === "NEEDS_LEVEL_UP"
                            ? "Needs Level Up"
                            : "Missing"}
                        </Badge>
                        <Badge tone="neutral">{b.importance.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1">
                        Required: <span className="font-medium text-[#172033]">{b.requiredLevel}</span>{" "}
                        · Yours:{" "}
                        <span className="font-medium text-[#172033]">
                          {b.currentLevel || "None"}
                        </span>
                        {b.prerequisites.length > 0 && ` · Prereqs: ${b.prerequisites.join(", ")}`}
                      </p>
                    </div>

                    <select
                      aria-label={`Set proficiency for ${b.skill}`}
                      disabled={updatingSkill === b.skill}
                      value={b.currentLevel || ""}
                      onChange={(e) => {
                        const lvl = e.target.value as ProficiencyLevel;
                        if (lvl) void handleQuickUpsert(b.skill, b.category, lvl);
                      }}
                      className="h-8 px-2 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-[#172033] focus:outline-none focus:border-[#6D5DFB]"
                    >
                      <option value="">Set Level...</option>
                      <option value={ProficiencyLevel.BEGINNER}>Beginner</option>
                      <option value={ProficiencyLevel.INTERMEDIATE}>Intermediate</option>
                      <option value={ProficiencyLevel.ADVANCED}>Advanced</option>
                    </select>
                  </div>

                  <p className="text-xs text-[#64748B] leading-relaxed">{b.recommendedAction}</p>

                  {b.resources.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {b.resources.map((res) => (
                        <a
                          key={res.url}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-[#6D5DFB]/40 hover:text-[#6D5DFB] text-[11px] font-medium text-[#172033] transition-colors"
                        >
                          <span className="text-[9px] font-bold uppercase text-[#6D5DFB]">
                            {res.type}
                          </span>
                          <span className="truncate max-w-[180px]">{res.title}</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Candidate Verified Skill Inventory Manager */}
      <Card>
        <CardHeader
          icon={<Layers className="h-4 w-4" />}
          title="Your PostgreSQL Skill Inventory"
          subtitle="Skills synced across Profile & Resume AI—add or calibrate any skill directly"
        />
        <CardContent className="space-y-4">
          <form onSubmit={handleAddCustomSkill} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              list="careerpilot-skill-catalog"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Add skill (e.g. Docker, TypeScript, DSA)"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
            />
            <datalist id="careerpilot-skill-catalog">
              {catalog.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>

            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
            >
              {Object.values(SkillCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value as ProficiencyLevel)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
            >
              <option value={ProficiencyLevel.BEGINNER}>Beginner</option>
              <option value={ProficiencyLevel.INTERMEDIATE}>Intermediate</option>
              <option value={ProficiencyLevel.ADVANCED}>Advanced</option>
            </select>

            <Button type="submit" variant="secondary" loading={updatingSkill === newSkillName.trim()}>
              <Plus className="h-4 w-4" />
              Save Skill
            </Button>
          </form>

          {loadingInit ? (
            <div className="flex items-center gap-2 text-xs text-[#64748B] py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[#6D5DFB]" />
              Loading verified skills...
            </div>
          ) : userSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userSkills.map((sk) => (
                <div
                  key={sk.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
                >
                  <span className="font-semibold text-[#172033]">{sk.name}</span>
                  <Badge tone="brand">{sk.proficiencyLevel}</Badge>
                  <button
                    type="button"
                    onClick={() => void handleRemoveSkill(sk.id)}
                    title={`Remove ${sk.name}`}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64748B] py-2">
              No skills recorded yet. Add skills above or analyze a resume in Resume AI to auto-sync
              your technical stack.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
