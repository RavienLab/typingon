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

    for (let i = 0; i < text.length; i++) {
      const span = document.createElement("span");

      if (text[i] === " ") {
        span.textContent = "\u00A0";
        span.className = "text-slate-500";
      } else {
        span.textContent = text[i];
        span.className = "text-slate-500 inline-block";
      }

      span.style.whiteSpace = "nowrap"; // 🔥 THIS IS THE KEY FIX

      spanRefs.current.push(span);
      frag.appendChild(span);
    }

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
      style={{ wordBreak: "keep-all" }}
    />
  );
}
