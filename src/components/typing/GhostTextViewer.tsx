"use client";

import { useEffect, useRef, useState } from "react";
import { Caret } from "./Caret";

export function GhostTextViewer({
  text,
  replay,
}: {
  text: string;
  replay: { t: number }[];
}) {
  const [ghostIndex, setGhostIndex] = useState<number | null>(null);
  const startRef = useRef<number | null>(null);
  const chars = Array.from(text);

  useEffect(() => {
    if (!replay || replay.length === 0) return;

    startRef.current = performance.now();
    setGhostIndex(0);

    let raf: number;

    const tick = (now: number) => {
      if (!startRef.current) return;
      const elapsed = now - startRef.current;
      const next = replay.findIndex((k) => k.t > elapsed);

      if (next === -1) {
        setGhostIndex(replay.length);
        return;
      }

      setGhostIndex(next);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [replay]);

  return (
    <div className="mt-6 text-xl font-mono text-white/40 text-center leading-relaxed">
      {chars.map((char, i) => (
        <span key={i} className="relative">
          {i === ghostIndex && <Caret />}
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}
