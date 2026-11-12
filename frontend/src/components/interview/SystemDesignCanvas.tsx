"use client";

import React from "react";
import { ArrowRight, Layers, Plus, X } from "lucide-react";

const ARCH_BLOCKS = [
  "Client / CDN",
  "Load Balancer",
  "API Gateway",
  "Auth Service",
  "App Servers",
  "Redis Cache",
  "Message Queue",
  "PostgreSQL Primary",
  "Read Replicas",
  "Vector Database",
  "Object Storage",
  "Rate Limiter",
];

export function SystemDesignCanvas({
  nodes,
  notes,
  onChange,
}: {
  nodes: string[];
  notes: string;
  onChange: (next: { nodes: string[]; notes: string }) => void;
}) {
  function toggleBlock(block: string) {
    if (nodes.includes(block)) {
      onChange({ nodes: nodes.filter((n) => n !== block), notes });
    } else {
      onChange({ nodes: [...nodes, block], notes });
    }
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#6D5DFB]" />
            <span className="text-xs font-semibold text-[#172033]">
              System Design Architecture Canvas
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Click any component below to add or remove it from your request flow.
          </p>
        </div>
        <span className="text-[11px] text-[#64748B]">
          {nodes.length} component(s) selected
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ARCH_BLOCKS.map((block) => {
          const active = nodes.includes(block);
          return (
            <button
              key={block}
              type="button"
              onClick={() => toggleBlock(block)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                active
                  ? "bg-[#6D5DFB] text-white border-[#6D5DFB]"
                  : "bg-white text-[#172033] border-slate-200 hover:border-[#6D5DFB]/40"
              }`}
            >
              {active ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {block}
            </button>
          );
        })}
      </div>

      {/* Live Topology Flow Strip */}
      <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] min-h-[68px] flex flex-wrap items-center gap-2">
        {nodes.length > 0 ? (
          nodes.map((node, idx) => (
            <React.Fragment key={node}>
              <div className="px-3 py-1.5 rounded-lg bg-[#EEF2FF] border border-[#6D5DFB]/30 text-xs font-semibold text-[#172033]">
                {idx + 1}. {node}
              </div>
              {idx < nodes.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-[#6D5DFB] shrink-0" />
              )}
            </React.Fragment>
          ))
        ) : (
          <p className="text-xs text-[#64748B]">
            Click building blocks above in request-flow order to construct your architecture topology.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-[#172033]">
          Scaling, Caching &amp; Bottleneck Notes
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => onChange({ nodes, notes: e.target.value })}
          placeholder="Explain partition keys, cache TTL/invalidation, read/write split, failover, and latency targets..."
          className="w-full p-3 rounded-lg border border-slate-200 bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
        />
      </div>
    </div>
  );
}
