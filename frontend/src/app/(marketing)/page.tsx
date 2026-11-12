"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Briefcase,
  CheckCircle2,
  Code2,
  Compass,
  Eye,
  FileSearch,
  GitCompare,
  Layers,
  LayoutDashboard,
  Map,
  Mic,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { DashboardAnalyticsDTO } from "@careerpilot/shared";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { CodeSqlSandbox, SandboxLanguage } from "@/components/interview/CodeSqlSandbox";
import { SystemDesignCanvas } from "@/components/interview/SystemDesignCanvas";

type PlaygroundTab = "sandbox" | "design" | "roles" | "workspace";

const HERO_ROLES = [
  "Full Stack SDEs",
  "AI / ML Engineers",
  "Backend Architects",
  "Data Scientists",
];

const ROLE_BLUEPRINTS: Array<{
  role: string;
  stack: string[];
  interviewFocus: string[];
  summary: string;
}> = [
  {
    role: "Full Stack Developer",
    stack: ["TypeScript", "React / Next.js", "Node.js", "PostgreSQL", "REST APIs", "Docker"],
    interviewFocus: ["API Pagination & Auth", "SQL Indexing & Joins", "State & Caching", "System Design"],
    summary: "Balances frontend responsiveness, relational schema design, and scalable backend APIs.",
  },
  {
    role: "AI / ML Engineer",
    stack: ["Python", "PyTorch", "FastAPI", "Vector Databases", "NLP / LLMs", "Scikit-learn"],
    interviewFocus: ["RAG & Chunking Trade-offs", "Embeddings & Cosine Sim", "Model Latency & Fallbacks", "Evaluation Harnesses"],
    summary: "Focuses on structured LLM pipelines, retrieval accuracy, observability telemetry, and Python services.",
  },
  {
    role: "Software Engineer (SDE)",
    stack: ["Data Structures & Algorithms", "OOP", "Java / Python", "DBMS", "Operating Systems", "Git"],
    interviewFocus: ["Trees, Graphs & DP", "Concurrency & Locks", "ACID & Isolation Levels", "Complexity Bounds"],
    summary: "Emphasizes strong CS fundamentals, clean coding under constraints, and algorithmic efficiency.",
  },
  {
    role: "Backend Developer",
    stack: ["Node.js / Java", "PostgreSQL", "Redis", "System Design", "CI/CD", "Docker"],
    interviewFocus: ["Database Sharding & MVCC", "Rate Limiting & Queues", "Caching Invalidation", "Zero-Downtime Deploys"],
    summary: "Centers on throughput, reliability, concurrency control, and fault-tolerant service design.",
  },
  {
    role: "Data Scientist",
    stack: ["Python", "SQL", "Scikit-learn", "Machine Learning", "Statistics", "Feature Engineering"],
    interviewFocus: ["Bias-Variance & Metrics", "Window Functions in SQL", "Experiment Design", "Data Leakage Guards"],
    summary: "Combines statistical rigor, SQL analytical querying, and reproducible ML modeling.",
  },
];

const CONCEPT_DRILL_DECK = [
  {
    topic: "DBMS • MVCC",
    question: "How does PostgreSQL MVCC ensure readers never block concurrent writers?",
    hint: "Think about row tuple transaction IDs (xmin/xmax) and snapshot isolation.",
    answer:
      "PostgreSQL keeps multiple versioned row tuples tagged with xmin/xmax transaction IDs. Each reader views a consistent point-in-time snapshot without taking read locks against writers, while VACUUM reclaims dead tuples asynchronously.",
  },
  {
    topic: "Caching • Redis",
    question: "What is the thundering herd (cache stampede) problem, and how do you mitigate it?",
    hint: "Consider what happens when a hot key expires under high concurrent traffic.",
    answer:
      "When a high-traffic key expires simultaneously for many requests, all miss and hit the primary database at once. Mitigate via singleflight/mutex coalescing, jittered TTLs, or probabilistic early refresh.",
  },
  {
    topic: "DSA • Hashing",
    question: "Why can hash table lookup degrade from O(1) to O(n), and how do modern runtimes guard against it?",
    hint: "Think about bucket collisions and balanced tree fallbacks.",
    answer:
      "Adversarial or poor hash functions can map many keys to the same bucket, forming a long chain. Guard against this using randomized hash seeds, low load-factor resizing, and treeifying oversized buckets (O(log n) in Java HashMap).",
  },
];

