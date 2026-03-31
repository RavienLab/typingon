import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSaveResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        attemptId: crypto.randomUUID(), // 🔥 ADD THIS
      };

      const res = await fetch("/api/results", {
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

    // 🔥 keeps UI fresh everywhere
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["xp"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
