"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CareerPilot Client Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-card text-center space-y-5">
        <div className="h-12 w-12 rounded-xl bg-rose-50 text-[#EF4444] flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-[#172033] tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            An unexpected display error occurred. Your saved workspace data remains safe.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" onClick={() => reset()}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
