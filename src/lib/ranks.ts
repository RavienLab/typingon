export function getRank(wpm: number) {
  if (wpm >= 120) return { name: "Legend", color: "text-yellow-400" };
  if (wpm >= 100) return { name: "Master", color: "text-purple-400" };
  if (wpm >= 80) return { name: "Diamond", color: "text-blue-400" };
  if (wpm >= 60) return { name: "Gold", color: "text-amber-400" };
  if (wpm >= 40) return { name: "Silver", color: "text-gray-300" };
  return { name: "Bronze", color: "text-orange-400" };
}
