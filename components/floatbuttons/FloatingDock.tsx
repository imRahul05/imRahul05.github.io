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

export const FloatingDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll shrink state
  const [isShrunk, setIsShrunk] = useState<boolean>(false);
  const lastScrollYRef = useRef<number>(0);

  // Touch glide & pointer hover glide state
  const [glideIndex, setGlideIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  // Listen to window scrolling to shrink the menu on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Shrink when scrolling down beyond a small threshold
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 60) {
        setIsShrunk(true);
      } else if (
        currentScrollY < lastScrollYRef.current ||
        currentScrollY <= 15
      ) {
        setIsShrunk(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Set up and clean up the dimming timer and general activity listeners
  useEffect(() => {
    resetDimTimer();
    const handleActivity = () => resetDimTimer();

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

    if (isNextDark) {
      // Circle clip-path reveal expanding downwards
      document.documentElement.animate(
        {
          clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    } else {
      // Circle clip-path reveal expanding upwards
      document.documentElement.animate(
        {
          clipPath: ["inset(100% 0 0 0)", "inset(0 0 0 0)"],
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    }
  }, [currentThemeIndex]);

  // Click action for items
  const handleItemClick = (item: NavItem) => {
    resetDimTimer();

    if (item.isThemeToggle) {
      toggleTheme();
    } else if (item.isExternal) {
      window.open(item.path, "_blank", "noopener,noreferrer");
    } else {
      navigate(item.path);
      window.scrollTo(0, 0);
    }
  };

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
  const getActiveIndicatorIndex = (): number => {
    const path = location.pathname;
    if (path === "/") return 0;
    if (path === "/projects") return 1;
    if (path.startsWith("/blogs")) return 2;
    return 0; // Default fallback to Home
  };

  const activeIndex = getActiveIndicatorIndex();

  // Dynamic layout measurements to translate the circular Liquid Glass lens
  const getTranslationOffset = useCallback((): number => {
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;
    const buttonWidth = isMobile ? 36 : 40;
    const gap = isMobile ? 4 : 8;

    // Slide circular lens to glided item (touch) -> hovered item (pointer) -> active route
    const showIndex =
      glideIndex !== null
        ? glideIndex
        : hoveredIndex !== null
          ? hoveredIndex
          : activeIndex;
    return showIndex * (buttonWidth + gap);
  }, [activeIndex, glideIndex, hoveredIndex]);

  const [translationOffset, setTranslationOffset] = useState<number>(0);

  useEffect(() => {
    setTranslationOffset(getTranslationOffset());
  }, [getTranslationOffset]);

  // Re-calculate on window resize
  useEffect(() => {
    const handleResize = () => {
      setTranslationOffset(getTranslationOffset());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getTranslationOffset]);

  // Touch Glide Gesture Logic
  const updateTouchActiveItem = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Prevent snapping outside vertically bounds
    if (clientY < rect.top - 60 || clientY > rect.bottom + 60) {
      setGlideIndex(null);
      return;
    }

    const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;
    const padding = isMobile ? 5 : 6;
    const relativeX = clientX - rect.left - padding;

    const buttonWidth = isMobile ? 36 : 40;
    const gap = isMobile ? 4 : 8;
    const step = buttonWidth + gap;

    const index = Math.floor(relativeX / step);
    if (index >= 0 && index < navItems.length) {
      setGlideIndex(index);
    } else {
      setGlideIndex(null);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    resetDimTimer();
    updateTouchActiveItem(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    resetDimTimer();
    updateTouchActiveItem(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    resetDimTimer();
    if (glideIndex !== null) {
      handleItemClick(navItems[glideIndex]);
    }
    setGlideIndex(null);
  };

  const isLensGliding = glideIndex !== null || hoveredIndex !== null;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-4 left-1/2 z-[1000] flex origin-bottom -translate-x-1/2 scale-100 items-center justify-center opacity-100 transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] select-none sm:bottom-6",
        isShrunk && "scale-[0.84] opacity-80 hover:scale-100 hover:opacity-100",
        isDimmed && "opacity-45 hover:opacity-100",
      )}
    >
      <div
        ref={containerRef}
        className="relative flex items-center gap-1 rounded-full border border-white/75 bg-white/30 p-[5px] shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.05),inset_0_1.5px_1px_rgba(255,255,255,0.88),inset_0_-1px_1px_rgba(0,0,0,0.06)] backdrop-blur-[32px] backdrop-saturate-[220%] transition-all duration-300 ease-in-out before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent sm:gap-2 sm:p-1.5 dark:border-white/20 dark:bg-[rgba(22,22,28,0.42)] dark:shadow-[0_16px_42px_rgba(0,0,0,0.5),0_2px_10px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_-1px_1px_rgba(0,0,0,0.35)] dark:before:from-white/12 dark:before:via-white/[0.02] dark:before:to-transparent"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Apple Liquid Glass sliding circular lens */}
        <div
          className={cn(
            "pointer-events-none absolute top-[5px] left-[5px] z-[1] h-9 w-9 rounded-full border border-white/90 bg-white/70 shadow-[0_3px_12px_rgba(155,92,255,0.18),0_1px_3px_rgba(0,0,0,0.08),inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(155,92,255,0.12)] backdrop-blur-md transition-[transform,box-shadow,background-color] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] sm:top-1.5 sm:left-1.5 sm:h-10 sm:w-10 dark:border-white/28 dark:bg-white/[0.16] dark:shadow-[0_3px_14px_rgba(0,0,0,0.42),inset_0_1.5px_1.5px_rgba(255,255,255,0.35),inset_0_-1px_2px_rgba(0,0,0,0.3)]",
            isLensGliding &&
              "bg-white/82 shadow-[0_5px_18px_rgba(155,92,255,0.24),0_1px_4px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,1)] dark:bg-white/[0.22]",
          )}
          style={{
            transform: `translate3d(${translationOffset}px, 0, 0) scale(${isLensGliding ? 1.07 : 1})`,
          }}
        />

        {/* Foreground navigation items */}
        <div className="relative z-[2] flex items-center gap-1 sm:gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            // Standard active check
            const isActive =
              !item.isThemeToggle &&
              !item.isExternal &&
              (item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path));

            // Visual active check follows sliding glass lens (touch glide -> pointer hover -> active route)
            const isCurrentlyActive =
              glideIndex !== null
                ? glideIndex === index
                : hoveredIndex !== null
                  ? hoveredIndex === index
                  : isActive;

            return (
              <button
                key={item.label}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => {
                  resetDimTimer();
                  setHoveredIndex(index);
                }}
                className={cn(
                  "group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#6e6a7c] transition-[transform,color] duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.2)] outline-none active:scale-[0.92] sm:h-10 sm:w-10 dark:text-[#a8a29e] [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:transition-[stroke-width,transform] [&_svg]:duration-200 sm:[&_svg]:h-5 sm:[&_svg]:w-5",
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
