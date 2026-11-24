import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Settings,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { BLOGS } from "../../data/blogs";
import { MermaidDiagram } from "./MermaidDiagram";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BlogDetailPageProps {
  slug: string;
  onBack: () => void;
}

type FontStyle = "mono" | "sans" | "serif";
type ReadingTheme = "default" | "sepia" | "high-contrast";

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({
  slug,
  onBack,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Reading Preferences
  const [fontSize, setFontSize] = useState(16);
  const [fontStyle, setFontStyle] = useState<FontStyle>("mono");
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>("default");
  const [showSettings, setShowSettings] = useState(false);

  const blog = useMemo(() => {
    return BLOGS.find((b) => b.slug === slug);
  }, [slug]);

  useEffect(() => {
    const loadContent = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const { BLOG_CONTENTS } = await import("../../data/blog-contents");
        setContent(BLOG_CONTENTS[slug] || null);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error("Failed to load blog content:", err);
        setContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [slug]);

  const handleFontSizeChange = (delta: number) => {
    setFontSize((prev) => Math.min(Math.max(prev + delta * 2, 12), 32));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Simple markdown-like rendering for the content
  const renderContent = (rawContent: string) => {
    const lines = rawContent.trim().split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = "";
    let unorderedListItems: React.ReactNode[] = [];
    let orderedListItems: React.ReactNode[] = [];

    const flushLists = () => {
      if (unorderedListItems.length > 0) {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className="my-0 mb-4 ml-6 list-disc pl-1"
          >
            {unorderedListItems}
          </ul>,
        );
        unorderedListItems = [];
      }

      if (orderedListItems.length > 0) {
        elements.push(
          <ol
            key={`ol-${elements.length}`}
            className="my-0 mb-4 ml-6 list-decimal pl-1"
          >
            {orderedListItems}
          </ol>,
        );
        orderedListItems = [];
      }
    };

    lines.forEach((line, index) => {
      // Code block start/end
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLanguage = line.slice(3).trim();
          codeBlockContent = [];
        } else {
          const code = codeBlockContent.join("\n");

          if (codeBlockLanguage === "mermaid") {
            elements.push(
              <MermaidDiagram key={`mermaid-${index}`} chart={code} />,
            );
          } else {
            elements.push(
              <pre
                key={`code-${index}`}
                className={cn(
                  "my-4 overflow-x-auto rounded-lg border p-4",
                  readingTheme === "default" &&
                    "border-border bg-border-light text-foreground",
                  readingTheme === "sepia" &&
                    "border-[#5b4636]/20 bg-[#5b4636]/5 text-[#5b4636]",
                  readingTheme === "high-contrast" &&
                    "border-white bg-[#111111] text-white",
                )}
              >
                <code
                  className={cn(
                    "font-mono text-[0.8rem] leading-relaxed whitespace-pre",
                    readingTheme === "default" && "text-foreground",
                    readingTheme === "sepia" && "text-[#5b4636]",
                    readingTheme === "high-contrast" && "text-white",
                    `language-${codeBlockLanguage}`,
                  )}
                >
                  {code}
                </code>
              </pre>,
            );
          }
          inCodeBlock = false;
          codeBlockContent = [];
          codeBlockLanguage = "";
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Skip empty lines
      if (line.trim() === "") {
        flushLists();
        return;
      }

      // H1
      if (line.startsWith("# ")) {
        flushLists();
        elements.push(
          <h1
            key={index}
            className={cn(
              "mt-8 mb-4 text-[1.6em] font-bold tracking-tight first:mt-0",
              readingTheme === "default" && "text-foreground",
              readingTheme === "sepia" && "text-[#5b4636]",
              readingTheme === "high-contrast" && "text-white",
            )}
          >
            {line.slice(2)}
          </h1>,
        );
        return;
      }

      // H2
      if (line.startsWith("## ")) {
        flushLists();
        elements.push(
          <h2
            key={index}
            className={cn(
              "mt-8 mb-3 text-[1.4em] font-bold tracking-tight",
              readingTheme === "default" && "text-foreground",
              readingTheme === "sepia" && "text-[#5b4636]",
              readingTheme === "high-contrast" && "text-white",
            )}
          >
            {line.slice(3)}
          </h2>,
        );
        return;
      }

      // H3
      if (line.startsWith("### ")) {
        flushLists();
        elements.push(
          <h3
            key={index}
            className={cn(
              "mt-6 mb-2 text-[1.2em] font-bold tracking-tight",
              readingTheme === "default" && "text-foreground",
              readingTheme === "sepia" && "text-[#5b4636]",
              readingTheme === "high-contrast" && "text-white",
            )}
          >
            {line.slice(4)}
          </h3>,
        );
        return;
      }

      // List items
      if (line.startsWith("- ")) {
        orderedListItems = [];
        unorderedListItems.push(
          <li
            key={index}
            className={cn(
              "mb-2 text-[1em] leading-relaxed",
              readingTheme === "default" && "text-secondary-foreground",
              readingTheme === "sepia" && "text-[#5b4636]",
              readingTheme === "high-contrast" && "text-white",
            )}
          >
            {renderInlineContent(line.slice(2))}
          </li>,
        );
        return;
      }

      // Numbered list items
      const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
      if (orderedMatch) {
        unorderedListItems = [];
        orderedListItems.push(
          <li
            key={index}
            className={cn(
              "mb-2 text-[1em] leading-relaxed",
              readingTheme === "default" && "text-secondary-foreground",
              readingTheme === "sepia" && "text-[#5b4636]",
              readingTheme === "high-contrast" && "text-white",
            )}
          >
            {renderInlineContent(orderedMatch[1])}
          </li>,
        );
        return;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        flushLists();
        elements.push(
          <blockquote
            key={index}
            className={cn(
              "my-6 rounded-r-lg border-l-4 py-3 pr-4 pl-4 italic leading-[1.8]",
              readingTheme === "default" &&
                "border-accent bg-border-light/50 text-foreground",
              readingTheme === "sepia" &&
                "border-[#5b4636]/50 bg-[#5b4636]/5 text-[#5b4636]",
              readingTheme === "high-contrast" &&
                "border-white bg-[#111111] text-white",
            )}
          >
            {renderInlineContent(line.slice(2))}
          </blockquote>,
        );
        return;
      }

      // Regular paragraph
      flushLists();
      elements.push(
        <p
          key={index}
          className={cn(
            "mb-5 text-[1em] leading-[1.8]",
            readingTheme === "default" && "text-secondary-foreground",
            readingTheme === "sepia" && "text-[#5b4636]",
            readingTheme === "high-contrast" && "text-white",
          )}
        >
          {renderInlineContent(line)}
        </p>,
      );
    });

    flushLists();
    return elements;
  };

  // Render inline markdown: code, links, and bold text
  const renderInlineContent = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const tokenRegex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith("`") && token.endsWith("`")) {
        nodes.push(
          <code
            key={`${match.index}-code`}
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[0.85em]",
              readingTheme === "default" && "bg-border-light text-foreground",
              readingTheme === "sepia" &&
                "border border-[#5b4636]/20 bg-[#5b4636]/5 text-[#5b4636]",
              readingTheme === "high-contrast" &&
                "border border-white bg-[#111111] text-white",
            )}
          >
            {token.slice(1, -1)}
          </code>,
        );
      } else if (token.startsWith("[")) {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, href] = linkMatch;
          nodes.push(
            <a
              key={`${match.index}-link`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "underline underline-offset-2 transition-colors",
                readingTheme === "default" &&
                  "text-foreground hover:text-secondary-foreground",
                readingTheme === "sepia" && "text-[#5b4636] hover:opacity-80",
                readingTheme === "high-contrast" &&
                  "text-white hover:opacity-80",
              )}
            >
              {label}
            </a>,
          );
        } else {
          nodes.push(token);
        }
      } else if (token.startsWith("**") && token.endsWith("**")) {
        nodes.push(
          <strong key={`${match.index}-bold`}>{token.slice(2, -2)}</strong>,
        );
      } else {
        nodes.push(token);
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes;
  };

  if (!blog) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-6 pt-14 pb-28 font-mono">
        <header className="mb-8 flex items-center justify-between">
          <button
            className="inline-flex cursor-pointer items-center gap-2 py-2 font-mono text-sm text-secondary-foreground transition-colors hover:text-foreground"
            onClick={onBack}
          >
            <ArrowLeft size={20} />
            <span>Back to Blogs</span>
          </button>
        </header>
        <div className="py-16 text-center">
          <h1 className="mb-2 text-2xl font-bold">Blog not found</h1>
          <p className="text-muted-foreground">
            The blog post you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen w-full transition-colors duration-200",
        readingTheme === "sepia" && "bg-[#f4ecd8] text-[#5b4636]",
        readingTheme === "high-contrast" && "bg-black text-white",
      )}
    >
      <div className="mx-auto max-w-3xl px-6 pt-14 pb-28">
        <header
          className={cn(
            "mb-8 flex items-center justify-between",
            readingTheme === "sepia" && "border-[#5b4636]/20",
            readingTheme === "high-contrast" && "border-white",
          )}
        >
          <button
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 py-2 font-mono text-sm transition-colors",
              readingTheme === "default" &&
                "text-secondary-foreground hover:text-foreground",
              readingTheme === "sepia" &&
                "text-[#5b4636]/80 hover:text-[#5b4636]",
              readingTheme === "high-contrast" && "text-white hover:opacity-80",
            )}
            onClick={onBack}
          >
            <ArrowLeft size={20} />
            <span>Back to Blogs</span>
          </button>

          <div className="relative">
            <button
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-200",
                readingTheme === "default" &&
                  "text-secondary-foreground hover:bg-border-light hover:text-foreground",
                readingTheme === "default" &&
                  showSettings &&
                  "bg-border-light text-foreground",
                readingTheme === "sepia" &&
                  "text-[#5b4636]/80 hover:bg-[#5b4636]/5 hover:text-[#5b4636]",
                readingTheme === "sepia" &&
                  showSettings &&
                  "bg-[#5b4636]/5 text-[#5b4636]",
                readingTheme === "high-contrast" &&
                  "text-white hover:bg-[#111111] hover:text-white",
                readingTheme === "high-contrast" &&
                  showSettings &&
                  "bg-[#111111] text-white",
              )}
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Reading settings"
            >
              <Settings size={20} />
            </button>

            {showSettings && (
              <div
                className={cn(
                  "absolute top-full right-0 z-50 mt-2 w-60 rounded-xl border p-5 shadow-xl backdrop-blur-md",
                  readingTheme === "default" &&
                    "border-border bg-background/95",
                  readingTheme === "sepia" &&
                    "border-[#5b4636]/20 bg-[#f4ecd8]/95",
                  readingTheme === "high-contrast" &&
                    "border-white bg-[#111111]/95 text-white",
                )}
              >
                <div className="mb-5">
                  <span
                    className={cn(
                      "mb-3 block text-xs font-bold tracking-wider uppercase",
                      readingTheme === "default" && "text-muted-foreground",
                      readingTheme === "sepia" && "text-[#5b4636]/70",
                      readingTheme === "high-contrast" && "text-white",
                    )}
                  >
                    Font Size
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      className={cn(
                        "flex size-8 cursor-pointer items-center justify-center rounded-md border transition-all duration-200",
                        readingTheme === "default" &&
                          "border-border text-secondary-foreground hover:border-muted-foreground hover:text-foreground",
                        readingTheme === "sepia" &&
                          "border-[#5b4636]/20 text-[#5b4636] hover:border-[#5b4636]",
                        readingTheme === "high-contrast" &&
                          "border-white text-white hover:bg-[#222222]",
                      )}
                      onClick={() => handleFontSizeChange(-1)}
                      aria-label="Decrease font size"
                    >
                      <Minimize2 size={16} />
                    </button>
                    <span className="min-w-[3ch] text-center text-sm font-medium">
                      {fontSize}px
                    </span>
                    <button
                      className={cn(
                        "flex size-8 cursor-pointer items-center justify-center rounded-md border transition-all duration-200",
                        readingTheme === "default" &&
                          "border-border text-secondary-foreground hover:border-muted-foreground hover:text-foreground",
                        readingTheme === "sepia" &&
                          "border-[#5b4636]/20 text-[#5b4636] hover:border-[#5b4636]",
                        readingTheme === "high-contrast" &&
                          "border-white text-white hover:bg-[#222222]",
                      )}
                      onClick={() => handleFontSizeChange(1)}
                      aria-label="Increase font size"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-5">
                  <span
                    className={cn(
                      "mb-3 block text-xs font-bold tracking-wider uppercase",
                      readingTheme === "default" && "text-muted-foreground",
                      readingTheme === "sepia" && "text-[#5b4636]/70",
                      readingTheme === "high-contrast" && "text-white",
                    )}
                  >
                    Font Style
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["mono", "sans", "serif"] as const).map((style) => (
                      <button
                        key={style}
                        className={cn(
                          "cursor-pointer rounded-md border py-1 text-xs capitalize transition-all duration-200",
                          fontStyle === style
                            ? readingTheme === "default"
                              ? "border-foreground bg-border-light font-bold text-foreground"
                              : readingTheme === "sepia"
                                ? "border-[#5b4636] bg-[#5b4636]/10 font-bold text-[#5b4636]"
                                : "border-white bg-[#222222] font-bold text-white"
                            : readingTheme === "default"
                              ? "border-border text-secondary-foreground hover:border-muted-foreground"
                              : readingTheme === "sepia"
                                ? "border-[#5b4636]/20 text-[#5b4636]/80 hover:border-[#5b4636]"
                                : "border-white/50 text-white/80 hover:border-white",
                        )}
                        onClick={() => setFontStyle(style)}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span
                    className={cn(
                      "mb-3 block text-xs font-bold tracking-wider uppercase",
                      readingTheme === "default" && "text-muted-foreground",
                      readingTheme === "sepia" && "text-[#5b4636]/70",
                      readingTheme === "high-contrast" && "text-white",
                    )}
                  >
                    Reading Theme
                  </span>
                  <div className="flex gap-3">
                    <button
                      className={cn(
                        "size-8 cursor-pointer rounded-full border-2 border-[#e5e7eb] bg-white transition-transform duration-200 dark:border-[#334155] dark:bg-[#0f172a]",
                        readingTheme === "default" &&
                          "scale-115 border-foreground dark:border-white",
                      )}
                      onClick={() => setReadingTheme("default")}
                      title="Default"
                      aria-label="Default reading theme"
                    />
                    <button
                      className={cn(
                        "size-8 cursor-pointer rounded-full border-2 border-transparent bg-[#f4ecd8] transition-transform duration-200",
                        readingTheme === "sepia" &&
                          "scale-115 border-[#5b4636]",
                      )}
                      onClick={() => setReadingTheme("sepia")}
                      title="Sepia"
                      aria-label="Sepia reading theme"
                    />
                    <button
                      className={cn(
                        "size-8 cursor-pointer rounded-full border-2 border-white bg-black transition-transform duration-200",
                        readingTheme === "high-contrast" &&
                          "scale-115 border-white ring-2 ring-white/50",
                      )}
                      onClick={() => setReadingTheme("high-contrast")}
                      title="High Contrast"
                      aria-label="High contrast reading theme"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <article
          className={cn(
            "max-w-full",
            fontStyle === "mono" && "font-mono",
            fontStyle === "sans" &&
              "font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]",
            fontStyle === "serif" &&
              "font-[Georgia,Cambria,'Times_New_Roman',Times,serif]",
          )}
        >
          {blog.image && (
            <div className="relative mb-8 w-full overflow-hidden rounded-xl border border-border-light bg-border-light/40">
              {!isImageLoaded && (
                <Skeleton className="aspect-16/9 w-full rounded-xl animate-shimmer" />
              )}
              <img
                src={blog.image}
                alt={blog.title}
                className={`h-auto max-h-[520px] w-full rounded-xl object-contain dark:brightness-95 ${
                  !isImageLoaded ? "hidden" : ""
                }`}
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
          )}

          <div
            className={cn(
              "mb-8 border-b pb-6",
              readingTheme === "default" && "border-border",
              readingTheme === "sepia" && "border-[#5b4636]/20",
              readingTheme === "high-contrast" && "border-white",
            )}
          >
            <h1
              className={cn(
                "mb-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl",
                readingTheme === "default" && "text-foreground",
                readingTheme === "sepia" && "text-[#5b4636]",
                readingTheme === "high-contrast" && "text-white",
              )}
            >
              {blog.title}
            </h1>

            <div className="mb-4 flex items-center gap-6">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  readingTheme === "default" && "text-muted-foreground",
                  readingTheme === "sepia" && "text-[#5b4636]/70",
                  readingTheme === "high-contrast" && "text-white",
                )}
              >
                <Calendar size={14} />
                {formatDate(blog.date)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  readingTheme === "default" && "text-muted-foreground",
                  readingTheme === "sepia" && "text-[#5b4636]/70",
                  readingTheme === "high-contrast" && "text-white",
                )}
              >
                <Clock size={14} />
                {blog.readTime}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn(
                    "gap-1 rounded px-2 py-1 text-xs font-normal",
                    readingTheme === "default" &&
                      "border-border text-secondary-foreground",
                    readingTheme === "sepia" &&
                      "border-[#5b4636]/30 text-[#5b4636]",
                    readingTheme === "high-contrast" &&
                      "border-white text-white",
                  )}
                >
                  <Tag size={10} />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="leading-[1.8]" style={{ fontSize: `${fontSize}px` }}>
            {isLoading ? (
              <div className="mt-4 flex flex-col gap-5">
                <Skeleton className="h-4 w-full animate-shimmer" />
                <Skeleton className="h-4 w-full animate-shimmer" />
                <Skeleton className="h-4 w-[80%] animate-shimmer" />
                <Skeleton className="mt-8 h-4 w-[90%] animate-shimmer" />
                <Skeleton className="h-4 w-full animate-shimmer" />
                <Skeleton className="h-4 w-[70%] animate-shimmer" />
              </div>
            ) : content ? (
              renderContent(content)
            ) : (
              <div
                className={cn(
                  "py-12 text-center",
                  readingTheme === "default" && "text-muted-foreground",
                  readingTheme === "sepia" && "text-[#5b4636]/70",
                  readingTheme === "high-contrast" && "text-white",
                )}
              >
                <p>Content could not be loaded. Please try again later.</p>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};
