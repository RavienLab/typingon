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
  const [started, setStarted] = useState(false);
  const examId = null;
  const { paragraph, practiceMode, setPracticeMode } = useParagraph();

  const [paused, setPaused] = useState(false);
  // 🔵 Keystroke chunk batching

  const hasSubmittedRef = useRef(false);
  const sessionCreatedRef = useRef(false);

  const [showExamNotice, setShowExamNotice] = useState(false);
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  /* ---------- START TEST + CREATE ATTEMPT ---------- */

  useEffect(() => {
    router.prefetch("/test/result");
  }, []);

  useEffect(() => {
    if (!paragraph?.text) return;
    if (text !== paragraph.text) {
      // 🔥 immediately clear old state BEFORE anything

      hasSubmittedRef.current = false;
      setPaused(false);

      // now load new paragraph
      startTest(paragraph.text);

      timerStartRef.current = null;
      setStarted(false);
      setDisplayElapsedMs(0);

      sessionCreatedRef.current = false;
      setSessionId(null);

      // 🔥 CREATE SESSION EARLY (NO RACE CONDITION)
      if (!sessionCreatedRef.current) {
        sessionCreatedRef.current = true;

        fetch("/api/v1/typing/start", {
          method: "POST",
        })
          .then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              console.error("SESSION ERROR:", err);

              sessionCreatedRef.current = false; // allow retry
              return;
            }

            const data = await res.json();
            setSessionId(data.sessionId);
          })
          .catch(() => {
            sessionCreatedRef.current = false;
          });
      }
    }
  }, [paragraph.text, paragraph.id]);

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

  /* ---------- INSCRIPT EXAM INPUT ---------- */
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

      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (paused) return;

      // ✅ CREATE SESSION ONLY ON FIRST KEYSTROKE

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

      // English / Numbers / Code — Exam Safe
      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
        startTimer();

        input(e.key);
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: true });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [practiceMode, input]);

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

  /* ---------- STATS ---------- */
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

  useEffect(() => {
    if (!finished) return;
    if (hasSubmittedRef.current) return;

    hasSubmittedRef.current = true;

    queueMicrotask(() => {
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

      // ✅ ALWAYS store result first (prevents blank screen)
      useTypingStore.getState().setLastResult(payload);

      // ⚠️ If too short, skip backend but STILL show result
      if (stats.elapsedMs < 5000) {
        console.warn("Test too short — skipping submit");

        if (sessionId) {
          router.push(`/test/result?id=${sessionId}`);
        } else {
          router.push(`/test/result`);
        }
        return;
      }

      try {
        if (sessionId && session?.user?.id) {
          saveResultMutation.mutate(
            {
              sessionId,
              keystrokes: keystrokes.map((k) => ({
                key: k.key,
                time: k.time,
                correct: k.correct,
              })),
              wpmTimeline: [],
              backspaces: keystrokes.filter((k) => k.key === "Backspace")
                .length,
            },
            {
              onSuccess: () => {
                if (sessionId) {
                  router.push(`/test/result?id=${sessionId}`);
                } else {
                  router.push(`/test/result`);
                }
              },
              onError: (err) => {
                console.error("Save failed:", err);

                // ✅ STILL go to result (fallback will show)
                if (sessionId) {
                  router.push(`/test/result?id=${sessionId}`);
                } else {
                  router.push(`/test/result`);
                }
              },
            },
          );
        } else {
          console.warn("Missing sessionId or userId");

          // ✅ allow guest result view
          if (sessionId) {
            router.push(`/test/result?id=${sessionId}`);
          } else {
            router.push(`/test/result`);
          }
        }
      } catch (e) {
        console.error("Unexpected error:", e);

        // ✅ never block result screen
        if (sessionId) {
          router.push(`/test/result?id=${sessionId}`);
        } else {
          router.push(`/test/result`);
        }
      }
    });
  }, [finished]);

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

  return (
    <>
      {/* LANGUAGE BAR */}
      <div className="border-b border-slate-800">
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
    flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border transition
    ${
      active
        ? "border-blue-500 text-blue-400 bg-blue-500/10"
        : "border-transparent hover:text-white hover:bg-white/5"
    }
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

      {/* MAIN */}
      <div className="flex flex-col pt-2 sm:pt-4 h-[calc(100vh-56px)] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col h-full">
          {/* SCROLL AREA */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1">
            {/* STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 min-h-[90px]">
              <Stat
                label="WPM"
                value={liveStats.wpm}
                color="text-emerald-400"
              />
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

            {showExamNotice && (
              <div className="mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
                <div className="font-semibold mb-1">Exam Mode Notice</div>
                This mode uses the official InScript keyboard layout.
                <br />
                Phonetic typing is disabled.
                <br />
                Required for government & institutional exams.
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
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="relative bg-slate-900 rounded-2xl border border-slate-800 h-[160px] sm:h-[180px] overflow-hidden px-4 sm:px-8 py-4 sm:py-6 shadow-2xl cursor-text">
                {paused && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
                    <div className="text-white/80 text-sm tracking-wide">
                      Paused — Press Esc to resume
                    </div>
                  </div>
                )}

                <div className="absolute top-3 left-4 flex items-center gap-2 text-xs text-white/40">
                  <Activity size={14} className="text-emerald-400" />
                  Live Typing
                </div>

                <div className="flex items-center h-full w-full overflow-hidden">
                  <TypingParagraph
                    text={text}
                    index={index}
                    wrongIndexes={wrongIndexes}
                  />
                </div>

                {/* InScript Reference Panel */}
                {(practiceMode === "hindi" || practiceMode === "marathi") && (
                  <details className="absolute bottom-3 right-4 text-xs text-white/50 text-right">
                    <summary className="cursor-pointer text-white/70 hover:text-white transition">
                      ⌨ InScript Layout
                    </summary>

                    <div className="mt-2 space-y-1 font-mono bg-slate-800/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-700">
                      <div>K → क</div>
                      <div>Shift + K → ख</div>
                      <div>/ → ् (Halant)</div>
                      <div>D + / + R → द्र</div>
                    </div>
                  </details>
                )}
              </div>
              <div className="sticky bottom-0 z-40 bg-[#0b1220] pt-3 pb-4">
                {" "}
                <Keyboard
                  expectedKey={graphemes[index]}
                  lastCorrect={derivedLastCorrect}
                />
              </div>
            </div>
          </div>

          {/* <ErrorBar errors={errors} /> */}
        </div>
      </div>
    </>
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
    <div className="bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700 flex flex-col items-center">
      <span className="text-slate-400 text-xs uppercase tracking-widest">
        {label}
      </span>
      <span className={`text-2xl sm:text-4xl font-black ${color} tabular-nums`}>
        {value}
      </span>
    </div>
  );
}
