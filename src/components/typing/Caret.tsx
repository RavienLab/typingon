"use client";

import { useTypingStore } from "@/store/typingStore";
import { useEffect, useState } from "react";

export function Caret() {
  const { keystrokes, finished } = useTypingStore();
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (finished) return;

    setIdle(false);
    const t = setTimeout(() => setIdle(true), 600);
    return () => clearTimeout(t);
  }, [keystrokes.length, finished]);

  return (
    <span
      className={`
        absolute
        left-0
        bottom-[0.05em]
        w-full
        h-[2px]
        bg-white
        rounded-sm
        pointer-events-none
        z-10
        ${idle ? "caret-blink" : ""}
      `}
    />
  );
}
