"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  Wrench,
} from "lucide-react";
import {
  CAREER_ROLE_PRESETS,
  EXPERIENCE_LEVEL_OPTIONS,
  ResumeAnalysisType,
  ResumeDTO,
  TailoredResumeDTO,
} from "@careerpilot/shared";
import { ApiClientError } from "@/lib/api";
import { downloadTailoredResumePdf } from "@/lib/pdfExport";
import { useAuth } from "@/store/auth-context";
import { resumeApi } from "@/services/resume.service";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ResumeAnalyzerPage() {
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [resumes, setResumes] = useState<ResumeDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  const [dragging, setDragging] = useState(false);
  const [selectedRoleOption, setSelectedRoleOption] = useState<string>(
    user?.targetRole || CAREER_ROLE_PRESETS[0]
  );
  const [customRole, setCustomRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<string>(
    user?.careerPreferences?.experienceLevel || EXPERIENCE_LEVEL_OPTIONS[1]
  );
  const [analysisType, setAnalysisType] = useState<ResumeAnalysisType>(
    ResumeAnalysisType.COMPLETE_ANALYSIS
  );
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [previewMode, setPreviewMode] = useState<"report" | "document" | "parsed" | "tailored">(
    "report"
  );
  const [tailoring, setTailoring] = useState(false);
  const [tailoredDraft, setTailoredDraft] = useState<TailoredResumeDTO | null>(null);
  const [tailorJd, setTailorJd] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const selectedResume = resumes.find((r) => r.id === selectedId) || resumes[0] || null;
  const effectiveTargetRole =
    selectedRoleOption === "Other"
      ? customRole.trim() || user?.targetRole || "Full Stack Developer"
      : selectedRoleOption;

  useEffect(() => {
    if (!user) return;
    if (user.targetRole) {
      if ((CAREER_ROLE_PRESETS as readonly string[]).includes(user.targetRole)) {
        setSelectedRoleOption(user.targetRole);
      } else {
        setSelectedRoleOption("Other");
        setCustomRole(user.targetRole);
      }
    }
    if (user.careerPreferences?.experienceLevel) {
      setExperienceLevel(user.careerPreferences.experienceLevel);
    }
  }, [user]);

  const loadResumes = useCallback(async () => {
    try {
      const list = await resumeApi.list();
      setResumes(list);
      setSelectedId((prev) => {
        if (prev && list.some((r) => r.id === prev)) return prev;
        return list.find((r) => r.isPrimary)?.id || list[0]?.id || null;
      });
    } catch {
      setErrorMsg("Unable to load your uploaded resumes.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  // Securely load authenticated PDF preview Blob URL when Document Preview tab opens
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function loadFilePreview() {
      if (previewMode !== "document" || !selectedResume || selectedResume.fileType !== "PDF") {
        return;
      }
      setLoadingPreview(true);
      try {
        const blob = await resumeApi.fetchFileBlob(selectedResume.id);
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(createdUrl);
      } catch {
        if (active) setPdfBlobUrl(null);
      } finally {
        if (active) setLoadingPreview(false);
      }
    }

    void loadFilePreview();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [previewMode, selectedResume]);

  async function processFileUpload(file: File) {
    setErrorMsg(null);
    setInfoMsg(null);

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      setErrorMsg("Unsupported file type. Please upload a PDF or DOCX resume.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File exceeds 10 MB maximum limit.");
      return;
    }

    try {
      setProcessingStep("Validating & uploading resume safely...");
      const uploaded = await resumeApi.upload(file);
      setResumes((prev) => [uploaded, ...prev]);
      setSelectedId(uploaded.id);

      setProcessingStep(
        "Parsing sections, extracting verified skills & generating ATS feedback..."
      );
      const analyzed = await resumeApi.analyze(uploaded.id, {
        targetRole: effectiveTargetRole,
        experienceLevel,
        analysisType,
      });
      setResumes((prev) => prev.map((r) => (r.id === analyzed.id ? analyzed : r)));
      setInfoMsg("Resume parsed and evaluated successfully.");
      setPreviewMode("report");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Unexpected error during resume upload or AI evaluation.");
      }
    } finally {
      setProcessingStep(null);
    }
  }

  async function handleReanalyze(id: string) {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      setProcessingStep("Running fresh AI analysis against your target role...");
      const updated = await resumeApi.analyze(id, {
        targetRole: effectiveTargetRole,
        experienceLevel,
        analysisType,
      });
      setResumes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setInfoMsg("Resume evaluation refreshed.");
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Failed to analyze resume.");
    } finally {
      setProcessingStep(null);
    }
  }

  async function handleSyncSkills(id: string) {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const res = await resumeApi.syncSkills(id);
      await refreshProfile();
      setInfoMsg(`Synced ${res.syncedCount} detected skills into your Candidate Profile.`);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Could not sync skills.");
    }
  }

  async function handleSetPrimary(id: string) {
    try {
      await resumeApi.setPrimary(id);
      setResumes((prev) => prev.map((r) => ({ ...r, isPrimary: r.id === id })));
    } catch {
      setErrorMsg("Failed to mark primary resume.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this resume and its evaluation report permanently?")) return;
    try {
      await resumeApi.delete(id);
      const next = resumes.filter((r) => r.id !== id);
      setResumes(next);
      if (selectedId === id) {
        setSelectedId(next[0]?.id || null);
      }
      setInfoMsg("Resume deleted.");
    } catch {
      setErrorMsg("Failed to delete resume.");
    }
  }

  async function handleTailorResume(id: string) {
    setErrorMsg(null);
    setInfoMsg(null);
    setTailoring(true);
    try {
      const res = await resumeApi.tailor(id, {
        targetRole: effectiveTargetRole,
        jobDescription: tailorJd.trim() || undefined,
      });
      setTailoredDraft(res);
      setPreviewMode("tailored");
      setInfoMsg("Generated tailored ATS resume rewrite.");
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Could not tailor resume.");
    } finally {
      setTailoring(false);
    }
  }

  function scoreTone(score: number): "success" | "warning" | "danger" {
    if (score >= 75) return "success";
    if (score >= 55) return "warning";
    return "danger";
  }

  return (
    <div className="space-y-6">
      {/* Top Configurator & Drag-and-Drop Uploader Card */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">Target Role</label>
              <select
                value={selectedRoleOption}
                onChange={(e) => setSelectedRoleOption(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
              >
                {[...CAREER_ROLE_PRESETS, "Other"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {selectedRoleOption === "Other" && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Custom role..."
                  className="mt-1.5 w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-[#172033]"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
              >
                {EXPERIENCE_LEVEL_OPTIONS.map((exp) => (
                  <option key={exp} value={exp}>
                    {exp}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172033]">Analysis Focus</label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as ResumeAnalysisType)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
              >
                <option value={ResumeAnalysisType.COMPLETE_ANALYSIS}>Complete Resume Analysis</option>
                <option value={ResumeAnalysisType.ATS_COMPATIBILITY}>ATS Compatibility</option>
                <option value={ResumeAnalysisType.TECHNICAL_SKILLS}>Technical Skills Analysis</option>
                <option value={ResumeAnalysisType.PROJECT_EVALUATION}>Project Evaluation</option>
              </select>
              <p className="text-[11px] text-[#64748B]">
                {analysisType === ResumeAnalysisType.ATS_COMPATIBILITY
                  ? "Checks formatting, section headers, and recruiter screening keywords."
                  : analysisType === ResumeAnalysisType.TECHNICAL_SKILLS
                  ? "Audits your programming languages, tools, and missing role skills."
                  : analysisType === ResumeAnalysisType.PROJECT_EVALUATION
                  ? "Evaluates impact, metrics, and technical depth in your project bullets."
                  : "Full review: ATS readability, technical skills, projects, and action tips."}
              </p>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void processFileUpload(f);
            }}
            className={`rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
              dragging
                ? "border-[#6D5DFB] bg-[#EEF2FF]/60"
                : "border-[#E2E8F0] bg-[#F8FAFC]/60 hover:border-[#8B7CFF]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void processFileUpload(f);
                e.target.value = "";
              }}
            />

            <div className="mx-auto h-11 w-11 rounded-xl bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center mb-3">
              {processingStep ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
            </div>

            <h2 className="text-base font-semibold text-[#172033]">
              {processingStep || "Upload your resume for AI analysis"}
            </h2>
            <p className="text-xs text-[#64748B] mt-1 max-w-lg mx-auto">
              Drag and drop a <strong>PDF</strong> or <strong>DOCX</strong> file (max 10 MB).
              Evaluated against your active target role:{" "}
              <span className="font-semibold text-[#172033]">
                {user?.targetRole || "Full Stack Developer"}
              </span>
              .
            </p>

            <div className="mt-4">
              <Button
                type="button"
                disabled={Boolean(processingStep)}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-4 w-4" />
                Select PDF or DOCX File
              </Button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-medium text-[#EF4444]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {infoMsg && (
            <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs font-medium text-[#16A34A]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Library + Main Report Workspace */}
      {loadingList ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 text-[#6D5DFB] animate-spin" />
        </div>
      ) : resumes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-[#172033]">No resumes uploaded yet</h3>
            <p className="text-xs text-[#64748B]">
              Upload your first resume above to unlock structural parsing, missing keyword audits,
              and bullet rewrites.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Library List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] px-1">
              Saved Resumes ({resumes.length})
            </h3>
            {resumes.map((r) => {
              const active = r.id === selectedResume?.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                    active
                      ? "border-[#6D5DFB] ring-2 ring-[#6D5DFB]/15 shadow-card"
                      : "border-[#E2E8F0] hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#172033] truncate">{r.title}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {r.fileType} &bull; Uploaded {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {r.analyzedAt ? (
                      <Badge tone={scoreTone(r.estimatedScore)} className="tabular-nums shrink-0">
                        {Math.round(r.estimatedScore)}%
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Pending</Badge>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    {r.isPrimary ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6D5DFB]">
                        <Star className="h-3 w-3 fill-[#6D5DFB]" />
                        Primary Resume
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleSetPrimary(r.id);
                        }}
                        className="text-[11px] font-medium text-[#64748B] hover:text-[#172033]"
                      >
                        Set as Primary
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(r.id);
                      }}
                      className="p-1 text-slate-400 hover:text-[#EF4444]"
                      title="Delete resume"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Analysis & Preview Pane */}
          {selectedResume && (
            <div className="lg:col-span-8 space-y-5">
              {/* Header Bar + View Tabs */}
              <Card>
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#EEF2FF] border border-[#6D5DFB]/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-[#6D5DFB] tabular-nums leading-none">
                        {selectedResume.analyzedAt
                          ? `${Math.round(selectedResume.estimatedScore)}%`
                          : "—"}
                      </span>
                      <span className="text-[9px] font-semibold text-[#64748B] uppercase mt-1">
                        EST. FIT
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#172033]">
                        {selectedResume.title}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {selectedResume.skills.length} detected skills &bull;{" "}
                        {selectedResume.parsedData.wordCount || 0} words extracted
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Boolean(processingStep)}
                      onClick={() => void handleReanalyze(selectedResume.id)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {selectedResume.analyzedAt ? "Re-Analyze" : "Run Analysis"}
                    </Button>
                    {selectedResume.skills.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        title="Add skills found in this resume to your profile so Skill Gap & Interviews stay up to date"
                        onClick={() => void handleSyncSkills(selectedResume.id)}
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        Save Skills to Profile
                      </Button>
                    )}
                  </div>
                </CardContent>

                <div className="px-5 pb-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  {[
                    { id: "report", label: "Analysis Report", icon: Sparkles },
                    { id: "tailored", label: "Tailor & Export PDF", icon: Download },
                    { id: "parsed", label: "Parsed Entities & Text", icon: FileText },
                    { id: "document", label: "Original File Preview", icon: Eye },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = previewMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setPreviewMode(
                            tab.id as "report" | "document" | "parsed" | "tailored"
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          active
                            ? "bg-[#6D5DFB] text-white"
                            : "bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* View: Tailored ATS Resume & PDF Export */}
              {previewMode === "tailored" && (
                <Card>
                  <CardHeader
                    icon={<Download className="h-4 w-4" />}
                    title={`Tailor Resume for ${effectiveTargetRole}`}
                    subtitle="Generate a role-aligned summary and rewritten impact bullets, then export an ATS-clean PDF."
                  />
                  <CardContent className="space-y-4">
                    <textarea
                      rows={3}
                      value={tailorJd}
                      onChange={(e) => setTailorJd(e.target.value)}
                      placeholder="Optional: Paste target job description text to inject specific role keywords..."
                      className="w-full p-3 rounded-lg border border-slate-200 bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="primary"
                        loading={tailoring}
                        disabled={!selectedResume.analyzedAt}
                        onClick={() => void handleTailorResume(selectedResume.id)}
                      >
                        <Sparkles className="h-4 w-4" />
                        {tailoring ? "Tailoring Resume..." : "Generate Tailored Version"}
                      </Button>

                      {tailoredDraft && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            downloadTailoredResumePdf({
                              candidateName:
                                selectedResume.parsedData.contact.candidateName ||
                                user?.name ||
                                "Candidate",
                              email: selectedResume.parsedData.contact.email || user?.email,
                              location:
                                selectedResume.parsedData.contact.location || user?.location,
                              tailored: tailoredDraft,
                            })
                          }
                        >
                          <Download className="h-4 w-4" />
                          Download ATS PDF
                        </Button>
                      )}
                    </div>

                    {tailoredDraft && (
                      <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                            Tailored Headline
                          </p>
                          <p className="text-sm font-semibold text-[#172033] mt-0.5">
                            {tailoredDraft.headline}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                            Executive Summary
                          </p>
                          <p className="text-xs text-[#172033] leading-relaxed mt-1">
                            {tailoredDraft.tailoredSummary}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB] mb-1.5">
                            Prioritized Skills
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {tailoredDraft.highlightedSkills.map((sk) => (
                              <Badge key={sk} tone="brand">
                                {sk}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                            Rewritten Impact Bullets
                          </p>
                          {tailoredDraft.rewrittenBullets.map((b, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 text-xs"
                            >
                              <Badge tone="neutral">{b.section}</Badge>
                              <p className="text-slate-400 line-through">{b.original}</p>
                              <p className="text-[#172033] font-medium">{b.tailored}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* View 1: Analysis Report */}
              {previewMode === "report" && (
                <>
                  {!selectedResume.analyzedAt ? (
                    <Card>
                      <CardContent className="p-6 text-center space-y-3">
                        <p className="text-sm font-medium text-[#172033]">
                          This file is uploaded and ready for AI evaluation.
                        </p>
                        <Button onClick={() => void handleReanalyze(selectedResume.id)}>
                          <Sparkles className="h-4 w-4" />
                          Run AI Resume Evaluation
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Honest Methodology Disclaimer */}
                      <div className="p-3.5 rounded-xl bg-[#EEF2FF]/70 border border-[#6D5DFB]/20 flex items-start gap-2.5 text-xs text-[#172033]">
                        <Info className="h-4 w-4 text-[#6D5DFB] shrink-0 mt-0.5" />
                        <span>{selectedResume.feedback.scoringMethodologyNote}</span>
                      </div>

                      {/* Section-wise Evaluation Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedResume.sectionScores.map((sec) => (
                          <Card key={sec.section}>
                            <CardContent className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#172033]">
                                  {sec.section}
                                </span>
                                <Badge
                                  tone={
                                    sec.status === "STRONG"
                                      ? "success"
                                      : sec.status === "MISSING"
                                      ? "danger"
                                      : "warning"
                                  }
                                >
                                  {Math.round(sec.score)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-[#64748B]">{sec.summary}</p>
                              {sec.suggestions.length > 0 && (
                                <ul className="space-y-1 pt-1 border-t border-slate-100">
                                  {sec.suggestions.map((s, idx) => (
                                    <li key={idx} className="text-[11px] text-[#172033] flex gap-1.5">
                                      <span className="text-[#6D5DFB]">&bull;</span>
                                      <span>{s}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Skills & Missing Keywords */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader
                            title="Skills Detected"
                            subtitle={`${selectedResume.skills.length} extracted from resume`}
                          />
                          <CardContent className="flex flex-wrap gap-1.5">
                            {selectedResume.skills.map((s) => (
                              <Badge key={s} tone="brand">
                                {s}
                              </Badge>
                            ))}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader
                            title="Missing Keywords"
                            subtitle={`Recommended for ${user?.targetRole || "your role"}`}
                          />
                          <CardContent className="flex flex-wrap gap-1.5">
                            {selectedResume.feedback.missingKeywords.length > 0 ? (
                              selectedResume.feedback.missingKeywords.map((kw) => (
                                <Badge key={kw} tone="warning">
                                  + {kw}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-[#16A34A] font-medium">
                                Strong keyword alignment detected.
                              </span>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader title="Strengths" />
                          <CardContent>
                            <ul className="space-y-2">
                              {selectedResume.feedback.strengths.map((str, i) => (
                                <li key={i} className="text-xs text-[#172033] flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] mt-0.5 shrink-0" />
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader title="Areas to Strengthen" />
                          <CardContent>
                            <ul className="space-y-2">
                              {selectedResume.feedback.weaknesses.map((w, i) => (
                                <li key={i} className="text-xs text-[#172033] flex items-start gap-2">
                                  <AlertCircle className="h-3.5 w-3.5 text-[#F59E0B] mt-0.5 shrink-0" />
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>

                      {/* AI Bullet Point Rewrites */}
                      {selectedResume.feedback.bulletSuggestions.length > 0 && (
                        <Card>
                          <CardHeader
                            title="AI Bullet Point Upgrades"
                            subtitle="Quantified impact rewrites based on your actual bullet lines"
                          />
                          <CardContent className="space-y-4">
                            {selectedResume.feedback.bulletSuggestions.map((b, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/70 space-y-2.5"
                              >
                                <div className="text-xs">
                                  <span className="font-semibold text-[#EF4444]">Original: </span>
                                  <span className="text-[#64748B]">{b.original}</span>
                                </div>
                                <div className="text-xs flex items-start gap-1.5">
                                  <ArrowRight className="h-3.5 w-3.5 text-[#16A34A] mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-semibold text-[#16A34A]">Improved: </span>
                                    <span className="text-[#172033] font-medium">{b.improved}</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-[#64748B] italic">{b.reason}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </>
              )}

              {/* View 2: Parsed Structured Entities */}
              {previewMode === "parsed" && (
                <Card>
                  <CardHeader
                    title="Extracted Profile Entities & Text"
                    subtitle="Structured summary detected from your uploaded document"
                  />
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">Name:</span>{" "}
                        <strong>{selectedResume.parsedData.contact.candidateName || "—"}</strong>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">Email:</span>{" "}
                        <strong>{selectedResume.parsedData.contact.email || "—"}</strong>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">GitHub:</span>{" "}
                        <strong>{selectedResume.parsedData.contact.githubUrl || "—"}</strong>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">LinkedIn:</span>{" "}
                        <strong>{selectedResume.parsedData.contact.linkedinUrl || "—"}</strong>
                      </div>
                    </div>

                    {selectedResume.parsedData.projects.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-[#172033] mb-2">
                          Extracted Projects ({selectedResume.parsedData.projects.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedResume.parsedData.projects.map((p, i) => (
                            <div key={i} className="p-3 rounded-lg border border-[#E2E8F0] text-xs">
                              <p className="font-semibold text-[#172033]">{p.title}</p>
                              {p.techStack.length > 0 && (
                                <p className="text-[11px] text-[#6D5DFB] mt-0.5">
                                  {p.techStack.join(", ")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-[#172033] mb-2">
                        Raw Extracted Text
                      </h4>
                      <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs whitespace-pre-wrap max-h-80 overflow-y-auto font-mono leading-relaxed">
                        {selectedResume.extractedText || "Not extracted yet."}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View 3: Authenticated Original Document Preview */}
              {previewMode === "document" && (
                <Card>
                  <CardHeader
                    title="Original File Preview"
                    subtitle="Streamed securely via authenticated API Blob"
                  />
                  <CardContent>
                    {selectedResume.fileType === "PDF" ? (
                      loadingPreview ? (
                        <div className="h-96 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-[#6D5DFB] animate-spin" />
                        </div>
                      ) : pdfBlobUrl ? (
                        <iframe
                          src={pdfBlobUrl}
                          title="Resume PDF Preview"
                          className="w-full h-[640px] rounded-lg border border-[#E2E8F0]"
                        />
                      ) : (
                        <p className="text-xs text-[#64748B] py-8 text-center">
                          Unable to preview PDF inline.
                        </p>
                      )
                    ) : (
                      <div className="p-6 text-center space-y-3">
                        <p className="text-sm text-[#172033]">
                          Inline browser rendering is only supported for PDFs. Switch to{" "}
                          <strong>Parsed Entities &amp; Text</strong> to inspect extracted DOCX text,
                          or download the original file below.
                        </p>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const blob = await resumeApi.fetchFileBlob(selectedResume.id);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${selectedResume.title}.docx`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Download Original DOCX
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
