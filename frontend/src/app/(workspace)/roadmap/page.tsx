"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Loader2,
  Map,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  CAREER_ROLE_PRESETS,
  JobMatchDTO,
  LearningRoadmapDTO,
  ResumeDTO,
  TaskPriority,
  TaskStatus,
} from "@careerpilot/shared";
import { ApiClientError } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { roadmapApi } from "@/services/roadmap.service";
import { resumeApi } from "@/services/resume.service";
import { matcherApi } from "@/services/matcher.service";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";

export default function LearningRoadmapPage() {
  const { user } = useAuth();

  const [roadmaps, setRoadmaps] = useState<LearningRoadmapDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resumes, setResumes] = useState<ResumeDTO[]>([]);
  const [matches, setMatches] = useState<JobMatchDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [targetRole, setTargetRole] = useState<string>(
    user?.targetRole || CAREER_ROLE_PRESETS[0]
  );
  const [estimatedWeeks, setEstimatedWeeks] = useState<number>(4);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const [resumeId, setResumeId] = useState<string>("");
  const [jobMatchId, setJobMatchId] = useState<string>("");

  const [generating, setGenerating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [rMaps, rList, mList] = await Promise.all([
        roadmapApi.list(),
        resumeApi.list(),
        matcherApi.list(),
      ]);
      setRoadmaps(rMaps);
      setResumes(rList.filter((r) => Boolean(r.analyzedAt)));
      setMatches(mList);

      const activeMap = rMaps.find((m) => m.isActive) || rMaps[0] || null;
      if (activeMap) setSelectedId(activeMap.id);

      const primary = rList.find((r) => r.isPrimary && r.analyzedAt) || rList.find((r) => r.analyzedAt);
      if (primary) setResumeId(primary.id);
      if (mList[0]) setJobMatchId(mList[0].id);
    } catch {
      setErrorMsg("Unable to load your saved learning roadmaps.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (user?.targetRole) {
      setTargetRole(user.targetRole);
    }
  }, [user?.targetRole]);

  const activeRoadmap =
    roadmaps.find((r) => r.id === selectedId) || roadmaps.find((r) => r.isActive) || roadmaps[0] || null;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setGenerating(true);
    try {
      const created = await roadmapApi.generate({
        targetRole: targetRole.trim() || undefined,
        estimatedWeeks,
        hoursPerWeek,
        resumeId: resumeId || undefined,
        jobMatchId: jobMatchId || undefined,
      });
      setRoadmaps((prev) => [
        created,
        ...prev.map((m) => ({ ...m, isActive: false })),
      ]);
      setSelectedId(created.id);
      setWeekFilter("ALL");
      setStatusFilter("ALL");
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError
          ? err.message
          : "Roadmap generation failed. Please verify FastAPI AI service availability."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleTaskStatusChange(taskId: string, nextStatus: TaskStatus) {
    if (!activeRoadmap) return;
    setUpdatingTaskId(taskId);
    setErrorMsg(null);
    try {
      const updated = await roadmapApi.updateTask(activeRoadmap.id, taskId, {
        status: nextStatus,
      });
      setRoadmaps((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError ? err.message : "Failed to save task progress."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function handleActivate(id: string) {
    setErrorMsg(null);
    try {
      const updated = await roadmapApi.activate(id);
      setRoadmaps((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : { ...r, isActive: false }))
      );
      setSelectedId(updated.id);
    } catch {
      setErrorMsg("Unable to switch active roadmap.");
    }
  }

  async function handleDelete(id: string) {
    setErrorMsg(null);
    try {
      await roadmapApi.delete(id);
      const remaining = roadmaps.filter((r) => r.id !== id);
      setRoadmaps(remaining);
      if (selectedId === id) {
        setSelectedId(remaining[0]?.id ?? null);
      }
    } catch {
      setErrorMsg("Unable to delete learning roadmap.");
    }
  }

  const ROLE_OPTIONS = Array.from(
    new Set([...CAREER_ROLE_PRESETS, ...(user?.targetRole ? [user.targetRole] : [])])
  );

  const visibleTasks =
    activeRoadmap?.tasks.filter((t) => {
      const matchWeek = weekFilter === "ALL" ? true : t.weekNumber === weekFilter;
      const matchStatus = statusFilter === "ALL" ? true : t.status === statusFilter;
      return matchWeek && matchStatus;
    }) ?? [];

  const weeksPresent = activeRoadmap
    ? Array.from(new Set(visibleTasks.map((t) => t.weekNumber))).sort((a, b) => a - b)
    : [];

  return (
    <div className="space-y-6">
      {/* Roadmap Generator Control Card */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-white via-white to-[#EEF2FF]/65">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge tone="brand">
                  <Sparkles className="h-3 w-3" />
                  AI Sprint Planner
                </Badge>
                <Badge tone="neutral" className="tabular-nums">
                  {roadmaps.length} Saved Plan{roadmaps.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold text-[#172033] tracking-tight">
                Personalized Learning Roadmap
              </h2>
              <p className="text-xs text-[#64748B]">
                Turn open skill gaps into week-by-week execution sprints persisted in PostgreSQL
                that dynamically update your Dashboard Readiness.
              </p>
            </div>

            <Link href="/skills" className="shrink-0">
              <Button variant="outline" size="sm">
                Inspect Skill Gaps First
              </Button>
            </Link>
          </div>

          <form
            onSubmit={handleGenerate}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-200/80 items-end"
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">Target Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">Duration (Weeks)</label>
              <select
                value={estimatedWeeks}
                onChange={(e) => setEstimatedWeeks(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
              >
                {[2, 4, 6, 8, 12].map((w) => (
                  <option key={w} value={w}>
                    {w} Weeks
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">Study Pace</label>
              <select
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
              >
                {[6, 10, 15, 20, 30].map((h) => (
                  <option key={h} value={h}>
                    {h} hrs / week
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">
                JD Match Context
              </label>
              <select
                value={jobMatchId}
                onChange={(e) => setJobMatchId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
              >
                <option value="">General Role Gaps</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.companyName ? `${m.companyName} — ` : ""}
                    {m.targetRole}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" variant="primary" className="w-full h-10" loading={generating}>
              <Map className="h-4 w-4" />
              Generate Plan
            </Button>
          </form>
        </div>
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Saved Roadmap Selector Tabs */}
      {roadmaps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5">
          {roadmaps.map((rm) => {
            const isSelected = rm.id === activeRoadmap?.id;
            return (
              <div
                key={rm.id}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? "bg-white border-[#6D5DFB] shadow-card text-[#172033]"
                    : "bg-white/70 border-[#E2E8F0] text-[#64748B] hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(rm.id);
                    setWeekFilter("ALL");
                  }}
                  className="font-semibold flex items-center gap-2 text-left"
                >
                  <span>{rm.title}</span>
                  <span className="tabular-nums text-[11px] font-medium text-[#6D5DFB]">
                    {Math.round(rm.progressPct)}%
                  </span>
                </button>
                {rm.isActive ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleActivate(rm.id)}
                    className="text-[11px] font-medium text-[#6D5DFB] hover:underline"
                  >
                    Set Active
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(rm.id)}
                  title="Delete roadmap"
                  className="text-slate-400 hover:text-rose-500 transition-colors ml-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading / Generating Skeleton */}
      {(loading || generating) && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#6D5DFB]" />
              <p className="text-sm font-medium text-[#172033]">
                {generating
                  ? "Synthesizing dependency-ordered weekly study sprint with Gemini..."
                  : "Loading saved learning roadmaps..."}
              </p>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Active Roadmap Details & Weekly Timeline */}
      {!loading && !generating && activeRoadmap ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <ProgressRing
                  value={activeRoadmap.progressPct}
                  size={88}
                  strokeWidth={8}
                  color={activeRoadmap.progressPct >= 80 ? "#16A34A" : "#6D5DFB"}
                  label="Done"
                />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-[#172033]">{activeRoadmap.title}</h3>
                    {activeRoadmap.isActive && <Badge tone="success">Dashboard Synced</Badge>}
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Target: <span className="font-medium text-[#172033]">{activeRoadmap.targetRole}</span>{" "}
                    · {activeRoadmap.estimatedWeeks} weeks plan ·{" "}
                    <span className="tabular-nums">
                      {activeRoadmap.completedTasks}/{activeRoadmap.totalTasks} tasks completed
                    </span>
                    {activeRoadmap.inProgressTasks > 0 &&
                      ` (${activeRoadmap.inProgressTasks} in progress)`}
                  </p>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  aria-label="Filter by week"
                  value={weekFilter}
                  onChange={(e) =>
                    setWeekFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
                  }
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-[#172033]"
                >
                  <option value="ALL">All Weeks (1–{activeRoadmap.estimatedWeeks})</option>
                  {Array.from({ length: activeRoadmap.estimatedWeeks }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by task status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "ALL")}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-[#172033]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value={TaskStatus.PENDING}>Pending</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.COMPLETED}>Completed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Week Groups */}
          {weeksPresent.length > 0 ? (
            weeksPresent.map((weekNum) => {
              const weekTasks = visibleTasks.filter((t) => t.weekNumber === weekNum);
              const weekCompleted = weekTasks.filter(
                (t) => t.status === TaskStatus.COMPLETED
              ).length;

              return (
                <Card key={weekNum}>
                  <CardHeader
                    icon={<Calendar className="h-4 w-4" />}
                    title={`Week ${weekNum} Sprint`}
                    subtitle={`${weekCompleted} of ${weekTasks.length} milestone(s) completed`}
                    action={
                      <Badge
                        tone={weekCompleted === weekTasks.length ? "success" : "brand"}
                        className="tabular-nums"
                      >
                        {Math.round((weekCompleted / Math.max(weekTasks.length, 1)) * 100)}%
                      </Badge>
                    }
                  />
                  <CardContent className="divide-y divide-slate-100">
                    {weekTasks.map((task) => {
                      const isDone = task.status === TaskStatus.COMPLETED;
                      const isBusy = updatingTaskId === task.id;
                      return (
                        <div
                          key={task.id}
                          className={`py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-start justify-between gap-4 transition-opacity ${
                            isDone ? "opacity-75" : ""
                          }`}
                        >
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 tabular-nums">
                                Day {task.dayNumber}
                              </span>
                              <Badge tone="brand">{task.skillTag}</Badge>
                              <Badge
                                tone={
                                  task.priority === TaskPriority.HIGH
                                    ? "warning"
                                    : task.priority === TaskPriority.MEDIUM
                                    ? "neutral"
                                    : "neutral"
                                }
                              >
                                {task.priority}
                              </Badge>
                              {task.dueDate && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B] tabular-nums">
                                  <Clock className="h-3 w-3" />
                                  Due {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            <h4
                              className={`text-sm font-semibold text-[#172033] ${
                                isDone ? "line-through text-slate-500" : ""
                              }`}
                            >
                              {task.title}
                            </h4>
                            <p className="text-xs text-[#64748B] leading-relaxed">
                              {task.description}
                            </p>

                            {task.resources.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {task.resources.map((res) => (
                                  <a
                                    key={res.url}
                                    href={res.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-slate-200 hover:border-[#6D5DFB]/40 hover:text-[#6D5DFB] text-[11px] font-medium text-[#172033] transition-colors"
                                  >
                                    <span className="text-[9px] font-bold uppercase text-[#6D5DFB]">
                                      {res.type}
                                    </span>
                                    <span className="truncate max-w-[190px]">{res.title}</span>
                                    <ExternalLink className="h-3 w-3 text-slate-400" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 3-State Task Progress Segmented Buttons */}
                          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-lg border border-slate-200/80 shrink-0 self-start">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handleTaskStatusChange(task.id, TaskStatus.PENDING)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                                task.status === TaskStatus.PENDING
                                  ? "bg-white text-[#172033] shadow-sm"
                                  : "text-slate-500 hover:text-[#172033]"
                              }`}
                            >
                              <Circle className="h-3 w-3" />
                              Pending
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handleTaskStatusChange(task.id, TaskStatus.IN_PROGRESS)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                                task.status === TaskStatus.IN_PROGRESS
                                  ? "bg-[#6D5DFB] text-white shadow-sm"
                                  : "text-slate-500 hover:text-[#172033]"
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              Doing
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handleTaskStatusChange(task.id, TaskStatus.COMPLETED)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                                task.status === TaskStatus.COMPLETED
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "text-slate-500 hover:text-emerald-700"
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-[#64748B]">
                No tasks match the current week/status filters.
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        !loading &&
        !generating && (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center mx-auto">
                <Map className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-[#172033]">
                No Learning Roadmap Generated Yet
              </h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                Select your target role, weekly duration, and study hours above to synthesize a
                dependency-ordered weekly execution plan directly from your open skill gaps.
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
