"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Kanban,
  List,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ApplicationStatus, JobApplicationDTO } from "@careerpilot/shared";
import { ApiClientError } from "@/lib/api";
import { applicationsApi } from "@/services/applications.service";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; tone: "brand" | "neutral" | "success" | "warning" | "danger" }
> = {
  [ApplicationStatus.APPLIED]: { label: "Applied", tone: "neutral" },
  [ApplicationStatus.ASSESSMENT]: { label: "Assessment", tone: "brand" },
  [ApplicationStatus.INTERVIEW_SCHEDULED]: { label: "Interview Scheduled", tone: "warning" },
  [ApplicationStatus.SELECTED]: { label: "Selected", tone: "success" },
  [ApplicationStatus.OFFER_RECEIVED]: { label: "Offer Received", tone: "success" },
  [ApplicationStatus.REJECTED]: { label: "Rejected", tone: "danger" },
};

export default function ApplicationsTrackerPage() {
  const [apps, setApps] = useState<JobApplicationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Add application form modal toggle
  const [showAddForm, setShowAddForm] = useState(false);
  const [company, setCompany] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>(ApplicationStatus.APPLIED);
  const [interviewDate, setInterviewDate] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadApps = useCallback(async () => {
    try {
      const list = await applicationsApi.list({
        status: statusFilter,
        search: searchTerm,
      });
      setApps(list);
    } catch {
      setErrorMsg("Unable to load job applications from PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !jobRole.trim()) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const created = await applicationsApi.create({
        company: company.trim(),
        jobRole: jobRole.trim(),
        status,
        interviewDate: interviewDate ? new Date(interviewDate).toISOString() : null,
        applicationUrl: applicationUrl.trim() || null,
        notes: notes.trim() || null,
      });
      setApps((prev) => [created, ...prev]);
      setCompany("");
      setJobRole("");
      setInterviewDate("");
      setApplicationUrl("");
      setNotes("");
      setShowAddForm(false);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Failed to save application.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, nextStatus: ApplicationStatus) {
    setErrorMsg(null);
    try {
      const updated = await applicationsApi.update(id, { status: nextStatus });
      setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {
      setErrorMsg("Unable to update pipeline status.");
    }
  }

  async function handleDelete(id: string) {
    setErrorMsg(null);
    try {
      await applicationsApi.delete(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setErrorMsg("Unable to delete application record.");
    }
  }

  const totalCount = apps.length;
  const interviewsCount = apps.filter(
    (a) => a.status === ApplicationStatus.INTERVIEW_SCHEDULED
  ).length;
  const offersCount = apps.filter(
    (a) =>
      a.status === ApplicationStatus.OFFER_RECEIVED ||
      a.status === ApplicationStatus.SELECTED
  ).length;
  const interviewPlusOffers =
    interviewsCount + offersCount;
  const interviewRate =
    totalCount > 0 ? Math.round((interviewPlusOffers / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Tracked Applications
              </p>
              <p className="text-2xl font-bold text-[#172033] mt-2 tabular-nums">{totalCount}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Interviews Scheduled
              </p>
              <p className="text-2xl font-bold text-[#172033] mt-2 tabular-nums">
                {interviewsCount}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Selected / Offers
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">{offersCount}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Interview Conversion
              </p>
              <p className="text-2xl font-bold text-[#172033] mt-2 tabular-nums">
                {interviewRate}%
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-[#6D5DFB] flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Bar */}
      <Card>
        <div className="p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search company or role..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-[#172033] focus:outline-none focus:border-[#6D5DFB]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-[#172033]"
            >
              <option value="ALL">All Stages</option>
              {Object.values(ApplicationStatus).map((st) => (
                <option key={st} value={st}>
                  {STATUS_META[st].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                  viewMode === "table" ? "bg-white text-[#172033] shadow-sm" : "text-slate-500"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                  viewMode === "board" ? "bg-white text-[#172033] shadow-sm" : "text-slate-500"
                }`}
              >
                <Kanban className="h-3.5 w-3.5" />
                Board
              </button>
            </div>

            <Button variant="primary" size="sm" onClick={() => setShowAddForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showAddForm ? "Close Form" : "Add Application"}
            </Button>
          </div>
        </div>

        {/* Collapsible Add Application Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="px-6 pb-6 pt-4 border-t border-slate-100 bg-[#F8FAFC]/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <Input
              label="Company Name"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Atlassian"
            />
            <Input
              label="Role Title"
              required
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Software Engineer I"
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">Pipeline Stage</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
              >
                {Object.values(ApplicationStatus).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_META[st].label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Interview Date (Optional)"
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
            />
            <Input
              label="Posting URL (Optional)"
              type="url"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://careers..."
            />
            <Input
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referral, recruiter contact, prep focus..."
            />

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <Button type="submit" variant="primary" loading={submitting}>
                Save Application to Pipeline
              </Button>
            </div>
          </form>
        )}
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <Briefcase className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-[#172033]">No applications tracked yet</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Add companies you apply to so CareerPilot AI can monitor upcoming interview dates and
              calculate pipeline conversion metrics.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4" />
              Log First Application
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3 px-5">Company &amp; Role</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Applied</th>
                  <th className="py-3 px-4">Interview Date</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#172033]">{app.company}</span>
                        {app.applicationUrl && (
                          <a
                            href={app.applicationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-[#6D5DFB]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{app.jobRole}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Status for ${app.company}`}
                        value={app.status}
                        onChange={(e) =>
                          void handleStatusChange(app.id, e.target.value as ApplicationStatus)
                        }
                        className="h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-[#172033]"
                      >
                        {Object.values(ApplicationStatus).map((st) => (
                          <option key={st} value={st}>
                            {STATUS_META[st].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B] tabular-nums">
                      {new Date(app.applicationDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      {app.interviewDate ? (
                        <Badge tone="brand">
                          {new Date(app.interviewDate).toLocaleDateString()}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px] truncate text-[#64748B]">
                      {app.notes || "—"}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(app.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete application"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.values(ApplicationStatus).map((stage) => {
            const stageApps = apps.filter((a) => a.status === stage);
            const meta = STATUS_META[stage];
            return (
              <Card key={stage}>
                <CardHeader
                  title={meta.label}
                  action={<Badge tone={meta.tone}>{stageApps.length}</Badge>}
                />
                <CardContent className="space-y-3">
                  {stageApps.length > 0 ? (
                    stageApps.map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-[#172033]">{app.company}</p>
                            <p className="text-[11px] text-[#64748B]">{app.jobRole}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDelete(app.id)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {app.interviewDate && (
                          <p className="text-[11px] text-[#6D5DFB] font-medium tabular-nums">
                            Interview: {new Date(app.interviewDate).toLocaleDateString()}
                          </p>
                        )}

                        <select
                          value={app.status}
                          onChange={(e) =>
                            void handleStatusChange(app.id, e.target.value as ApplicationStatus)
                          }
                          className="w-full h-8 px-2 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-[#172033]"
                        >
                          {Object.values(ApplicationStatus).map((st) => (
                            <option key={st} value={st}>
                              Move to {STATUS_META[st].label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">Empty stage</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
