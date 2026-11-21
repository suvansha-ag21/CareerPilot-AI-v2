"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Download, FileText, FolderGit2, GitCompare, Info, Loader2, Sparkles, Trash2, UploadCloud, } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, } from "recharts";
import { CAREER_ROLE_PRESETS, EXPERIENCE_LEVEL_OPTIONS, JobType, } from "@careerpilot/shared";
import { ApiClientError } from "@/lib/api";
import { downloadTailoredResumePdf } from "@/lib/pdfExport";
import { useAuth } from "@/store/auth-context";
import { resumeApi } from "@/services/resume.service";
import { matcherApi } from "@/services/matcher.service";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
export default function JobMatcherPage() {
    const { user } = useAuth();
    const jdFileRef = useRef(null);
    const [resumes, setResumes] = useState([]);
    const [matches, setMatches] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [loadingInit, setLoadingInit] = useState(true);
    const [resumeId, setResumeId] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [customRole, setCustomRole] = useState("");
    const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVEL_OPTIONS[1]);
    const [jobType, setJobType] = useState(JobType.FULL_TIME);
    const [companyName, setCompanyName] = useState("");
    const [inputMode, setInputMode] = useState("paste");
    const [jobDescription, setJobDescription] = useState("");
    const [jdFile, setJdFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [tailoring, setTailoring] = useState(false);
    const [tailoredResume, setTailoredResume] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const loadInitial = useCallback(async () => {
        try {
            const [rList, mList] = await Promise.all([resumeApi.list(), matcherApi.list()]);
            setResumes(rList);
            setMatches(mList);
            const analyzedPrimary = rList.find((r) => r.isPrimary && r.analyzedAt) || rList.find((r) => r.analyzedAt);
            if (analyzedPrimary) {
                setResumeId(analyzedPrimary.id);
            }
            else if (rList[0]) {
                setResumeId(rList[0].id);
            }
            if (mList[0]) {
                setSelectedMatchId(mList[0].id);
            }
        }
        catch {
            setErrorMsg("Unable to load resumes and job match history.");
        }
        finally {
            setLoadingInit(false);
        }
    }, []);
    useEffect(() => {
        void loadInitial();
    }, [loadInitial]);
    useEffect(() => {
        if (!user)
            return;
        if (user.targetRole && !targetRole) {
            if (CAREER_ROLE_PRESETS.includes(user.targetRole)) {
                setTargetRole(user.targetRole);
            }
            else {
                setTargetRole("Other");
                setCustomRole(user.targetRole);
            }
        }
        if (user.careerPreferences?.experienceLevel) {
            setExperienceLevel(user.careerPreferences.experienceLevel);
        }
    }, [user, targetRole]);
    const analyzedResumes = resumes.filter((r) => Boolean(r.analyzedAt));
    const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0] || null;
    async function handleRunMatch(e) {
        e.preventDefault();
        setErrorMsg(null);
        if (!resumeId) {
            setErrorMsg("Please upload and analyze a resume first.");
            return;
        }
        if (inputMode === "paste" && jobDescription.trim().length < 40) {
            setErrorMsg("Please paste a job description (at least 40 characters).");
            return;
        }
        if (inputMode === "upload" && !jdFile) {
            setErrorMsg("Please select a .pdf, .docx, or .txt job description document.");
            return;
        }
        setSubmitting(true);
        try {
            const effectiveRole = targetRole === "Other" ? customRole.trim() : targetRole.trim();
            const created = await matcherApi.evaluate({
                resumeId,
                targetRole: effectiveRole || undefined,
                companyName,
                experienceLevel,
                jobType,
                jobDescription: inputMode === "paste" ? jobDescription : undefined,
                jdFile: inputMode === "upload" ? jdFile : null,
            });
            setMatches((prev) => [created, ...prev]);
            setSelectedMatchId(created.id);
        }
        catch (err) {
            setErrorMsg(err instanceof ApiClientError ? err.message : "Failed to run Job Description match.");
        }
        finally {
            setSubmitting(false);
        }
    }
    async function handleDeleteMatch(id) {
        try {
            await matcherApi.delete(id);
            const next = matches.filter((m) => m.id !== id);
            setMatches(next);
            if (selectedMatchId === id) {
                setSelectedMatchId(next[0]?.id || null);
            }
        }
        catch {
            setErrorMsg("Could not delete job match record.");
        }
    }
    function scoreTone(score) {
        if (score >= 75)
            return "success";
        if (score >= 55)
            return "warning";
        return "danger";
    }
    const breakdownChartData = selectedMatch
        ? [
            { metric: "Overall Match", score: selectedMatch.matchScore },
            { metric: "Role Alignment", score: selectedMatch.semanticScore },
            { metric: "Skills Coverage", score: selectedMatch.skillScore },
            { metric: "Experience Fit", score: selectedMatch.experienceScore },
        ]
        : [];
    return (<div className="space-y-6">
      {/* Top Form: Select Resume + Input JD */}
      <Card>
        <CardHeader title="Compare Resume Against a Job Description" subtitle="Evaluates semantic role fit, required & transferable skills coverage, and tailored resume improvements."/>
        <CardContent>
          {loadingInit ? (<div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 text-[#6D5DFB] animate-spin"/>
            </div>) : analyzedResumes.length === 0 ? (<div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-3">
              <FileText className="h-7 w-7 text-[#6D5DFB] mx-auto"/>
              <h3 className="text-sm font-semibold text-[#172033]">Analyzed resume required</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Upload and run an analysis on at least one resume in Resume AI before comparing
                against job descriptions.
              </p>
              <Link href="/resume">
                <Button size="sm">
                  Go to Resume AI
                  <ArrowRight className="h-3.5 w-3.5"/>
                </Button>
              </Link>
            </div>) : (<form onSubmit={handleRunMatch} className="space-y-4">
              {errorMsg && (<div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-medium text-[#EF4444]">
                  <AlertCircle className="h-4 w-4 shrink-0"/>
                  <span>{errorMsg}</span>
                </div>)}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="resumeId" className="block text-xs font-medium text-[#172033]">
                    Analyzed Resume
                  </label>
                  <select id="resumeId" value={resumeId} onChange={(e) => setResumeId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]">
                    {analyzedResumes.map((r) => (<option key={r.id} value={r.id}>
                        {r.title} ({Math.round(r.estimatedScore)}%)
                      </option>))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#172033]">Target Job Role</label>
                  <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#172033]">
                    <option value="">Auto-detect from JD</option>
                    {[...CAREER_ROLE_PRESETS, "Other"].map((r) => (<option key={r} value={r}>
                        {r}
                      </option>))}
                  </select>
                  {targetRole === "Other" && (<input type="text" value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="Custom role title" className="mt-1.5 w-full h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#172033]"/>)}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#172033]">
                    Experience Level
                  </label>
                  <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#172033]">
                    {EXPERIENCE_LEVEL_OPTIONS.map((exp) => (<option key={exp} value={exp}>
                        {exp}
                      </option>))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#172033]">Job Type</label>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#172033]">
                    <option value={JobType.INTERNSHIP}>Internship</option>
                    <option value={JobType.FULL_TIME}>Full-time</option>
                    <option value={JobType.PART_TIME}>Part-time</option>
                    <option value={JobType.REMOTE}>Remote</option>
                    <option value={JobType.ON_SITE}>On-site</option>
                    <option value={JobType.HYBRID}>Hybrid</option>
                  </select>
                </div>

                <Input label="Company Name (optional)" placeholder="e.g. Stripe / Atlassian" value={companyName} onChange={(e) => setCompanyName(e.target.value)}/>
              </div>

              {/* Paste vs Upload JD Switch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-medium text-[#172033]">Job Description</label>
                  <div className="inline-flex rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F8FAFC]">
                    <button type="button" onClick={() => setInputMode("paste")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${inputMode === "paste"
                ? "bg-white text-[#172033] shadow-sm"
                : "text-[#64748B]"}`}>
                      Paste Text
                    </button>
                    <button type="button" onClick={() => setInputMode("upload")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${inputMode === "upload"
                ? "bg-white text-[#172033] shadow-sm"
                : "text-[#64748B]"}`}>
                      Upload Document
                    </button>
                  </div>
                </div>

                {inputMode === "paste" ? (<textarea rows={6} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the full job description including responsibilities, required skills (e.g. Java, DSA, SQL, Spring Boot, REST APIs), and qualifications..." className="w-full p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/50 text-sm text-[#172033] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"/>) : (<div className="p-5 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC]/60 flex items-center justify-between gap-4">
                    <input ref={jdFileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => setJdFile(e.target.files?.[0] || null)}/>
                    <div className="text-xs text-[#64748B]">
                      {jdFile ? (<span className="font-semibold text-[#172033]">Selected: {jdFile.name}</span>) : ("Upload a .pdf, .docx, or .txt job description file (max 5 MB).")}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => jdFileRef.current?.click()}>
                      <UploadCloud className="h-3.5 w-3.5"/>
                      Choose File
                    </Button>
                  </div>)}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <p className="text-xs text-[#64748B]">
                  We compare both exact keywords and related tools between your resume and this job.
                </p>
                <Button type="submit" size="lg" loading={submitting}>
                  <GitCompare className="h-4 w-4"/>
                  Check Job Compatibility
                </Button>
              </div>
            </form>)}
        </CardContent>
      </Card>

      {/* Match History + Detailed Visual Comparison */}
      {matches.length > 0 && (<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* History List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] px-1">
              Match Reports ({matches.length})
            </h3>
            {matches.map((m) => {
                const active = m.id === selectedMatch?.id;
                return (<div key={m.id} onClick={() => setSelectedMatchId(m.id)} className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${active
                        ? "border-[#6D5DFB] ring-2 ring-[#6D5DFB]/15 shadow-card"
                        : "border-[#E2E8F0] hover:border-slate-300"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#172033] truncate">
                        {m.targetRole}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {m.companyName ? `${m.companyName} • ` : ""}
                        {m.resumeTitle || "Resume"}
                      </p>
                    </div>
                    <Badge tone={scoreTone(m.matchScore)} className="tabular-nums shrink-0">
                      {Math.round(m.matchScore)}%
                    </Badge>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                    <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteMatch(m.id);
                    }} className="text-slate-400 hover:text-[#EF4444]" title="Delete match report">
                      <Trash2 className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                </div>);
            })}
          </div>

          {/* Visual Breakdown Column */}
          {selectedMatch && (<div className="lg:col-span-8 space-y-5">
              {/* Overall Match Banner + Subscore Chart */}
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone={scoreTone(selectedMatch.matchScore)} className="tabular-nums">
                          {Math.round(selectedMatch.matchScore)}% Compatibility
                        </Badge>
                        {selectedMatch.companyName && (<span className="text-xs font-medium text-[#64748B]">
                            {selectedMatch.companyName}
                          </span>)}
                      </div>
                      <h3 className="text-xl font-semibold text-[#172033] mt-1.5">
                        {selectedMatch.targetRole}
                      </h3>
                      <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                        {selectedMatch.recommendations.summary}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" loading={tailoring} onClick={async () => {
                    setErrorMsg(null);
                    setTailoring(true);
                    try {
                        const tailored = await resumeApi.tailor(selectedMatch.resumeId, {
                            jobMatchId: selectedMatch.id,
                            targetRole: selectedMatch.targetRole,
                        });
                        setTailoredResume(tailored);
                    }
                    catch (err) {
                        setErrorMsg(err instanceof ApiClientError
                            ? err.message
                            : "Could not generate tailored resume.");
                    }
                    finally {
                        setTailoring(false);
                    }
                }}>
                        <Download className="h-3.5 w-3.5"/>
                        Tailor Resume
                      </Button>
                      <Link href="/skills">
                        <Button size="sm" variant="secondary">
                          <Sparkles className="h-3.5 w-3.5"/>
                          Analyze Skill Gaps
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {tailoredResume && tailoredResume.resumeId === selectedMatch.resumeId && (<div className="p-4 rounded-xl bg-[#EEF2FF]/60 border border-[#6D5DFB]/25 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-[#172033]">
                            Tailored Resume Ready ({tailoredResume.targetRole})
                          </p>
                          <p className="text-[11px] text-[#64748B]">{tailoredResume.headline}</p>
                        </div>
                        <Button size="sm" variant="primary" onClick={() => downloadTailoredResumePdf({
                        candidateName: user?.name || "Candidate",
                        email: user?.email,
                        location: user?.location,
                        tailored: tailoredResume,
                    })}>
                          <Download className="h-3.5 w-3.5"/>
                          Download ATS PDF
                        </Button>
                      </div>
                      <p className="text-xs text-[#172033] leading-relaxed">
                        {tailoredResume.tailoredSummary}
                      </p>
                    </div>)}

                  <div className="h-52 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={breakdownChartData} margin={{ top: 5, right: 16, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false}/>
                        <XAxis dataKey="metric" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false}/>
                        <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false}/>
                        <Tooltip cursor={{ fill: "#F8FAFC" }} contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                }}/>
                        <Bar dataKey="score" fill="#6D5DFB" radius={[6, 6, 0, 0]} maxBarSize={48}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-3 rounded-lg bg-[#EEF2FF]/70 border border-[#6D5DFB]/20 flex items-start gap-2 text-[11px] text-[#172033]">
                    <Info className="h-4 w-4 text-[#6D5DFB] shrink-0 mt-0.5"/>
                    <span>{selectedMatch.recommendations.methodologyNote}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 3-Bucket Skill Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardHeader title="Matching Skills" subtitle={`${selectedMatch.matchingSkills.length} found directly in your resume`}/>
                  <CardContent className="flex flex-wrap gap-1.5">
                    {selectedMatch.matchingSkills.length > 0 ? (selectedMatch.matchingSkills.map((s) => (<Badge key={s} tone="success">
                          <CheckCircle2 className="h-3 w-3"/>
                          {s}
                        </Badge>))) : (<span className="text-xs text-[#64748B]">None matched directly</span>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Related / Transferable" subtitle={`${selectedMatch.partialSkills.length} close to what the job asks for`}/>
                  <CardContent className="flex flex-wrap gap-1.5">
                    {selectedMatch.partialSkills.length > 0 ? (selectedMatch.partialSkills.map((s) => (<Badge key={s} tone="warning">
                          ~ {s}
                        </Badge>))) : (<span className="text-xs text-[#64748B]">None flagged</span>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Missing Skills" subtitle={`${selectedMatch.missingSkills.length} gaps to highlight or learn`}/>
                  <CardContent className="flex flex-wrap gap-1.5">
                    {selectedMatch.missingSkills.length > 0 ? (selectedMatch.missingSkills.map((s) => (<Badge key={s} tone="danger">
                          - {s}
                        </Badge>))) : (<span className="text-xs text-[#16A34A] font-medium">
                        No missing JD skills!
                      </span>)}
                  </CardContent>
                </Card>
              </div>

              {/* Relevant Resume Projects & Experience Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader title="Relevant Resume Projects" subtitle="Projects aligning closest to this JD"/>
                  <CardContent className="space-y-3">
                    {selectedMatch.relevantProjects.length > 0 ? (selectedMatch.relevantProjects.map((p, idx) => (<div key={idx} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172033]">
                            <FolderGit2 className="h-3.5 w-3.5 text-[#6D5DFB]"/>
                            {p.title}
                          </div>
                          <p className="text-xs text-[#64748B] leading-relaxed">
                            {p.relevanceReason}
                          </p>
                          {p.matchedTechnologies.length > 0 && (<div className="flex flex-wrap gap-1 pt-0.5">
                              {p.matchedTechnologies.map((t) => (<Badge key={t} tone="brand">
                                  {t}
                                </Badge>))}
                            </div>)}
                        </div>))) : (<p className="text-xs text-[#64748B]">
                        Add detailed project descriptions in your resume to improve matching context.
                      </p>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Experience & Tailoring Tips" subtitle={selectedMatch.recommendations.experienceAssessment}/>
                  <CardContent className="space-y-2.5">
                    {selectedMatch.recommendations.items.map((rec, i) => (<div key={i} className="p-3 rounded-lg border border-[#E2E8F0] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#172033]">{rec.area}</span>
                          <Badge tone={rec.priority === "HIGH"
                        ? "danger"
                        : rec.priority === "MEDIUM"
                            ? "warning"
                            : "neutral"}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed">{rec.suggestion}</p>
                      </div>))}
                  </CardContent>
                </Card>
              </div>
            </div>)}
        </div>)}
    </div>);
}
