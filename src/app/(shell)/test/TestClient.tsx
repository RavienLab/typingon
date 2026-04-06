"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useTypingStore } from "@/store/typingStore";
import { PageMotion } from "@/components/ui/PageMotion";
import { useParagraph } from "@/components/typing/ParagraphProvider";
import { Keyboard } from "@/components/typing/Keyboard";
import { Globe, Hash, Code2, Languages, Activity } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { INSCRIPT_MAP } from "@/lib/typing/inscript";
import TypingParagraph from "@/components/typing/TypingParagraph";
import { useSaveResult } from "@/hooks/useSaveResult";

/* ---------------- CONSTANTS ---------------- */
const MODES = [
  { label: "English", value: "english", icon: Globe },
  { label: "Numbers", value: "numbers", icon: Hash },
  { label: "Code", value: "code", icon: Code2 },
  { label: "Hindi (InScript)", value: "hindi", icon: Languages },
  { label: "Marathi (InScript)", value: "marathi", icon: Languages },
] as const;

const LANGUAGE_LABELS: Record<string, string> = {
  english: "ENGLISH",
  numbers: "NUMBERS",
  code: "CODE",
  hindi: "HINDI",
  marathi: "MARATHI",
};

/* ---------------- PAGE ---------------- */

function calculateStats({
  text,
  index,
  keystrokes,
  elapsedMs,
}: {
  text: string;
  index: number;
  keystrokes: any[];
  elapsedMs: number;
}) {
  if (elapsedMs < 1000) {
    return { wpm: 0, rawWpm: 0, accuracy: 100 };
  }

  const minutes = elapsedMs / 60000;

  // ✅ FINAL CORRECT CHARS (not keystrokes spam)
  let correctChars = 0;

  for (let i = 0; i < index; i++) {
    if (keystrokes[i]?.correct) correctChars++;
  }

  const rawChars = index;

  const wpm = Math.round(correctChars / 5 / minutes);
  const rawWpm = Math.round(rawChars / 5 / minutes);

  const accuracy =
    rawChars > 0 ? Math.round((correctChars / rawChars) * 100) : 100;

  return { wpm, rawWpm, accuracy };
}

