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
import "../styles/FloatingDock.scss";

// Safe interface for view transitions
interface TransitionDocument extends Document {
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
      className={`floating-dock-wrapper ${isDimmed ? "is-dimmed" : ""} ${
        isShrunk ? "is-shrunk" : ""
      }`}
    >
      <div
        ref={containerRef}
        className="floating-dock-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Dynamic sliding active capsule background */}
        <div
          className="dock-active-indicator"
          style={{
            transform: `translate3d(${translationOffset}px, 0, 0)`,
          }}
        />

        {/* Foreground navigation items */}
        <div className="dock-foreground-nav">
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
                className={`dock-action-btn ${
                  isCurrentlyActive ? "is-active-route" : ""
                }`}
                aria-label={item.label}
                type="button"
              >
                <span className="dock-btn-tooltip">{item.label}</span>
                <div className="dock-icon-wrapper">
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
