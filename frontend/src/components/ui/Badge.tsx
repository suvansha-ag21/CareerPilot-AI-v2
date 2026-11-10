import React from "react";

type BadgeTone = "brand" | "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-[#EEF2FF] text-[#6D5DFB] border-[#6D5DFB]/20",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
