import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from "@/lib/utils";

const INTEREST_ICONS = {
  'Gardening': '🌻',
  'Chess': '♟️',
  'History': '📚',
  'Music': '🎵',
  'Cooking': '👨‍🍳',
  'Travel': '✈️',
  'Photography': '📷',
  'Reading': '📖',
  'Art': '🎨',
  'Nature': '🌳',
  'Movies': '🎬',
  'Knitting': '🧶',
  'Puzzles': '🧩',
  'Walking': '🚶',
  'Birdwatching': '🐦',
  'Fishing': '🎣',
  'Cards': '🃏',
  'Dancing': '💃',
  'Crafts': '✂️',
  'Pets': '🐕'
};

export default function InterestTag({
  interest,
  selected,
  onClick,
  size = "normal"
}) {
  const icon = INTEREST_ICONS[interest] || '⭐';
  
  const sizeClasses = {
    small: "px-4 py-2 text-lg",
    normal: "px-6 py-4 text-xl",
    large: "px-8 py-5 text-2xl"
  };

  return (
    <motion.button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${interest}, ${selected ? 'selected' : 'not selected'}`}
      className={cn(
        "relative rounded-2xl font-semibold transition-all",
        "border-3 flex items-center gap-3",
        "focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-2",
        sizeClasses[size],
        selected
          ? "bg-amber-100 border-amber-500 text-amber-800"
          : "bg-white border-slate-200 text-slate-700 hover:border-amber-400"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-2xl">{icon}</span>
      <span>{interest}</span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-2 bg-amber-500 rounded-full p-1"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

export { INTEREST_ICONS };