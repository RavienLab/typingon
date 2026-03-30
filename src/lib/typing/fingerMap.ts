export type FingerCode =
  | "LP" // Left Pinky
  | "LR" // Left Ring
  | "LM" // Left Middle
  | "LI" // Left Index
  | "RI" // Right Index
  | "RM" // Right Middle
  | "RR" // Right Ring
  | "RP" // Right Pinky
  | "THUMB";

export const FINGER_MAP: Record<string, FingerCode> = {
  // ----------------
  // Left Hand
  // ----------------
  q: "LP",
  a: "LP",
  z: "LP",

  w: "LR",
  s: "LR",
  x: "LR",

  e: "LM",
  d: "LM",
  c: "LM",

  r: "LI",
  f: "LI",
  v: "LI",
  t: "LI",
  g: "LI",
  b: "LI",

  // ----------------
  // Right Hand
  // ----------------
  y: "RI",
  h: "RI",
  n: "RI",
  u: "RI",
  j: "RI",
  m: "RI",

  i: "RM",
  k: "RM",
  ",": "RM",

  o: "RR",
  l: "RR",
  ".": "RR",

  p: "RP",
  ";": "RP",
  "/": "RP",

  // ----------------
  // Thumb
  // ----------------
  " ": "THUMB",
};
