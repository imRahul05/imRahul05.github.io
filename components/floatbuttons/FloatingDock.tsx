"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Safe interface for view transitions
interface TransitionDocument extends Omit<Document, "startViewTransition"> {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
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

  // Theme state
  const [currentThemeIndex, setCurrentThemeIndex] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("theme");
    const index = THEMES.findIndex((t) => t.name === saved);
    return index >= 0 ? index : 0;
  });

  // Sync theme changes to document attributes
  useEffect(() => {
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

    const transitionDoc = document as TransitionDocument;
    if (!transitionDoc.startViewTransition) {
      setCurrentThemeIndex(nextIndex);
      return;
    }

    await transitionDoc.startViewTransition(() => {
      flushSync(() => {
        setCurrentThemeIndex(nextIndex);
      });
    }).ready;

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
  const handleItemSelect = (item: NavItem, index: number) => {
    resetDimTimer();

    if (item.isThemeToggle) {
      setPendingIndex(null);
      void toggleTheme();
    } else if (item.isExternal) {
      setPendingIndex(null);
      window.open(item.path, "_blank", "noopener,noreferrer");
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

  const buttonWidth = isMobile ? 36 : 40;
  const gap = isMobile ? 4 : 8;
  const translationOffset = displayIndex * (buttonWidth + gap);

  // Touch Glide Gesture Logic
  const getTouchItemIndex = (
    clientX: number,
    clientY: number,
  ): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();

    if (clientY < rect.top - 60 || clientY > rect.bottom + 60) {
      return null;
    }

    const padding = isMobile ? 5 : 6;
    const relativeX = clientX - rect.left - padding;
    const step = buttonWidth + gap;

    const index = Math.floor(relativeX / step);
    if (index >= 0 && index < navItems.length) {
      return index;
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    resetDimTimer();
    const index = getTouchItemIndex(e.touches[0].clientX, e.touches[0].clientY);
    touchStartIndexRef.current = index;
    didTouchGlideRef.current = false;
    setHoveredIndex(null);
    setGlideIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    resetDimTimer();
    const index = getTouchItemIndex(e.touches[0].clientX, e.touches[0].clientY);
    if (index !== touchStartIndexRef.current) {
      didTouchGlideRef.current = true;
    }
    setGlideIndex(index);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    resetDimTimer();
    if (glideIndex !== null) {
      // Prevent synthetic delayed click on the original touch-start button after a swipe
      if (didTouchGlideRef.current) {
        e.preventDefault();
      }
      handleItemSelect(navItems[glideIndex], glideIndex);
    }
    setGlideIndex(null);
    touchStartIndexRef.current = null;
    didTouchGlideRef.current = false;
  };

  const isLensGliding = glideIndex !== null || hoveredIndex !== null;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-4 left-1/2 z-[1000] flex origin-bottom -translate-x-1/2 scale-100 items-center justify-center opacity-100 transition-[scale,transform,opacity] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[scale,opacity] select-none sm:bottom-6",
        isShrunk && "scale-[0.84] opacity-80 hover:scale-100 hover:opacity-100",
        isDimmed && "opacity-45 hover:opacity-100",
      )}
    >
      <div
        ref={containerRef}
        className="relative flex touch-none items-center gap-1 rounded-full border border-border bg-card/75 p-[5px] shadow-[0_12px_36px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-[32px] backdrop-saturate-[220%] transition-[border-color,background-color,box-shadow] duration-300 ease-in-out sm:gap-2 sm:p-1.5 dark:border-white/18 dark:bg-[#0a0a0a]/75 dark:shadow-[0_16px_42px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.16)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") {
            setHoveredIndex(null);
          }
        }}
      >
        {/* Apple Liquid Glass sliding circular lens */}
        <div
          className={cn(
            "pointer-events-none absolute top-[5px] left-[5px] z-[1] h-9 w-9 rounded-full border border-foreground/20 bg-foreground/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-md transition-[transform,box-shadow,background-color,border-color] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform sm:top-1.5 sm:left-1.5 sm:h-10 sm:w-10 dark:border-white/25 dark:bg-white/[0.14] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.28)]",
            isLensGliding && "border-accent/50 bg-accent/15",
          )}
          style={{
            transform: `translate3d(${translationOffset}px, 0, 0) scale(${isLensGliding ? 1.07 : 1})`,
          }}
        />

        {/* Foreground navigation items */}
        <div className="relative z-[2] flex items-center gap-1 sm:gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isCurrentlyActive = displayIndex === index;

            return (
              <button
                key={item.label}
                onClick={() => handleItemSelect(item, index)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") {
                    resetDimTimer();
                    setHoveredIndex(index);
                  }
                }}
                className={cn(
                  "group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#6e6a7c] transition-[scale,transform,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none active:scale-[0.92] sm:h-10 sm:w-10 dark:text-[#a8a29e] [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:transition-[stroke-width,transform] [&_svg]:duration-200 sm:[&_svg]:h-5 sm:[&_svg]:w-5",
                  isCurrentlyActive &&
                    "scale-[1.06] text-accent dark:text-foreground",
                )}
                aria-label={item.label}
                type="button"
              >
                <span className="pointer-events-none invisible absolute bottom-[calc(100%+12px)] left-1/2 z-[1010] -translate-x-1/2 translate-y-1 rounded-md border border-white/10 bg-[rgba(26,21,35,0.9)] px-2.5 py-1.5 font-mono text-[0.7rem] tracking-[0.02em] whitespace-nowrap text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-[4px] transition-all duration-200 ease-in-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-solid after:border-transparent after:border-t-[rgba(26,21,35,0.9)] after:content-[''] dark:border-black/10 dark:bg-[rgba(250,250,249,0.94)] dark:text-[#101014] dark:after:border-t-[rgba(250,250,249,0.94)]">
                  {item.label}
                </span>
                <div className="flex items-center justify-center transition-transform duration-200 ease-in-out">
                  <Icon size={20} strokeWidth={isCurrentlyActive ? 2.4 : 1.9} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
