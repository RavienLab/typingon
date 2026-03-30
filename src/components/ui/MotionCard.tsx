"use client";

import { useMotion } from "@/components/MotionProvider";

export function MotionCard({ children }: { children: React.ReactNode }) {
  const { motion } = useMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="card"
    >
      {children}
    </motion.div>
  );
}
