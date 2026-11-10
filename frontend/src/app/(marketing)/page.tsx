"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Compass,
  Cpu,
  Database,
  FileSearch,
  GitCompare,
  Layers,
  Map,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    icon: FileSearch,
    title: "AI Resume Analyzer",
    description:
      "Parse PDF and DOCX layouts with PyMuPDF & spaCy to evaluate structure, extract skills, detect missing keywords, and rewrite weak bullets.",
  },
  {
    icon: GitCompare,
    title: "Semantic JD Matcher",
    description:
      "Compare your resume against target job descriptions using dense Sentence Transformer embeddings and Scikit-learn hybrid scoring.",
  },
  {
    icon: Sparkles,
    title: "Skill Gap Intelligence",
    description:
      "Benchmark your relational skill profile against target role requirements with prioritized beginner, intermediate, and advanced paths.",
  },
  {
    icon: Mic,
    title: "Mock & Voice Interviews",
    description:
      "Practice DSA, Java, Python, SQL, Full Stack, HR, and Project interviews using text or voice with Whisper STT and structured rubric scoring.",
  },
  {
    icon: Map,
    title: "Personalized Roadmap",
    description:
      "Turn identified skill gaps into week-by-week and day-by-day execution plans with curated resources and completion tracking.",
  },
  {
    icon: Briefcase,
    title: "Application & Analytics Hub",
    description:
      "Track applications across pipeline stages while monitoring selection rates, interview score trends, and readiness velocity.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Build Your Profile & Upload Resume",
    description: "Add education, projects, and upload your PDF or DOCX resume for structural NLP parsing.",
  },
  {
    step: "02",
    title: "Benchmark Against Target Roles",
    description: "Paste any job description to inspect semantic compatibility and exact skill gaps.",
  },
  {
    step: "03",
    title: "Practice Adaptive Voice & Text Interviews",
    description: "Answer RAG-grounded technical and HR questions with real-time follow-ups and rubric scores.",
  },
  {
    step: "04",
    title: "Execute Roadmap & Track Offers",
    description: "Follow weekly upskilling tasks and manage every job application in one unified analytics view.",
  },
];

