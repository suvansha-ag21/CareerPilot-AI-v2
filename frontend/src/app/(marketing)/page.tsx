"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Compass,
  FileSearch,
  GitCompare,
  Layers,
  Map,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";

type PreviewTab = "overview" | "resume" | "matcher" | "interview";

const FEATURES = [
  {
    icon: FileSearch,
    title: "AI Resume Analyzer",
    description:
      "Upload PDF or DOCX resumes to uncover ATS readiness scores, extract key skills, spot missing keywords, and upgrade weak bullet points.",
  },
  {
    icon: GitCompare,
    title: "Smart Job Description Matcher",
    description:
      "Compare your resume against any job posting to measure compatibility, aligned strengths, transferable experience, and exact gaps.",
  },
  {
    icon: Sparkles,
    title: "Skill Gap Intelligence",
    description:
      "Benchmark your skill set against target hiring roles with dependency-ordered beginner, intermediate, and advanced learning priorities.",
  },
  {
    icon: Mic,
    title: "Mock & Voice Interviews",
    description:
      "Practice technical, coding, SQL, behavioral, and project deep-dive interviews via text or live microphone with paced delivery analytics.",
  },
  {
    icon: Map,
    title: "Personalized Learning Roadmap",
    description:
      "Turn your open skill gaps into structured week-by-week and day-by-day execution plans with curated study links and live progress tracking.",
  },
  {
    icon: Briefcase,
    title: "Application & Analytics Hub",
    description:
      "Track applications from applied to offer across table or board views while monitoring score progression and conversion velocity.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Build Your Profile & Upload Resume",
    description:
      "Add your education, projects, and upload your PDF or DOCX resume for instant ATS evaluation.",
  },
  {
    step: "02",
    title: "Match Target Job Descriptions",
    description:
      "Paste or upload any job posting to reveal compatibility scores and critical skill gaps.",
  },
  {
    step: "03",
    title: "Practice Voice & Text Interviews",
    description:
      "Answer role-tailored technical and behavioral prompts with adaptive follow-ups and clear rubric feedback.",
  },
  {
    step: "04",
    title: "Follow Roadmap & Land Offers",
    description:
      "Complete weekly study sprints and track every interview date and application milestone in one workspace.",
  },
];

const ENGINE_PILLARS = [
  {
    icon: Layers,
    title: "Section-by-Section Resume Audits",
    detail:
      "Evaluates contact clarity, technical summary, project impact, and role keywords cleanly.",
  },
  {
    icon: Target,
    title: "Role-Calibrated Question Bank",
    detail:
      "Covers Data Structures, Databases, OS, Networking, OOP, Java, Python, SQL, and HR scenarios.",
  },
  {
    icon: TrendingUp,
    title: "Speech & Pacing Insights",
    detail:
      "Measures speaking speed (WPM), clarity, and filler-word habits during live voice interviews.",
  },
  {
    icon: BarChart3,
    title: "Transparent 5-Criterion Scoring",
    detail:
      "Grades technical accuracy, depth, completeness, clarity, and practical examples without guesswork.",
  },
];

