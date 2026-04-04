"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);

      // show popup after delay (better UX)
      setTimeout(() => {
        setVisible(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || !visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50">
      <span className="text-sm text-white">
        Install TypingON for better experience
      </span>

      <button
        onClick={() => prompt.prompt()}
        className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
      >
        Install
      </button>

      <button
        onClick={() => setVisible(false)}
        className="text-white/50 hover:text-white text-sm"
      >
        ✕
      </button>
    </div>
  );
}