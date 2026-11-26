"use client";

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import {
  Home,
  LayoutGrid,
  BookOpen,
  FileText,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { DATA } from "../../data/data";
import { playMouseClickSound } from "../utils/mouseClickSound";
import { cn } from "@/lib/utils";
import { LiquidGlassFilter, useLiquidGlass } from "./LiquidGlass";
import { prefetchRoute } from "../routes/Routes";

// Safe interface for view transitions
interface TransitionDocument extends Omit<Document, "startViewTransition"> {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
    finished?: Promise<void>;
  };
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  isExternal?: boolean;
  isThemeToggle?: boolean;
}

const THEMES = [
  { name: "lilac", icon: Sun },
  { name: "dark", icon: Moon },
] as const;

const SCROLL_DIRECTION_THRESHOLD = 18;

export const FloatingDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll shrink state with direction accumulator to prevent jitter
  const [isShrunk, setIsShrunk] = useState<boolean>(false);
  const lastScrollYRef = useRef<number>(0);
  const scrollDeltaRef = useRef<number>(0);

  // Touch glide, pointer hover, and pending route index (prevents to-and-fro bounce)
  const [glideIndex, setGlideIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const didTouchGlideRef = useRef<boolean>(false);
  const touchStartIndexRef = useRef<number | null>(null);

  // Responsive breakpoint (only updates on crossing 640px)
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth <= 640 : false,
  );

  // Dimming and transition state
  const [isDimmed, setIsDimmed] = useState<boolean>(false);
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingExternalRef = useRef<string | null>(null);
  const pendingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Theme state
  const [currentThemeIndex, setCurrentThemeIndex] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("theme");
    const index = THEMES.findIndex((t) => t.name === saved);
    return index >= 0 ? index : 0;
  });

  // Sync theme changes to document attributes. Layout effect so the class is
  // on <html> in the same commit the view transition snapshots.
  useLayoutEffect(() => {
    const theme = THEMES[currentThemeIndex].name;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, [currentThemeIndex]);

  // Track responsive breakpoint cleanly via matchMedia
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // Handle auto-dimming of the menu when idle
  const resetDimTimer = useCallback(() => {
    if (dimTimerRef.current) {
      clearTimeout(dimTimerRef.current);
    }
    setIsDimmed(false);

    dimTimerRef.current = setTimeout(() => {
      setIsDimmed(true);
    }, 4000);
  }, []);

  // Smooth scroll shrink/expand with accumulated delta deadzone
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      // Always expand near the top
      if (currentScrollY <= 24) {
        scrollDeltaRef.current = 0;
        setIsShrunk(false);
        return;
      }

      // Reset accumulator on direction change
      if (
        (delta > 0 && scrollDeltaRef.current < 0) ||
        (delta < 0 && scrollDeltaRef.current > 0)
      ) {
        scrollDeltaRef.current = 0;
      }

      scrollDeltaRef.current += delta;

      if (
        scrollDeltaRef.current > SCROLL_DIRECTION_THRESHOLD &&
        currentScrollY > 72
      ) {
        setIsShrunk(true);
        scrollDeltaRef.current = 0;
      } else if (scrollDeltaRef.current < -SCROLL_DIRECTION_THRESHOLD) {
        setIsShrunk(false);
        scrollDeltaRef.current = 0;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Set up and clean up the dimming timer and general activity listeners
  useEffect(() => {
    const handleActivity = () => resetDimTimer();
    dimTimerRef.current = setTimeout(() => setIsDimmed(true), 4000);

    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });

    return () => {
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [resetDimTimer]);

  // Perform theme toggle using startViewTransition API with fallback
  const toggleTheme = useCallback(async () => {
    playMouseClickSound();

    const nextIndex = (currentThemeIndex + 1) % THEMES.length;
    const isNextDark = THEMES[nextIndex].name === "dark";

    // Freeze CSS transitions during the swap: otherwise glass shadows /
    // tints animate for ~300ms after the wipe and look out of sync.
    const root = document.documentElement;
    root.classList.add("theme-switching");
    const unfreeze = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => root.classList.remove("theme-switching")),
      );

    const transitionDoc = document as TransitionDocument;
    if (!transitionDoc.startViewTransition) {
      flushSync(() => setCurrentThemeIndex(nextIndex));
      unfreeze();
      return;
    }

    const transition = transitionDoc.startViewTransition(() => {
      flushSync(() => {
        setCurrentThemeIndex(nextIndex);
      });
    });
    void transition.finished?.finally(unfreeze);
    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: isNextDark
          ? ["inset(0 0 100% 0)", "inset(0 0 0 0)"]
          : ["inset(100% 0 0 0)", "inset(0 0 0 0)"],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }, [currentThemeIndex]);

  // Build the list of navigation items
  const navItems: NavItem[] = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Projects", icon: LayoutGrid, path: "/projects" },
    { label: "Blogs", icon: BookOpen, path: "/blogs" },
    {
      label: "Resume",
      icon: FileText,
      path: DATA.personal.resume,
      isExternal: true,
    },
    {
      label: "Theme",
      icon: THEMES[currentThemeIndex].icon,
      path: "",
      isThemeToggle: true,
    },
  ];

  // Calculate the active index for the indicator position (Home: 0, Projects: 1, Blogs: 2)
  const activeIndex = (() => {
    const path = location.pathname;
    if (path === "/") return 0;
    if (path === "/projects") return 1;
    if (path.startsWith("/blogs")) return 2;
    return 0;
  })();

  // Click / selection action for items
  const handleItemSelect = (
    item: NavItem,
    index: number,
    deferExternal = false,
  ) => {
    resetDimTimer();

    if (item.isThemeToggle) {
      setPendingIndex(null);
      void toggleTheme();
    } else if (item.isExternal) {
      // Briefly hold the lens on the item so the release feels acknowledged
      setPendingIndex(index);
      if (pendingClearRef.current) clearTimeout(pendingClearRef.current);
      pendingClearRef.current = setTimeout(() => setPendingIndex(null), 450);
      if (deferExternal) {
        pendingExternalRef.current = item.path;
      } else {
        window.open(item.path, "_blank", "noopener,noreferrer");
      }
    } else {
      // Lock lens on destination index immediately so lazy route transition never bounces back
      setPendingIndex(index);
      navigate(item.path);
      window.scrollTo(0, 0);
    }
  };

  // Clear pending lock automatically once router reaches the destination
  const resolvedPendingIndex =
    pendingIndex !== null && pendingIndex !== activeIndex ? pendingIndex : null;

  // Derive lens index & translation directly in render (zero effect lag, zero to-and-fro bounce)
  const displayIndex =
    glideIndex !== null
      ? glideIndex
      : hoveredIndex !== null
        ? hoveredIndex
        : resolvedPendingIndex !== null
          ? resolvedPendingIndex
          : activeIndex;

  // Unified Pointer Glide (works for mobile touch swipe AND desktop drag, never blocks clicks)
  const activePointerIdRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number>(0);

  const getItemIndexAtPoint = (
    clientX: number,
    clientY: number,
  ): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();

    if (clientY < rect.top - 60 || clientY > rect.bottom + 60) {
      return null;
    }

    // Hit-test against the real button boxes (works for any layout/scale)
    for (let i = 0; i < buttonRefs.current.length; i++) {
      const btn = buttonRefs.current[i];
      if (!btn) continue;
      const b = btn.getBoundingClientRect();
      if (clientX >= b.left - 4 && clientX <= b.right + 4) return i;
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    resetDimTimer();
    const index = getItemIndexAtPoint(e.clientX, e.clientY);
    activePointerIdRef.current = e.pointerId;
    pointerStartXRef.current = e.clientX;
    touchStartIndexRef.current = index;
    didTouchGlideRef.current = false;
    if (e.pointerType !== "mouse") {
      setHoveredIndex(null);
    }
    // Do NOT call setPointerCapture on pointerdown — that steals click from child buttons!
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    const movedDistance = Math.abs(e.clientX - pointerStartXRef.current);

    // Only enter swipe/glide mode after intentional drag (> 8px)
    if (!didTouchGlideRef.current) {
      if (movedDistance < 8) return;
      didTouchGlideRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    resetDimTimer();
    const index = getItemIndexAtPoint(e.clientX, e.clientY);
    setGlideIndex(index);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    resetDimTimer();
    const targetIndex = glideIndex;
    const didGlide = didTouchGlideRef.current;

    activePointerIdRef.current = null;
    touchStartIndexRef.current = null;
    didTouchGlideRef.current = false;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (didGlide && targetIndex !== null) {
      // Mobile browsers (iOS Safari especially) only allow window.open()
      // from click / touchend, not pointerup — so for touch we defer the
      // external open to the touchend that follows.
      handleItemSelect(
        navItems[targetIndex],
        targetIndex,
        e.pointerType !== "mouse",
      );
    }
    setGlideIndex(null);
    if (e.pointerType !== "mouse") {
      setHoveredIndex(null);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    activePointerIdRef.current = null;
    touchStartIndexRef.current = null;
    didTouchGlideRef.current = false;
    setGlideIndex(null);
  };

  const isLensGliding = glideIndex !== null || hoveredIndex !== null;

  /* ------------------------------------------------------------------ */
  /* Liquid Glass: refraction filters, droplet lens physics, rim light   */
  /* ------------------------------------------------------------------ */
  const glass = useLiquidGlass();
  // Refraction filters are generated during idle time; until each one exists
  // the CSS frosted-glass fallback is used, so the dock never looks broken.
  const [dockGlassReady, setDockGlassReady] = useState(false);
  const [lensGlassReady, setLensGlassReady] = useState(false);
  const onDockGlassReady = useCallback(() => setDockGlassReady(true), []);
  const onLensGlassReady = useCallback(() => setLensGlassReady(true), []);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const [dockSize, setDockSize] = useState({ w: 0, h: 0 });
  const lensSize = isMobile ? 48 : 44;

  // Track dock size so the displacement map matches it 1:1
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDockSize({ w: el.offsetWidth, h: el.offsetHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Spring-driven lens: it lags, overshoots and stretches like a droplet
  const lensTargetRef = useRef<number | null>(null);
  const lensPressRef = useRef(false);
  const lensKickRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let x: number | null = null;
    let v = 0;
    let scale = 1;
    let raf: number | null = null;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const step = () => {
      raf = null;
      const lens = lensRef.current;
      const target = lensTargetRef.current;
      if (!lens || target === null) return;
      if (x === null || reduce) {
        x = target;
        v = 0;
      }
      v += (target - x) * 0.16;
      v *= 0.7;
      x += v;
      const press = lensPressRef.current ? 1.14 : 1;
      scale += (press - scale) * 0.22;
      const speed = Math.abs(v);
      const sx = scale * (1 + Math.min(0.5, speed * 0.04));
      const sy = scale * (1 - Math.min(0.22, speed * 0.018));
      lens.style.transform = `translate3d(${(x - lensSize / 2).toFixed(2)}px, -50%, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      if (
        Math.abs(target - x) > 0.1 ||
        speed > 0.05 ||
        Math.abs(press - scale) > 0.002
      ) {
        raf = requestAnimationFrame(step);
      }
    };
    lensKickRef.current = () => {
      if (raf === null) raf = requestAnimationFrame(step);
    };
    lensKickRef.current();
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [lensSize]);

  useEffect(() => {
    const btn = buttonRefs.current[displayIndex];
    const dock = containerRef.current;
    if (!btn || !dock) return;
    const b = btn.getBoundingClientRect();
    const d = dock.getBoundingClientRect();
    // Account for the dock's own scale (shrink-on-scroll)
    const ratio = dock.offsetWidth / Math.max(1, d.width);
    lensTargetRef.current = (b.left - d.left + b.width / 2) * ratio;
    lensPressRef.current = isLensGliding;
    lensKickRef.current();
  }, [displayIndex, isLensGliding, dockSize.w, isMobile]);

  // Tiny haptic tick while gliding across items (Android)
  useEffect(() => {
    if (glideIndex === null) return;
    (navigator as Navigator & { vibrate?: (ms: number) => boolean }).vibrate?.(
      6,
    );
  }, [glideIndex]);

  // Rim highlight follows the pointer like a light source
  const handleLightMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty(
      "--lx",
      `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`,
    );
    el.style.setProperty(
      "--ly",
      `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
    );
  };

  const dockFilterId = "liquid-glass-dock";
  const lensFilterId = "liquid-glass-lens";

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[1000] flex w-[calc(100vw-2rem)] max-w-[400px] origin-bottom -translate-x-1/2 scale-100 items-center justify-center transition-[scale,transform] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] select-none sm:bottom-6 sm:w-auto sm:max-w-none",
        // NOTE: never put opacity/filter on this wrapper — it would become a
        // "backdrop root" and the glass inside could no longer see the page.
        isShrunk && "scale-[0.86] hover:scale-100",
      )}
    >
      {glass.refract && dockSize.w > 0 && (
        <>
          <LiquidGlassFilter
            id={dockFilterId}
            width={dockSize.w}
            height={dockSize.h}
            radius={dockSize.h / 2}
            bezel={Math.min(16, dockSize.h * 0.3)}
            magnify={0}
            strength={22}
            blur={4}
            onReady={onDockGlassReady}
          />
          <LiquidGlassFilter
            id={lensFilterId}
            width={lensSize}
            height={lensSize}
            radius={lensSize / 2}
            bezel={lensSize * 0.26}
            magnify={0.16}
            strength={11}
            onReady={onLensGlassReady}
          />
        </>
      )}

      <div
        ref={containerRef}
        data-refract={glass.refract && dockGlassReady ? "" : undefined}
        data-reduced={glass.reduced ? "" : undefined}
        className="group/dock liquid-glass liquid-rim relative flex w-full touch-none items-center rounded-full p-1.5 sm:w-auto"
        style={
          glass.refract && dockGlassReady
            ? {
                backdropFilter: `url(#${dockFilterId}) saturate(185%) brightness(1.04)`,
              }
            : undefined
        }
        onPointerDown={handlePointerDown}
        onPointerMove={(e) => {
          handleLightMove(e);
          handlePointerMove(e);
        }}
        onPointerUp={handlePointerUp}
        onTouchEnd={() => {
          const href = pendingExternalRef.current;
          if (!href) return;
          pendingExternalRef.current = null;
          window.open(href, "_blank", "noopener,noreferrer");
        }}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") {
            setHoveredIndex(null);
          }
        }}
      >
        {/* Foreground navigation items */}
        <div
          className={cn(
            "relative z-[2] grid w-full grid-cols-5 items-center transition-opacity duration-500 sm:flex sm:w-auto sm:gap-1.5",
            (isDimmed || isShrunk) &&
              !isLensGliding &&
              "opacity-60 [@media(hover:hover)]:group-hover/dock:opacity-100",
          )}
        >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isCurrentlyActive = displayIndex === index;
            const isRoute = !item.isExternal && !item.isThemeToggle;

            return (
              <button
                key={item.label}
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                onClick={() => handleItemSelect(item, index)}
                onPointerEnter={(e) => {
                  if (isRoute) prefetchRoute(item.path);
                  if (e.pointerType === "mouse") {
                    resetDimTimer();
                    setHoveredIndex(index);
                  }
                }}
                onPointerDown={() => {
                  if (isRoute) prefetchRoute(item.path);
                }}
                className={cn(
                  "group relative flex h-12 w-full cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-foreground/60 transition-[color] duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-11 sm:w-11 [&_svg]:transition-[stroke-width,transform] [&_svg]:duration-300",
                  isCurrentlyActive && "text-accent dark:text-foreground",
                )}
                aria-label={item.label}
                aria-current={
                  isRoute && activeIndex === index ? "page" : undefined
                }
                type="button"
              >
                <span className="liquid-tooltip pointer-events-none invisible absolute bottom-[calc(100%+14px)] left-1/2 z-[1010] -translate-x-1/2 translate-y-1 rounded-full px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.1em] whitespace-nowrap uppercase opacity-0 transition-all duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.label}
                  {isRoute && (
                    <span className="ml-1.5 text-accent normal-case">
                      {item.path === "/" ? "~/" : `~${item.path}`}
                    </span>
                  )}
                  {item.isExternal && (
                    <span className="ml-1.5 text-accent">↗</span>
                  )}
                </span>
                <Icon
                  size={20}
                  strokeWidth={isCurrentlyActive ? 2.3 : 1.8}
                  className={cn(isCurrentlyActive && "scale-[1.08]")}
                />
                {/* Running indicator for the current route */}
                {isRoute && activeIndex === index && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[3px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* The droplet lens — sits ABOVE the icons and magnifies them */}
        <div
          ref={lensRef}
          aria-hidden="true"
          className={cn(
            "liquid-lens pointer-events-none absolute top-1/2 left-0 z-[3] rounded-full will-change-transform",
            isLensGliding && "is-pressed",
          )}
          style={{
            width: lensSize,
            height: lensSize,
            transform: `translate3d(-999px, -50%, 0)`,
            ...(glass.refract && lensGlassReady
              ? {
                  backdropFilter: `url(#${lensFilterId}) saturate(160%) brightness(1.06)`,
                }
              : null),
          }}
        />
      </div>
    </div>
  );
};