const TESTIMONIALS = [
  {
    name: "Aarav Mehta",
    role: "Final-Year CS Student • Backend Intern Offer",
    quote:
      "Seeing missing Spring Boot and SQL indexing requirements side by side against my resume immediately clarified what to study before campus placements.",
  },
  {
    name: "Neha Kulkarni",
    role: "Full Stack Developer Applicant",
    quote:
      "The adaptive follow-up questions during project-based mock interviews pushed me to explain architecture trade-offs instead of reciting memorized answers.",
  },
  {
    name: "Rohan Desai",
    role: "Graduate Software Engineer",
    quote:
      "Having my skill gaps flow straight into a week-by-week roadmap and application tracker replaced four disconnected spreadsheets for me.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [previewTab, setPreviewTab] = useState<PreviewTab>("overview");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      {/* 1. Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#6D5DFB] flex items-center justify-center shadow-sm">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-[#172033]">
              CareerPilot AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#64748B]">
            <a href="#features" className="hover:text-[#172033] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#172033] transition-colors">
              How It Works
            </a>
            <a href="#why-careerpilot" className="hover:text-[#172033] transition-colors">
              Scoring &amp; AI
            </a>
            <a href="#testimonials" className="hover:text-[#172033] transition-colors">
              Stories
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">
                  Open Dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-16 sm:pt-24 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-hero-glow">
        <div className="absolute inset-0 bg-grid-slate opacity-60 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#6D5DFB]/20 text-xs font-medium text-[#6D5DFB]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Career &amp; Interview Intelligence Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#172033] leading-[1.1]"
          >
            Your Career. Your Potential.{" "}
            <span className="text-[#6D5DFB]">Powered by AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed"
          >
            Analyze your resume, close critical skill gaps, practice voice and text interviews, and
            turn your preparation into real job offers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Link href={user ? "/dashboard" : "/register"}>
              <Button size="lg" className="w-full sm:w-auto px-7">
                {user ? "Go to Workspace" : "Get Started Free"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-7">
                Explore Features
              </Button>
            </a>
          </motion.div>
        </div>

        {/* 3. Interactive Product Workspace Preview */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative max-w-6xl mx-auto mt-14"
        >
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-elevated overflow-hidden">
            {/* Browser Top Chrome */}
            <div className="h-11 bg-slate-50 border-b border-[#E2E8F0] px-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <span className="text-[11px] font-medium text-[#64748B]">
                CareerPilot AI — Workspace Tour
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6D5DFB]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Interactive Demo
              </span>
            </div>

            {/* Interactive Split Workspace Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[360px]">
              {/* Dark Sidebar Mini Navigation (#111827) */}
              <div className="hidden md:flex md:col-span-3 bg-[#111827] text-slate-300 p-5 flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <div className="h-6 w-6 rounded bg-[#6D5DFB] flex items-center justify-center">
                      <Compass className="h-3.5 w-3.5 text-white" />
                    </div>
                    CareerPilot AI
                  </div>
                  <div className="space-y-1 text-xs">
                    {(
                      [
                        { id: "overview", label: "Overview Dashboard" },
                        { id: "resume", label: "Resume Analyzer" },
                        { id: "matcher", label: "Job Description Match" },
                        { id: "interview", label: "Voice & Mock Interview" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPreviewTab(tab.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                          previewTab === tab.id
                            ? "bg-[#6D5DFB]/25 text-white border border-[#6D5DFB]/40 font-medium"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                        }`}
                      >
                        <span>{tab.label}</span>
                        {previewTab === tab.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                  Track: Full Stack Developer
                </div>
              </div>

              {/* Light Workspace Canvas (#F8FAFC) */}
              <div className="md:col-span-9 bg-[#F8FAFC] p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                      Sample Workspace View
                    </p>
                    <h3 className="text-base font-semibold text-[#172033]">
                      {previewTab === "overview" && "Placement Readiness & Progress"}
                      {previewTab === "resume" && "Resume ATS Score & Bullet Upgrades"}
                      {previewTab === "matcher" && "Job Compatibility Breakdown"}
                      {previewTab === "interview" && "Voice & Technical Rubric Report"}
                    </h3>
                  </div>

                  {/* Mobile tab pills */}
                  <div className="flex md:hidden flex-wrap gap-1.5">
                    {(["overview", "resume", "matcher", "interview"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPreviewTab(t)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ${
                          previewTab === t
                            ? "bg-[#6D5DFB] text-white"
                            : "bg-white border border-slate-200 text-slate-600"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <span className="hidden md:inline-flex px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-xs font-medium text-[#172033]">
                    Target: Full Stack Developer
                  </span>
                </div>

                {previewTab === "overview" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3.5">
                      <ProgressRing value={84} size={64} strokeWidth={6} label="Ready" />
                      <div>
                        <p className="text-xs text-[#64748B]">Placement Readiness</p>
                        <p className="text-sm font-semibold text-[#172033] mt-0.5">Strong Trajectory</p>
                        <p className="text-[11px] text-emerald-600 font-medium">14 verified skills</p>
                      </div>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <p className="text-xs text-[#64748B]">Latest Resume Score</p>
                      <p className="text-2xl font-bold text-[#172033] tabular-nums">86%</p>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full w-[86%] bg-emerald-500 rounded-full" />
                      </div>
                      <p className="text-[11px] text-[#64748B]">Strong project impact metrics</p>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <p className="text-xs text-[#64748B]">Active Study Sprint</p>
                      <p className="text-2xl font-bold text-[#172033] tabular-nums">75%</p>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full w-[75%] bg-[#6D5DFB] rounded-full" />
                      </div>
                      <p className="text-[11px] text-[#6D5DFB] font-medium">9 of 12 weekly tasks done</p>
                    </div>
                  </div>
                )}

                {previewTab === "resume" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2.5">
                      <p className="text-xs font-semibold text-[#172033]">Section Quality Signals</p>
                      {[
                        { s: "Technical Skills", p: 92 },
                        { s: "Projects & Impact", p: 86 },
                        { s: "Formatting & Keywords", p: 78 },
                      ].map((row) => (
                        <div key={row.s} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#64748B]">{row.s}</span>
                            <span className="font-semibold text-[#172033] tabular-nums">{row.p}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#6D5DFB] rounded-full"
                              style={{ width: `${row.p}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-[#6D5DFB]">AI Bullet Rewrite Suggestion</p>
                      <p className="text-[11px] text-slate-400 line-through">
                        Built a backend API for student tracking app.
                      </p>
                      <p className="text-xs text-[#172033] font-medium leading-relaxed">
                        Engineered RESTful Node.js microservices with Redis caching, reducing API p95
                        latency by 42% for 1,200+ active users.
                      </p>
                    </div>
                  </div>
                )}

                {previewTab === "matcher" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-4">
                      <ProgressRing value={88} size={68} strokeWidth={7} color="#16A34A" label="Match" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#172033]">
                          Software Engineer — Cloud Platform
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          Strong alignment across core stack &amp; production APIs.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2.5">
                      <p className="text-xs font-semibold text-[#172033]">Detected Skill Fit</p>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          ✓ TypeScript
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          ✓ React &amp; SQL
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                          ~ Kubernetes (Docker transferable)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                          + System Design
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === "interview" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#172033]">Voice Delivery Metrics</p>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          128 WPM • Clear Pace
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        &ldquo;We used read-through caching with short TTL invalidation so stale reads
                        stay bounded while protecting database throughput.&rdquo;
                      </p>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-[#6D5DFB]">5-Criterion Evaluation</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-slate-50">Accuracy: <strong>90%</strong></div>
                        <div className="p-2 rounded bg-slate-50">Depth: <strong>85%</strong></div>
                        <div className="p-2 rounded bg-slate-50">Clarity: <strong>88%</strong></div>
                        <div className="p-2 rounded bg-slate-50">Examples: <strong>82%</strong></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[#172033]">
                      Built Around Your Own Progress
                    </p>
                    <p className="text-xs text-[#64748B]">
                      Every new account starts cleanly at zero—your readiness score grows strictly
                      from your real resumes, job matches, and practice sessions.
                    </p>
                  </div>
                  <Link href={user ? "/dashboard" : "/register"} className="shrink-0">
                    <Button size="sm" variant="secondary">
                      Create Free Workspace
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-[#E2E8F0] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6D5DFB]">
              Platform Capabilities
            </p>
            <h2 className="text-3xl font-semibold text-[#172033] tracking-tight mt-2">
              Six tightly integrated career intelligence modules
            </h2>
            <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
              Every tool shares your profile context—what you learn from a resume review or mock
              interview directly shapes your skill gaps and study roadmap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/50 hover:bg-white hover:shadow-card transition-all duration-150"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[#172033]">{feat.title}</h3>
                  <p className="text-sm text-[#64748B] mt-2 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6D5DFB]">
              Workflow
            </p>
            <h2 className="text-3xl font-semibold text-[#172033] tracking-tight mt-2">
              From raw resume to confident offer execution
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-3 shadow-card"
              >
                <span className="inline-block text-xs font-semibold text-[#6D5DFB] bg-[#EEF2FF] px-2.5 py-1 rounded-md tabular-nums">
                  STEP {item.step}
                </span>
                <h3 className="text-sm font-semibold text-[#172033]">{item.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Precision Intelligence Showcase */}
      <section id="why-careerpilot" className="py-20 bg-[#111827] text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8B7CFF]">
              <ShieldCheck className="h-4 w-4" />
              Precision Career Intelligence
            </span>
            <h2 className="text-3xl font-semibold tracking-tight leading-tight">
              Structured evaluation, never generic chatbot advice
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instead of superficial chat responses, CareerPilot AI evaluates your real resume
              structure, target job requirements, and interview depth using transparent rubrics.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] shrink-0" />
                Private per-user workspace with isolated resume &amp; session storage
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] shrink-0" />
                Explicit-consent microphone controls and clear scoring methodology
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] shrink-0" />
                Adaptive follow-up interviews anchored in core computer science topics
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ENGINE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#6D5DFB]/20 text-[#8B7CFF] flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{pillar.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{pillar.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6D5DFB]">
              Designed for Candidates
            </p>
            <h2 className="text-3xl font-semibold text-[#172033] tracking-tight mt-2">
              Structured preparation for students and job seekers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-card flex flex-col justify-between gap-4"
              >
                <p className="text-sm text-[#172033] leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-[#172033]">{t.name}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-2xl bg-white border border-[#E2E8F0] p-8 sm:p-12 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl font-semibold text-[#172033] tracking-tight">
              Ready to measure and close your skill gaps?
            </h2>
            <p className="text-sm text-[#64748B]">
              Create your CareerPilot AI workspace in seconds and start preparing with clear,
              actionable feedback.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href={user ? "/dashboard" : "/register"}>
              <Button size="lg">
                {user ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2 font-medium text-[#172033]">
            <Compass className="h-4 w-4 text-[#6D5DFB]" />
            <span>CareerPilot AI</span>
          </div>
          <p>CareerPilot AI &bull; Intelligent Career &amp; Interview Preparation Platform</p>
        </div>
      </footer>
    </div>
  );
}
