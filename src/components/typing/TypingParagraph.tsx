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

  /* ---------- build paragraph once ---------- */
  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    spanRefs.current = [];

    const frag = document.createDocumentFragment();

    let globalIndex = 0;

    const words = text.split(" ");

    words.forEach((word, wordIndex) => {
      const wordWrapper = document.createElement("span");
      wordWrapper.style.display = "inline-block";
      wordWrapper.style.whiteSpace = "nowrap"; // 🔥 keeps word together
      wordWrapper.style.marginRight = "6px"; // spacing between words

      for (let i = 0; i < word.length; i++) {
        const charSpan = document.createElement("span");
        charSpan.textContent = word[i];
        charSpan.className = "text-slate-500";

        spanRefs.current.push(charSpan);
        wordWrapper.appendChild(charSpan);
        globalIndex++;
      }

      frag.appendChild(wordWrapper);

      // add space (as real space, not span)
      if (wordIndex !== words.length - 1) {
        const space = document.createTextNode(" ");
        frag.appendChild(space);
        globalIndex++;
      }
    });

    containerRef.current.appendChild(frag);
  }, [text]);

  /* ---------- update styles on typing ---------- */
  useEffect(() => {
    const spans = spanRefs.current;

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];

      span.classList.remove(
        "text-white",
        "text-red-400",
        "text-slate-500",
        "active-char",
      );

      if (i < index) {
        if (wrongIndexes.has(i)) span.classList.add("text-red-400");
        else span.classList.add("text-white");
      } else {
        span.classList.add("text-slate-500");
      }
    }

    const active = spans[index];
    if (active) active.classList.add("active-char");
  }, [index, wrongIndexes]);

  return (
    <div
      ref={containerRef}
      className="text-2xl md:text-3xl font-mono leading-relaxed whitespace-pre-wrap"
    />
  );
}
