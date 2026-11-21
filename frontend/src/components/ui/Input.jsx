import React from "react";
export function Input({ label, error, hint, id, className = "", ...props }) {
    const inputId = id || props.name;
    return (<div className="space-y-1.5">
      {label && (<label htmlFor={inputId} className="block text-xs font-medium text-[#172033]">
          {label}
        </label>)}
      <input id={inputId} className={`w-full h-10 px-3 rounded-lg border bg-white text-sm text-[#172033] placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${error
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-slate-200 focus:border-[#6D5DFB] focus:ring-[#6D5DFB]/20"} ${className}`} {...props}/>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>);
}
