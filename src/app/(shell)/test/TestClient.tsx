"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useTypingStore } from "@/store/typingStore";
import { useParagraph } from "@/components/typing/ParagraphProvider";
import { Keyboard } from "@/components/typing/Keyboard";
import { Globe, Hash, Code2, Languages, Loader2 } from "lucide-react";
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

/* ---------------- STATS CALCULATION ---------------- */
function calculateStats({
  index,
  keystrokes,
  elapsedMs,
}: {
  index: number;
  keystrokes: any[];
  elapsedMs: number;
}) {
  if (elapsedMs < 1000) return { wpm: 0, rawWpm: 0, accuracy: 100 };
  const minutes = elapsedMs / 60000;
  let correctChars = 0;
  for (let i = 0; i < index; i++) {
    if (keystrokes[i]?.correct) correctChars++;
  }
  return {
    wpm: Math.round(correctChars / 5 / minutes),
    rawWpm: Math.round(index / 5 / minutes),
    accuracy: index > 0 ? Math.round((correctChars / index) * 100) : 100,
  };
}

export default function TypingTest() {
  const saveResultMutation = useSaveResult();
  const { text, index, errors, keystrokes, finished, startTest, input } =
    useTypingStore();
  const { data: session } = useSession();
  const router = useRouter();

  // 🔥 UPDATED: Get sessionId and loading state from Provider
  const { paragraph, sessionId, practiceMode, setPracticeMode, loading } =
    useParagraph();

  const [displayElapsedMs, setDisplayElapsedMs] = useState(0);
  const timerStartRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const hasSubmittedRef = useRef(false);

  const isNavigating = useTypingStore((s) => s.isNavigating);
  const setNavigating = useTypingStore((s) => s.setNavigating);

  const startTimer = () => {
    if (!timerStartRef.current) timerStartRef.current = Date.now();
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    router.prefetch("/test/result");
  }, [router]);

  // 🔥 UPDATED: Watch the whole paragraph object, not just the text
  useEffect(() => {
    if (!paragraph) return; // Wait for the object to exist

    // 1. Force clear the store
    useTypingStore.setState({
      index: 0,
      errors: 0,
      keystrokes: [],
      finished: false,
    });

    // 2. Reset local refs
    timerStartRef.current = null;
    setDisplayElapsedMs(0);
    hasSubmittedRef.current = false;
    setLiveStats({ wpm: 0, rawWpm: 0, accuracy: 100, elapsedMs: 0 });

    // 3. Start test
    if (paragraph.text) {
      startTest(paragraph.text);
      console.log("🚀 Test reset with Paragraph ID:", paragraph.id);
    }
  }, [paragraph, startTest]); // 👈 Changed from paragraph.text to paragraph

  const stateRef = useRef({ text, index, paused });
  useEffect(() => {
    stateRef.current = { text, index, paused };
  }, [text, index, paused]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { paused } = stateRef.current;

      if ([" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setPaused((p) => !p);
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey || paused) return;

      // 🔥 CLEANUP: Removed the fetch() call that was here.
      // The session is now handled entirely by ParagraphProvider.

      if (practiceMode === "hindi" || practiceMode === "marathi") {
        if (e.code === "Backspace") {
          e.preventDefault();
          return;
        }
        const char = INSCRIPT_MAP[e.shiftKey ? `Shift+${e.code}` : e.code];
        if (!char) return;
        startTimer();
        input(char);
        return;
      }

      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
        e.preventDefault();
        startTimer();
        input(e.key);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [practiceMode, input]);

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
  }, [index, keystrokes, paused, finished]);

  useEffect(() => {
    if (!finished || hasSubmittedRef.current || !sessionId) return;

    const handleFinish = () => {
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

      useTypingStore.getState().setLastResult(payload);

      setTimeout(() => {
        setNavigating(true);
        router.push(`/test/result?id=${sessionId}`);
      }, 100);

      if (session?.user?.id && stats.elapsedMs >= 1000) {
        saveResultMutation.mutate({
          sessionId: sessionId,
          keystrokes,
          wpmTimeline: [],
          backspaces: keystrokes.filter((k) => k.key === "Backspace").length,
        });
      }
    };

    handleFinish();
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
  useEffect(() => {
    const interval = setInterval(() => {
      inputRef.current?.focus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  const wrongIndexes = useMemo(() => {
    const map = new Set<number>();
    keystrokes.forEach((k, i) => {
      if (!k.correct) map.add(i);
    });
    return map;
  }, [keystrokes]);

  const graphemes = useMemo(() => Array.from(text), [text]);

  if (isNavigating) return <div className="h-screen w-full bg-[#0b1220]" />;

  // 🔥 ADDED: Professional Loading State
  if (loading || !paragraph) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0b1220] text-white/50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-xs uppercase tracking-[0.3em] font-black">
          Fetching Paragraph...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1220] overflow-x-hidden">
      <input
        ref={inputRef}
        className="absolute opacity-0"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => {
          const value = e.target.value;

          // 🔥 BACKSPACE FIX
          if (value.length === 0) {
            input("Backspace");
            return;
          }

          const char =
            value[value.length - 1] === "\n"
              ? "Enter"
              : value[value.length - 1];

          startTimer();
          input(char);

          e.target.value = "";
        }}
      />
      {/* 1. HEADER */}
      <div className="shrink-0 flex items-center pt-2 pb-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex gap-2 overflow-x-auto no-scrollbar text-xs uppercase tracking-wider text-white/50">
            {MODES.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                disabled={index > 0}
                onClick={() => setPracticeMode(value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition shrink-0 ${
                  value === practiceMode
                    ? "border-blue-500 text-blue-400 bg-blue-500/10"
                    : "border-transparent hover:text-white"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MAIN SECTION */}
      <main className="flex-1 flex flex-col items-center justify-start w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12">
        <div className="relative w-full shrink-0 min-h-[180px] sm:min-h-[240px] md:min-h-[280px] mb-6 sm:mb-8">
          <div
            onClick={() => inputRef.current?.focus()}
            className="relative h-full bg-slate-900/40 rounded-[2rem] border border-slate-800/60 shadow-2xl overflow-hidden cursor-text"
          >
            {paused && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
                <div className="text-white/90 text-sm font-bold tracking-[0.3em] uppercase bg-slate-800/80 px-8 py-4 rounded-full border border-white/10">
                  Paused
                </div>
              </div>
            )}

            <div className="absolute top-5 left-8 z-30 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-400/70 font-black">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Session
            </div>

            <div className="relative h-full w-full px-4 sm:px-8 md:px-16">
              <div
                className="transition-all duration-500 ease-out"
                style={{
                  transform: `translateY(-${Math.max(0, (Math.floor(index / 55) - 1) * 60)}px)`,
                }}
              >
                <div className="pt-20 pb-20">
                  <div
                    className="text-lg sm:text-2xl md:text-3xl lg:text-4xl leading-relaxed tracking-wide text-left text-slate-100 font-medium"
                    style={{
                      wordBreak: "normal",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <TypingParagraph
                      text={text}
                      index={index}
                      wrongIndexes={wrongIndexes}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0b1220] via-[#0b1220]/40 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/40 to-transparent z-20 pointer-events-none" />
          </div>
        </div>

        {/* 3. KEYBOARD */}
        <div className="w-full shrink-0 flex items-center justify-center py-4 sm:py-6">
          <Keyboard
            expectedKey={graphemes[index]}
            lastCorrect={keystrokes[keystrokes.length - 1]?.correct}
          />
        </div>
      </main>
    </div>
  );
}
