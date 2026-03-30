// Hindi + Marathi InScript — Exam Mode
// Uses event.code ONLY (hardware keys)

export const INSCRIPT_MAP: Record<string, string> = {
  /* ================= CONSONANTS ================= */
  KeyK: "क",
  "Shift+KeyK": "ख",

  KeyG: "ग",
  "Shift+KeyG": "घ",

  KeyC: "च",
  "Shift+KeyC": "छ",

  KeyJ: "ज",
  "Shift+KeyJ": "झ",

  KeyT: "त",
  "Shift+KeyT": "थ",

  KeyD: "द",
  "Shift+KeyD": "ध",

  KeyN: "न",
  "Shift+KeyN": "ण",

  KeyP: "प",
  "Shift+KeyP": "फ",

  KeyB: "ब",
  "Shift+KeyB": "भ",

  KeyM: "म",

  KeyY: "य",
  KeyR: "र",
  KeyL: "ल",
  "Shift+KeyL": "ळ",

  KeyV: "व",

  KeyS: "स",
  "Shift+KeyS": "श",

  KeyH: "ह",

  "Shift+KeyQ": "ष",
  "Shift+KeyW": "ञ",

  /* ================= VOWELS ================= */
  KeyQ: "अ",
  KeyW: "आ",

  KeyE: "इ",
  "Shift+KeyE": "ई",

  KeyU: "उ",
  "Shift+KeyU": "ऊ",

  KeyI: "ऋ",
  "Shift+KeyI": "ॠ",

  KeyO: "ए",
  "Shift+KeyO": "ऐ",

  KeyA: "ओ",
  "Shift+KeyA": "औ",

  /* ================= MATRAS ================= */
  Digit1: "ा",
  Digit2: "ि",
  Digit3: "ी",
  Digit4: "ु",
  Digit5: "ू",
  Digit6: "े",
  Digit7: "ै",
  Digit8: "ो",
  Digit9: "ौ",

  "Shift+Digit2": "ृ",
  "Shift+Digit3": "ॄ",

  /* ================= HALANT & SIGNS ================= */
  Slash: "्",              // Halant
  Comma: "ं",              // Anusvara
  "Shift+Comma": "ँ",      // Chandrabindu
  BracketRight: "ः",       // Visarga
  Backquote: "़",          // Nukta

  /* ================= PUNCTUATION ================= */
  Period: "।",
  "Shift+Period": "॥",

  /* ================= DIGITS ================= */
  Digit0: "०",
  Minus: "१",
  Equal: "२",
  BracketLeft: "३",
  Backslash: "४",
  Semicolon: "५",
  Quote: "६",
  IntlBackslash: "७",
  "Shift+Slash": "८",
  "Shift+Equal": "९",

  /* ================= SPACE ================= */
  Space: " ",
};
