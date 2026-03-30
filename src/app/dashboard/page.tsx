"use client";

import { useQuery } from "@tanstack/react-query";

export default function Dashboard() { 
  const { data: history } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/stats/me");
      return res.json();
    },
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/v1/user/me").then((r) => r.json()),
  });

  if (!history || !me) return <div className="p-10">Loading…</div>;

  const latest = history[history.length - 1];

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">Your Progress</h1>

      {/* 🔥 Identity layer */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-gray-900 rounded-xl">
          <div className="text-sm opacity-60">Streak</div>
          <div className="text-4xl font-bold">
            {me.currentStreak} 🔥
          </div>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl">
          <div className="text-sm opacity-60">Best Streak</div>
          <div className="text-4xl font-bold">
            {me.bestStreak}
          </div>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl">
          <div className="text-sm opacity-60">Personal Best</div>
          <div className="text-4xl font-bold">
            {me.personalBest} WPM
          </div>
        </div>
      </div>

      {/* 📈 Latest session */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-gray-900 rounded-xl">
          <div className="text-sm opacity-60">Latest WPM</div>
          <div className="text-4xl font-bold">
            {latest?.wpm}
          </div>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl">
          <div className="text-sm opacity-60">Accuracy</div>
          <div className="text-4xl font-bold">
            {latest?.accuracy}%
          </div>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl">
          <div className="text-sm opacity-60">Sessions</div>
          <div className="text-4xl font-bold">
            {history.length}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="p-6 bg-gray-900 rounded-xl">
        <h2 className="text-xl mb-4">History</h2>
        <div className="space-y-2">
          {history.map((r: any, i: number) => (
            <div
              key={i}
              className="flex justify-between text-sm"
            >
              <div>
                {new Date(r.createdAt).toLocaleDateString()}
              </div>
              <div>{r.wpm} WPM</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
