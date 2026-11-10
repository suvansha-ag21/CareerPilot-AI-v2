"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Unable to reach authentication server. Please verify backend connectivity.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F8FAFC]">
      {/* Left Dark Showcase Panel (#111827) */}
      <div className="hidden lg:flex flex-col justify-between bg-[#111827] text-white p-12 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#6D5DFB] flex items-center justify-center">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">CareerPilot AI</span>
        </div>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-[#8B7CFF]">
            <Sparkles className="h-3.5 w-3.5" />
            Career & Interview Intelligence
          </div>
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Prepare with signal, not guesswork.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Combine hybrid ML job-description matching, ATS layout audits, adaptive text &amp; voice
            mock interviews, and gap-driven learning roadmaps in one unified SaaS workspace.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <p className="text-xs font-medium text-slate-400">Vector + ML Scoring</p>
              <p className="text-sm font-semibold text-white mt-1">ChromaDB &amp; Scikit-learn</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <p className="text-xs font-medium text-slate-400">Session Security</p>
              <p className="text-sm font-semibold text-white mt-1">Rotated HttpOnly JWT</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>PostgreSQL + FastAPI Isolated Architecture</span>
        </div>
      </div>

      {/* Right Sign-in Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white border border-slate-200/90 rounded-2xl p-8 shadow-card">
          <div>
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="h-8 w-8 rounded-lg bg-[#6D5DFB] flex items-center justify-center">
                <Compass className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-[#172033]">CareerPilot AI</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#172033] tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to access your CareerPilot AI workspace.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="alex.rivera@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" size="lg" loading={submitting} className="w-full mt-2">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            New to CareerPilot AI?{" "}
            <Link href="/register" className="font-semibold text-[#6D5DFB] hover:text-[#5B4BE8]">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