const AI_PILLARS = [
  {
    icon: Layers,
    title: "NLP Layout & Entity Extraction",
    detail: "PyMuPDF, pdfplumber, python-docx, and spaCy structured sectioning.",
  },
  {
    icon: Database,
    title: "ChromaDB Vector RAG",
    detail: "Grounded 9-topic CS knowledge base covering DSA, DBMS, OS, CN, OOP & Full Stack.",
  },
  {
    icon: Cpu,
    title: "Deterministic ML + LLM Fusion",
    detail: "Scikit-learn cosine & TF-IDF calibration paired with strict Pydantic JSON outputs.",
  },
  {
    icon: BarChart3,
    title: "Transparent Rubric Scoring",
    detail: "Evaluates correctness, depth, completeness, and clarity without arbitrary numbers.",
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
            <a href="#ai-engine" className="hover:text-[#172033] transition-colors">
              AI Architecture
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
      <section className="pt-16 pb-14 sm:pt-24 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
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
            Analyze your resume, discover skill gaps, practice interviews and build a smarter path
            to your dream job.
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

        {/* 3. Product Dashboard Preview Frame */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-6xl mx-auto mt-14"
        >
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-elevated overflow-hidden">
            {/* Window Top Chrome */}
            <div className="h-10 bg-slate-50 border-b border-[#E2E8F0] px-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </div>
              <span className="text-[11px] font-medium text-[#64748B]">
                Product Preview — CareerPilot AI Workspace
              </span>
              <span className="text-[11px] font-medium text-[#6D5DFB]">Live Architecture</span>
            </div>

            {/* Simulated Split Workspace Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[340px]">
              {/* Dark Sidebar Mini Preview (#111827) */}
              <div className="hidden md:flex md:col-span-3 bg-[#111827] text-slate-300 p-5 flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <div className="h-6 w-6 rounded bg-[#6D5DFB] flex items-center justify-center">
                      <Compass className="h-3.5 w-3.5 text-white" />
                    </div>
                    CareerPilot AI
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="px-3 py-2 rounded-md bg-[#6D5DFB]/20 text-white border border-[#6D5DFB]/40">
                      Overview
                    </div>
                    <div className="px-3 py-1.5 text-slate-400">Resume AI</div>
                    <div className="px-3 py-1.5 text-slate-400">Job Matcher</div>
                    <div className="px-3 py-1.5 text-slate-400">Skill Gap Analyzer</div>
                    <div className="px-3 py-1.5 text-slate-400">Mock Interview</div>
                    <div className="px-3 py-1.5 text-slate-400">Learning Roadmap</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                  PostgreSQL + FastAPI + ChromaDB
                </div>
              </div>

              {/* Light Workspace Preview (#F8FAFC) */}
              <div className="md:col-span-9 bg-[#F8FAFC] p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-[#6D5DFB]">ILLUSTRATIVE PREVIEW</p>
                    <h3 className="text-base font-semibold text-[#172033]">
                      Placement Readiness &amp; Match Intelligence
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] text-xs font-medium text-[#172033]">
                    Target: Full Stack Developer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                    <p className="text-xs text-[#64748B]">Semantic JD Compatibility</p>
                    <p className="text-xl font-semibold text-[#172033] mt-1 tabular-nums">
                      Hybrid ML Pipeline
                    </p>
                    <p className="text-[11px] text-[#16A34A] mt-1 font-medium">
                      Embeddings + TF-IDF + Skill Graph
                    </p>
                  </div>
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                    <p className="text-xs text-[#64748B]">Interview Evaluation</p>
                    <p className="text-xl font-semibold text-[#172033] mt-1">5-Criterion Rubric</p>
                    <p className="text-[11px] text-[#6D5DFB] mt-1 font-medium">
                      Text &amp; Whisper Voice Modes
                    </p>
                  </div>
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                    <p className="text-xs text-[#64748B]">Roadmap Sync</p>
                    <p className="text-xl font-semibold text-[#172033] mt-1">Weekly Task Plans</p>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      Generated from open Skill Gaps
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#172033]">
                      Real User Data Guarantee
                    </p>
                    <p className="text-xs text-[#64748B]">
                      New accounts begin with a clean zero baseline—scores populate strictly from
                      your real resumes, matches, and completed interviews.
                    </p>
                  </div>
                  <Link href={user ? "/dashboard" : "/register"} className="shrink-0">
                    <Button size="sm" variant="secondary">
                      Create Workspace
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
              Every module shares normalized PostgreSQL context—what you learn in a resume audit or
              interview immediately informs your skill gaps and learning roadmap.
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

      {/* 6. AI Capabilities */}
      <section id="ai-engine" className="py-20 bg-[#111827] text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8B7CFF]">
              <ShieldCheck className="h-4 w-4" />
              Production AI Engineering
            </span>
            <h2 className="text-3xl font-semibold tracking-tight leading-tight">
              Built with Python, FastAPI, ChromaDB, and Scikit-learn
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instead of wrapping a single chat prompt, CareerPilot AI routes heavy NLP, vector
              similarity, and evaluation pipelines through a dedicated Python microservice with
              verified structured schemas.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] shrink-0" />
                User-scoped vector filtering prevents cross-account leakage
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] shrink-0" />
                Explicit microphone indicators and transparent score methodology
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] shrink-0" />
                Modular LLM factory supporting Gemini and OpenAI models
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AI_PILLARS.map((pillar) => {
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
              Create your CareerPilot AI workspace in seconds and start preparing with structured AI
              intelligence.
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
          <p>Full Stack + AI Engineering Platform • Next.js, Express, FastAPI, PostgreSQL, ChromaDB</p>
        </div>
      </footer>
    </div>
  );
}
