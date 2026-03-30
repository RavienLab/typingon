"use client";

import { useTypingStore } from "@/store/typingStore";
import ResultScreen from "@/components/typing/ResultScreen";
import { useRouter } from "next/navigation";
import { useParagraph } from "@/components/typing/ParagraphProvider";
import { useEffect } from "react";

export default function ResultPage() {
  const lastResult = useTypingStore((s) => s.lastResult);
  const router = useRouter();
  const { nextParagraph } = useParagraph();

  // ✅ SAFE redirect after mount
  useEffect(() => {
    if (!lastResult) {
      router.replace("/test");
    }
  }, [lastResult, router]);


  // prevent render until redirect decision
  if (!lastResult) return null;

  const previousWpm =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("typing_last_result_prev") || "null")
          ?.stats?.wpm
      : null;

  return (
    <ResultScreen
      stats={lastResult.stats}
      practiceMode={lastResult.practiceMode}
      paragraph={lastResult.paragraph}
      ghostReplay={lastResult.keystrokes.map((k) => ({ time: k.time }))}
      onRetry={() => {
        useTypingStore.getState().restartTest();
        router.replace("/test");
      }}
      onNext={() => {
        nextParagraph();
        useTypingStore.getState().reset();
        router.replace("/test");
      }}
    />
  );
}
