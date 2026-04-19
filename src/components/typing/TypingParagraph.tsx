"use client";

import { useEffect, useRef } from "react";

type Props = {
  text: string;
  index: number;
  wrongIndexes: Set<number>;
};

export default function TypingParagraph({ text, index, wrongIndexes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<HTMLSpanElement[]>([]);

  // 1. Build Paragraph Structure
  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    spanRefs.current = [];

    const frag = document.createDocumentFragment();
    const words = text.split(" ");

    words.forEach((word, wordIndex) => {
      const wordWrapper = document.createElement("span");
      wordWrapper.style.display = "inline-block";
      wordWrapper.style.whiteSpace = "nowrap";
      wordWrapper.className = "word-wrapper"; // Optional: for debugging

      for (let i = 0; i < word.length; i++) {
        const charSpan = document.createElement("span");
        charSpan.textContent = word[i];
        charSpan.className = "text-white/20 transition-colors duration-75 relative"; 
        
        spanRefs.current.push(charSpan);
        wordWrapper.appendChild(charSpan);
      }

      frag.appendChild(wordWrapper);

      // Add space as a tracked span
      if (wordIndex !== words.length - 1) {
        const spaceSpan = document.createElement("span");
        spaceSpan.textContent = " "; 
        spaceSpan.className = "text-white/20 transition-colors duration-75 relative";
        
        spanRefs.current.push(spaceSpan);
        frag.appendChild(spaceSpan);
      }
    });

    containerRef.current.appendChild(frag);
  }, [text]);

  // 2. Update Styles Based on Current Index & Errors
  useEffect(() => {
    const spans = spanRefs.current;
    if (!spans.length) return;

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      
      // Reset classes to base state
      // We keep "relative" because your CSS .active-char::after needs a relative parent
      span.className = "transition-colors duration-75 relative";

      if (i < index) {
        // --- CHARACTERS ALREADY TYPED ---
        if (wrongIndexes.has(i)) {
          span.classList.add("text-red-500");
          if (span.textContent === " ") {
            span.classList.add("bg-red-500/30", "rounded-sm");
          }
        } else {
          span.classList.add("text-slate-100");
        }
      } else if (i === index) {
        // --- THE CURRENT ACTIVE CHARACTER ---
        // Using your CSS global class "active-char" for the blinking underline
        span.classList.add("text-blue-400", "active-char");
      } else {
        // --- FUTURE CHARACTERS ---
        span.classList.add("text-white/20");
      }
    }

    // Auto-scroll logic
    const activeSpan = spans[index];
    if (activeSpan && containerRef.current) {
      activeSpan.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [index, wrongIndexes]);

  return (
    <div
      ref={containerRef}
      className="text-2xl md:text-4xl font-mono leading-[1.8] tracking-tight py-4 cursor-text"
    />
  );
}