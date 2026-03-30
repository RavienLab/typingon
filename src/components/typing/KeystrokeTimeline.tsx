"use client";

import type { Keystroke } from "@/lib/typing/types";

export function KeystrokeTimeline({
  keystrokes,
}: {
  keystrokes: Keystroke[];
}) {
  if (!keystrokes || keystrokes.length < 2) return null;

  const intervals = keystrokes.map((k, i) =>
    i === 0 ? 0 : k.time - keystrokes[i - 1].time
  );

  const max = Math.max(...intervals);

  return (
    <div className="bg-gray-900 p-4 rounded-xl">
      <div className="text-sm opacity-60 mb-2">
        Keystroke timeline
      </div>

      <div className="flex gap-1 items-end h-32">
        {intervals.map((ms, i) => {
          const height = Math.min(100, (ms / max) * 100);
          const bad = !keystrokes[i]?.correct;

          return (
            <div
              key={i}
              title={`${ms}ms`}
              className={`w-1 rounded ${
                bad ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      <div className="flex justify-between text-xs opacity-50 mt-2">
        <span>Fast</span>
        <span>Slow</span>
      </div>
    </div>
  );
}
