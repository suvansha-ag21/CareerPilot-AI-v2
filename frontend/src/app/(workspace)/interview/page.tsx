"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  History,
  Layers,
  Loader2,
  MessageSquare,
  Mic,
  Play,
  Sparkles,
  Square,
  Target,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import {
  CAREER_ROLE_PRESETS,
  GitHubRepoAnalysisDTO,
  InterviewCategory,
  InterviewDifficulty,
  InterviewMode,
  InterviewSessionDTO,
  InterviewStatus,
  ResumeDTO,
  SpeechMetricsDTO,
  TECHNICAL_SUBCATEGORY_OPTIONS,
} from "@careerpilot/shared";
import { useAuth } from "@/store/auth-context";
import { ApiClientError } from "@/lib/api";
import { interviewApi } from "@/services/interview.service";
import { resumeApi } from "@/services/resume.service";
import { projectsApi } from "@/services/advanced.service";
import { CodeSqlSandbox, SandboxLanguage } from "@/components/interview/CodeSqlSandbox";
import { SystemDesignCanvas } from "@/components/interview/SystemDesignCanvas";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";

const CATEGORY_OPTIONS: Array<{
  value: InterviewCategory;
  label: string;
  desc: string;
}> = [
  { value: InterviewCategory.TECHNICAL, label: "Technical Interview", desc: "Core CS & Stack Topics" },
  { value: InterviewCategory.HR, label: "HR Interview", desc: "Motivation & Culture Fit" },
  { value: InterviewCategory.DSA, label: "DSA Interview", desc: "Trees, Graphs, DP & Hashing" },
  { value: InterviewCategory.PROJECT_BASED, label: "Project-Based Interview", desc: "Grounded in Your Resume" },
  { value: InterviewCategory.BEHAVIORAL, label: "Behavioral Interview", desc: "STAR Leadership & Conflict" },
  { value: InterviewCategory.MIXED, label: "Mixed Interview", desc: "Technical + Behavioral Blend" },
];

