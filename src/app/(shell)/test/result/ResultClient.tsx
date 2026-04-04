"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ResultScreen from "@/components/typing/ResultScreen";

export default function ResultClient() {
  const params = useSearchParams();
  const router = useRouter();

  const id = params.get("id");

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      router.replace("/test");
      return;
    }

    fetch(`/api/v1/typing/session/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then(setData)
      .catch(() => {
        router.replace("/test");
      });
  }, [id]);

  if (!data) return null;

  return (
    <ResultScreen
      stats={data.stats}
      practiceMode={data.practiceMode}
      paragraph={data.paragraph}
      ghostReplay={data.keystrokes?.map((k: any) => ({ time: k.time })) || []}
      onRetry={() => router.replace("/test")}
      onNext={() => router.replace("/test")}
    />
  );
}