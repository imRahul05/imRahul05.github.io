import React, { useState } from "react";
import { ChevronDown, ExternalLink, Github } from "lucide-react";
import { TypewriterText } from "../TypewriterText";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectItemProps {
  name: string;
  period?: string;
  description: string;
  tech: string[];
  link?: string;
  sourceUrl?: string;
  tag?: string;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  name,
  period,
  description,
  tech,
  link,
  sourceUrl,
  tag,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen((v) => !v);

  return (
    <div
      className="group rounded-xl border border-border bg-background/60 p-4 transition-[border-color,background-color,box-shadow] duration-200 hover:border-accent/50 hover:bg-border-light/30 hover:shadow-[0_4px_20px_var(--hover-ripple)]"
      onClick={toggleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Title, tag, period */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">{name}</h3>
            {tag && (
              <Badge
                variant="outline"
                className="h-auto rounded border-border bg-transparent px-2 py-0.5 text-[0.65rem] font-normal text-secondary-foreground whitespace-nowrap"
              >
                {tag.trim()}
              </Badge>
            )}
            {period && (
              <span className="text-[0.68rem] text-muted-foreground">
                · {period}
              </span>
            )}
          </div>

          {/* Concise description preview when collapsed, full typewriter when expanded */}
          {!isOpen ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-secondary-foreground">
              {description}
            </p>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-secondary-foreground">
              <TypewriterText text={description} speed={4} />
            </p>
          )}
        </div>

        {/* Right: Always-visible Deployed + GitHub action pills + expand toggle */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {link && (
            <a
              href={link}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-foreground/20 bg-foreground px-2.5 py-1 font-mono text-[0.7rem] font-medium text-background transition-opacity hover:opacity-85"
            >
              <ExternalLink size={12} />
              Live
            </a>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[0.7rem] font-medium text-secondary-foreground transition-colors hover:border-muted-foreground hover:bg-border-light hover:text-foreground"
            >
              <Github size={12} />
              Repo
            </a>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleOpen();
            }}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-border-light hover:text-foreground"
            aria-label={isOpen ? "Collapse details" : "Expand details"}
          >
            <ChevronDown
              size={14}
              className={cn(
                "transition-transform duration-200 ease-in-out",
                isOpen && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {/* Tech stack badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tech.map((t) => (
          <Badge
            key={t}
            variant="outline"
            className="h-auto rounded border-border-light bg-transparent px-2 py-0.5 text-[0.65rem] font-normal text-muted-foreground transition-colors group-hover:border-border group-hover:text-secondary-foreground"
          >
            {t}
          </Badge>
        ))}
      </div>
    </div>
  );
};
