"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Compass, CheckCircle2, ArrowRight } from "lucide-react";
import { apiRequest, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest<{ reset: boolean }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
        skipAuth: true,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to reset password.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-10 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold text-[#172033]">Password updated</h1>
        <p className="text-sm text-[#64748B]">
          Your password has been updated and active sessions revoked. Redirecting to sign in...
        </p>
        <Link href="/login">
          <Button className="w-full">
            Sign In Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-[#172033]">Set new password</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Enter your reset token and choose a strong new password.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-[#EF4444]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Reset token"
          name="token"
          required
          placeholder="Paste reset token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        <Input
          label="New password"
          name="newPassword"
          type="password"
          required
          placeholder="Min 8 chars, 1 uppercase & 1 number"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Update Password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-card space-y-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="h-8 w-8 rounded-lg bg-[#6D5DFB] flex items-center justify-center">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-[#172033]">CareerPilot AI</span>
        </Link>

        <Suspense fallback={<p className="text-sm text-[#64748B]">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
