"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ResultScreen from "@/components/typing/ResultScreen";
import { useTypingStore } from "@/store/typingStore";

export default function ResultClient() {
  const params = useSearchParams();
  const router = useRouter();

  const id = params.get("id");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const lastResult = useTypingStore((s) => s.lastResult);

  const setNavigating = useTypingStore((s) => s.setNavigating);

  useEffect(() => {
    if (!id) {
      router.replace("/test");
      return;
    }

    let cancelled = false;

    fetch(`/api/v1/typing/session/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((res) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch((err) => {
        console.error("Result fetch failed:", err);
        // ❌ no redirect — fallback will handle UI
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  useEffect(() => {
    // 🔥 UNLOCK UI when result page loads
    setNavigating(false);

    return () => {
      // 🔥 safety unlock (important for fast navigation)
      setNavigating(false);
    };
  }, []);

  useEffect(() => {
    setNavigating(false);
  }, []);

  /* ---------------- PRIORITY: ALWAYS SHOW LAST RESULT FIRST ---------------- */
  if (lastResult) {
    return (
      <ResultScreen
        stats={lastResult.stats}
        practiceMode={lastResult.practiceMode}
        paragraph={lastResult.paragraph}
        ghostReplay={lastResult.keystrokes.map((k) => ({ time: k.time }))}
        onRetry={() => {
          const store = useTypingStore.getState();
          store.restartTest();
          router.replace("/test");
        }}
        onNext={() => {
          const store = useTypingStore.getState();

          // ✅ only reset typing progress (NOT text)
          store.restartTest();

          router.replace("/test");
        }}
      />
    );
  }

  /* ---------------- SERVER DATA (OPTIONAL OVERRIDE) ---------------- */
  if (data) {
    return (
      <ResultScreen
        stats={data.stats}
        practiceMode={data.practiceMode}
        paragraph={data.paragraph}
        ghostReplay={data.keystrokes?.map((k: any) => ({ time: k.time })) || []}
        onRetry={() => {
          const store = useTypingStore.getState();
          store.restartTest();
          router.replace("/test");
        }}
        onNext={() => {
          const store = useTypingStore.getState();

          // ✅ only reset typing progress (NOT text)
          store.restartTest();

          router.replace("/test");
        }}
      />
    );
  }

  /* ---------------- PRIORITY 3: LOADING ---------------- */
  return (
    <div className="text-center mt-10 text-white/50">Loading result...</div>
  );
}
