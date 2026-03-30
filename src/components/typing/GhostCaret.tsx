"use client";

export function GhostCaret() {
  return (
    <span
      className="absolute left-0 top-0 w-[2px] h-7 bg-white/30"
      style={{ transform: "translateX(0)" }}
    />
  );
}
