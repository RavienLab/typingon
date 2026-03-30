"use client";

type KeyboardProps = {
  expectedKey?: string;
  lastCorrect?: boolean; // 👈 keep only this
};

/* ---------------- KEY LAYOUT ---------------- */

const KEYS = [
  ["`","1","2","3","4","5","6","7","8","9","0","-","=","Backspace"],
  ["Tab","q","w","e","r","t","y","u","i","o","p","[","]","\\"],
  ["Caps","a","s","d","f","g","h","j","k","l",";","'","Enter"],
  ["Shift","z","x","c","v","b","n","m",",",".","/","Shift"],
  ["Space"],
];

/* ---------------- HELPERS ---------------- */

const normalize = (key?: string) => {
  if (!key) return "";
  if (key === " ") return "space";
  if (key === "\n") return "enter";
  return key.toLowerCase();
};

export function Keyboard({ expectedKey, lastCorrect }: KeyboardProps) {
  const expected = normalize(expectedKey);

  return (
    <div className="select-none">
      {KEYS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-2 mb-2">
          {row.map((key, ki) => {
            const keyNorm =
              key === "Space"
                ? "space"
                : key === "Enter"
                ? "enter"
                : key.toLowerCase();

            const isExpected = expected && keyNorm === expected;

            let stateClass =
              "bg-slate-800 border-white/10 text-white/70";

            /* 🎯 CORE LOGIC */

            if (isExpected) {
              // 🔴 wrong press → red
              if (lastCorrect === false) {
                stateClass =
                  "bg-red-500/20 border-red-400 text-red-200 scale-105";
              }
              // 🔵 normal → blue
              else {
                stateClass =
                  "bg-blue-500/20 border-blue-400 text-blue-200 shadow-[0_0_18px_rgba(59,130,246,0.6)] scale-105";
              }
            }

            return (
              <div
                key={`${key}-${ri}-${ki}`}
                className={`
                  px-4 py-3 rounded-md border
                  text-xs font-mono
                  transition-all duration-150
                  flex items-center justify-center
                  ${key === "Space" ? "w-64" : "min-w-[42px]"}
                  ${stateClass}
                `}
              >
                {key}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}