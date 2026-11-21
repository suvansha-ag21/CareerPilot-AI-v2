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
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!isLoading && user) {
            router.replace("/dashboard");
        }
    }, [isLoading, user, router]);
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login({ email, password });
            router.replace("/dashboard");
        }
        catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            }
            else {
                setError("Unable to reach authentication server.");
            }
        }
        finally {
            setSubmitting(false);
        }
    }
    return (<div className="min-h-screen grid lg:grid-cols-2 bg-[#F8FAFC]">
      <div className="hidden lg:flex flex-col justify-between bg-[#111827] text-white p-12 border-r border-slate-800">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="h-9 w-9 rounded-lg bg-[#6D5DFB] flex items-center justify-center">
            <Compass className="h-5 w-5 text-white"/>
          </div>
          <span className="text-lg font-semibold tracking-tight">CareerPilot AI</span>
        </Link>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-[#8B7CFF]">
            <Sparkles className="h-3.5 w-3.5"/>
            Career &amp; Interview Intelligence
          </div>
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Prepare with measurable signal, not guesswork.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Sign in to access your resume audits, semantic job description matches, mock voice/text
            interviews, and personalized skill roadmaps.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#16A34A]"/>
          <span>Encrypted Sessions &bull; Private Workspace Isolation</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6 bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-card">
          <div>
            <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-6 w-fit">
              <div className="h-8 w-8 rounded-lg bg-[#6D5DFB] flex items-center justify-center">
                <Compass className="h-4 w-4 text-white"/>
              </div>
              <span className="font-semibold text-[#172033]">CareerPilot AI</span>
            </Link>
            <h1 className="text-2xl font-semibold text-[#172033] tracking-tight">Sign in</h1>
            <p className="text-sm text-[#64748B] mt-1">
              Continue to your CareerPilot AI workspace.
            </p>
          </div>

          {error && (<div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-[#EF4444]">
              {error}
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email address" name="email" type="email" required placeholder="student@university.edu" value={email} onChange={(e) => setEmail(e.target.value)}/>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-[#172033]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium text-[#6D5DFB] hover:text-[#5B4BE8]">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/>
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full mt-2">
              Sign In
              <ArrowRight className="h-4 w-4"/>
            </Button>
          </form>

          <p className="text-center text-xs text-[#64748B] pt-3 border-t border-slate-100">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-[#6D5DFB] hover:text-[#5B4BE8]">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>);
}
