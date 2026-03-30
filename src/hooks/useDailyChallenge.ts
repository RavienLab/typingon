import { useQuery } from "@tanstack/react-query";

export function useDailyChallenge() {
  return useQuery({
    queryKey: ["daily-challenge"],
    queryFn: async () => {
      const res = await fetch("/api/v1/challenge/today");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });
}
