"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { PageMotion } from "@/components/ui/PageMotion";
import { useSession } from "next-auth/react";

type Entry = {
  rank: number;
  wpm: number;
  avgWpm: number;
  tests: number;
  accuracy: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const isGuest = status !== "authenticated";

  const [type, setType] = useState<"global" | "daily" | "weekly" | "monthly">(
    "global",
  );

  const {
    data = [],
    isLoading,
    isFetching,
  } = useQuery<Entry[]>({
    queryKey: ["leaderboard", type],
    queryFn: async () => {
      const controller = new AbortController();

      setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`/api/v1/leaderboard?type=${type}`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Leaderboard fetch failed");

      return res.json();
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev ?? [],
  });

  const currentUserId = status === "authenticated" ? session.user.id : null;

  const currentUserRow = useMemo(() => {
    if (!currentUserId) return null;
    return data.find((r) => r.user.id === currentUserId) ?? null;
  }, [data, currentUserId]);

  const nextRankRow = useMemo(() => {
    if (!currentUserRow) return null;
    return data.find((r) => r.rank === currentUserRow.rank - 1) ?? null;
  }, [data, currentUserRow]);

  const wpmGap =
    currentUserRow && nextRankRow
      ? Math.max(0, nextRankRow.wpm - currentUserRow.wpm)
      : null;

  return (
    <PageMotion>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-black">Leaderboard</h1>
          <p className="text-white/50">
            Top typists ranked by speed & accuracy
          </p>
        </div>

        {/* TABS */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit">
          {["global", "daily", "weekly", "monthly"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t as any)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition
                ${
                  type === t
                    ? "bg-blue-600 text-white"
                    : "text-white/60 hover:text-white"
                }
              `}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {isGuest && (
          <div className="text-sm text-white/50 text-center mb-4">
            Sign in to compete on leaderboard
          </div>
        )}

        <div className="relative">
          {isFetching && (
            <div className="absolute top-4 right-6 text-xs text-white/40">
              Updating…
            </div>
          )}

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
            {/* HEADER */}
            <div className="grid grid-cols-12 px-6 py-4 text-sm text-white/50 border-b border-slate-800">
              <div className="col-span-1">#</div>
              <div className="col-span-5">User</div>
              <div className="col-span-2 text-right">Best</div>
              <div className="col-span-2 text-right">Avg</div>
              <div className="col-span-2 text-right">Tests</div>
            </div>

            {/* ROWS */}
            {data.length === 0 ? (
              <div className="p-8 text-white/50 text-center">
                No results yet — be the first ⚡
              </div>
            ) : (
              data.map((row) => {
                const isCurrentUser = row.user.id === currentUserId;

                return (
                  <div
                    key={row.user.id}
                    className={`grid grid-cols-12 px-6 py-4 border-b border-slate-800 last:border-none items-center transition
              ${
                isCurrentUser
                  ? "bg-yellow-500/10 ring-1 ring-yellow-400/30"
                  : "hover:bg-white/5"
              }
            `}
                  >
                    {/* Rank */}
                    <div className="col-span-1 font-bold">
                      {row.rank === 1 && "🥇"}
                      {row.rank === 2 && "🥈"}
                      {row.rank === 3 && "🥉"}
                      {row.rank > 3 && row.rank}
                    </div>

                    {/* User */}
                    <div className="col-span-5 flex items-center gap-3">
                      <Avatar src={row.user.image} />

                      <div>
                        <span className="font-medium">
                          {row.user.name || "Anonymous"}
                        </span>

                        {/* 🔥 Smart hint */}
                        {isCurrentUser &&
                          currentUserRow &&
                          currentUserRow.rank > 1 &&
                          wpmGap !== null &&
                          wpmGap <= 10 && (
                            <div className="text-yellow-400 text-xs">
                              🔥 You're close to next rank!
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Best WPM */}
                    <div className="col-span-2 text-right font-black text-emerald-400">
                      {row.wpm}
                    </div>

                    {/* Avg WPM */}
                    <div className="col-span-2 text-right text-blue-400">
                      {Math.round(row.avgWpm)}
                    </div>

                    {/* Tests */}
                    <div className="col-span-2 text-right text-white/70">
                      {row.tests}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 🔥 RANK PUSH CTA */}
        {currentUserRow &&
          currentUserRow.rank > 1 &&
          wpmGap !== null &&
          wpmGap > 0 && (
            <div className="text-center text-sm text-white/60 mt-4 space-y-1">
              <div>Beat just 1 more player to rank up ⚡</div>

              <div className="text-yellow-400 font-semibold">
                You're just {wpmGap} WPM away from Rank #
                {currentUserRow.rank - 1}
              </div>
            </div>
          )}
      </div>
    </PageMotion>
  );
}

/* ---------------- AVATAR ---------------- */

function Avatar({ src }: { src: string | null }) {
  if (!src) {
    const initial = "U";

    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-bold">
        {initial}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt="avatar"
      width={36}
      height={36}
      className="rounded-full"
    />
  );
}
