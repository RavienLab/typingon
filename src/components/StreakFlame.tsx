"use client";

import { useEffect, useState } from "react";

export default function StreakFlame({ streak }: { streak: number }) {
  const [ignite, setIgnite] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastSeen = localStorage.getItem("streakSeen");

    if (lastSeen !== today) {
      setIgnite(true);
      localStorage.setItem("streakSeen", today);

      const timer = setTimeout(() => setIgnite(false), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <span
      className={`text-orange-400 font-semibold ${
        ignite ? "animate-[streakIgnite_0.8s_ease-out]" : ""
      }`}
    >
      🔥 {streak ?? 0}
    </span>
  );
}