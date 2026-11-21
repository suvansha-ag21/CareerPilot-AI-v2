import React from "react";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
export default function NotFoundPage() {
    return (<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-card text-center space-y-5">
        <div className="h-12 w-12 rounded-xl bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center mx-auto">
          <Compass className="h-6 w-6"/>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6D5DFB]">404</p>
          <h1 className="text-xl font-semibold text-[#172033] tracking-tight">Page not found</h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            The requested CareerPilot AI route could not be found or has moved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="primary">
              <ArrowLeft className="h-4 w-4"/>
              Go to Workspace
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </div>
    </div>);
}