export default function TypingTest() {
  const saveResultMutation = useSaveResult();
  const {
    text,
    index,
    errors,
    keystrokes,
    finished,
    startTest,
    input,
    setFocused,
  } = useTypingStore();

  const correct = useMemo(
    () => keystrokes.filter((k) => k.correct).length,
    [keystrokes],
  );

  const lastStroke = keystrokes[keystrokes.length - 1];
  const derivedLastKey = lastStroke?.key;
  const derivedLastCorrect = lastStroke?.correct;

  const { data: session } = useSession();

  const [displayElapsedMs, setDisplayElapsedMs] = useState(0);
  const timerStartRef = useRef<number | null>(null);
  const startTimer = () => {
    if (!timerStartRef.current) {
      timerStartRef.current = Date.now();
    }
  };
  const { paragraph, practiceMode, setPracticeMode } = useParagraph();

  const [paused, setPaused] = useState(false);

  const hasSubmittedRef = useRef(false);
  const isCreatingSession = useRef(false);

  const [showExamNotice, setShowExamNotice] = useState(false);
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isNavigating = useTypingStore((s) => s.isNavigating);
  const setNavigating = useTypingStore((s) => s.setNavigating);

  /* ---------- SYNC & INITIALIZATION ---------- */

  useEffect(() => {
    router.prefetch("/test/result");
  }, [router]);

  // ✅ SYNC PARAGRAPH: Load text from Provider into the Engine
  useEffect(() => {
    if (!paragraph?.text) return;

    // Prevent re-syncing if text is already correctly loaded
    if (text === paragraph.text) return;

    // Reset local test state
    hasSubmittedRef.current = false;
    setPaused(false);
    timerStartRef.current = null;
    setDisplayElapsedMs(0);
    setSessionId(null);

    // Sync to store
    startTest(paragraph.text);
  }, [paragraph.text, text, startTest]);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("inscript_exam_notice_seen");
      if (!seen && (practiceMode === "hindi" || practiceMode === "marathi")) {
        setShowExamNotice(true);
      } else {
        setShowExamNotice(false);
      }
    } catch {}
  }, [practiceMode]);

  /* ---------- INPUT HANDLING ---------- */
  const stateRef = useRef({
    text,
    index,
    paused,
  });

  useEffect(() => {
    stateRef.current = { text, index, paused };
  }, [text, index, paused]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { text, index, paused } = stateRef.current;

      if (e.key === "Escape") {
        e.preventDefault();
        setPaused((p) => !p);
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey || paused) return;

      // 🔥 SESSION CREATION ON FIRST KEYSTROKE
      if (index === 0 && !sessionId && !isCreatingSession.current) {
        isCreatingSession.current = true;
        fetch("/api/v1/typing/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ practiceMode, textType: practiceMode }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("DB Connection Error");
            return res.json();
          })
          .then((data) => {
            if (data.sessionId) setSessionId(data.sessionId);
          })
          .catch((err) => {
            console.error("Session failed:", err);
          })
          .finally(() => {
            isCreatingSession.current = false;
          });
      }

      // Hindi / Marathi — InScript Exam
      if (practiceMode === "hindi" || practiceMode === "marathi") {
        if (e.code === "Backspace") {
          e.preventDefault();
          return;
        }
        const key = e.shiftKey ? `Shift+${e.code}` : e.code;
        const char = INSCRIPT_MAP[key];
        if (!char) return;
        startTimer();
        input(char);
        return;
      }

      // English / Numbers / Code
      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
        startTimer();
        input(e.key);
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: true });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [practiceMode, input, sessionId]);

  useEffect(() => {
    if (index === 0) return;
    const block = (e: ClipboardEvent) => e.preventDefault();
    window.addEventListener("copy", block);
    window.addEventListener("paste", block);
    window.addEventListener("cut", block);
    return () => {
      window.removeEventListener("copy", block);
      window.removeEventListener("paste", block);
      window.removeEventListener("cut", block);
    };
  }, [index]);

  /* ---------- STATS ENGINE ---------- */
  const [liveStats, setLiveStats] = useState({
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    elapsedMs: 0,
  });

  useEffect(() => {
    let raf: number;
    const loop = () => {
      if (timerStartRef.current && !paused && !finished) {
        const now = Date.now();
        const elapsed = now - timerStartRef.current;
        setDisplayElapsedMs(elapsed);

        const stats = calculateStats({
          text,
          index,
          keystrokes,
          elapsedMs: elapsed,
        });

        setLiveStats((prev) => ({
          wpm:
            prev.wpm === 0
              ? stats.wpm
              : Math.round(prev.wpm * 0.9 + stats.wpm * 0.1),
          rawWpm: stats.rawWpm,
          accuracy: stats.accuracy,
          elapsedMs: elapsed,
        }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [text, index, keystrokes, paused, finished]);

  /* ---------- FINISH LOGIC (OPTIMISTIC) ---------- */
  useEffect(() => {
    if (!finished || hasSubmittedRef.current) return;

    const handleFinish = (currentId: string | null) => {
      hasSubmittedRef.current = true;
      const stats = liveStats;

      const payload = {
        stats: {
          wpm: stats.wpm,
          rawWpm: stats.rawWpm,
          accuracy: stats.accuracy,
          errors,
          durationMs: stats.elapsedMs,
        },
        practiceMode,
        paragraph: text,
        keystrokes,
      };

      // 1. Save results to local memory (Zustand) instantly
      useTypingStore.getState().setLastResult(payload);

      // 2. 🔥 THE SYNC FIX: Increase delay to 100ms to ensure RAM is 100% saved
      // before the ResultClient mounts. This stops the race condition.
      setTimeout(() => {
        setNavigating(true);
        const finalId = currentId || "latest";
        router.push(`/test/result?id=${finalId}`);
      }, 100);

      // 3. Background Sync (1000ms threshold)
      if (currentId && session?.user?.id && stats.elapsedMs >= 1000) {
        saveResultMutation.mutate({
          sessionId: currentId,
          keystrokes,
          wpmTimeline: [],
          backspaces: keystrokes.filter((k) => k.key === "Backspace").length,
        });
      }
    };

    // 🔥 GATING: Wait for the session creation to finish if it's still in flight
    if (isCreatingSession.current) {
      const poll = setInterval(() => {
        if (!isCreatingSession.current) {
          clearInterval(poll);
          handleFinish(sessionId);
        }
      }, 100);
      return () => clearInterval(poll);
    } else {
      handleFinish(sessionId);
    }
  }, [
    finished,
    sessionId,
    liveStats,
    practiceMode,
    text,
    keystrokes,
    errors,
    session,
    router,
    setNavigating,
    saveResultMutation,
  ]);

  const wrongIndexes = useMemo(() => {
    if (!keystrokes.length) return new Set<number>();
    const map = new Set<number>();
    let cursor = 0;
    for (const k of keystrokes) {
      if (!k.correct) map.add(cursor);
      cursor++;
    }
    return map;
  }, [keystrokes]);

  const graphemes = useMemo(() => Array.from(text), [text]);
  if (isNavigating) {
    return <div className="h-screen w-full bg-[#0b1220]" />;
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#0b1220] overflow-x-hidden">
      {/* LANGUAGE BAR */}
      <div className="border-b border-slate-800 shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar text-xs uppercase tracking-wider text-white/50">
            {MODES.map(({ label, value, icon: Icon }) => {
              const active = value === practiceMode;
              return (
                <button
                  key={value}
                  disabled={index > 0}
                  onClick={() => setPracticeMode(value)}
                  className={`
                    flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border transition shrink-0
                    ${active ? "border-blue-500 text-blue-400 bg-blue-500/10" : "border-transparent hover:text-white hover:bg-white/5"}
                    ${index > 0 ? "opacity-40 cursor-not-allowed" : ""}
                  `}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col pt-4 sm:pt-6 h-[calc(100vh-64px)] overflow-hidden">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 flex flex-col h-full gap-6">
          {/* STATS SECTION */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 shrink-0">
            <Stat label="WPM" value={liveStats.wpm} color="text-emerald-400" />
            <Stat
              label="Accuracy"
              value={`${liveStats.accuracy}%`}
              color="text-blue-400"
            />
            <Stat
              label="Time"
              value={(() => {
                const seconds = Math.floor(displayElapsedMs / 1000);
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, "0")}`;
              })()}
              color="text-amber-400"
            />
            <Stat
              label="Mode"
              value={
                LANGUAGE_LABELS[practiceMode] ?? practiceMode.toUpperCase()
              }
            />
          </div>

          {/* SCROLLABLE TYPING ZONE */}
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-6 pb-24">
            {showExamNotice && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm shrink-0">
                <div className="font-semibold mb-1">Exam Mode Notice</div>
                This mode uses the official InScript keyboard layout. Required
                for government exams.
                <button
                  className="block mt-2 text-xs text-amber-300 underline"
                  onClick={() => {
                    try {
                      localStorage.setItem("inscript_exam_notice_seen", "1");
                    } catch {}
                    setShowExamNotice(false);
                  }}
                >
                  Got it
                </button>
              </div>
            )}

            {/* TYPING CARD */}
            <div className="flex flex-col gap-6">
              <div className="relative bg-slate-900 rounded-[2rem] border border-slate-800 min-h-[260px] sm:min-h-[300px] flex flex-col px-6 sm:px-12 py-12 sm:py-16 shadow-2xl cursor-text transition-all">
                {/* OVERLAYS & INDICATORS */}
                {paused && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md rounded-[2rem]">
                    <div className="text-white/90 text-sm font-bold tracking-[0.3em] uppercase bg-slate-800/80 px-8 py-4 rounded-full border border-white/10 shadow-2xl">
                      Paused
                    </div>
                  </div>
                )}

                <div className="absolute top-6 left-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-400/50 font-black">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Session
                </div>

                {/* THE TEXT - Centered and Wrapped */}
                <div className="flex-1 flex items-center justify-center w-full max-w-4xl mx-auto">
                  <div className="w-full text-xl sm:text-2xl md:text-3xl leading-[1.8] sm:leading- tracking-wide text-left break-words whitespace-pre-wrap">
                    <TypingParagraph
                      text={text}
                      index={index}
                      wrongIndexes={wrongIndexes}
                    />
                  </div>
                </div>

                {/* INSCRIPT GUIDE */}
                {(practiceMode === "hindi" || practiceMode === "marathi") && (
                  <details className="absolute bottom-6 right-8 text-xs text-white/20 hover:text-white/40 transition-colors group">
                    <summary className="list-none cursor-pointer font-medium">
                      ⌨ Layout Guide
                    </summary>
                    <div className="absolute bottom-full right-0 mb-4 w-48 space-y-2 font-mono bg-slate-950/90 backdrop-blur-xl px-5 py-4 rounded-2xl border border-white/5 shadow-2xl">
                      <div className="flex justify-between">
                        <span>K</span> <span className="text-white/80">क</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shift+K</span>{" "}
                        <span className="text-white/80">ख</span>
                      </div>
                      <div className="border-t border-white/5 my-2" />
                      <div className="flex justify-between">
                        <span>/</span> <span className="text-white/80">्</span>
                      </div>
                    </div>
                  </details>
                )}
              </div>

              {/* KEYBOARD WRAPPER */}
              <div className="flex justify-center pb-8">
                <Keyboard
                  expectedKey={graphemes[index]}
                  lastCorrect={derivedLastCorrect}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Stat({
  label,
  value,
  color = "text-slate-300",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center transition-all hover:bg-slate-800/80">
      <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-1 font-bold">
        {label}
      </span>
      <span className={`text-2xl sm:text-4xl font-black ${color} tabular-nums`}>
        {value}
      </span>
    </div>
  );
}
