import React, { useEffect, useRef, useState } from "react";
import { orreryState } from "./orreryState";

/**
 * Design-tool "viewport" chrome around the page: rulers with live cursor
 * markers, a crosshair that lives *behind* the reading sheet, and HUD
 * readouts (camera, fps, scroll depth, active section).
 *
 * Everything per-frame is written straight to the DOM through refs so the
 * React tree never re-renders on pointer move.
 */

const RULER = 16; // px

const useViewportWidth = () => {
  const [size, setSize] = useState(() => ({
    w: typeof window === "undefined" ? 1440 : window.innerWidth,
    h: typeof window === "undefined" ? 900 : window.innerHeight,
  }));
  useEffect(() => {
    const onResize = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
};

const toDeg = (rad: number) => ((((rad * 180) / Math.PI) % 360) + 360) % 360;

/** Layer that sits BEHIND the reading sheet. */
export const ViewportBackChrome: React.FC = () => {
  const vLine = useRef<HTMLDivElement | null>(null);
  const hLine = useRef<HTMLDivElement | null>(null);
  const tag = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    let raf: number | null = null;
    let x = -100;
    let y = -100;
    const apply = () => {
      raf = null;
      if (vLine.current) vLine.current.style.transform = `translateX(${x}px)`;
      if (hLine.current) hLine.current.style.transform = `translateY(${y}px)`;
      if (tag.current) {
        tag.current.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
        tag.current.textContent = `X ${String(Math.round(x)).padStart(4, "0")}  Y ${String(Math.round(y + window.scrollY)).padStart(4, "0")}`;
      }
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (raf === null) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden lg:block"
    >
      <div
        ref={vLine}
        className="absolute top-0 bottom-0 left-0 w-px bg-foreground/10 will-change-transform"
      />
      <div
        ref={hLine}
        className="absolute top-0 right-0 left-0 h-px bg-foreground/10 will-change-transform"
      />
      <div
        ref={tag}
        className="absolute top-0 left-0 border border-accent/50 bg-background/80 px-1.5 py-0.5 font-mono text-[0.6rem] tracking-[0.06em] whitespace-pre text-accent tabular-nums will-change-transform"
      />
    </div>
  );
};

/** Layer that sits ABOVE everything: rulers + HUD readouts. */
export const ViewportFrontChrome: React.FC = () => {
  const { w, h } = useViewportWidth();
  const topMarker = useRef<HTMLDivElement | null>(null);
  const leftMarker = useRef<HTMLDivElement | null>(null);
  const progressBar = useRef<HTMLDivElement | null>(null);
  const depthText = useRef<HTMLSpanElement | null>(null);
  const camText = useRef<HTMLSpanElement | null>(null);
  const fpsText = useRef<HTMLSpanElement | null>(null);
  const focusText = useRef<HTMLSpanElement | null>(null);
  const [section, setSection] = useState({ index: "00", name: "Hero" });

  // Cursor markers on rulers + scroll depth
  useEffect(() => {
    let raf: number | null = null;
    let x = -20;
    let y = -20;
    const apply = () => {
      raf = null;
      if (topMarker.current)
        topMarker.current.style.transform = `translateX(${x}px)`;
      if (leftMarker.current)
        leftMarker.current.style.transform = `translateY(${y}px)`;
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      if (progressBar.current)
        progressBar.current.style.transform = `scaleY(${p})`;
      if (depthText.current)
        depthText.current.textContent = `${(p * 100).toFixed(0).padStart(3, "0")}%`;
    };
    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      schedule();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", schedule);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  // Camera / fps readout from the orrery (slow poll, no re-render)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (camText.current)
        camText.current.textContent = `θ ${toDeg(orreryState.yaw).toFixed(1).padStart(5, "0")}°  φ ${toDeg(orreryState.pitch).toFixed(1)}°`;
      if (fpsText.current)
        fpsText.current.textContent = String(orreryState.fps).padStart(2, "0");
      if (focusText.current)
        focusText.current.textContent = orreryState.focused
          ? `SEL · ${orreryState.focused.toUpperCase()}`
          : "SEL · NONE";
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  // Active section tracking
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-hud-section]"),
    );
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            setSection({
              index: el.dataset.hudIndex ?? "00",
              name: el.dataset.hudSection ?? "",
            });
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const topLabels: number[] = [];
  for (let px = 100; px < w; px += 100) topLabels.push(px);
  const leftLabels: number[] = [];
  for (let px = 100; px < h; px += 100) leftLabels.push(px);

  return (
    <div aria-hidden="true" className="pointer-events-none select-none">
      {/* Rulers (lg+) */}
      <div className="fixed inset-x-0 top-0 z-[45] hidden lg:block">
        <div
          className="ruler-x relative border-b border-border bg-background/85 backdrop-blur-sm"
          style={{ height: RULER, marginLeft: RULER }}
        >
          {topLabels.map((px) => (
            <span
              key={px}
              className="absolute top-[1px] font-mono text-[0.5rem] text-muted-foreground tabular-nums"
              style={{ left: px - RULER + 3 }}
            >
              {px}
            </span>
          ))}
          <div
            ref={topMarker}
            className="absolute top-0 bottom-0 w-px bg-accent will-change-transform"
            style={{ left: -RULER }}
          />
        </div>
      </div>
      <div className="fixed inset-y-0 left-0 z-[45] hidden lg:block">
        <div
          className="ruler-y relative h-full border-r border-border bg-background/85 backdrop-blur-sm"
          style={{ width: RULER }}
        >
          {leftLabels.map((px) => (
            <span
              key={px}
              className="absolute left-[2px] origin-top-left -rotate-90 font-mono text-[0.5rem] text-muted-foreground tabular-nums"
              style={{ top: px + 18 }}
            >
              {px}
            </span>
          ))}
          <div
            ref={leftMarker}
            className="absolute right-0 left-0 h-px bg-accent will-change-transform"
            style={{ top: 0 }}
          />
          {/* Corner square */}
        </div>
        <div
          className="absolute top-0 left-0 grid place-items-center border-r border-b border-border bg-background"
          style={{ width: RULER, height: RULER }}
        >
          <span className="h-1.5 w-1.5 bg-accent" />
        </div>
      </div>

      {/* Scroll depth rail (md+) */}
      <div className="fixed top-1/2 right-3 z-[45] hidden h-40 w-px -translate-y-1/2 bg-border md:block">
        <div
          ref={progressBar}
          className="h-full w-full origin-top scale-y-0 bg-accent"
        />
      </div>

      {/* HUD (xl+ — only where the margins are wide enough to stay clear of text) */}
      <div className="fixed top-7 left-7 z-[45] hidden border border-border-light bg-background/75 px-2.5 py-1.5 backdrop-blur-sm font-mono text-[0.62rem] leading-[1.7] tracking-[0.08em] text-muted-foreground uppercase xl:block">
        <div className="flex items-center gap-2 text-foreground">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-[#eb5757]" />
          <span>imrahul.me / home.tsx</span>
        </div>
        <div>Viewport 01 · Perspective</div>
        <div>Mode · Orbit / Auto</div>
        <div>
          <span ref={focusText}>SEL · NONE</span>
        </div>
      </div>

      <div className="fixed top-20 right-7 z-[45] hidden border border-border-light bg-background/75 px-2.5 py-1.5 text-right backdrop-blur-sm font-mono text-[0.62rem] leading-[1.7] tracking-[0.08em] text-muted-foreground uppercase tabular-nums xl:block">
        <div className="text-foreground">
          Cam <span ref={camText}>θ 000.0° φ 56.0°</span>
        </div>
        <div>
          FPS <span ref={fpsText}>60</span> · Canvas2D
        </div>
        <div>Render · Wireframe</div>
        <div>Grid · 20px snap</div>
      </div>

      <div className="fixed bottom-8 left-28 z-[45] hidden border border-border-light bg-background/75 px-2.5 py-1.5 backdrop-blur-sm font-mono text-[0.62rem] leading-[1.7] tracking-[0.08em] text-muted-foreground uppercase tabular-nums xl:block">
        <div className="text-foreground">
          §{section.index} · {section.name}
        </div>
        <div>
          Depth Z <span ref={depthText}>000%</span>
        </div>
      </div>
    </div>
  );
};
