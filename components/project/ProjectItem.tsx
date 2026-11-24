import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TypewriterText } from "../TypewriterText";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectItemProps {
  name: string;
  description: string;
  tech: string[];
  link?: string;
  tag?: string;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  name,
  description,
  tech,
  link,
  tag,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen((v) => !v);

  return (
    <div
      className="group cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
      <div className="mb-1 flex items-center gap-2">
        {link ? (
          <a
            href={link}
            className="text-sm font-bold text-foreground underline decoration-border underline-offset-4 transition-[text-decoration-color] duration-200 group-hover:decoration-foreground hover:decoration-foreground"
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
          >
            {name}
          </a>
        ) : (
          <span className="text-sm font-bold text-foreground">{name}</span>
        )}

        {tag && (
          <Badge
            variant="outline"
            className="h-auto rounded border-border bg-transparent px-2 py-0.5 text-[0.7rem] font-normal text-secondary-foreground whitespace-nowrap"
          >
            {tag}
          </Badge>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleOpen();
          }}
          className={cn(
            "flex cursor-pointer items-center border-none bg-transparent p-0 transition-opacity duration-200",
            isOpen
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
          aria-label={isOpen ? "Collapse details" : "Expand details"}
        >
          <ChevronDown
            size={14}
            className={cn(
              "text-muted-foreground transition-transform duration-200 ease-in-out",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {tech.map((t) => (
          <span key={t} className="before:content-['['] after:content-[']']">
            {t}
          </span>
        ))}
      </div>

      {isOpen && (
        <p className="mt-2 mb-2 text-sm leading-relaxed text-secondary-foreground">
          <TypewriterText text={description} speed={5} />
        </p>
      )}
    </div>
  );
};
