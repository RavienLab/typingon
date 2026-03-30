"use client";

import Link from "next/link";
import { useDailyChallenge } from "@/hooks/useDailyChallenge";

export function DailyChallengeCard() {
  const { data, isLoading } = useDailyChallenge();

  if (isLoading) {
    return <div className="p-6 bg-white/5 rounded-xl animate-pulse h-32" />;
  }

  if (!data) return null;

  return (
    <div className="relative p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl border border-white/10">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500" />

      {/* 🔒 Pro lock badge */}
      {!data.completed && !data.unlocked && (
        <div
          className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full
          bg-black/60 border border-white/20 text-white/70"
        >
          🔒 Pro
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">Daily Challenge</div>
        {data.completed && (
          <div className="text-green-400 text-sm">Completed ✓</div>
        )}
      </div>

      <div className="text-white/70 text-sm mb-4">
        Train your weakest keys today.
      </div>

      {!data.completed && (
        <Link
          href={data.unlocked ? `/test?mode=daily&seed=${data.seed}` : "#"}
          className={`inline-block px-4 py-2 rounded transition
            ${
              data.unlocked
                ? "bg-purple-600 hover:bg-purple-500"
                : "bg-gray-700 cursor-not-allowed opacity-60"
            }`}
        >
          Start Challenge
        </Link>
      )}
    </div>
  );
}
