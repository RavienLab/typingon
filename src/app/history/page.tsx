"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageMotion } from "@/components/ui/PageMotion";

export default function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => fetch("/api/v1/history").then(r => r.json()),
  });

  if (isLoading) return <div className="p-10">Loading…</div>;
  if (!data) return <div className="p-10">Failed to load history.</div>;

  return (
    <PageMotion>
      <div className="max-w-4xl mx-auto p-10">
        <h1 className="text-3xl font-bold mb-8">Test History</h1>

        <div className="space-y-3">
          {data.map((run: any) => (
            <Link
              key={run.id}
              href={`/test/summary/${run.sessionId}`}
              className="block p-4 bg-gray-900 rounded-xl hover:bg-white/5 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-mono">
                    {run.wpm} WPM
                  </div>
                  <div className="text-xs opacity-50">
                    {run.accuracy}% accuracy
                  </div>
                </div>

                <div className="text-sm opacity-60">
                  {new Date(run.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageMotion>
  );
}
