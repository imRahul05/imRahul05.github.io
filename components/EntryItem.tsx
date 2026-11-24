import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TypewriterText } from "./TypewriterText";

interface EntryItemProps {
  title: string;
  subtitle: string;
  meta: string;
  description: string;
}

export const EntryItem: React.FC<EntryItemProps> = ({
  title,
  subtitle,
  meta,
  description,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group mb-8 last:mb-0">
      <div className="flex flex-col mb-1 sm:flex-row sm:justify-between sm:items-baseline">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm">{title}</h3>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "bg-transparent border-0 cursor-pointer p-0 flex items-center transition-opacity duration-200 ease-in-out",
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
                isOpen ? "rotate-180" : "rotate-0",
              )}
            />
          </button>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{meta}</span>
      </div>
      <div className="font-medium text-secondary-foreground mb-2 text-sm">
        {subtitle}
      </div>
      {isOpen && (
        <p className="text-sm text-secondary-foreground leading-relaxed">
          <TypewriterText text={description} speed={5} />
        </p>
      )}
    </div>
  );
};
