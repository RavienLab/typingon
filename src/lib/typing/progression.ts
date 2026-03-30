export type Level =
  | "Novice"
  | "Apprentice"
  | "Adept"
  | "Expert"
  | "Master";

export const LEVELS: { level: Level; xp: number }[] = [
  { level: "Novice", xp: 0 },
  { level: "Apprentice", xp: 500 },
  { level: "Adept", xp: 1500 },
  { level: "Expert", xp: 3500 },
  { level: "Master", xp: 7000 },
];

export function getLevel(totalXp: number): Level {
  let current: Level = "Novice";
  for (const l of LEVELS) {
    if (totalXp >= l.xp) current = l.level;
  }
  return current;
}

export type Progression = {
  totalXp: number;
  level: Level;
};

export const PROGRESSION_KEY = "typingon:progression";
