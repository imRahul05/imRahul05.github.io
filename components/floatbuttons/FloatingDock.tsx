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

  // Touch glide state
  const [glideIndex, setGlideIndex] = useState<number | null>(null);

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

  // Dynamic layout measurements to translate the indicator background pill
  const getTranslationOffset = useCallback((): number => {
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;
    const buttonWidth = isMobile ? 38 : 44;
    const gap = isMobile ? 4 : 8;

    // Slide indicators to the glided item if user is touching/dragging
    const showIndex = glideIndex !== null ? glideIndex : activeIndex;
    return showIndex * (buttonWidth + gap);
  }, [activeIndex, glideIndex]);

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

    const buttonWidth = isMobile ? 38 : 44;
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

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-4 left-1/2 z-[1000] flex origin-bottom -translate-x-1/2 scale-100 items-center justify-center opacity-100 transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] select-none sm:bottom-6",
        isShrunk && "scale-[0.82] opacity-80 hover:scale-100 hover:opacity-100",
        isDimmed && "opacity-45 hover:opacity-100",
      )}
    >
      <div
        ref={containerRef}
        className="relative flex items-center gap-1 rounded-[14px] border-[1.5px] border-white/65 bg-white/45 p-[5px] shadow-[0_12px_36px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-[28px] backdrop-saturate-[190%] transition-all duration-300 ease-in-out sm:gap-2 sm:rounded-2xl sm:p-1.5 dark:border-white/12 dark:bg-[rgba(16,16,20,0.45)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Dynamic sliding active capsule background */}
        <div
          className="pointer-events-none absolute top-[5px] left-[5px] z-[1] h-8 w-[38px] rounded-lg bg-black/6 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)] transition-transform duration-[380ms] ease-[cubic-bezier(0.25,1.2,0.5,1.1)] sm:top-1.5 sm:left-1.5 sm:h-9 sm:w-11 sm:rounded-[10px] dark:bg-white/11 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          style={{
            transform: `translate3d(${translationOffset}px, 0, 0)`,
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

            // Visual active check overrides when user is glided on touch
            const isCurrentlyActive =
              glideIndex !== null ? glideIndex === index : isActive;

            return (
              <button
                key={item.label}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "group relative flex h-8 w-[38px] cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[#8e8e93] transition-[transform,color] duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.2)] outline-none hover:-translate-y-0.5 hover:scale-[1.06] hover:text-foreground active:scale-[0.94] sm:h-9 sm:w-11 sm:rounded-[10px] [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:transition-[stroke-width] [&_svg]:duration-200 sm:[&_svg]:h-5 sm:[&_svg]:w-5",
                  isCurrentlyActive && "text-accent",
                )}
                aria-label={item.label}
                type="button"
              >
                <span className="pointer-events-none invisible absolute bottom-[calc(100%+12px)] left-1/2 z-[1010] -translate-x-1/2 translate-y-1 rounded-md border border-white/10 bg-[rgba(26,21,35,0.9)] px-2.5 py-1.5 font-mono text-[0.7rem] tracking-[0.02em] whitespace-nowrap text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-[4px] transition-all duration-200 ease-in-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-solid after:border-transparent after:border-t-[rgba(26,21,35,0.9)] after:content-[''] dark:border-black/10 dark:bg-[rgba(250,250,249,0.94)] dark:text-[#101014] dark:after:border-t-[rgba(250,250,249,0.94)]">
                  {item.label}
                </span>
                <div className="flex items-center justify-center transition-transform duration-200 ease-in-out">
                  <Icon size={20} strokeWidth={isCurrentlyActive ? 2.5 : 2} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
