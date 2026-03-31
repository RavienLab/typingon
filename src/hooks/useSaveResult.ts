import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSaveResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        attemptId: crypto.randomUUID(),
      };

      const res = await fetch("/api/v1/typing/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to save result");
      }

      return res.json();
    },

    // 🔥 THIS IS THE MAGIC
    onSuccess: (data) => {
      // ⚡ instant UI update
      queryClient.setQueryData(["user"], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          currentStreak: data?.streak ?? old.currentStreak,
        };
      });

      // 🔄 force refetch (sync with backend)
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
    },
  });
}
