import React from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#6D5DFB] text-white hover:bg-[#5B4BE8] active:bg-[#4F3FE0] shadow-sm border border-transparent",
  secondary:
    "bg-[#EEF2FF] text-[#6D5DFB] hover:bg-[#E0E7FF] border border-[#C7D2FE]/60",
  outline:
    "bg-white text-[#172033] hover:bg-slate-50 border border-slate-200 shadow-sm",
  ghost: "bg-transparent text-slate-600 hover:text-[#172033] hover:bg-slate-100 border border-transparent",
  danger: "bg-rose-600 text-white hover:bg-rose-700 border border-transparent shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-5 text-sm rounded-lg gap-2",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5DFB]/40 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
