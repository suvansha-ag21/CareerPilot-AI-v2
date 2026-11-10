import React from "react";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function UpcomingModuleCard({
  phase,
  moduleName,
  description,
  capabilities,
}: {
  phase: string;
  moduleName: string;
  description: string;
  capabilities: string[];
}) {
  return (
    <Card className="max-w-2xl mx-auto mt-6">
      <CardContent className="p-8 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Badge tone="brand">
            <Layers className="h-3.5 w-3.5" />
            Scheduled for {phase}
          </Badge>
          <span className="text-xs font-medium text-[#64748B]">CareerPilot AI Roadmap</span>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#172033] tracking-tight">{moduleName}</h2>
          <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">{description}</p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2.5">
            Module Capabilities
          </p>
          <ul className="space-y-2">
            {capabilities.map((cap) => (
              <li key={cap} className="text-sm text-[#172033] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6D5DFB] shrink-0" />
                {cap}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back to Overview
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="secondary">Complete Candidate Profile</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
