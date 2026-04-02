"use client";

import { motion } from "framer-motion";
import type { PracticeMode } from "@/store/typingStore";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { deriveWpmSeries } from "@/lib/typing/wpmSeries";
import { WpmChart } from "@/components/typing/WpmChart";
import SignupToast from "@/components/typing/SignupToast";
import RewardPopup from "@/components/RewardPopup";
import { useMemo } from "react";
/* -------------------- TYPES -------------------- */

type ResultStats = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  durationMs: number;
  consistency?: number;
};

type ResultScreenProps = {
  stats: ResultStats;
  practiceMode?: PracticeMode;
  paragraph: string;
  ghostReplay?: { time: number }[];
  onRetry: () => void;
  onNext: () => void;
};

/* -------------------- SCREEN -------------------- */

export default function ResultScreen({
  stats,
  practiceMode,
  paragraph,
  ghostReplay,
  onRetry,
  onNext,
}: ResultScreenProps) {
  if (!stats) return null;
  const { status } = useSession();
  const isGuest = status !== "authenticated";

  const [previous, setPrevious] = useState<number | null>(null);

  const [reward, setReward] = useState<{
    //1xp
    xp: number;
    badge: string | null;
  } | null>(null);

  /* ✅ LOAD LAST RESULT FROM LOCALSTORAGE (INSTANT) */
  useEffect(() => {
    const saved = localStorage.getItem("typing_last_result_prev");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPrevious(parsed?.wpm ?? null);
      } catch {
        setPrevious(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!stats?.wpm) return;

    setReward({
      xp: 50,
      badge: stats.wpm > 70 ? "Speed Demon" : null,
    });

    const t = setTimeout(() => setReward(null), 3000);
    return () => clearTimeout(t);
  }, [stats]); //xp2

  const speedSeries = useMemo(() => {
    return Array.isArray(ghostReplay) ? deriveWpmSeries(ghostReplay) : [];
  }, [ghostReplay]);

  const timeline = speedSeries.map((p) => ({
    t: p.second,
    wpm: p.wpm,
  }));

  const peakFromGraph = speedSeries.length
    ? Math.max(...speedSeries.map((d) => d.wpm))
    : 0;

  const peak = Math.max(peakFromGraph, stats.wpm);

  const modeLabel = (practiceMode ?? "english").toUpperCase();

  const consistency =
    stats.rawWpm > 0 ? Math.round((stats.wpm / stats.rawWpm) * 100) : 100;

  const currentWpm = stats.wpm;

  const improvement = previous !== null ? currentWpm - previous : 0;

  const percentile = Math.min(95, 50 + Math.floor(currentWpm / 2));

  const insight =
    stats.accuracy >= 96
      ? "Elite accuracy. Speed follows discipline."
      : stats.accuracy >= 92
        ? "Strong control. Maintain rhythm."
        : "Slow slightly. Accuracy compounds.";

  const accuracyColor =
    stats.accuracy >= 96
      ? "text-emerald-400"
      : stats.accuracy >= 92
        ? "text-blue-400"
        : "text-amber-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative min-h-[calc(100vh-56px)] px-4 sm:px-6 py-10 sm:py-16"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_60%)]" />

      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-8 sm:space-y-12 md:space-y-14">
        {/* TITLE */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Test Complete
          </h1>
          <p className="text-white/50">TypingON performance summary</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          <Stat
            label="WPM"
            value={stats.wpm}
            color={
              previous === null
                ? "text-emerald-400"
                : stats.wpm > previous
                  ? "text-green-400"
                  : stats.wpm < previous
                    ? "text-red-400"
                    : "text-yellow-400" // 👈 SAME SCORE = WARNING / PUSH USER
            }
          />
          <Stat label="Raw WPM" value={stats.rawWpm} color="text-emerald-300" />
          <Stat
            label="Accuracy"
            value={`${stats.accuracy}%`}
            color={accuracyColor}
          />
          <Stat label="Mistakes" value={stats.errors} color="text-red-400" />
          <Stat
            label="Time"
            value={(() => {
              const seconds = Math.floor(stats.durationMs / 1000);
              const mins = Math.floor(seconds / 60);
              const secs = seconds % 60;
              return `${mins}:${secs.toString().padStart(2, "0")}`;
            })()}
            color="text-amber-400"
          />
          <Stat label="Mode" value={modeLabel} color="text-white" small />
        </div>

        {/* 🎯 PERFORMANCE INSIGHTS */}
        {previous !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* LEFT BOX */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center transition hover:scale-[1.02]">
              <div className="text-blue-400 text-sm font-medium">
                ⚡ Faster than {percentile}% of users
              </div>

              {improvement > 0 && (
                <div className="text-green-400 text-sm mt-1">
                  🚀 +{improvement} WPM improvement
                </div>
              )}

              {improvement < 0 && (
                <div className="text-red-400 text-sm mt-1">
                  ↓ {Math.abs(improvement)} WPM drop
                </div>
              )}
            </div>

            {/* RIGHT BOX */}
            {!isGuest && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center transition hover:scale-[1.02]">
                <div className="text-sm text-white/60 mb-1">
                  Beat Your Last Score
                </div>

                <div className="text-sm">
                  <span className="text-white/60">Last:</span>{" "}
                  <span className="font-semibold">{previous} WPM</span>
                </div>

                <div className="text-sm">
                  <span className="text-white/60">This Test:</span>{" "}
                  <span className="font-semibold text-blue-400">
                    {stats.wpm} WPM
                  </span>
                </div>

                {stats.wpm > previous && (
                  <div className="text-emerald-400 mt-2 font-semibold">
                    +{stats.wpm - previous} improvement 🚀
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SPEED GRAPH */}
        {speedSeries.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 md:p-4 sm:p-6 md:p-8 space-y-4">
            <div className="text-xs uppercase tracking-widest text-white/40">
              Speed Curve
            </div>

            <div className="h-36">
              <WpmChart timeline={timeline} />
            </div>

            <div className="flex gap-6 text-sm text-white/60">
              <div>
                Average:{" "}
                <span className="text-blue-400 font-semibold">
                  {stats.wpm} WPM
                </span>
              </div>

              <div>
                Peak:{" "}
                <span className="text-emerald-400 font-semibold">
                  {peak} WPM
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col items-center gap-4">
          {isGuest && <SignupToast />}
          {reward && (
            <RewardPopup xp={reward.xp} badge={reward.badge ?? undefined} />
          )}
          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => {
                onRetry();
              }}
              className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-500/30"
            >
              🔥 Beat {Math.max(peak, stats.wpm)} WPM
            </button>

            <button
              onClick={() => {
                onNext();
              }}
              className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all"
            >
              Next Paragraph
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------- UI -------------------- */

function Stat({
  label,
  value,
  color = "text-white",
  small = false,
}: {
  label: string;
  value: string | number;
  color?: string;
  small?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 sm:p-4 md:p-5 text-center"
    >
      <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
        {label}
      </div>
      <div
        className={`font-black ${
          small ? "text-xl sm:text-2xl md:text-3xl" : "text-2xl sm:text-3xl md:text-4xl"
        } ${color}`}
      >
        {value}
      </div>
    </motion.div>
  );
}
