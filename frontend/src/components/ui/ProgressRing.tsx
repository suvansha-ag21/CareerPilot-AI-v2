import React from "react";

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  color = "#6D5DFB",
  trackColor = "#E2E8F0",
  label,
  sublabel,
}: {
  value: number | null;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}) {
  const safeVal = value === null ? 0 : Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeVal / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={value === null ? "#CBD5E1" : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold text-[#172033] tabular-nums leading-none">
          {value !== null ? `${Math.round(safeVal)}%` : "—"}
        </span>
        {label && (
          <span className="text-[10px] font-medium text-[#64748B] mt-1 leading-none">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[9px] text-slate-400 mt-0.5 leading-none">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
