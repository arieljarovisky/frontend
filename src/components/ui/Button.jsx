import { twMerge } from "tailwind-merge";

export default function Button({ className, children, variant = "primary", ...props }) {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105",
    secondary: "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 focus:ring-slate-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg shadow-red-500/25",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800/50 focus:ring-slate-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-lg shadow-emerald-500/25",
  };

  return (
    <button
      {...props}
      className={twMerge(
        baseStyles,
        variants[variant] || variants.primary,
        className
      )}
    >
      {children}
    </button>
  );
}


