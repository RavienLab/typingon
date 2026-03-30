"use client";

import { useMotion } from "@/components/MotionProvider";

export function PageMotion({ children }: { children: React.ReactNode }) {
  const { motion } = useMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
