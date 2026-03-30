"use client";
import { useState } from "react";

export function AiParagraphModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [prompt, setPrompt] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-white/20 rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-sm uppercase tracking-widest text-white/70 mb-4">
          AI Paragraph
        </h2>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-black border border-white/20 text-white p-3 rounded
                     focus:outline-none focus:border-white/50"
          rows={4}
          placeholder="Describe the paragraph you want..."
        />

        <div className="flex justify-end gap-3 mt-4 text-xs">
          <button onClick={onClose} className="text-white/50 hover:text-white">
            Cancel
          </button>
          <button
            onClick={() => {
              onSubmit(prompt);
              onClose();
            }}
            className="border border-white px-3 py-1 rounded hover:bg-white hover:text-black"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
