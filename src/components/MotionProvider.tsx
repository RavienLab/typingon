"use client";

import { createContext, useContext } from "react";
import * as Framer from "framer-motion";

type MotionContextType = {
  motion: typeof Framer.motion;
  AnimatePresence: typeof Framer.AnimatePresence;
};

const MotionContext = createContext<MotionContextType | null>(null);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionContext.Provider
      value={{
        motion: Framer.motion,
        AnimatePresence: Framer.AnimatePresence,
      }}
    >
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error("useMotion must be used inside <MotionProvider>");
  }
  return ctx;
}
