import React, { Suspense, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Mounts `children` (typically a React.lazy component) only once the
 * placeholder comes within `rootMargin` of the viewport. Below-the-fold
 * widgets then cost no JS download, parse or network calls at startup.
 * The placeholder reserves space so nothing jumps when it swaps in.
 */
export const LazyWhenVisible: React.FC<{
  children: React.ReactNode;
  /** Classes for the placeholder (give it the expected height) */
  placeholderClassName?: string;
  rootMargin?: string;
}> = ({ children, placeholderClassName, rootMargin = "600px 0px" }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  const placeholder = (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("cad-card animate-shimmer", placeholderClassName)}
    />
  );

  if (!visible) return placeholder;
  return <Suspense fallback={placeholder}>{children}</Suspense>;
};
