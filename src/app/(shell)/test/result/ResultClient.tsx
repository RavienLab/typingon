"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ResultScreen from "@/components/typing/ResultScreen";
import { useTypingStore } from "@/store/typingStore";
import { useParagraph } from "@/components/typing/ParagraphProvider"; // ✅ Added to cycle text

export default function ResultClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { nextParagraph } = useParagraph(); // ✅ Destructure the cycler

  const id = params.get("id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const lastResult = useTypingStore((s) => s.lastResult);
  const setNavigating = useTypingStore((s) => s.setNavigating);

  /* ---------- DATA FETCHING ---------- */
  useEffect(() => {
    // 🔥 THE SILENCER: If data exists in the Zustand store, skip the fetch entirely.
    // This prevents the 404 logs because we don't even call the API.
    if (lastResult) {
      setLoading(false);
      return;
    }

    // 1. If we don't have local data AND the ID is generic, wait for sync
    if (!id || id === "null" || id === "latest") {
      const syncTimer = setTimeout(() => {
        // Final check: if store is still empty after 300ms, go back to test
        if (!useTypingStore.getState().lastResult) {
          router.replace("/test");
        }
      }, 300);
      return () => clearTimeout(syncTimer);
    }

    let cancelled = false;

    // 2. Only run fetch if we are actually missing local data (e.g., page refresh)
    fetch(`/api/v1/typing/session/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not Found");
        return res.json();
      })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        /* Silent fail: Fallback handled by UI showing empty stats */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, lastResult, router]);

  /* ---------- UI LOCK MANAGEMENT ---------- */
  useEffect(() => {
    // 🔥 UNLOCK UI when result page loads to ensure navigation works
    setNavigating(false);
    return () => setNavigating(false);
  }, [setNavigating]);

  /* ---------- HANDLERS ---------- */
  /* ---------- HANDLERS ---------- */
  const handleNext = () => {
    // 1. Aggressively clear the Zustand store
    const store = useTypingStore.getState();
    store.reset(); // Wipe all previous keystrokes/WPM

    // 2. Clear local data
    setData(null);

    // 3. 🔥 Trigger the ParagraphProvider to fetch the NEW paragraph
    nextParagraph();

    // 4. Move back to the test page
    // We use setTimeout to let the state updates settle for a millisecond
    setTimeout(() => {
      router.replace("/test");
    }, 10);
  };

  const handleRetry = () => {
    const store = useTypingStore.getState();
    // Reset typing progress but keep the SAME paragraph text
    store.restartTest();
    router.replace("/test");
  };

  /* ---------- RENDER LOGIC ---------- */

  // 1. PRIORITY: Local store (instant display)
  if (lastResult) {
    return (
      <ResultScreen
        stats={lastResult.stats}
        practiceMode={lastResult.practiceMode}
        paragraph={lastResult.paragraph}
        ghostReplay={lastResult.keystrokes.map((k) => ({ time: k.time }))}
        onRetry={handleRetry}
        onNext={handleNext}
      />
    );
  }

  // 2. FALLBACK: Server data (historical view)
  if (data) {
    return (
      <ResultScreen
        stats={data.stats}
        practiceMode={data.practiceMode}
        paragraph={data.paragraph}
        ghostReplay={data.keystrokes?.map((k: any) => ({ time: k.time })) || []}
        onRetry={handleRetry}
        onNext={handleNext}
      />
    );
  }

  // 3. LOADING STATE
  return (
    <div className="text-center mt-10 text-white/50">Loading result...</div>
  );
}
