"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";

/* -------------------- TYPES -------------------- */

type Difficulty = "easy" | "medium" | "hard";
type Length = "short" | "medium" | "long";
export type PracticeMode = "english" | "numbers" | "code" | "hindi" | "marathi";

type Paragraph = {
  id: string;
  text: string;
  difficulty: Difficulty;
};

type ParagraphContextType = {
  length: Length;
  paragraph: Paragraph;

  practiceMode: PracticeMode;
  setPracticeMode: (m: PracticeMode) => void;

  setLength: (l: Length) => void;
  nextParagraph: () => void;
};

/* -------------------- TEXT BANKS -------------------- */

const ENGLISH: Record<Length, Paragraph[]> = {
  short: [
    {
      id: "en-short-1",
      text: "The art of programming is the art of organizing complexity, of mastering a multitude of intricate details, and of defining abstractions that remain valid across different contexts.",
      difficulty: "medium",
    },
  ],
  medium: [
    {
      id: "en-medium-1",
      text: "Software engineering is more than just writing code; it is a discipline of problem-solving and architectural design. Great developers focus on readability, maintainability, and the long-term impact of their technical decisions on the overall system health.",
      difficulty: "medium",
    },
    {
      id: "en-medium-2",
      text: "In the world of startups, speed is often prioritized over perfection. However, the most successful products are those that manage to balance rapid iteration with a solid foundational architecture that can scale as the user base grows exponentially.",
      difficulty: "medium",
    },
  ],
  long: [
    {
      id: "en-long-1",
      text: "Persistence is the most vital trait for any engineer. Building a production-level application requires hours of debugging, deep-diving into documentation, and the willingness to rewrite entire modules to achieve the desired performance. It is a marathon of focus where the reward is a seamless user experience and a robust, reliable product that stands the test of time and scale.",
      difficulty: "hard",
    },
  ],
};

const NUMBERS: Paragraph[] = [
  {
    id: "num-1",
    text: "0123456789 9876543210",
    difficulty: "easy",
  },
  {
    id: "num-2",
    text: "4 + 4 = 8 and 10 - 2 = 8.",
    difficulty: "easy",
  },
  {
    id: "num-3",
    text: "Call 911 for emergencies. 24/7 support available.",
    difficulty: "medium",
  },
  {
    id: "num-4",
    text: "The year was 1995 and the price was $5.99.",
    difficulty: "medium",
  },
];

const CODE: Paragraph[] = [
  {
    id: "code-1",
    text: "function sum(a, b) { return a + b; }",
    difficulty: "medium",
  },
  {
    id: "code-2",
    text: "const arr = [1,2,3].map(x => x * 2);",
    difficulty: "medium",
  },
  {
    id: "code-3",
    text: "<div className='container'>Hello</div>",
    difficulty: "medium",
  },
];

const HINDI: Paragraph[] = [
  {
    id: "hi-1",
    text: "नमस्ते दुनिया यह एक टाइपिंग परीक्षण है",
    difficulty: "easy",
  },
  {
    id: "hi-2",
    text: "सफलता अभ्यास से आती है",
    difficulty: "easy",
  },
];

const MARATHI: Paragraph[] = [
  {
    id: "mr-1",
    text: "नमस्कार जग हे एक टायपिंग चाचणी आहे",
    difficulty: "easy",
  },
  {
    id: "mr-2",
    text: "सरावाने यश मिळते",
    difficulty: "easy",
  },
  {
    id: "mr-3",
    text: "सातत्याने मेहनत केल्याने प्रगती होते",
    difficulty: "medium",
  },
];

/* -------------------- CONTEXT -------------------- */

const ParagraphContext = createContext<ParagraphContextType | null>(null);

/* -------------------- PROVIDER -------------------- */

export function ParagraphProvider({ children }: { children: ReactNode }) {
  const [length, setLengthState] = useState<Length>("medium");
  const [index, setIndex] = useState(0);
  const [practiceMode, setPracticeModeState] = useState<PracticeMode>(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("practiceMode") as PracticeMode) || "english"
      );
    }
    return "english";
  });

  /* ---------- PARAGRAPH ---------- */

  const paragraph = useMemo<Paragraph>(() => {
    if (practiceMode === "numbers") {
      return NUMBERS[index % NUMBERS.length];
    }

    if (practiceMode === "code") {
      return CODE[index % CODE.length];
    }

    if (practiceMode === "hindi") {
      return HINDI[index % HINDI.length];
    }

    if (practiceMode === "marathi") {
      return MARATHI[index % MARATHI.length];
    }

    // English
    return ENGLISH[length][index % ENGLISH[length].length];
  }, [practiceMode, length, index]);

  /* ---------- ACTIONS ---------- */

  const setPracticeMode = (m: PracticeMode) => {
    setPracticeModeState(m);
    localStorage.setItem("practiceMode", m);
    setIndex((i) => i + 1);
  };

  const setLength = (l: Length) => {
    setLengthState(l);
    setIndex(0);
  };

  const nextParagraph = () => {
    setIndex((i) => i + 1);
  };

  return (
    <ParagraphContext.Provider
      value={{
        length,
        paragraph,
        practiceMode,
        setPracticeMode,
        setLength,
        nextParagraph,
      }}
    >
      {children}
    </ParagraphContext.Provider>
  );
}

/* -------------------- HOOK -------------------- */

export function useParagraph() {
  const ctx = useContext(ParagraphContext);
  if (!ctx) {
    throw new Error("useParagraph must be used inside ParagraphProvider");
  }
  return ctx;
}
