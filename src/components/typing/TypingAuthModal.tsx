"use client";

import { X } from "lucide-react";
import { signIn } from "next-auth/react";

export default function TypingAuthModal({
  open,
  onClose,
  onGuest,
}: {
  open: boolean;
  onClose: () => void;
  onGuest: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-slate-900 w-[420px] rounded-2xl p-6 relative border border-slate-800">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold mb-2">Join Typing ON</h2>

        <p className="text-white/60 mb-6">
          Track your progress, compete on leaderboards, and unlock pro features.
        </p>

        {/* Google (future hook) */}
        <button
          onClick={() => {
            localStorage.removeItem("guest");

            signIn("google", {
              callbackUrl: "/test",
            });
          }}
          className="w-full bg-white text-black py-3 rounded-lg font-semibold"
        >
          Continue with Google
        </button>

        {/* Guest */}
        <button
          onClick={onGuest}
          className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-lg font-semibold"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
