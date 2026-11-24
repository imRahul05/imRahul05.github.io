import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Home,
  LayoutGrid,
  BookOpen,
  FileText,
  Sun,
  Moon,
  Mail,
  Check,
  ExternalLink,
  Github,
  Linkedin,
  CornerDownLeft,
  Command,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DATA } from "@/data/data";
import { BLOGS } from "@/data/blogs";
import { playMouseClickSound } from "@/components/utils/mouseClickSound";
import { cn } from "@/lib/utils";

interface TransitionDocument extends Omit<Document, "startViewTransition"> {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
}

type CommandGroup = "Navigation" | "Quick Actions" | "Projects" | "Blogs";

interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  group: CommandGroup;
  icon: LucideIcon;
  keywords: string;
  shortcut?: string;
  action: () => void;
}

const GROUP_ORDER: ReadonlyArray<CommandGroup> = [
  "Navigation",
  "Quick Actions",
  "Projects",
  "Blogs",
];

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, []);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) {
            setQuery("");
            setActiveIndex(0);
            setIsDarkTheme(document.documentElement.classList.contains("dark"));
            requestAnimationFrame(() => inputRef.current?.focus());
          }
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const toggleTheme = useCallback(async () => {
    playMouseClickSound();
    const currentlyDark = document.documentElement.classList.contains("dark");
    const nextTheme = currentlyDark ? "lilac" : "dark";
    const isNextDark = nextTheme === "dark";

    const applyTheme = () => {
      document.documentElement.setAttribute("data-theme", nextTheme);
      document.documentElement.classList.toggle("dark", isNextDark);
      localStorage.setItem("theme", nextTheme);
      setIsDarkTheme(isNextDark);
    };

    const transitionDoc = document as TransitionDocument;
    if (!transitionDoc.startViewTransition) {
      applyTheme();
      return;
    }

    await transitionDoc.startViewTransition(() => {
      applyTheme();
    }).ready;

    document.documentElement.animate(
      {
        clipPath: isNextDark
          ? ["inset(0 0 100% 0)", "inset(0 0 0 0)"]
          : ["inset(100% 0 0 0)", "inset(0 0 0 0)"],
      },
      {
        duration: 600,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }, []);

  const handleCopyEmail = useCallback(() => {
    playMouseClickSound();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(DATA.personal.email).catch(() => undefined);
    }
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1800);
  }, []);

  const goTo = useCallback(
    (path: string) => {
      playMouseClickSound();
      setIsOpen(false);
      navigate(path);
      window.scrollTo(0, 0);
    },
    [navigate],
  );

  const openExternal = useCallback((url: string) => {
    playMouseClickSound();
    setIsOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const commands = useMemo<CommandItem[]>(() => {
    const navCommands: CommandItem[] = [
      {
        id: "nav-home",
        label: "Home",
        subtitle: "Bio, experience, featured projects & build rhythm",
        group: "Navigation",
        icon: Home,
        keywords: "home index landing profile",
        shortcut: "G H",
        action: () => goTo("/"),
      },
      {
        id: "nav-projects",
        label: "All Projects",
        subtitle: `${DATA.projects.length} builds with live demos & repos`,
        group: "Navigation",
        icon: LayoutGrid,
        keywords: "projects portfolio work demos",
        shortcut: "G P",
        action: () => goTo("/projects"),
      },
      {
        id: "nav-blogs",
        label: "Blogs",
        subtitle: `${BLOGS.length} architecture notes & deep dives`,
        group: "Navigation",
        icon: BookOpen,
        keywords: "blogs articles writing notes architecture",
        shortcut: "G B",
        action: () => goTo("/blogs"),
      },
      {
        id: "nav-resume",
        label: "Open Resume",
        subtitle: "View PDF resume in new tab",
        group: "Navigation",
        icon: FileText,
        keywords: "resume cv pdf experience",
        action: () => openExternal(DATA.personal.resume),
      },
    ];

    const quickCommands: CommandItem[] = [
      {
        id: "action-theme",
        label: isDarkTheme ? "Switch to Lilac Theme" : "Switch to Dark Theme",
        subtitle: "Toggle light / dark with View Transition",
        group: "Quick Actions",
        icon: isDarkTheme ? Sun : Moon,
        keywords: "theme dark light lilac mode appearance",
        action: () => {
          setIsOpen(false);
          void toggleTheme();
        },
      },
      {
        id: "action-email",
        label: copiedEmail ? "Email Copied!" : "Copy Email Address",
        subtitle: DATA.personal.email,
        group: "Quick Actions",
        icon: copiedEmail ? Check : Mail,
        keywords: "email contact mail copy reach out",
        action: handleCopyEmail,
      },
      {
        id: "action-github",
        label: "GitHub Profile",
        subtitle: DATA.personal.github,
        group: "Quick Actions",
        icon: Github,
        keywords: "github code repos open source",
        action: () => openExternal(`https://${DATA.personal.github}`),
      },
      {
        id: "action-linkedin",
        label: "LinkedIn Profile",
        subtitle: DATA.personal.linkedin,
        group: "Quick Actions",
        icon: Linkedin,
        keywords: "linkedin social profile",
        action: () => openExternal(`https://${DATA.personal.linkedin}`),
      },
    ];

    const projectCommands: CommandItem[] = DATA.projects
      .filter((p) => Boolean(p.link) || Boolean(p.sourceUrl))
      .slice(0, 6)
      .map((project) => ({
        id: `project-${project.name}`,
        label: project.name,
        subtitle: project.tech.slice(0, 4).join(" · "),
        group: "Projects" as const,
        icon: project.link ? ExternalLink : Github,
        keywords: `${project.name} ${project.tech.join(" ")} ${project.tag ?? ""}`,
        action: () =>
          openExternal(
            project.link || project.sourceUrl || "https://imrahul.me",
          ),
      }));

    const blogCommands: CommandItem[] = BLOGS.map((blog) => ({
      id: `blog-${blog.slug}`,
      label: blog.title,
      subtitle: `${blog.readTime} · ${blog.tags.slice(0, 3).join(", ")}`,
      group: "Blogs" as const,
      icon: BookOpen,
      keywords: `${blog.title} ${blog.tags.join(" ")} ${blog.slug}`,
      action: () => goTo(`/blogs/${blog.slug}`),
    }));

    return [
      ...navCommands,
      ...quickCommands,
      ...projectCommands,
      ...blogCommands,
    ];
  }, [
    copiedEmail,
    goTo,
    handleCopyEmail,
    isDarkTheme,
    openExternal,
    toggleTheme,
  ]);

  const filteredCommands = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return commands;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(trimmed) ||
        (cmd.subtitle?.toLowerCase().includes(trimmed) ?? false) ||
        cmd.keywords.toLowerCase().includes(trimmed),
    );
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      items: filteredCommands.filter((item) => item.group === group),
    })).filter((section) => section.items.length > 0);
  }, [filteredCommands]);

  const flatVisibleItems = useMemo(
    () => groupedCommands.flatMap((section) => section.items),
    [groupedCommands],
  );

  const safeActiveIndex = Math.min(
    activeIndex,
    Math.max(0, flatVisibleItems.length - 1),
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatVisibleItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatVisibleItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) =>
          (prev - 1 + flatVisibleItems.length) % flatVisibleItems.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const selected = flatVisibleItems[safeActiveIndex];
      if (selected) {
        requestAnimationFrame(() => selected.action());
      }
    }
  };

  return (
    <>
      {/* Subtle Pencil-Glass ⌘K Trigger Pill (Desktop Top-Right) */}
      <button
        type="button"
        onClick={(e) => {
          e.currentTarget.blur();
          handleOpenChange(true);
        }}
        aria-label="Open command palette (Command + K)"
        className="pencil-btn fixed top-5 right-5 z-[900] hidden cursor-pointer items-center gap-1.5 bg-background/85 px-3 py-1.5 font-mono text-[0.7rem] font-semibold text-foreground backdrop-blur-xl hover:bg-foreground hover:text-background sm:inline-flex"
      >
        <Command size={12} />
        <span>K</span>
      </button>

      {/* Monochrome Liquid Glass + Pencil Border Command Palette Dialog */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="fixed top-[16%] left-1/2 z-[1100] flex max-h-[72vh] w-[92vw] max-w-xl -translate-x-1/2 translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border-[2px] border-border bg-background/88 p-0 font-mono shadow-[5px_5px_0px_0px_var(--pencil-shadow)] ring-0 backdrop-blur-[32px] backdrop-saturate-[180%] outline-none sm:max-w-xl"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Command Palette</DialogTitle>
          </DialogHeader>

          {/* Search Input Row */}
          <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 dark:border-white/10">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Jump to page, project, blog, or action..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden rounded border border-border bg-background/60 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <div className="flex-1 overflow-y-auto p-2">
            {groupedCommands.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No matching commands for &ldquo;{query}&rdquo;
              </div>
            ) : (
              groupedCommands.map(({ group, items }) => (
                <div key={group} className="mb-2 last:mb-0">
                  <div className="px-2.5 py-1.5 text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                    {group}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => {
                      const flatIdx = flatVisibleItems.indexOf(item);
                      const isSelected = flatIdx === safeActiveIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          onClick={item.action}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                            isSelected
                              ? "border border-white/80 bg-white/75 text-foreground shadow-[0_2px_10px_rgba(155,92,255,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-white/15 dark:bg-white/12 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                              : "border border-transparent text-secondary-foreground hover:text-foreground",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60",
                              isSelected && "border-accent/40 text-accent",
                            )}
                          >
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-foreground">
                              {item.label}
                            </div>
                            {item.subtitle && (
                              <div className="truncate text-[0.68rem] text-muted-foreground">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <CornerDownLeft
                              size={13}
                              className="shrink-0 text-muted-foreground"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Hints */}
          <div className="flex items-center justify-between border-t border-border/70 bg-background/40 px-4 py-2 text-[0.65rem] text-muted-foreground dark:border-white/10">
            <div className="flex items-center gap-3">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
            </div>
            <span>⌘K to toggle</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
