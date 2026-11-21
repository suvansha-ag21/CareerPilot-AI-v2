"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, ArrowRight, CheckCircle2 } from "lucide-react";
import { CAREER_ROLE_PRESETS } from "@careerpilot/shared";
import { useAuth } from "@/store/auth-context";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
export default function RegisterPage() {
    const { user, register, isLoading } = useAuth();
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [targetRole, setTargetRole] = useState(CAREER_ROLE_PRESETS[0]);
    const [yearsExperience, setYearsExperience] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!isLoading && user) {
            const done = user.careerPreferences?.onboardingCompleted === true;
            router.replace(done ? "/dashboard" : "/onboarding");
        }
    }, [isLoading, user, router]);
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await register({
                name,
                email,
                password,
                targetRole,
                yearsExperience: Number(yearsExperience) || 0,
            });
            router.replace("/onboarding");
        }
        catch (err) {
            if (err instanceof ApiClientError) {
                if (err.details && typeof err.details === "object") {
                    const firstFieldErr = Object.values(err.details)
                        .flat()
                        .find(Boolean);
                    setError(firstFieldErr || err.message);
                }
                else {
                    setError(err.message);
                }
            }
            else {
                setError("Unable to register account right now.");
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
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Start with a clean workspace personalized to your target role.
          </h2>
          <ul className="space-y-4 text-sm text-slate-300">
            {[
            "Organize education, experience, projects & verified skills",
            "Analyze PDF & DOCX resumes with clear ATS & bullet rewrites",
            "Measure role fit against real job descriptions in seconds",
            "Practice adaptive text & voice mock interviews",
        ].map((item) => (<li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#8B7CFF] mt-0.5 shrink-0"/>
                <span>{item}</span>
              </li>))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          Your data is strictly isolated to your authenticated user account.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6 bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-card">
          <div>
            <h1 className="text-2xl font-semibold text-[#172033] tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Set your target role and experience level to get started.
            </p>
          </div>

          {error && (<div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-[#EF4444]">
              {error}
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" name="name" required placeholder="Alex Rivera" value={name} onChange={(e) => setName(e.target.value)}/>

            <Input label="Email address" name="email" type="email" required placeholder="alex.rivera@example.com" value={email} onChange={(e) => setEmail(e.target.value)}/>

            <Input label="Password" name="password" type="password" required placeholder="Min 8 chars, 1 uppercase & 1 number" hint="Include at least 8 characters, one uppercase letter, and one digit." value={password} onChange={(e) => setPassword(e.target.value)}/>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="targetRole" className="block text-xs font-medium text-[#172033]">
                  Target Job Role
                </label>
                <select id="targetRole" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]">
                  {CAREER_ROLE_PRESETS.map((preset) => (<option key={preset} value={preset}>
                      {preset}
                    </option>))}
                </select>
              </div>

              <Input label="Experience (Yrs)" name="yearsExperience" type="number" min={0} max={40} value={yearsExperience} onChange={(e) => setYearsExperience(Number(e.target.value))}/>
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full mt-2">
              Create Workspace
              <ArrowRight className="h-4 w-4"/>
            </Button>
          </form>

          <p className="text-center text-xs text-[#64748B] pt-2 border-t border-slate-100">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#6D5DFB] hover:text-[#5B4BE8]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>);
}