function formatCountdown(remainingSeconds: number): string {
  const safe = Math.max(0, remainingSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function MockInterviewPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSessionDTO[]>([]);
  const [resumes, setResumes] = useState<ResumeDTO[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepoAnalysisDTO[]>([]);
  const [activeSession, setActiveSession] = useState<InterviewSessionDTO | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // New session configuration
  const [category, setCategory] = useState<InterviewCategory>(InterviewCategory.TECHNICAL);
  const [targetRole, setTargetRole] = useState<string>(
    user?.targetRole || CAREER_ROLE_PRESETS[0]
  );
  const [customTargetRole, setCustomTargetRole] = useState<string>("");
  const [subcategories, setSubcategories] = useState<string[]>(["DSA", "OOP", "System Design"]);
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>(InterviewDifficulty.MEDIUM);
  const [mode, setMode] = useState<InterviewMode>(InterviewMode.TEXT);
  const [questionLimit, setQuestionLimit] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [resumeId, setResumeId] = useState<string>("");
  const [githubRepoId, setGithubRepoId] = useState<string>("");
  const [targetJobDescription, setTargetJobDescription] = useState<string>("");

  // Room & evaluation states
  const [starting, setStarting] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [workspaceTab, setWorkspaceTab] = useState<"written" | "code" | "design">("written");
  const [sandboxLang, setSandboxLang] = useState<SandboxLanguage>("javascript");
  const [sandboxCode, setSandboxCode] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState<string | undefined>(undefined);
  const [designNodes, setDesignNodes] = useState<string[]>([]);
  const [designNotes, setDesignNotes] = useState("");
  const [streamingHint, setStreamingHint] = useState("");
  const [hintLoading, setHintLoading] = useState(false);
  const [speechMetrics, setSpeechMetrics] = useState<SpeechMetricsDTO | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingPrompt, setSpeakingPrompt] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordDurationRef = useRef<number>(0);

  const loadData = useCallback(async () => {
    try {
      const [sList, rList, repoList] = await Promise.all([
        interviewApi.list(),
        resumeApi.list(),
        projectsApi.listGitHub().catch(() => [] as GitHubRepoAnalysisDTO[]),
      ]);
      setSessions(sList);
      setGithubRepos(repoList);
      const analyzed = rList.filter((r) => Boolean(r.analyzedAt));
      setResumes(analyzed);
      const primary = analyzed.find((r) => r.isPrimary) || analyzed[0];
      if (primary) setResumeId(primary.id);
    } catch {
      setErrorMsg("Unable to load mock interview sessions.");
    } finally {
      setLoadingInit(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (user?.targetRole && user.targetRole !== "Other") {
      setTargetRole(user.targetRole);
    }
  }, [user?.targetRole]);

  // Live timer countdown when an IN_PROGRESS interview is open
  useEffect(() => {
    if (!activeSession || activeSession.status !== InterviewStatus.IN_PROGRESS) {
      return;
    }

    const computeRemaining = () => {
      const startedMs = new Date(activeSession.createdAt).getTime();
      const endMs = startedMs + activeSession.durationMinutes * 60 * 1000;
      const diffSec = Math.floor((endMs - Date.now()) / 1000);
      setRemainingSeconds(Math.max(0, diffSec));
    };

    computeRemaining();
    const interval = setInterval(computeRemaining, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Stop speech/media cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const supportsSubcategories =
    category === InterviewCategory.TECHNICAL || category === InterviewCategory.MIXED;

  function toggleSubcategory(topic: string) {
    setSubcategories((prev) =>
      prev.includes(topic) ? prev.filter((item) => item !== topic) : [...prev, topic]
    );
  }

  async function handleStartSession(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setStarting(true);
    const resolvedTargetRole =
      targetRole === "Other"
        ? customTargetRole.trim() || undefined
        : targetRole.trim() || undefined;
    try {
      const created = await interviewApi.start({
        category,
        targetRole: resolvedTargetRole,
        subcategories: supportsSubcategories ? subcategories : [],
        difficulty,
        mode,
        durationMinutes,
        questionLimit,
        resumeId: resumeId || undefined,
        githubRepoId: githubRepoId || undefined,
        targetJobDescription: targetJobDescription.trim() || undefined,
      });
      setSessions((prev) => [created, ...prev]);
      setActiveSession(created);
      setAnswerText("");
      setStreamingHint("");
      setSandboxCode("");
      setSandboxOutput(undefined);
      setDesignNodes([]);
      setDesignNotes("");
      setSpeechMetrics(null);
      setRecordedBlob(null);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError
          ? err.message
          : "Unable to start interview session. Please try again in a moment."
      );
    } finally {
      setStarting(false);
    }
  }

  function handleSpeakQuestion(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setErrorMsg("Browser Text-to-Speech is not supported in this browser.");
      return;
    }
    if (speakingPrompt) {
      window.speechSynthesis.cancel();
      setSpeakingPrompt(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.onend = () => setSpeakingPrompt(false);
    utter.onerror = () => setSpeakingPrompt(false);
    setSpeakingPrompt(true);
    window.speechSynthesis.speak(utter);
  }

  async function handleToggleRecording() {
    setErrorMsg(null);
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setErrorMsg("Microphone recording is unavailable in this browser. You can type your answer below.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recordDurationRef.current = 0;
      setRecordingSec(0);
      setRecordedBlob(null);

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setRecordedBlob(blob);
        if (!activeSession || blob.size === 0) return;
        setTranscribing(true);
        try {
          const stt = await interviewApi.transcribeAudio(
            activeSession.id,
            blob,
            Math.max(1, recordDurationRef.current)
          );
          if (stt.transcript) {
            setAnswerText((prev) => (prev.trim() ? `${prev.trim()} ${stt.transcript}` : stt.transcript));
          }
          setSpeechMetrics(stt.speechMetrics);
        } catch (err) {
          setErrorMsg(
            err instanceof ApiClientError
              ? err.message
              : "Could not transcribe audio automatically; please type your answer."
          );
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        recordDurationRef.current += 1;
        setRecordingSec(recordDurationRef.current);
      }, 1000);
    } catch {
      setErrorMsg(
        "Microphone permission was denied or no audio device was detected. You may still type your response below."
      );
    }
  }

  async function handleSubmitVoiceDirectly() {
    if (!activeSession || !recordedBlob) return;
    const currentQuestion = activeSession.questions.find((q) => q.userAnswer === null);
    if (!currentQuestion) return;

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const updated = await interviewApi.submitVoiceAnswer(
        activeSession.id,
        currentQuestion.id,
        recordedBlob,
        Math.max(1, recordDurationRef.current)
      );
      setActiveSession(updated);
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setAnswerText("");
      setSpeechMetrics(null);
      setRecordedBlob(null);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError ? err.message : "Failed to submit voice recording."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitAnswer(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!activeSession) return;
    const currentQuestion = activeSession.questions.find((q) => q.userAnswer === null);
    if (!currentQuestion) return;

    if (answerText.trim().length < 5) {
      setErrorMsg("Please write or record a response (at least 5 characters) before submitting.");
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    const hasCode = Boolean(sandboxCode.trim());
    const hasDesign = designNodes.length > 0 || Boolean(designNotes.trim());
    try {
      const updated = await interviewApi.submitAnswer(activeSession.id, {
        questionId: currentQuestion.id,
        answerText: answerText.trim(),
        ...(speechMetrics ? { speechMetrics } : {}),
        ...(hasCode || hasDesign
          ? {
              submissionContext: {
                ...(hasCode
                  ? {
                      codeLanguage: sandboxLang,
                      codeSnippet: sandboxCode,
                      executionOutput: sandboxOutput,
                    }
                  : {}),
                ...(hasDesign
                  ? {
                      architectureNodes: designNodes,
                      architectureNotes: designNotes.trim() || undefined,
                    }
                  : {}),
              },
            }
          : {}),
      });
      setActiveSession(updated);
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setAnswerText("");
      setStreamingHint("");
      setSandboxCode("");
      setSandboxOutput(undefined);
      setDesignNodes([]);
      setDesignNotes("");
      setSpeechMetrics(null);
      setRecordedBlob(null);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError ? err.message : "Failed to evaluate interview response."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteEarly() {
    if (!activeSession) return;
    setErrorMsg(null);
    setFinishing(true);
    try {
      const updated = await interviewApi.complete(activeSession.id);
      setActiveSession(updated);
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError ? err.message : "Unable to finalize interview report."
      );
    } finally {
      setFinishing(false);
    }
  }

  async function handleDeleteSession(id: string) {
    setErrorMsg(null);
    try {
      await interviewApi.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSession?.id === id) setActiveSession(null);
    } catch {
      setErrorMsg("Unable to delete interview session.");
    }
  }

  const pendingQuestion =
    activeSession?.status === InterviewStatus.IN_PROGRESS
      ? activeSession.questions.find((q) => q.userAnswer === null) || null
      : null;
  const answeredQuestions =
    activeSession?.questions.filter((q) => q.userAnswer !== null) ?? [];

  // 1. LIVE INTERVIEW ROOM VIEW
  if (activeSession && activeSession.status === InterviewStatus.IN_PROGRESS && pendingQuestion) {
    const progressPct = Math.round(
      (answeredQuestions.length / Math.max(activeSession.questionLimit, 1)) * 100
    );

    return (
      <div className="space-y-6">
        {/* Room Top Control Bar */}
        <Card>
          <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Back to setup & history"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="brand">{activeSession.category.replace(/_/g, " ")}</Badge>
                  {activeSession.targetRole && (
                    <Badge tone="neutral">{activeSession.targetRole}</Badge>
                  )}
                  <Badge tone="neutral">{activeSession.difficulty}</Badge>
                  {activeSession.subcategories?.slice(0, 3).map((sub) => (
                    <Badge key={sub} tone="neutral">
                      {sub}
                    </Badge>
                  ))}
                  <span className="text-xs font-semibold text-[#172033] tabular-nums">
                    Question {answeredQuestions.length + 1} of {activeSession.questionLimit}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-48 sm:w-64 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6D5DFB] transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tabular-nums ${
                  remainingSeconds <= 120
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-[#F8FAFC] text-[#172033] border-[#E2E8F0]"
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-[#6D5DFB]" />
                {formatCountdown(remainingSeconds)}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleCompleteEarly()}
                loading={finishing}
              >
                Finish &amp; Score
              </Button>
            </div>
          </div>
        </Card>

        {remainingSeconds === 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
            <span>
              Session timer has reached 00:00. Submit your current response or click Finish &amp; Score
              to generate your evaluation report.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Active Prompt + AI Coach Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8">
            <CardHeader
              icon={<MessageSquare className="h-4 w-4" />}
              title={`Prompt #${pendingQuestion.questionOrder}`}
              subtitle={`Topic: ${pendingQuestion.topicTag}`}
              action={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!activeSession || !pendingQuestion) return;
                      setStreamingHint("");
                      setHintLoading(true);
                      try {
                        await interviewApi.streamHint(
                          activeSession.id,
                          pendingQuestion.id,
                          (token) => setStreamingHint((prev) => prev + token)
                        );
                      } catch {
                        setErrorMsg("Unable to stream coaching hint.");
                      } finally {
                        setHintLoading(false);
                      }
                    }}
                    disabled={hintLoading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:border-[#6D5DFB]/40 text-[11px] font-medium text-[#6D5DFB] transition-colors"
                    title="Stream structured framing hint"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {hintLoading ? "Streaming..." : "Stream Hint"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeakQuestion(pendingQuestion.question)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:border-[#6D5DFB]/40 text-[11px] font-medium text-[#172033] transition-colors"
                    title="Speak question aloud using Text-to-Speech"
                  >
                    {speakingPrompt ? (
                      <>
                        <VolumeX className="h-3.5 w-3.5 text-rose-500" />
                        Mute Voice
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-[#6D5DFB]" />
                        Read Aloud
                      </>
                    )}
                  </button>
                  {pendingQuestion.isFollowUp ? (
                    <Badge tone="warning">
                      <Sparkles className="h-3 w-3" />
                      Adaptive Follow-Up
                    </Badge>
                  ) : (
                    <Badge tone="brand">Role-Tailored Prompt</Badge>
                  )}
                </div>
              }
            />
            <CardContent className="space-y-5">
              <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="text-base font-medium text-[#172033] leading-relaxed">
                  {pendingQuestion.question}
                </p>
              </div>

              {(streamingHint || hintLoading) && (
                <div className="p-3.5 rounded-xl bg-[#EEF2FF]/70 border border-[#6D5DFB]/25 text-xs text-[#172033] leading-relaxed">
                  <span className="font-semibold text-[#6D5DFB]">Live Coaching Hint: </span>
                  {streamingHint || "Streaming framing guidance..."}
                </div>
              )}

              {/* Answer Mode Switcher: Prose / Voice | Live Code & SQL Sandbox | System Design Canvas */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
                {[
                  { id: "written", label: "Written / Voice Answer" },
                  { id: "code", label: "Code & SQL Sandbox" },
                  { id: "design", label: "System Design Canvas" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setWorkspaceTab(tab.id as "written" | "code" | "design")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      workspaceTab === tab.id
                        ? "bg-[#6D5DFB] text-white"
                        : "bg-slate-100 text-[#64748B] hover:text-[#172033]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {workspaceTab === "code" && (
                <CodeSqlSandbox
                  language={sandboxLang}
                  code={sandboxCode}
                  onChange={({ language: l, code: c, output }) => {
                    setSandboxLang(l);
                    setSandboxCode(c);
                    if (output !== undefined) setSandboxOutput(output);
                  }}
                />
              )}

              {workspaceTab === "design" && (
                <SystemDesignCanvas
                  nodes={designNodes}
                  notes={designNotes}
                  onChange={({ nodes: n, notes: nt }) => {
                    setDesignNodes(n);
                    setDesignNotes(nt);
                  }}
                />
              )}

              {activeSession.mode === InterviewMode.VOICE && (
                <div className="p-4 rounded-xl border border-[#6D5DFB]/25 bg-[#EEF2FF]/45 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                        <Mic className="h-3.5 w-3.5 text-[#6D5DFB]" />
                        Explicit-Consent Voice Recorder &amp; Speech Analytics
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Click Record to speak your answer, then review transcript &amp; WPM or
                        submit directly.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={isRecording ? "danger" : "primary"}
                        size="sm"
                        onClick={() => void handleToggleRecording()}
                        disabled={transcribing || submitting}
                      >
                        {isRecording ? (
                          <>
                            <Square className="h-3.5 w-3.5" />
                            Stop ({formatCountdown(recordingSec)})
                          </>
                        ) : (
                          <>
                            <Mic className="h-3.5 w-3.5" />
                            Start Recording
                          </>
                        )}
                      </Button>

                      {recordedBlob && !isRecording && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleSubmitVoiceDirectly()}
                          loading={submitting}
                          disabled={transcribing}
                        >
                          Submit Audio Directly
                        </Button>
                      )}
                    </div>
                  </div>

                  {transcribing && (
                    <div className="flex items-center gap-2 text-xs text-[#6D5DFB] font-medium">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Transcribing audio &amp; computing WPM delivery metrics...
                    </div>
                  )}

                  {speechMetrics && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="brand" className="tabular-nums">
                          {speechMetrics.wordsPerMinute} WPM
                        </Badge>
                        <Badge tone="neutral" className="tabular-nums">
                          {speechMetrics.durationSeconds}s · {speechMetrics.wordCount} words
                        </Badge>
                        <Badge
                          tone={speechMetrics.fillerWordCount >= 3 ? "warning" : "success"}
                          className="tabular-nums"
                        >
                          {speechMetrics.fillerWordCount} filler(s)
                        </Badge>
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        {speechMetrics.deliveryFeedback}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmitAnswer} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="interview-answer-editor"
                    className="text-xs font-semibold text-[#172033]"
                  >
                    Your Answer ({activeSession.mode === InterviewMode.VOICE ? "Transcript / Text" : "Text Mode"})
                  </label>
                  <span className="text-[11px] text-[#64748B] tabular-nums">
                    {answerText.trim() ? answerText.trim().split(/\s+/).length : 0} words
                  </span>
                </div>

                <textarea
                  id="interview-answer-editor"
                  rows={8}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      void handleSubmitAnswer();
                    }
                  }}
                  placeholder="Structure your answer clearly: define core mechanics, discuss time/space or architectural trade-offs, and cite a concrete example..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white text-sm text-[#172033] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB] leading-relaxed resize-y"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-[#64748B]">
                    Tip: Press Ctrl + Enter to submit answer for real-time rubric grading.
                  </span>

                  <Button type="submit" variant="primary" loading={submitting}>
                    {submitting ? "Grading Response..." : "Submit Answer"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Compact AI Coach Panel */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader
                icon={<Cpu className="h-4 w-4" />}
                title="5-Criterion Grading Rubric"
                subtitle="How CareerPilot AI scores your response"
              />
              <CardContent className="space-y-2.5 text-xs">
                {[
                  { label: "Technical Accuracy", pct: "30%" },
                  { label: "Depth & Trade-offs", pct: "25%" },
                  { label: "Completeness", pct: "20%" },
                  { label: "Clarity & Structure", pct: "15%" },
                  { label: "Practical Examples", pct: "10%" },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                  >
                    <span className="font-medium text-[#172033]">{c.label}</span>
                    <Badge tone="brand" className="tabular-nums">
                      {c.pct}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-[#6D5DFB]" />
                  Delivery Coaching Tips
                </p>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Target 110–155 WPM with crisp structure (Core Definition → Trade-offs →
                  Concrete Production Example) and minimal filler words.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Previously Answered Turns Feedback */}
        {answeredQuestions.length > 0 && (
          <Card>
            <CardHeader
              icon={<History className="h-4 w-4" />}
              title="Session Transcript & Live Evaluations"
              subtitle="Instant AI grading from earlier turns in this interview"
            />
            <CardContent className="space-y-4">
              {[...answeredQuestions].reverse().map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#172033]">
                        Q{q.questionOrder}: {q.topicTag}
                      </span>
                      {q.isFollowUp && <Badge tone="warning">Follow-Up</Badge>}
                    </div>
                    <Badge
                      tone={
                        (q.score ?? 0) >= 80
                          ? "success"
                          : (q.score ?? 0) >= 60
                          ? "warning"
                          : "danger"
                      }
                      className="tabular-nums"
                    >
                      Score: {q.score ?? 0}%
                    </Badge>
                  </div>

                  <p className="text-xs font-medium text-[#172033]">{q.question}</p>
                  <p className="text-xs text-[#64748B] bg-white p-3 rounded-lg border border-slate-200/80">
                    <span className="font-semibold text-[#172033]">Your Answer: </span>
                    {q.userAnswer}
                  </p>
                  {q.feedback && (
                    <p className="text-xs text-[#172033] leading-relaxed">
                      <span className="font-semibold text-[#6D5DFB]">AI Feedback: </span>
                      {q.feedback}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // 2. COMPLETED INTERVIEW REPORT VIEW
  if (activeSession && activeSession.status === InterviewStatus.COMPLETED) {
    const summary = activeSession.feedbackSummary;
    const radarData = summary
      ? [
          { metric: "Accuracy", score: summary.rubricAverages.technicalAccuracy },
          { metric: "Depth", score: summary.rubricAverages.depthOfUnderstanding },
          { metric: "Completeness", score: summary.rubricAverages.completeness },
          { metric: "Clarity", score: summary.rubricAverages.clarityAndStructure },
          { metric: "Examples", score: summary.rubricAverages.practicalExamples },
        ]
      : [];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => setActiveSession(null)}>
            <ArrowLeft className="h-4 w-4" />
            All Sessions &amp; Setup
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="brand">{activeSession.category.replace(/_/g, " ")}</Badge>
            {activeSession.targetRole && (
              <Badge tone="neutral">{activeSession.targetRole}</Badge>
            )}
            <Badge tone="neutral">{activeSession.difficulty}</Badge>
            {activeSession.subcategories?.map((sub) => (
              <Badge key={sub} tone="neutral">
                {sub}
              </Badge>
            ))}
            <Badge tone="success">Completed Report</Badge>
          </div>
        </div>

        {/* Hero Summary + Rubric Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7">
            <CardHeader
              icon={<Award className="h-4 w-4" />}
              title="Interview Performance Dossier"
              subtitle={`Evaluated ${activeSession.answeredCount} question(s) using role-calibrated CS benchmarks`}
            />
            <CardContent className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <ProgressRing
                  value={activeSession.overallScore ?? 0}
                  size={96}
                  strokeWidth={8}
                  color={
                    (activeSession.overallScore ?? 0) >= 75
                      ? "#16A34A"
                      : (activeSession.overallScore ?? 0) >= 55
                      ? "#6D5DFB"
                      : "#EF4444"
                  }
                  label="Overall"
                />
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-[#172033] leading-relaxed">
                    {summary?.executiveSummary || "Interview completed."}
                  </p>
                  {summary && summary.weakTopics.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-rose-700">Weak Topics:</span>
                      {summary.weakTopics.map((wt) => (
                        <Badge key={wt} tone="danger">
                          {wt}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <p className="text-xs font-semibold text-emerald-800">Observed Strengths</p>
                    <ul className="space-y-1.5">
                      {summary.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-emerald-900 flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <p className="text-xs font-semibold text-amber-800">Areas to Improve</p>
                    <ul className="space-y-1.5">
                      {summary.areasToImprove.map((a, i) => (
                        <li key={i} className="text-xs text-amber-900 flex items-start gap-1.5">
                          <Target className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader
              icon={<Layers className="h-4 w-4" />}
              title="5-Criterion Rubric Profile"
              subtitle="Mean performance across answered prompts"
            />
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#6D5DFB"
                      fill="#6D5DFB"
                      fillOpacity={0.28}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question-by-Question Evidence Breakdown */}
        <Card>
          <CardHeader
            icon={<MessageSquare className="h-4 w-4" />}
            title="Question-by-Question Evidence & Model Answers"
            subtitle="Inspect your answers side-by-side against calibrated reference solutions"
          />
          <CardContent className="space-y-4">
            {activeSession.questions
              .filter((q) => q.userAnswer !== null)
              .map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">Q{q.questionOrder}</Badge>
                      <span className="text-xs font-semibold text-[#172033]">{q.topicTag}</span>
                      {q.isFollowUp && <Badge tone="warning">Follow-Up</Badge>}
                    </div>
                    <Badge
                      tone={
                        (q.score ?? 0) >= 80
                          ? "success"
                          : (q.score ?? 0) >= 60
                          ? "warning"
                          : "danger"
                      }
                      className="tabular-nums"
                    >
                      {q.score ?? 0}%
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-[#172033]">{q.question}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                      <p className="text-[11px] font-semibold uppercase text-[#64748B]">
                        Your Submitted Response
                      </p>
                      <p className="text-xs text-[#172033] leading-relaxed whitespace-pre-wrap">
                        {q.userAnswer}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#EEF2FF]/50 border border-[#6D5DFB]/20 space-y-1">
                      <p className="text-[11px] font-semibold uppercase text-[#6D5DFB]">
                        Reference Model Answer
                      </p>
                      <p className="text-xs text-[#172033] leading-relaxed">{q.modelAnswer}</p>
                    </div>
                  </div>

                  {q.feedback && (
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      <span className="font-semibold text-[#172033]">Evaluator Notes: </span>
                      {q.feedback}
                    </p>
                  )}

                  {q.speechMetrics && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <Badge tone="brand">{q.speechMetrics.wordsPerMinute} WPM</Badge>
                      <Badge tone="neutral">{q.speechMetrics.durationSeconds}s audio</Badge>
                      <Badge tone={q.speechMetrics.fillerWordCount >= 3 ? "warning" : "success"}>
                        {q.speechMetrics.fillerWordCount} filler(s)
                      </Badge>
                      <span className="text-[#64748B]">{q.speechMetrics.deliveryFeedback}</span>
                    </div>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. SETUP STUDIO & HISTORY VIEW
  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Session Configurator */}
        <Card className="lg:col-span-7">
          <CardHeader
            icon={<Sparkles className="h-4 w-4" />}
            title="Configure AI Mock Interview"
            subtitle="Questions grounded in core computer science topics + optional resume & JD context"
          />
          <CardContent>
            <form onSubmit={handleStartSession} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#172033]">
                  Interview Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const active = category === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCategory(opt.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? "bg-[#EEF2FF] border-[#6D5DFB] ring-1 ring-[#6D5DFB]"
                            : "bg-white border-[#E2E8F0] hover:border-slate-300"
                        }`}
                      >
                        <p className="text-xs font-semibold text-[#172033] truncate">{opt.label}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5 truncate">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {supportsSubcategories && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-[#172033]">
                      Technical Focus Subcategories
                    </label>
                    <span className="text-[11px] text-[#64748B]">
                      {subcategories.length} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TECHNICAL_SUBCATEGORY_OPTIONS.map((topic) => {
                      const active = subcategories.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleSubcategory(topic)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            active
                              ? "bg-[#6D5DFB] text-white border-[#6D5DFB]"
                              : "bg-white text-[#172033] border-slate-200 hover:border-[#6D5DFB]/40"
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#172033]">Target Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
                >
                  {Array.from(
                    new Set([
                      ...CAREER_ROLE_PRESETS,
                      ...(user?.targetRole && user.targetRole !== "Other"
                        ? [user.targetRole]
                        : []),
                      "Other",
                    ])
                  ).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {targetRole === "Other" && (
                  <input
                    type="text"
                    value={customTargetRole}
                    onChange={(e) => setCustomTargetRole(e.target.value)}
                    placeholder="Enter target role (e.g. Cloud Architect)"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-[#172033]"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#172033]">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as InterviewDifficulty)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
                  >
                    <option value={InterviewDifficulty.EASY}>Easy (Foundational)</option>
                    <option value={InterviewDifficulty.MEDIUM}>Medium (Standard Bar)</option>
                    <option value={InterviewDifficulty.HARD}>Hard (Senior / Deep Dive)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#172033]">
                    Number of Questions
                  </label>
                  <select
                    value={questionLimit}
                    onChange={(e) => setQuestionLimit(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} Questions
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#172033]">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
                  >
                    {[15, 30, 45, 60].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#172033]">
                  Attach Analyzed Resume (Used for Project-Based &amp; Resume Probes)
                </label>
                <select
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
                >
                  <option value="">No resume attached (General interview)</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({Math.round(r.estimatedScore)}% ATS)
                    </option>
                  ))}
                </select>
              </div>

              {githubRepos.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#172033]">
                    Attach Analyzed GitHub Repository (Optional Codebase Deep-Dive)
                  </label>
                  <select
                    value={githubRepoId}
                    onChange={(e) => setGithubRepoId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#172033]"
                  >
                    <option value="">None</option>
                    {githubRepos.map((repo) => (
                      <option key={repo.id} value={repo.id}>
                        {repo.owner}/{repo.repoName} ({repo.primaryLanguage || "Code"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#172033]">
                  Optional Target Job Description Snippet
                </label>
                <textarea
                  rows={3}
                  value={targetJobDescription}
                  onChange={(e) => setTargetJobDescription(e.target.value)}
                  placeholder="Paste role responsibilities or stack requirements to tailor questions..."
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white text-xs text-[#172033] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#172033]">
                  Interview Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode(InterviewMode.TEXT)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      mode === InterviewMode.TEXT
                        ? "bg-[#EEF2FF] border-[#6D5DFB] ring-1 ring-[#6D5DFB]"
                        : "bg-white border-[#E2E8F0] hover:border-slate-300"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 text-[#6D5DFB] shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#172033]">Text Interview</p>
                      <p className="text-[10px] text-[#64748B]">Written structured responses</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(InterviewMode.VOICE)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      mode === InterviewMode.VOICE
                        ? "bg-[#EEF2FF] border-[#6D5DFB] ring-1 ring-[#6D5DFB]"
                        : "bg-white border-[#E2E8F0] hover:border-slate-300"
                    }`}
                  >
                    <Mic className="h-4 w-4 text-[#6D5DFB] shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#172033]">Voice Interview</p>
                      <p className="text-[10px] text-[#64748B]">
                        Voice capture, speaking pace &amp; audio prompts
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" loading={starting}>
                <Play className="h-4 w-4" />
                {starting
                  ? "Preparing Opening Question..."
                  : `Launch ${mode === InterviewMode.VOICE ? "Voice" : "Text"} Mock Interview`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Past Sessions List */}
        <Card className="lg:col-span-5">
          <CardHeader
            icon={<History className="h-4 w-4" />}
            title="Interview History"
            subtitle="Resume active interviews or inspect completed rubric dossiers"
          />
          <CardContent className="space-y-3">
            {loadingInit ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : sessions.length > 0 ? (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 hover:bg-white hover:border-[#6D5DFB]/35 transition-all flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setActiveSession(s)}
                    className="flex-1 min-w-0 text-left space-y-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#172033]">
                        {s.category.replace(/_/g, " ")}
                      </span>
                      {s.targetRole && (
                        <Badge tone="neutral">{s.targetRole}</Badge>
                      )}
                      <Badge
                        tone={
                          s.status === InterviewStatus.COMPLETED
                            ? "success"
                            : s.status === InterviewStatus.IN_PROGRESS
                            ? "brand"
                            : "neutral"
                        }
                      >
                        {s.status === InterviewStatus.COMPLETED && s.overallScore !== null
                          ? `${s.overallScore}%`
                          : s.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#64748B] tabular-nums">
                      {s.difficulty} · {s.answeredCount}/{s.questionLimit} answered
                      {s.subcategories && s.subcategories.length > 0
                        ? ` · ${s.subcategories.slice(0, 3).join(", ")}`
                        : ""}
                      {" · "}
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDeleteSession(s.id)}
                    title="Delete interview"
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-10 text-center space-y-2">
                <Loader2 className="h-5 w-5 text-slate-300 mx-auto hidden" />
                <Mic className="h-6 w-6 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-[#172033]">No interviews taken yet</p>
                <p className="text-[11px] text-[#64748B] max-w-xs mx-auto">
                  Start your first adaptive session on the left to build your communication &amp;
                  technical evaluation baseline.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
