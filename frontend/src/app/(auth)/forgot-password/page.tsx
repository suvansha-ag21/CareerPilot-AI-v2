"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, ArrowLeft, MailCheck } from "lucide-react";
import { apiRequest, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ sent: boolean; message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
      setSubmittedMsg(res.message);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Unable to process reset request right now.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-card space-y-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="h-8 w-8 rounded-lg bg-[#6D5DFB] flex items-center justify-center">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-[#172033]">CareerPilot AI</span>
        </Link>

        {submittedMsg ? (
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <MailCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold text-[#172033]">Check your reset instructions</h1>
            <p className="text-sm text-[#64748B] leading-relaxed">{submittedMsg}</p>
            <p className="text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              Development note: When no external SMTP server is configured, the expiring reset link
              is logged directly in the Express backend server console.
            </p>
            <Link href="/login" className="block pt-2">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Return to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold text-[#172033]">Reset your password</h1>
              <p className="text-sm text-[#64748B] mt-1">
                Enter your registered email address to generate a time-limited password reset link.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-[#EF4444]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                name="email"
                type="email"
                required
                placeholder="alex.rivera@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button type="submit" size="lg" loading={submitting} className="w-full">
                Send Reset Instructions
              </Button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#172033]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
