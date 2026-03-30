"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Lock, Zap, Flame, BarChart3 } from "lucide-react";
import AvatarUploader from "@/components/profile/AvatarUploader";
import { motion } from "framer-motion";
import StreakHeatmap from "@/components/StreakHeatmap";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProLock from "@/components/ProLock";
import { useQueryClient } from "@tanstack/react-query";

/* ---------------- PAGE ---------------- */

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

  async function handleUpgrade() {
    try {
      setUpgrading(true);

      const res = await fetch("/api/v1/user/upgrade", {
        method: "POST",
      });

      if (!res.ok) throw new Error();

      await Promise.all([
        update(),
        queryClient.invalidateQueries({ queryKey: ["me"] }),
      ]);

      setUpgrading(false);
    } catch {
      setUpgrading(false);
      alert("Something went wrong");
    }
  }

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/v1/user/me").then((r) => r.json()),
    enabled: queriesEnabled,
  });

  /* ===== Fetch User Stats ===== */
  const { data: stats = [], isLoading: loadingStats } = useQuery({
    queryKey: ["me-stats"],
    queryFn: () => fetch("/api/v1/stats/me").then((r) => r.json()),
    enabled: queriesEnabled,
  });

  const { data: streak = 0, isLoading: loadingStreak } = useQuery({
    queryKey: ["streak"],
    queryFn: () => fetch("/api/v1/streak").then((r) => r.json()),
    enabled: queriesEnabled,
  });

  const { data: recent = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["recent"],
    queryFn: async () => {
      const res = await fetch("/api/v1/stats/recent", {
        credentials: "include",
      });

      if (!res.ok) return [];

      const data = await res.json();

      // support both array and { results: [] }
      if (Array.isArray(data)) return data;
      return data.results ?? [];
    },
    enabled: queriesEnabled,
  });

  const { data: xpData } = useQuery({
    queryKey: ["xp"],
    queryFn: () => fetch("/api/v1/xp").then((r) => r.json()),
    enabled: queriesEnabled,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/v1/achievements/me", {
        credentials: "include",
      });

      if (!res.ok) return [];

      return res.json();
    },
    enabled: queriesEnabled,
  });

  const { data: fingers = {} as Record<string, number> } = useQuery({
    queryKey: ["fingerStats"],
    queryFn: () => fetch("/api/v1/finger-stats").then((r) => r.json()),
    enabled: queriesEnabled,
  });
  if (status === "loading") return null;

  if (isGuest) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-6">
        <div className="text-2xl font-bold">Hey Newbie 👋</div>

        <div className="text-white/60">Create Your Typing Profile</div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
          <div className="text-lg font-semibold mb-2">
            🔥 Your last result: {lastWpm ?? "--"} WPM
          </div>

          <div className="text-sm text-white/60">Create your profile to:</div>

          <div className="text-sm text-white/70 mt-2 space-y-1">
            <div>• Track improvement</div>
            <div>• Keep streaks</div>
            <div>• Compete on leaderboard</div>
          </div>
        </div>

        <button
          onClick={() => router.push("/signin?redirect=/profile")}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  if (!me) return null;

  /* ===== Safe Calculations ===== */

  const testsCount = Array.isArray(stats) ? stats.length : 0;

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

  const weakestFinger =
    fingerEntries.length > 0
      ? fingerEntries.reduce(
          (min, curr) => (curr[1] < min[1] ? curr : min),
          fingerEntries[0],
        )
      : null;

  const lastTest = recent?.[0]?.createdAt;

  const didUserPlayToday =
    lastTest && new Date(lastTest).toDateString() === new Date().toDateString();

  const isAtRisk = streak > 0 && !didUserPlayToday;
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      {/* ================= TOP CARD ================= */}

      <div
        className={`
    bg-slate-900/70 border border-slate-800 rounded-2xl p-8 flex items-center gap-6
    ${me?.isPro ? "shadow-[0_0_30px_rgba(255,180,0,0.3)]" : ""}
  `}
      >
        {/* Avatar */}
        <AvatarUploader image={me?.image} />
        {/* Info */}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              {me?.name ?? session?.user?.name ?? "User"}
              <span className="ml-2 text-sm text-blue-400">
                Level {me?.level ?? 1}
              </span>
            </h2>
            {me?.isPro && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-black"
              >
                PRO
              </motion.span>
            )}
          </div>

          <p className="text-white/50 mt-1">Member since 2026</p>
          <div className="mt-2">
            <div className="text-xs text-white/50 mb-1">XP: {me?.xp ?? 0}</div>

            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${((me?.xp ?? 0) % 1000) / 10}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Upgrade */}
        <div className="ml-auto">
          <button
            onClick={handleUpgrade}
            disabled={!me || me?.isPro || upgrading}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 transform active:scale-95
  ${
    me?.isPro
      ? "bg-green-500 text-black"
      : upgrading
        ? "bg-blue-500 text-white opacity-80"
        : "bg-amber-500 hover:bg-amber-400 text-black"
  }`}
          >
            <Zap size={18} />
            {me?.isPro ? (
              "PRO Active"
            ) : upgrading ? (
              <>
                Unlocking...
                <span className="animate-pulse">...</span>
              </>
            ) : (
              "Unlock PRO (Free)"
            )}{" "}
          </button>
          {!me?.isPro && (
            <div className="text-xs text-white/50 mt-2 text-center">
              Early access — limited time
            </div>
          )}
        </div>
      </div>

      {/* ================= STREAK + WEEKLY ACTIVITY ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Streak Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="text-orange-400" />

            <div>
              <div className="text-sm text-white/50">Daily Streak</div>

              {loadingStreak ? (
                <div className="text-xl">Loading…</div>
              ) : (
                <div className="text-3xl font-black">{streak} 🔥</div>
              )}
            </div>
          </div>

          {!loadingStreak && (
            <div className="text-sm text-white/50">
              {streak > 0
                ? "Keep your streak alive today."
                : "Start your streak today."}
            </div>
          )}
        </div>

        {/* ⚠️ STREAK WARNING */}
        {isAtRisk && (
          <div className="md:col-span-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
            ⚠ You're about to lose your streak 😈
          </div>
        )}

        {/* Weekly Activity Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <div className="text-sm text-white/50 mb-3 text-center">
            Weekly Activity
          </div>

          <div className="flex justify-center">
            <StreakHeatmap />
          </div>
        </div>
      </div>

      {/* ================= PERFORMANCE ================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox
          icon={<BarChart3 size={18} />}
          label="Tests"
          value={testsCount}
        />

        <StatBox
          icon={<Activity size={18} />}
          label="Average WPM"
          value={avgWpm}
        />

        <StatBox icon={<Zap size={18} />} label="Best WPM" value={bestWpm} />
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 text-center">
          <div className="text-sm text-white/50">Level</div>

          <div className="text-4xl font-black text-blue-400">
            {xpData?.level || 1}
          </div>

          <div className="mt-2 text-sm text-white/50">
            XP: {xpData?.xp || 0}
          </div>
        </div>
      </div>

      {/* ================= FINGER ACCURACY ================= */}

      <ProLock isPro={!!me?.isPro}>
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Accuracy by Finger</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(fingers).length === 0 ? (
              <div className="text-white/50 text-sm col-span-full text-center">
                Complete a few tests to see finger accuracy.
              </div>
            ) : (
              Object.entries(fingers).map(([finger, acc]) => {
                const isWeakest = weakestFinger?.[0] === finger;

                return (
                  <div
                    key={finger}
                    className={`
                bg-white/5 rounded-xl p-4 text-center
                ${isWeakest ? "border border-red-500/50" : ""}
              `}
                  >
                    <div className="text-sm text-white/50">
                      {FINGER_LABELS[finger] ?? finger}
                    </div>

                    <div className="text-2xl font-black">{Number(acc)}%</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ProLock>

      {/* ================= LOWER GRID ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="text-blue-400" />
            Recent Activity
          </h3>

          {loadingRecent ? (
            <p className="text-white/50">Loading…</p>
          ) : !Array.isArray(recent) || recent.length === 0 ? (
            <p className="text-white/50">No tests taken yet.</p>
          ) : (
            <div className="space-y-3">
              {recent.slice(0, 5).map((r: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between bg-white/5 p-3 rounded-lg text-sm"
                >
                  <span>{r.practiceMode?.toUpperCase()}</span>
                  <span>{r.wpm} WPM</span>
                  <span>{r.accuracy}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Achievements</h3>

          {achievements.length === 0 ? (
            <p className="text-white/50">No achievements yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((a: any) => (
                <div
                  key={a.achievement.id}
                  className="bg-white/5 p-4 rounded-xl text-center"
                >
                  <div className="text-2xl">{a.achievement.icon}</div>

                  <div className="font-semibold mt-1">
                    {a.achievement.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 text-center">
      <div className="flex justify-center mb-2 text-blue-400">{icon}</div>
      <div className="text-sm text-white/50 mb-1">{label}</div>
      <div className="text-4xl font-black">{value}</div>
    </div>
  );
}

function Achievement({ title, progress }: { title: string; progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-4"
    >
      <div className="flex justify-between text-sm mb-1 text-white/70">
        <span>{title}</span>
        <span>{progress}%</span>
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
          className="h-full bg-blue-600"
        />
      </div>
    </motion.div>
  );
}
