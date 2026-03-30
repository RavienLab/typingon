"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ProLock({
  isPro,
  children,
}: {
  isPro: boolean;
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(isPro);

  useEffect(() => {
    if (isPro) {
      // delay unlock animation slightly
      setTimeout(() => setUnlocked(true), 150);
    }
  }, [isPro]);

  return (
    <div className="relative">
      <motion.div
        animate={{
          opacity: unlocked ? 1 : 0.4,
          scale: unlocked ? 1 : 0.98,
        }}
        transition={{ duration: 0.4 }}
        className={unlocked ? "" : "pointer-events-none"}
      >
        {children}
      </motion.div>

      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/40 px-4 py-2 rounded-lg text-sm text-white/70">
            🔒 PRO Feature
          </div>
        </div>
      )}
    </div>
  );
}