const FEATURES = [
  {
    icon: FileSearch,
    title: "AI Resume Analyzer",
    href: "/resume",
    description:
      "Upload PDF or DOCX resumes to uncover ATS readiness scores, extract skills, spot missing keywords, and tailor PDF exports.",
    flow: "PDF / DOCX Upload -> Layout & Skill Parsing -> Section Rubric + Tailored ATS PDF Export",
  },
  {
    icon: GitCompare,
    title: "Smart Job Matcher",
    href: "/matcher",
    description:
      "Compare your resume against any job posting to see matching, related, and missing skills instantly.",
    flow: "Resume + Job Post -> Meaning & Keyword Check -> Matching / Related / Missing Skills",
  },
  {
    icon: Sparkles,
    title: "Skill Gap Intelligence",
    href: "/skills",
    description:
      "Compare your skills against target roles with an easy step-by-step order from beginner basics to advanced topics.",
    flow: "Profile + Resume + Job -> Step-by-Step Study Order -> Prioritized Skill Gap Plan",
  },
  {
    icon: Mic,
    title: "Code, Voice & System Design Interviews",
    href: "/interview",
    description:
      "Practice live JS/SQL coding, build system diagrams, or answer by voice with speaking pace tips & GitHub project questions.",
    flow: "Written, Voice, Code, or Diagram -> 5-Part Rubric + Follow-Ups -> Score Breakdown & Practice Cards",
  },
  {
    icon: Map,
    title: "Personalized Roadmap & Daily Flashcards",
    href: "/roadmap",
    description:
      "Turn skill gaps into a 30–180 day weekly study plan synced with smart flashcards that come back right before you forget.",
    flow: "Skill Gaps + Study Time -> Weekly Tasks + Smart Flashcards -> Live Readiness Sync",
  },
  {
    icon: Briefcase,
    title: "Application Hub & Progress Insights",
    href: "/analytics",
    description:
      "Track applications in Table or Kanban views while watching your conversion rates, score trends, and AI response speed.",
    flow: "Job Pipeline + Activity -> Progress Funnel & AI Speed -> Clear Next Steps",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "3-Step Setup & GitHub Import",
    description:
      "Pick your education, career goals, resume, and optional public GitHub repos so interviews reflect your real projects.",
    href: "/onboarding",
    cta: "Start Onboarding",
  },
  {
    step: "02",
    title: "Check Job Fit & Tailor Resume",
    description:
      "Measure compatibility against real job postings, add missing keywords, and download a clean ATS-friendly PDF.",
    href: "/matcher",
    cta: "Open Job Matcher",
  },
  {
    step: "03",
    title: "Practice Code, SQL, Voice & Design",
    description:
      "Run code & SQL queries, build architecture diagrams, request quick hints, and get graded across 5 clear areas.",
    href: "/interview",
    cta: "Enter Interview Studio",
  },
  {
    step: "04",
    title: "Review Flashcards & Track Offers",
    description:
      "Practice auto-created flashcards daily, check off weekly roadmap tasks, and manage applications up to your offer.",
    href: "/drills",
    cta: "Open Daily Flashcards",
  },
];

