import React, { useEffect, useRef } from "react";

const GLYPHS = "▖▘▝▗▚▞█░▒▓/\\|<>-_=+*#%01";

/**
 * Decodes text on mount: characters resolve left → right out of CAD-ish glyph
 * noise. Screen readers always get the real text via aria-label.
 *
 * Frames write straight to the DOM node instead of React state, so the decode
 * never re-renders the (sticky) header it lives in.
 */
export const ScrambleText: React.FC<{
  text: string;
  duration?: number;
  className?: string;
}> = ({ text, duration = 900, className }) => {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = text;
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const resolved = Math.floor(p * text.length);
      let next = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (i < resolved || ch === " ") next += ch;
        else next += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = next;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }, [text, duration]);

  return (
    <span aria-label={text} className={className}>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
    </span>
  );
};
