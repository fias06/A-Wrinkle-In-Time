import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function LargeButton({
  children,
  onClick,
  variant = "primary",
  icon: Icon,
  disabled,
  className,
  ariaLabel
}) {
  const variants = {
    primary: "bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30",
    secondary: "bg-gradient-to-br from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 shadow-lg shadow-slate-500/30",
    success: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30",
    danger: "bg-gradient-to-br from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/30",
    outline: "bg-white border-4 border-slate-300 text-slate-700 hover:border-amber-400 hover:bg-amber-50"
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "flex items-center justify-center gap-4 px-8 py-5 rounded-2xl",
        "text-xl md:text-2xl font-semibold",
        "transition-all",
        "focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-4",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {Icon && <Icon className="w-7 h-7" />}
      {children}
    </motion.button>
  );
}