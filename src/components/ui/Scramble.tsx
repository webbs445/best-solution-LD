"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const randomFigure = () => `AED ${10 + Math.floor(Math.random() * 89)},${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

/**
 * Rolling, made-up digits for a locked figure: shows that a number is there without showing it. Never the
 * real figure, and hidden from screen readers (the caller says it is locked in words).
 */
export function Scramble({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [text, setText] = useState("AED 48,215");

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setText(randomFigure()), 110);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <span className={className} aria-hidden="true">
      {text}
    </span>
  );
}
