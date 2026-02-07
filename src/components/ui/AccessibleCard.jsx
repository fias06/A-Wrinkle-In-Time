import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function AccessibleCard({
  children,
  onClick,
  selected,
  className,
  ariaLabel,
  tabIndex = 0
}) {
  return (
    <motion.div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? tabIndex : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={ariaLabel}
      aria-pressed={selected}
      className={cn(
        "p-6 rounded-3xl transition-all cursor-pointer",
        "border-4",
        "focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-4",
        selected 
          ? "bg-amber-50 border-amber-500 shadow-xl shadow-amber-200/50" 
          : "bg-white border-slate-200 hover:border-amber-400 hover:shadow-lg",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}