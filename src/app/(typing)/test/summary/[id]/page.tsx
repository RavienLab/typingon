"use client";

import { useQuery } from "@tanstack/react-query";
import { KeystrokeTimeline } from "@/components/typing/KeystrokeTimeline";
import { WpmTimeline } from "@/components/typing/WpmTimeline";
import { WpmChart } from "@/components/typing/WpmChart";
import { Heatmap } from "@/components/typing/Heatmap";
import { MotionCard } from "@/components/ui/MotionCard";
import { PageMotion } from "@/components/ui/PageMotion";
import { PersonalBest } from "@/components/typing/PersonalBest";
import { getRank } from "@/lib/ranks";

type Keystroke = {
  key: string;
  time: number;
  correct: boolean;
};

type WpmPoint = {
  t: number;
  wpm: number;
};

type Result = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: Keystroke[];
  wpmTimeline: WpmPoint[];
};

type Analysis = {
  punctuationSlowdown?: boolean;
  consistency?: "stable" | "erratic";
  weakKeys?: string[];
  fatigue?: "stable" | "fatigue";
  confidence?: "high" | "low";
};

export default function Summary({ params }: { params: { id: string } }) {
  const lastWpm =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("lastWpm"))
      : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["session", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/typing/session/${params.id}`);
      if (!res.ok) throw new Error("Session not found");
      return res.json();
    },
    retry: false,
  });

  if (isLoading) return <div className="p-10">Loading…</div>;
  if (error || !data?.result)
    return (
      <div className="p-10 text-red-500">Failed to load session summary.</div>
    );

  const result: Result = data.result;
  const rank = getRank(result.wpm);

  if (typeof window !== "undefined") {
    localStorage.setItem("lastWpm", String(result.wpm));
  }

  const analysis: Analysis = data.analysis || {};

  // punctuation slowdown fallback
  const slowdownPoints = result.keystrokes.filter((k, i) => {
    if (![".", ",", "!", "?", ";"].includes(k.key)) return false;
    const before = result.wpmTimeline[i - 2]?.wpm || 0;
    const after = result.wpmTimeline[i + 2]?.wpm || 0;
    return after < before * 0.8;
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetch("/api/v1/leaderboard").then((r) => r.json()),
  });

  const { data: heatmap } = useQuery({
    queryKey: ["heatmap", params.id],
    queryFn: () =>
      fetch(`/api/v1/typing/heatmap/${params.id}`).then((r) => r.json()),
  });

  const { data: adaptive } = useQuery({
    queryKey: ["adaptive", params.id],
    queryFn: () =>
      fetch(`/api/v1/typing/adaptive/${params.id}`).then((r) => r.json()),
  });

  return (
    <PageMotion>
      <div className="max-w-4xl mx-auto p-10 space-y-10">
        <h1 className="text-3xl font-bold mb-2">Session Summary</h1>
        <div className={`mb-6 font-mono tracking-wide ${rank.color}`}>
          {rank.name} Typist
        </div>

        {/* Core stats */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {/* WPM (with PB logic) */}
          <MotionCard>
            <div className="text-sm opacity-60">WPM</div>

            <div className="text-4xl font-bold flex items-center gap-3">
              {result.wpm}

              {leaderboard &&
                result.wpm >=
                  Math.max(...leaderboard.map((u: any) => u.wpm)) && (
                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                    PB
                  </span>
                )}
            </div>
          </MotionCard>

          <Stat label="Raw" value={result.rawWpm} />
          <Stat label="Accuracy" value={`${result.accuracy}%`} />
        </div>

        <div className="mt-4 space-y-2">
          <PersonalBest wpm={result.wpm} />

          {lastWpm !== null && (
            <div className="text-sm text-white/60">
              {result.wpm > lastWpm && (
                <span className="text-green-400">
                  ↑ +{result.wpm - lastWpm} WPM vs last session
                </span>
              )}

              {result.wpm < lastWpm && (
                <span className="text-red-400">
                  ↓ {lastWpm - result.wpm} WPM vs last session
                </span>
              )}

              {result.wpm === lastWpm && (
                <span>Same speed as last session</span>
              )}
            </div>
          )}
        </div>

        {result.wpmTimeline?.length > 0 && (
          <MotionCard>
            <WpmChart timeline={result.wpmTimeline} />
          </MotionCard>
        )}

        <div className="grid grid-cols-2 gap-6 mb-10">
          <MotionCard>
            <WpmTimeline data={result.wpmTimeline} />
          </MotionCard>

          <MotionCard>
            <KeystrokeTimeline keystrokes={result.keystrokes} />
          </MotionCard>
        </div>

        {heatmap && (
          <MotionCard>
            <Heatmap data={heatmap} />
          </MotionCard>
        )}

        {adaptive && (
          <MotionCard>
            <div className="mt-10 p-6 bg-purple-500/10 rounded-xl">
              <h2 className="text-xl mb-2">Your Weak Keys</h2>
              <div className="flex gap-2 mb-4">
                {adaptive.weakKeys.map((k: string) => (
                  <span key={k} className="px-3 py-1 bg-purple-600/30 rounded">
                    {k}
                  </span>
                ))}
              </div>
              <a
                href={`/test?mode=adaptive&seed=${params.id}`}
                className="inline-block mt-2 px-4 py-2 bg-purple-600 rounded hover:bg-purple-500"
              >
                Train My Weaknesses
              </a>
            </div>
          </MotionCard>
        )}

        {/* 🧠 Phase-11 Coaching */}
        <MotionCard>
          <h2 className="text-xl mb-4">Typing Coach</h2>
          {analysis?.fatigue === "fatigue" && (
            <div className="mb-4 h-2 bg-red-500/40 rounded animate-pulse" />
          )}

          {analysis?.fatigue === "stable" && (
            <div className="mb-4 h-2 bg-green-500/40 rounded" />
          )}

          {analysis.punctuationSlowdown && (
            <div>🟡 You slow down after punctuation.</div>
          )}

          {analysis.consistency === "erratic" && (
            <div>📉 Your speed is unstable. Focus on rhythm.</div>
          )}

          {analysis.fatigue === "fatigue" && (
            <div>🧠 You fade near the end. Train endurance.</div>
          )}

          {analysis.confidence === "low" && (
            <div>😬 You hesitate after mistakes. Push through.</div>
          )}

          {!analysis && slowdownPoints.length > 0 && (
            <div>🟡 You slow down after punctuation.</div>
          )}

          {!analysis && slowdownPoints.length === 0 && (
            <div>🔥 You typed clean and steady.</div>
          )}
        </MotionCard>

        {leaderboard && (
          <div className="mt-10 opacity-70">
            You rank #
            {leaderboard.findIndex((u: any) => u.wpm <= result.wpm) + 1}
          </div>
        )}
        <MotionCard>
          <h2 className="text-xl mb-4">Mistakes</h2>

          {result.keystrokes.filter((k) => !k.correct).length === 0 ? (
            <div className="opacity-50">No mistakes 🎯</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.keystrokes
                .filter((k) => !k.correct)
                .map((k, i) => (
                  <span key={i} className="px-3 py-1 bg-red-600/30 rounded">
                    {k.key}
                  </span>
                ))}
            </div>
          )}
        </MotionCard>
      </div>
    </PageMotion>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <MotionCard>
      <div className="text-sm opacity-60">{label}</div>
      <div className="text-4xl font-bold">{value}</div>
    </MotionCard>
  );
}
