"use client";

import { motion } from "framer-motion";

export default function RewardPopup({
  xp,
  badge,
}: {
  xp?: number;
  badge?: string;
}) {
  return (
    <div className="fixed top-6 right-6 space-y-3 z-50">
      {xp && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500 text-black px-4 py-2 rounded-xl font-bold shadow-lg"
        >
          ⚡ +{xp} XP
        </motion.div>
      )}

      {badge && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg"
        >
          🏆 {badge}
        </motion.div>
      )}
    </div>
  );
}