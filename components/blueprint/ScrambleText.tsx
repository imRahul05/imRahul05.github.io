import React, { useEffect, useState } from "react";

const GLYPHS = "▖▘▝▗▚▞█░▒▓/\\|<>-_=+*#%01";

/**
 * Decodes text on mount: characters resolve left → right out of CAD-ish glyph
 * noise. Screen readers always get the real text via aria-label.
 */
export const ScrambleText: React.FC<{
  text: string;
  duration?: number;
  className?: string;
}> = ({ text, duration = 900, className }) => {
  const [output, setOutput] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOutput(text);
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
      setOutput(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);

  return (
    <span aria-label={text} className={className}>
      <span aria-hidden="true">{output}</span>
    </span>
  );
};
