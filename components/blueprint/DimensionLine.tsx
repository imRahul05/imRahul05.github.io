import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A CAD dimension line that measures the width of its container live:
 *   |◀──────── 236.40 ────────▶|
 */
export const DimensionLine: React.FC<{
  className?: string;
  suffix?: string;
}> = ({ className, suffix = "px" }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "dimension-line relative flex h-3 w-full items-center text-accent",
        className,
      )}
    >
      <span className="absolute top-0 left-0 h-full w-px bg-current" />
      <span className="absolute top-0 right-0 h-full w-px bg-current" />
      <span className="dimension-arrow-l absolute left-px" />
      <span className="dimension-arrow-r absolute right-px" />
      <span className="h-px flex-1 bg-current opacity-70" />
      <span className="px-1.5 font-mono text-[0.58rem] leading-none tracking-[0.08em] tabular-nums">
        {width === null ? "—" : `${width.toFixed(2)} ${suffix}`}
      </span>
      <span className="h-px flex-1 bg-current opacity-70" />
    </div>
  );
};
