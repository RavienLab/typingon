"use client";

export function StreakBadge({ streak }: { streak: number }) {
  if (!streak || streak < 1) return null;

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full 
                    bg-gradient-to-r from-orange-500/20 to-red-500/20 
                    border border-orange-500/40 
                    shadow-[0_0_20px_rgba(249,115,22,0.3)]
                    text-orange-300 text-sm font-mono tracking-wide">
      <span className="text-lg">🔥</span>
      <span>{streak} day streak</span>
    </div>
  );
}
