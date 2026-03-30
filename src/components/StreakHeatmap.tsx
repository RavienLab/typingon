"use client";

import { useQuery } from "@tanstack/react-query";

/* 🧠 Format date → DD-MM-YYYY */
function formatDate(dateStr: string) {
  const d = new Date(dateStr);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

export default function StreakHeatmap() {
  const { data: days = [] } = useQuery({
    queryKey: ["activity"],
    queryFn: () => fetch("/api/v1/activity").then((r) => r.json()),
  });

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  /* find Monday of current week */
  const monday = new Date(today);
  const dayIndex = monday.getDay(); // 0 = Sunday
  const diff = monday.getDate() - dayIndex + (dayIndex === 0 ? -6 : 1);
  monday.setDate(diff);

  /* build Monday → Sunday */
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const labels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Day labels */}
      <div className="flex gap-2 text-xs text-white/40">
        {labels.map((l, i) => (
          <span key={i} className="w-6 text-center">
            {l}
          </span>
        ))}
      </div>

      {/* Heatmap */}
      <div className="flex gap-2">
        {week.map((day) => {
          const isToday = day === todayKey;
          const isActive = days.includes(day);

          return (
            <div
              key={day}
              title={formatDate(day)}
              className={`
                w-6 h-6 rounded-md border border-white/10
                transition-all duration-200
                hover:scale-110
                ${
                  isToday
                    ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.7)]"
                    : isActive
                    ? "bg-green-500/40"
                    : "bg-white/10 hover:bg-white/20"
                }
              `}
            />
          );
        })}
      </div>
    </div>
  );
}