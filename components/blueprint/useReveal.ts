import { useEffect } from "react";

/**
 * Adds `is-in` to every `[data-reveal]` element once it scrolls into view.
 * Elements are only hidden after JS opts the document in (`.reveal-ready`),
 * so no-JS / prerendered HTML always shows content.
 */
export const useReveal = () => {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    // Anything already on screen shows immediately (no flash on load)
    const vh = window.innerHeight;
    nodes.forEach((n) => {
      if (n.getBoundingClientRect().top < vh * 0.92) n.classList.add("is-in");
    });
    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    nodes.forEach((n) => {
      if (!n.classList.contains("is-in")) io.observe(n);
    });

    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
};
