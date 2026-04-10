"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Lock, Zap, Flame, BarChart3 } from "lucide-react";
import AvatarUploader from "@/components/profile/AvatarUploader";
import { motion } from "framer-motion";
import StreakHeatmap from "@/components/StreakHeatmap";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProLock from "@/components/ProLock";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [lastWpm, setLastWpm] = useState<number | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const saved =
      localStorage.getItem("typing_last_result") ||
      localStorage.getItem("typing_last_result_prev");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLastWpm(parsed?.stats?.wpm ?? null);
      } catch {
        setLastWpm(null);
      }
    }
  }, []);

  const isGuest = status !== "authenticated";
  const queriesEnabled = !isGuest;

  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile-full-data"],
    queryFn: () => fetch("/api/v1/user/profile-data").then((r) => r.json()),
    enabled: queriesEnabled,
  });

  const me = profileData?.me;
  const stats = Array.isArray(profileData?.stats) ? profileData.stats : [];
  const streak = profileData?.streak || 0;
  const recent = Array.isArray(profileData?.recent) ? profileData.recent : [];
  const xpData = profileData?.xpData;
  const achievements = Array.isArray(profileData?.achievements)
    ? profileData.achievements
    : [];
  const fingers = profileData?.fingers || {};

  async function handleUpgrade() {
    try {
      setUpgrading(true);
      const res = await fetch("/api/v1/user/upgrade", { method: "POST" });

      if (!res.ok) throw new Error();

      const data = await res.json();

      // 🔥 THIS REFRESHES THE JWT COOKIE WITHOUT LOGOUT
      await update({
        ...session,
        user: {
          ...session?.user,
          isPro: data.isPro,
        },
      });

      // Refresh the UI data
      queryClient.invalidateQueries({ queryKey: ["profile-full-data"] });

      setUpgrading(false);
    } catch (err) {
      setUpgrading(false);
      alert("Upgrade failed. Please try again.");
    }
  }

  if (status === "loading" || (queriesEnabled && loadingProfile)) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="opacity-40 text-xs font-bold uppercase tracking-widest animate-pulse">
          Syncing profile...
        </p>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-6 text-white">
        <div className="text-xl font-bold">Hey Newbie 👋</div>
        <button
          onClick={() => router.push("/signin")}
          className="px-8 py-3 bg-blue-600 rounded-xl font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (!me) return null;

  /* ===== CALCULATIONS ===== */
  const testsCount = stats.length;
  const avgWpm =
    testsCount > 0
      ? Math.round(
          stats.reduce((sum: number, r: any) => sum + (r.wpm || 0), 0) /
            testsCount,
        )
      : 0;
  const bestWpm =
    testsCount > 0 ? Math.max(...stats.map((r: any) => r.wpm || 0)) : 0;

  const FINGER_LABELS: Record<string, string> = {
    LI: "Left Index",
    LM: "Left Middle",
    LR: "Left Ring",
    LP: "Left Pinky",
    RI: "Right Index",
    RM: "Right Middle",
    RR: "Right Ring",
    RP: "Right Pinky",
    THUMB: "Thumb",
  };

  const fingerEntries = Object.entries(fingers) as [string, number][];

  // 🔥 FIX 1: Explicit numeric sort
  const weakestFinger =
    fingerEntries.length > 0
      ? [...fingerEntries].sort((a, b) => Number(a) - Number(b))
      : null;

  // 🔥 FIX 2: Store the ID in a simple string for the UI comparison
  const weakestFingerId = weakestFinger ? weakestFinger : "";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 text-white">
      {/* HEADER */}
      <div
        className={`bg-slate-900/70 border border-slate-800 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 ${me?.isPro ? "shadow-[0_0_30px_rgba(255,180,0,0.1)]" : ""}`}
      >
        <AvatarUploader image={me?.image} name={me?.name} />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            {me?.name ?? "User"}{" "}
            <span className="text-sm text-blue-400 ml-2">
              Lvl {xpData?.level ?? 1}
            </span>
          </h2>
          <div className="mt-4 h-1.5 w-48 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${((xpData?.xp ?? 0) % 1000) / 10}%` }}
            />
          </div>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={me?.isPro || upgrading}
          className="px-6 py-3 bg-amber-400 text-black rounded-xl font-bold"
        >
          <Zap size={18} fill="currentColor" className="inline mr-2" />
          {me?.isPro ? "PRO Active" : "Unlock PRO"}
        </button>
      </div>

      {/* CORE STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatBox
          icon={<BarChart3 size={18} />}
          label="Tests"
          value={testsCount}
        />
        <StatBox icon={<Activity size={18} />} label="Avg WPM" value={avgWpm} />
        <StatBox icon={<Zap size={18} />} label="Best WPM" value={bestWpm} />
        <StatBox
          icon={<Flame size={18} />}
          label="Streak"
          value={streak}
          color="text-orange-400"
        />
      </div>

      {/* FINGER ACCURACY */}
      <ProLock isPro={!!me?.isPro}>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-6">
            Finger Accuracy
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {fingerEntries.map(([fingerId, acc]) => {
              // 🔥 FIX 3: Pre-calculate the class to avoid template literal issues
              const isThisWeakest = fingerId === weakestFingerId;
              const borderClass = isThisWeakest
                ? "border-red-500/30 bg-red-500/5"
                : "border-white/5";

              return (
                <div
                  key={fingerId}
                  className={`bg-white/5 rounded-xl p-4 text-center border ${borderClass}`}
                >
                  <div className="text-[10px] text-white/40 font-bold mb-1 uppercase">
                    {FINGER_LABELS[fingerId] ?? fingerId}
                  </div>
                  <div className="text-xl font-black">{Number(acc)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </ProLock>

      {/* RECENT ACTIVITY */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-6">
          Recent Activity
        </h3>
        <div className="space-y-2">
          {recent.slice(0, 5).map((r: any, i: number) => {
            // 🔥 NEW: Dynamic Mode Label Logic
            const getModeLabel = (type: string, mode: string) => {
              if (type === "words" || mode === "english") return "ENGLISH";
              if (type === "numbers" || mode === "numbers") return "NUMBERS";
              if (type === "code" || mode === "code") return "CODE";
              if (mode === "hindi") return "HINDI";
              if (mode === "marathi") return "MARATHI";
              return (mode || type || "TEST").toUpperCase();
            };

            const label = getModeLabel(r.textType, r.practiceMode);

            return (
              <div
                key={i}
                className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl border border-white/5"
              >
                {/* 🔥 Changed from static "TEST" to dynamic label */}
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                  {label}
                </span>

                <span className="font-bold text-sm text-slate-200">
                  {Math.round(r.wpm)} WPM
                </span>

                <span
                  className={`text-xs font-bold ${r.accuracy >= 95 ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {Math.round(r.accuracy)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color = "text-white",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-center">
      <div className="flex justify-center mb-3 text-blue-400/50">{icon}</div>
      <div className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-1">
        {label}
      </div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
    </div>
  );
}