const ENGINE_PILLARS = [
  {
    icon: Code2,
    title: "In-Browser Code & SQL Execution",
    detail:
      "Run JavaScript in a safe browser sandbox and execute SQL queries live during mock interviews.",
  },
  {
    icon: Target,
    title: "Questions Based on Your GitHub",
    detail:
      "Reads public repositories, dependencies, and READMEs so interview questions reflect projects you actually built.",
  },
  {
    icon: TrendingUp,
    title: "Speaking Pace & Health Monitor",
    detail:
      "Measures speaking speed (words per minute), filler words, and live AI response times.",
  },
  {
    icon: BarChart3,
    title: "Transparent 5-Criterion Scoring",
    detail:
      "Grades technical accuracy, depth, completeness, clarity, and practical examples without arbitrary scores.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [heroRoleIdx, setHeroRoleIdx] = useState(0);
  const [playgroundTab, setPlaygroundTab] = useState<PlaygroundTab>("roles");
  const [sandboxLang, setSandboxLang] = useState<SandboxLanguage>("sql");
  const [sandboxCode, setSandboxCode] = useState("");
  const [designNodes, setDesignNodes] = useState<string[]>([
    "Client / CDN",
    "Load Balancer",
    "API Gateway",
    "Redis Cache",
    "PostgreSQL Primary",
  ]);
  const [designNotes, setDesignNotes] = useState(
    "Read-through cache with 60s TTL + read replica scaling for analytics queries."
  );
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0);
  const [drillIdx, setDrillIdx] = useState(0);
  const [showDrillHint, setShowDrillHint] = useState(false);
  const [drillFlipped, setDrillFlipped] = useState(false);
  const [activeFeatureIdx, setActiveFeatureIdx] = useState(0);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [liveDashboard, setLiveDashboard] = useState<DashboardAnalyticsDTO | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroRoleIdx((prev) => (prev + 1) % HERO_ROLES.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) {
      setLiveDashboard(null);
      return;
    }
    let active = true;
    apiRequest<DashboardAnalyticsDTO>("/analytics/dashboard")
      .then((res) => {
        if (active) setLiveDashboard(res);
      })
      .catch(() => {
        if (active) setLiveDashboard(null);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const activeRoleBlueprint = ROLE_BLUEPRINTS[selectedRoleIdx];
  const activeDrill = CONCEPT_DRILL_DECK[drillIdx];
  const activeFeature = FEATURES[activeFeatureIdx];
  const activeStep = HOW_IT_WORKS[activeStepIdx];

  const laptopDisplayName = user?.name?.trim() || previewName.trim() || "Future Engineer";
  const laptopFirstName = laptopDisplayName.split(/\s+/)[0] || laptopDisplayName;
  const laptopInitials = laptopDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const laptopChartBars = [
    { label: "Profile", value: user ? liveDashboard?.profileCompletenessPct ?? 0 : 0 },
    { label: "Resume", value: user ? liveDashboard?.latestResumeScore ?? 0 : 0 },
    { label: "Match", value: user ? liveDashboard?.latestJobMatchScore ?? 0 : 0 },
    { label: "Interview", value: user ? liveDashboard?.averageInterviewScore ?? 0 : 0 },
    { label: "Roadmap", value: user ? liveDashboard?.roadmapProgressPct ?? 0 : 0 },
  ];

  const FEATURE_CARD_TINTS = [
    "from-blue-50/90 to-indigo-50/70 border-blue-200/70",
    "from-emerald-50/90 to-teal-50/70 border-emerald-200/70",
    "from-violet-50/90 to-purple-50/70 border-violet-200/70",
    "from-indigo-50/90 to-blue-50/70 border-indigo-200/70",
    "from-teal-50/90 to-emerald-50/70 border-teal-200/70",
    "from-amber-50/80 to-rose-50/60 border-amber-200/70",
  ];

  return (
    <div id="home" className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      {/* 1. Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#E2E8F0]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#5B4DFB] to-[#7C3AED] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-[#172033]">
              CareerPilot AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100/80 border border-slate-200/70 text-xs font-medium text-[#64748B]">
            <a href="#home" className="px-3 py-1.5 rounded-full text-[#172033] bg-white shadow-sm">
              Home
            </a>
            <a href="#features" className="px-3 py-1.5 rounded-full hover:text-[#172033] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="px-3 py-1.5 rounded-full hover:text-[#172033] transition-colors">
              How It Works
            </a>
            <a href="#playground" className="px-3 py-1.5 rounded-full hover:text-[#172033] transition-colors">
              Interactive Lab
            </a>
            <a href="#why-careerpilot" className="px-3 py-1.5 rounded-full hover:text-[#172033] transition-colors">
              Why CareerPilot
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
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
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get Started Free
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Split Hero Section with Live Personalized Laptop Preview */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#EEF2FF]/75 via-[#F5F3FF]/60 to-[#F8FAFC]">
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-[#6D5DFB]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-20 -left-16 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#6D5DFB]/20 text-xs font-medium text-[#5B4DFB] shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Career Platform
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="space-y-2"
            >
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#172033] leading-[1.12]">
                Your Career. Your Potential.
                <span className="block bg-gradient-to-r from-[#4F46E5] via-[#6D5DFB] to-[#8B5CF6] bg-clip-text text-transparent mt-1">
                  Powered by AI.
                </span>
              </h1>
              <p className="text-xs font-medium text-[#6D5DFB] pt-1">
                Built for{" "}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={HERO_ROLES[heroRoleIdx]}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22 }}
                    className="inline-block underline decoration-[#6D5DFB]/40 underline-offset-4"
                  >
                    {HERO_ROLES[heroRoleIdx]}
                  </motion.span>
                </AnimatePresence>
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-base text-[#475569] leading-relaxed"
            >
              Analyze your resume, discover skill gaps, practice interviews, track applications and
              build a smarter path to your dream job.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link href={user ? "/dashboard" : "/register"}>
                <Button size="lg" className="px-6 shadow-md">
                  {user ? "Go to My Dashboard" : "Get Started Free"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#playground">
                <Button variant="outline" size="lg" className="bg-white/90 px-6">
                  Try Interactive Lab
                </Button>
              </a>
            </motion.div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs font-medium text-[#475569]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#6D5DFB]" />
                AI-Powered Analysis
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#6D5DFB]" />
                Personalized Roadmap
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#6D5DFB]" />
                Interview Preparation
              </span>
            </div>
          </div>

          {/* Right Realistic Laptop Workspace Preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="lg:col-span-7"
          >
            {/* Laptop Screen Lid */}
            <div className="mx-auto max-w-[660px]">
              <div className="rounded-t-2xl bg-[#111827] p-2.5 sm:p-3 shadow-2xl border border-slate-700/80">
                {/* Webcam Dot */}
                <div className="flex justify-center pb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                </div>

                {/* Inner Laptop App Screen */}
                <div className="rounded-lg bg-[#F8FAFC] overflow-hidden border border-slate-800/40 grid grid-cols-12 min-h-[340px]">
                  {/* Dark Navy App Sidebar */}
                  <div className="col-span-4 sm:col-span-3 bg-[#111827] text-slate-300 p-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-white text-[11px] font-semibold px-1">
                        <div className="h-5 w-5 rounded bg-[#6D5DFB] flex items-center justify-center shrink-0">
                          <Compass className="h-3 w-3 text-white" />
                        </div>
                        <span className="truncate">CareerPilot AI</span>
                      </div>

                      <div className="space-y-1 text-[10px]">
                        {[
                          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
                          { label: "Resume Analyzer", href: "/resume", icon: FileSearch },
                          { label: "Job Matcher", href: "/matcher", icon: GitCompare },
                          { label: "Skill Gap", href: "/skills", icon: Sparkles },
                          { label: "Mock Interview", href: "/interview", icon: Mic },
                          { label: "Learning Roadmap", href: "/roadmap", icon: Map },
                          { label: "Applications", href: "/applications", icon: Briefcase },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              href={user ? item.href : "/register"}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors ${
                                item.active
                                  ? "bg-[#6D5DFB] text-white font-medium"
                                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                              }`}
                            >
                              <Icon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 px-1 text-[9px] text-slate-400 truncate">
                      {user?.targetRole || "Full Stack Track"}
                    </div>
                  </div>

                  {/* Main Dashboard Canvas Inside Laptop */}
                  <div className="col-span-8 sm:col-span-9 p-3.5 sm:p-4 space-y-3 bg-[#F8FAFC]">
                    {/* Dynamic Greeting Header — Automatically Changes With User */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-[#172033] truncate">
                          {greeting}, {laptopFirstName}!
                        </p>
                        <p className="text-[10px] text-[#64748B] truncate">
                          {user
                            ? `Synced workspace for ${laptopDisplayName}`
                            : "Live preview updates with your name & workspace"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-slate-200 shrink-0">
                        <span className="h-5 w-5 rounded-full bg-[#EEF2FF] text-[#6D5DFB] text-[9px] font-bold flex items-center justify-center">
                          {laptopInitials || <User className="h-3 w-3" />}
                        </span>
                        <span className="text-[10px] font-medium text-[#172033] max-w-[90px] truncate">
                          {laptopDisplayName}
                        </span>
                      </div>
                    </div>

                    {/* 3 Clean Zero-Fake-Data KPI Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-sm">
                        <p className="text-[9px] text-[#64748B] font-medium">Resume Score</p>
                        <p className="text-sm sm:text-base font-bold text-[#172033] mt-0.5 tabular-nums">
                          {user && liveDashboard?.latestResumeScore !== null && liveDashboard?.latestResumeScore !== undefined
                            ? `${liveDashboard.latestResumeScore}%`
                            : "—"}
                        </p>
                        <p className="text-[9px] text-[#6D5DFB] truncate">
                          {user && liveDashboard?.latestResumeScore !== null ? "Latest scan" : "Upload PDF"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-sm">
                        <p className="text-[9px] text-[#64748B] font-medium">Skill Readiness</p>
                        <p className="text-sm sm:text-base font-bold text-[#172033] mt-0.5 tabular-nums">
                          {user && liveDashboard?.readinessScore !== null && liveDashboard?.readinessScore !== undefined
                            ? `${liveDashboard.readinessScore}%`
                            : "—"}
                        </p>
                        <p className="text-[9px] text-emerald-600 truncate">
                          {user ? `${liveDashboard?.skillsCount ?? 0} verified` : "Real baseline"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-sm">
                        <p className="text-[9px] text-[#64748B] font-medium">Applications</p>
                        <p className="text-sm sm:text-base font-bold text-[#172033] mt-0.5 tabular-nums">
                          {user ? liveDashboard?.applicationStats?.total ?? 0 : 0}
                        </p>
                        <p className="text-[9px] text-[#64748B] truncate">
                          {user ? `${liveDashboard?.applicationStats?.active ?? 0} active` : "Ready to track"}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Visual Analytics + Next Steps Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-7 bg-white rounded-lg p-2.5 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-[#172033]">
                            Readiness Overview
                          </span>
                          <span className="text-[9px] text-[#6D5DFB] font-medium">
                            {user ? "Live Account" : "0% Empty Start"}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 items-end h-20 pt-2">
                          {laptopChartBars.map((bar) => (
                            <div key={bar.label} className="flex flex-col items-center gap-1 h-full justify-end">
                              <div className="w-full max-w-[20px] bg-slate-100 rounded-t-sm h-14 flex items-end overflow-hidden">
                                <div
                                  className="w-full rounded-t-sm bg-gradient-to-t from-[#5B4DFB] to-[#8B7CFF] transition-all duration-500"
                                  style={{ height: `${Math.max(bar.value, 6)}%`, opacity: bar.value > 0 ? 1 : 0.25 }}
                                />
                              </div>
                              <span className="text-[8px] text-[#64748B] truncate max-w-full">
                                {bar.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="sm:col-span-5 bg-white rounded-lg p-2.5 border border-slate-200/80 space-y-1.5">
                        <span className="text-[10px] font-semibold text-[#172033] block">
                          Next Recommended Steps
                        </span>
                        <ul className="space-y-1.5 text-[9.5px] text-[#475569]">
                          {(user && liveDashboard?.recommendations?.length
                            ? liveDashboard.recommendations.slice(0, 3).map((r) => r.title)
                            : [
                                "Complete 3-step onboarding",
                                "Upload your resume PDF/DOCX",
                                "Start a mock interview",
                              ]
                          ).map((stepTitle, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="h-3.5 w-3.5 rounded-full bg-[#EEF2FF] text-[#6D5DFB] font-bold text-[8px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="line-clamp-1">{stepTitle}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Realistic Silver Laptop Base Lip */}
              <div className="relative h-3.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-b-xl mx-auto w-[104%] -ml-[2%] shadow-lg flex justify-center">
                <div className="h-1 w-16 rounded-b-full bg-slate-500/40" />
              </div>

              {/* Live Name Switcher Pill for Guests */}
              {!user && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-[#64748B]">
                  <span>Preview the laptop dashboard with your name:</span>
                  <input
                    type="text"
                    value={previewName}
                    onChange={(e) => setPreviewName(e.target.value)}
                    placeholder="Type your name..."
                    maxLength={32}
                    className="h-7 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-[#172033] w-40 focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/25 focus:border-[#6D5DFB]"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 3. Authentic Platform Highlights Bar (Zero Fake Stats) */}
        <div className="relative max-w-6xl mx-auto mt-12">
          <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-[#E2E8F0] shadow-card grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200/80">
            {[
              {
                icon: FileSearch,
                value: "PDF & DOCX",
                label: "ATS Resume & Project Check",
                color: "text-[#6D5DFB] bg-[#EEF2FF]",
              },
              {
                icon: Mic,
                value: "4 Interview Modes",
                label: "Text, Voice, Code/SQL & Design",
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                icon: Map,
                value: "30–180 Days",
                label: "Adaptive Roadmaps & Flashcards",
                color: "text-indigo-600 bg-indigo-50",
              },
              {
                icon: ShieldCheck,
                value: "100% Real Data",
                label: "Every Account Starts at Zero",
                color: "text-amber-600 bg-amber-50",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="p-5 flex items-center gap-3.5">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#172033] tracking-tight">{item.value}</p>
                    <p className="text-xs text-[#64748B] truncate">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. A Complete Career Companion Grid */}
      <section id="features" className="py-16 sm:py-20 bg-white border-y border-[#E2E8F0] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#172033] tracking-tight">
              A Complete Career Companion
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Everything you need to prepare, practice and land your dream opportunity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              const active = activeFeatureIdx === idx;
              const tint = FEATURE_CARD_TINTS[idx % FEATURE_CARD_TINTS.length];
              return (
                <button
                  key={feat.title}
                  type="button"
                  onClick={() => setActiveFeatureIdx(idx)}
                  className={`text-left p-6 rounded-2xl border bg-gradient-to-br ${tint} transition-all duration-150 hover:-translate-y-0.5 ${
                    active ? "ring-2 ring-[#6D5DFB] shadow-card" : "hover:shadow-card"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      active ? "bg-[#6D5DFB] text-white" : "bg-white text-[#6D5DFB] shadow-sm"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[#172033]">{feat.title}</h3>
                  <p className="text-sm text-[#475569] mt-2 leading-relaxed">{feat.description}</p>
                </button>
              );
            })}
          </div>

          <div className="p-5 rounded-xl bg-[#111827] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8B7CFF]">
                Selected Tool • {activeFeature.title}
              </p>
              <p className="text-sm font-medium text-slate-200">{activeFeature.flow}</p>
            </div>
            <Link href={user ? activeFeature.href : "/register"} className="shrink-0">
              <Button size="sm" variant="primary">
                {user ? `Open ${activeFeature.title}` : "Try Module Free"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Interactive Hands-On Sandbox Lab */}
      <section className="py-16 sm:py-20 bg-[#F8FAFC] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6D5DFB]">
              Try It Before You Sign Up
            </p>
            <h2 className="text-3xl font-semibold text-[#172033] tracking-tight">
              Interactive Preparation Lab
            </h2>
            <p className="text-sm text-[#64748B]">
              Explore role blueprints, run JavaScript &amp; SQL queries live, sketch architecture
              diagrams, or test yourself with engineering flashcards.
            </p>
          </div>

          <motion.div
            id="playground"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative max-w-6xl mx-auto"
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
                  CareerPilot AI — Interactive Practice Lab
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6D5DFB]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {user ? "Signed In • Live Workspace" : "Try Live Tools"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
              {/* Dark Sidebar Switcher */}
              <div className="md:col-span-3 bg-[#111827] text-slate-300 p-5 flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <div className="h-6 w-6 rounded bg-[#6D5DFB] flex items-center justify-center">
                      <Compass className="h-3.5 w-3.5 text-white" />
                    </div>
                    Interactive Lab
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {(
                      [
                        { id: "roles", label: "Explore Career Roles", icon: Target },
                        { id: "sandbox", label: "Code & SQL Practice", icon: Code2 },
                        { id: "design", label: "Architecture Builder", icon: Layers },
                        {
                          id: "workspace",
                          label: user ? "My Live Progress" : "Practice Flashcards",
                          icon: Brain,
                        },
                      ] as const
                    ).map((tab) => {
                      const Icon = tab.icon;
                      const active = playgroundTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPlaygroundTab(tab.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between ${
                            active
                              ? "bg-[#6D5DFB] text-white font-medium shadow-sm"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                          </span>
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 space-y-2">
                  <p>
                    {user?.targetRole
                      ? `Your Track: ${user.targetRole}`
                      : "New accounts start cleanly at 0% with zero preloaded scores."}
                  </p>
                  <Link href={user ? "/interview" : "/register"} className="block">
                    <Button size="sm" variant="secondary" className="w-full">
                      {user ? "Open Full Interview Studio" : "Create Free Account"}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Interactive Canvas Body */}
              <div className="md:col-span-9 bg-[#F8FAFC] p-5 sm:p-6">
                <AnimatePresence mode="wait">
                  {playgroundTab === "sandbox" && (
                    <motion.div
                      key="sandbox"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                            Real In-Browser Execution
                          </p>
                          <h3 className="text-base font-semibold text-[#172033]">
                            Edit JavaScript or SQL &amp; click Run to execute live
                          </h3>
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          Tables: employees, departments, orders
                        </span>
                      </div>

                      <CodeSqlSandbox
                        language={sandboxLang}
                        code={sandboxCode}
                        onChange={({ language, code }) => {
                          setSandboxLang(language);
                          setSandboxCode(code);
                        }}
                      />
                    </motion.div>
                  )}

                  {playgroundTab === "design" && (
                    <motion.div
                      key="design"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                          Interactive Architecture Builder
                        </p>
                        <h3 className="text-base font-semibold text-[#172033]">
                          Toggle infrastructure blocks to construct a scalable topology
                        </h3>
                      </div>

                      <SystemDesignCanvas
                        nodes={designNodes}
                        notes={designNotes}
                        onChange={({ nodes, notes }) => {
                          setDesignNodes(nodes);
                          setDesignNotes(notes);
                        }}
                      />
                    </motion.div>
                  )}

                  {playgroundTab === "roles" && (
                    <motion.div
                      key="roles"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                          Interactive Role Blueprints
                        </p>
                        <h3 className="text-base font-semibold text-[#172033]">
                          Click any engineering role to inspect its benchmark stack &amp; interview focus
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ROLE_BLUEPRINTS.map((item, idx) => (
                          <button
                            key={item.role}
                            type="button"
                            onClick={() => setSelectedRoleIdx(idx)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              selectedRoleIdx === idx
                                ? "bg-[#6D5DFB] text-white border-[#6D5DFB] shadow-sm"
                                : "bg-white text-[#172033] border-slate-200 hover:border-[#6D5DFB]/40"
                            }`}
                          >
                            {item.role}
                          </button>
                        ))}
                      </div>

                      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-[#172033]">
                              {activeRoleBlueprint.role}
                            </h4>
                            <p className="text-xs text-[#64748B] mt-0.5">
                              {activeRoleBlueprint.summary}
                            </p>
                          </div>
                          <Link href={user ? "/skills" : "/register"} className="shrink-0">
                            <Button size="sm" variant="primary">
                              Benchmark My Skills
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                              Core Benchmark Stack
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {activeRoleBlueprint.stack.map((sk) => (
                                <span
                                  key={sk}
                                  className="px-2.5 py-1 rounded-md bg-[#EEF2FF] text-[#6D5DFB] text-xs font-medium"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                              Interview Focus Areas
                            </p>
                            <ul className="space-y-1 text-xs text-[#172033]">
                              {activeRoleBlueprint.interviewFocus.map((topic) => (
                                <li key={topic} className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {playgroundTab === "workspace" && (
                    <motion.div
                      key="workspace"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      {user ? (
                        <>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                              Your Live Workspace
                            </p>
                            <h3 className="text-base font-semibold text-[#172033]">
                              Real progress fetched directly from your account
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3.5">
                              <ProgressRing
                                value={liveDashboard?.readinessScore ?? null}
                                size={64}
                                strokeWidth={6}
                                label="Ready"
                              />
                              <div>
                                <p className="text-xs text-[#64748B]">Readiness</p>
                                <p className="text-sm font-semibold text-[#172033]">
                                  {liveDashboard?.readinessScore !== null &&
                                  liveDashboard?.readinessScore !== undefined
                                    ? `${liveDashboard.readinessScore}%`
                                    : "Not assessed"}
                                </p>
                                <p className="text-[11px] text-[#64748B]">
                                  {liveDashboard?.skillsCount ?? 0} verified skills
                                </p>
                              </div>
                            </div>
                            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-1.5">
                              <p className="text-xs text-[#64748B]">Latest Resume Score</p>
                              <p className="text-2xl font-bold text-[#172033] tabular-nums">
                                {liveDashboard?.latestResumeScore !== null &&
                                liveDashboard?.latestResumeScore !== undefined
                                  ? `${liveDashboard.latestResumeScore}%`
                                  : "—"}
                              </p>
                              <Link href="/resume" className="text-xs text-[#6D5DFB] hover:underline">
                                Open Resume AI &rarr;
                              </Link>
                            </div>
                            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-1.5">
                              <p className="text-xs text-[#64748B]">Interview Average</p>
                              <p className="text-2xl font-bold text-[#172033] tabular-nums">
                                {liveDashboard?.averageInterviewScore !== null &&
                                liveDashboard?.averageInterviewScore !== undefined
                                  ? `${liveDashboard.averageInterviewScore}%`
                                  : "—"}
                              </p>
                              <Link href="/drills" className="text-xs text-[#6D5DFB] hover:underline">
                                Practice Daily Drills &rarr;
                              </Link>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5DFB]">
                                Interactive Active-Recall Preview
                              </p>
                              <h3 className="text-base font-semibold text-[#172033]">
                                Test yourself on an engineering interview flashcard
                              </h3>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDrillIdx((prev) => (prev + 1) % CONCEPT_DRILL_DECK.length);
                                setDrillFlipped(false);
                                setShowDrillHint(false);
                              }}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Next Concept ({drillIdx + 1}/{CONCEPT_DRILL_DECK.length})
                            </Button>
                          </div>

                          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#6D5DFB] text-xs font-semibold">
                              {activeDrill.topic}
                            </span>
                            <p className="text-sm font-semibold text-[#172033] leading-relaxed">
                              {activeDrill.question}
                            </p>

                            {showDrillHint && (
                              <p className="text-xs text-[#6D5DFB] bg-[#EEF2FF]/70 px-3 py-2 rounded-lg">
                                <strong>Hint:</strong> {activeDrill.hint}
                              </p>
                            )}

                            {drillFlipped && (
                              <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-[#172033] leading-relaxed">
                                <strong className="text-emerald-800 block mb-1">Model Answer:</strong>
                                {activeDrill.answer}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => setDrillFlipped((v) => !v)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                {drillFlipped ? "Hide Answer" : "Flip Answer"}
                              </Button>
                              {!showDrillHint && !drillFlipped && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowDrillHint(true)}
                                >
                                  Show Hint
                                </Button>
                              )}
                              <Link href="/register" className="ml-auto">
                                <Button size="sm" variant="secondary">
                                  Save My Personal Deck
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Interactive Step-by-Step Workflow */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6D5DFB]">
                Interactive Workflow
              </p>
              <h2 className="text-3xl font-semibold text-[#172033] tracking-tight mt-2">
                Click through the 4-stage preparation loop
              </h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveStepIdx((prev) => (prev + 1) % HOW_IT_WORKS.length)}
            >
              Next Stage ({activeStepIdx + 1}/4)
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((item, idx) => {
              const active = activeStepIdx === idx;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStepIdx(idx)}
                  className={`text-left rounded-xl p-6 space-y-3 border transition-all ${
                    active
                      ? "bg-white border-[#6D5DFB] ring-1 ring-[#6D5DFB] shadow-elevated"
                      : "bg-white/70 border-[#E2E8F0] hover:bg-white shadow-card"
                  }`}
                >
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md tabular-nums ${
                      active ? "bg-[#6D5DFB] text-white" : "text-[#6D5DFB] bg-[#EEF2FF]"
                    }`}
                  >
                    STEP {item.step}
                  </span>
                  <h3 className="text-sm font-semibold text-[#172033]">{item.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{item.description}</p>
                </button>
              );
            })}
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-[#EEF2FF] text-[#6D5DFB] font-bold text-xs flex items-center justify-center">
                {activeStep.step}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#172033]">{activeStep.title}</p>
                <p className="text-xs text-[#64748B]">{activeStep.description}</p>
              </div>
            </div>
            <Link href={user ? activeStep.href : "/register"} className="shrink-0">
              <Button size="sm" variant="secondary">
                {user ? activeStep.cta : "Get Started"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
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
              Built for real engineering depth, never generic chat advice
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every tool produces clear, practical outputs: runnable code &amp; SQL checks, system
              architecture feedback, questions based on your GitHub projects, and live progress logs.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] shrink-0" />
                Private per-user workspace with zero preloaded fake metrics
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] shrink-0" />
                Live step-by-step coaching hints &amp; speaking speed feedback
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] shrink-0" />
                Smart flashcards automatically created from your weak interview topics
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ENGINE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-[#6D5DFB]/60 transition-colors space-y-2.5"
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

      {/* 7. Final CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-2xl bg-white border border-[#E2E8F0] p-8 sm:p-12 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl font-semibold text-[#172033] tracking-tight">
              Ready to measure and close your skill gaps?
            </h2>
            <p className="text-sm text-[#64748B]">
              Create your CareerPilot AI workspace in seconds and practice with live code, SQL,
              architecture, and voice interviews.
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

      {/* 8. Footer */}
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
