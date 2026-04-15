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

  const [lastIds, setLastIds] = useState<string[]>([]);
  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("practiceMode") as PracticeMode;
    if (saved) setPracticeModeState(saved);
  }, []);

  const fetchNewParagraph = useCallback(
    async (mode: PracticeMode, excludeId?: string) => {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/typing/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // 🔥 Now passing the excludeId to the API
          body: JSON.stringify({
            practiceMode: mode,
            excludeId,
            lastIds,
          }),
        });

        const data = await res.json();
        if (data.paragraph) {
          const newId = data.paragraph.id;

          setParagraph(data.paragraph);
          setSessionId(data.sessionId);

          setLastIds((prev) => {
            const updated = [newId, ...prev];
            return updated.slice(0, 5); // keep only last 5
          });
        }
      } catch (err) {
        console.error("❌ Failed to fetch paragraph:", err);
      } finally {
        setLoading(false);
      }
    },
    [lastIds],
  );

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
      setLastIds([]);
      localStorage.setItem("practiceMode", m);
      // The useEffect will trigger fetchNewParagraph because practiceMode changed
    }
  };

  // 🔥 nextParagraph now passes the current ID to ensure a DIFFERENT one is picked
  const nextParagraph = () => {
    fetchNewParagraph(practiceMode, paragraph?.id);
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
