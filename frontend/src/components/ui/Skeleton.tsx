import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-slate-200/70 via-slate-100 to-slate-200/70 bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}
