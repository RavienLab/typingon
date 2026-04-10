"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";

export type PracticeMode = "english" | "numbers" | "code" | "hindi" | "marathi";

type Paragraph = {
  id: string;
  text: string;
  difficulty: string;
};

type ParagraphContextType = {
  paragraph: Paragraph | null;
  sessionId: string | null; // 🔥 Added this
  practiceMode: PracticeMode;
  setPracticeMode: (m: PracticeMode) => void;
  nextParagraph: () => void;
  loading: boolean;
};

const ParagraphContext = createContext<ParagraphContextType | null>(null);

export function ParagraphProvider({ children }: { children: ReactNode }) {
  const [paragraph, setParagraph] = useState<Paragraph | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [practiceMode, setPracticeModeState] =
    useState<PracticeMode>("english");

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("practiceMode") as PracticeMode;
    if (saved) setPracticeModeState(saved);
  }, []);

  const fetchNewParagraph = useCallback(async (mode: PracticeMode) => {
    setLoading(true);
    setParagraph(null); // Clear old text so UI knows we are loading

    try {
      const res = await fetch("/api/v1/typing/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceMode: mode }), // Match backend's expected key
      });

      const data = await res.json();

      if (data.paragraph) {
        setParagraph(data.paragraph);
        setSessionId(data.sessionId);
      }
    } catch (err) {
      console.error("❌ Failed to fetch paragraph:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger fetch whenever mode changes
  useEffect(() => {
    fetchNewParagraph(practiceMode);
  }, [practiceMode, fetchNewParagraph]);


  const setPracticeMode = (m: PracticeMode) => {
    if (m === practiceMode) {
      // If clicking the same mode, force a refresh
      fetchNewParagraph(m);
    } else {
      setPracticeModeState(m);
      localStorage.setItem("practiceMode", m);
      // The useEffect will trigger fetchNewParagraph because practiceMode changed
    }
  };

  const nextParagraph = () => {
    fetchNewParagraph(practiceMode);
  };

  return (
    <ParagraphContext.Provider
      value={{
        paragraph,
        sessionId, // 🔥 Expose the sessionId
        practiceMode,
        setPracticeMode,
        nextParagraph,
        loading,
      }}
    >
      {children}
    </ParagraphContext.Provider>
  );
}

export function useParagraph() {
  const ctx = useContext(ParagraphContext);
  if (!ctx)
    throw new Error("useParagraph must be used inside ParagraphProvider");
  return ctx;
}
