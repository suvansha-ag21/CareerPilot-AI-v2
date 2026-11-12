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
  Map,
  Mic,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      {/* 1. Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-[#6D5DFB] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-[#172033]">
              CareerPilot AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#64748B]">
            <a href="#playground" className="hover:text-[#172033] transition-colors">
              Interactive Tools
            </a>
            <a href="#features" className="hover:text-[#172033] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#172033] transition-colors">
              How It Works
            </a>
            <a href="#why-careerpilot" className="hover:text-[#172033] transition-colors">
              Why CareerPilot
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
      <section className="relative pt-14 pb-16 sm:pt-20 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-hero-glow">
        <div className="absolute inset-0 bg-grid-slate opacity-60 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="relative max-w-4xl mx-auto text-center space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#6D5DFB]/20 text-xs font-medium text-[#6D5DFB]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Career &amp; Interview Intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-[#172033] leading-[1.12]"
          >
            Interview &amp; Career Prep Built for{" "}
            <span className="inline-block min-w-[260px] text-[#6D5DFB]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={HERO_ROLES[heroRoleIdx]}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="inline-block"
                >
                  {HERO_ROLES[heroRoleIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed"
          >
            Explore target tech roles, run live Code &amp; SQL, sketch system diagrams, and practice
            interview flashcards right below—no setup required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1"
          >
            <Link href={user ? "/dashboard" : "/register"}>
              <Button size="lg" className="w-full sm:w-auto px-7">
                {user ? "Go to Workspace" : "Launch Free Workspace"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#playground" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-7">
                Explore Live Tools
              </Button>
            </a>
          </motion.div>
        </div>

        {/* 3. Interactive Hands-On Sandbox (Zero Fake Numbers) */}
        <motion.div
          id="playground"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative max-w-6xl mx-auto mt-12"
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
                CareerPilot AI — Interactive Engineering Lab
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
      </section>

      {/* 4. Interactive Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-[#E2E8F0] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6D5DFB]">
              Platform Capabilities
            </p>
            <h2 className="text-3xl font-semibold text-[#172033] tracking-tight mt-2">
              Click any tool to see how it helps you prepare
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              const active = activeFeatureIdx === idx;
              return (
                <button
                  key={feat.title}
                  type="button"
                  onClick={() => setActiveFeatureIdx(idx)}
                  className={`text-left p-6 rounded-xl border transition-all duration-150 hover:-translate-y-0.5 ${
                    active
                      ? "bg-[#EEF2FF]/60 border-[#6D5DFB] shadow-card ring-1 ring-[#6D5DFB]"
                      : "border-[#E2E8F0] bg-[#F8FAFC]/50 hover:bg-white hover:shadow-card"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                      active ? "bg-[#6D5DFB] text-white" : "bg-[#EEF2FF] text-[#6D5DFB]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[#172033]">{feat.title}</h3>
                  <p className="text-sm text-[#64748B] mt-2 leading-relaxed">{feat.description}</p>
                </button>
              );
            })}
          </div>

          <div className="p-5 rounded-xl bg-[#111827] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8B7CFF]">
                Selected Pipeline • {activeFeature.title}
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
