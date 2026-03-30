"use client";

import type { WpmPoint } from "@/lib/typing/types";
const glowForWpm = (wpm: number) => {
  if (wpm > 90) return "shadow-[0_0_30px_rgba(34,197,94,0.6)]";
  if (wpm > 70) return "shadow-[0_0_25px_rgba(59,130,246,0.6)]";
  if (wpm > 50) return "shadow-[0_0_20px_rgba(234,179,8,0.5)]";
  return "shadow-[0_0_15px_rgba(239,68,68,0.4)]";
};


export function WpmTimeline({ data }: { data: WpmPoint[] }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data.map((p) => p.wpm));

  return (
    <div className="bg-gray-900 p-4 rounded-xl">
      <div className="text-sm opacity-60 mb-2">Speed over time</div>

      <div className="flex gap-1 items-end h-32">
        {data.map((p, i) => {
          const height = max === 0 ? 0 : (p.wpm / max) * 100;

          return ( 
            <div
              key={i}
              title={`${p.wpm} WPM`}
              className={`w-1 bg-blue-500/70 ${glowForWpm(p.wpm)}`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      <div className="flex justify-between text-xs opacity-50 mt-2">
        <span>Start</span>
        <span>Finish</span>
      </div>
    </div>
  );
}
