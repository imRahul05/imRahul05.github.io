import React, { useState, useRef, useCallback } from "react";
import { Play, X, ExternalLink, Github, Terminal } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  name: string;
  period?: string;
  description: string;
  tech: string[];
  link?: string;
  sourceUrl?: string;
  image?: string;
  video?: string;
  tag?: string;
  previewCommand?: string;
  previewTagline?: string;
}

const MAX_VISIBLE_TECH = 5;

export const ProjectCard: React.FC<ProjectCardProps> = ({
  name,
  period,
  description,
  tech,
  link,
  sourceUrl,
  image,
  video,
  tag,
  previewCommand,
  previewTagline,
}) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isTechExpanded, setIsTechExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const visibleTech = isTechExpanded ? tech : tech.slice(0, MAX_VISIBLE_TECH);
  const hiddenTech = tech.slice(MAX_VISIBLE_TECH);
  const remainingTechCount = hiddenTech.length;

  const handlePlayClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (video) {
        setIsVideoModalOpen(true);
      }
    },
    [video],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setIsVideoModalOpen(open);
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <>
      <article className="group/card flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background transition-[border-color,box-shadow,transform] duration-300 hover:border-accent/60 hover:shadow-[0_8px_28px_var(--hover-ripple)]">
        {/* Visual Header Section */}
        <div className="relative m-3 mb-0 aspect-video w-[calc(100%-1.5rem)] shrink-0 overflow-hidden rounded-lg border border-border-light bg-border-light">
          {!isImageLoaded && image && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-lg animate-shimmer" />
          )}
          {image ? (
            <img
              src={image}
              alt={name}
              className={cn(
                "h-full w-full rounded-lg object-cover transition-[transform,filter] duration-300 group-hover/card:scale-[1.03] dark:grayscale dark:group-hover/card:grayscale-0",
                !isImageLoaded && "hidden",
              )}
              onLoad={() => setIsImageLoaded(true)}
            />
          ) : (
            <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-lg bg-[radial-gradient(circle_at_top_right,var(--hover-ripple),transparent_55%),linear-gradient(145deg,var(--border-light),var(--background))] p-3.5">
              {/* Subtle terminal chrome */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                </div>
                {link ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[0.625rem] font-medium text-secondary-foreground backdrop-blur-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground backdrop-blur-xs">
                    Open Source
                  </span>
                )}
              </div>

              {/* Center command / architecture signature */}
              <div className="my-auto flex flex-col gap-1.5 py-2">
                <div className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-md border border-border bg-background/90 px-2.5 py-1 text-[0.7rem] font-semibold text-foreground shadow-xs">
                  <Terminal size={12} className="shrink-0 text-accent" />
                  <span className="truncate">
                    {previewCommand ?? name.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                </div>
                {previewTagline && (
                  <p className="line-clamp-1 text-[0.68rem] text-muted-foreground">
                    {previewTagline}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[0.625rem] tracking-wider uppercase text-muted-foreground">
                <span>{tech[0]}</span>
                <span>{period ?? "Project"}</span>
              </div>
            </div>
          )}

          {video && (
            <button
              type="button"
              className="absolute top-1/2 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 scale-90 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-white/80 bg-black/60 text-white opacity-0 backdrop-blur-[4px] transition-[opacity,transform,background-color] duration-250 hover:scale-105 hover:border-white hover:bg-black/80 group-hover/card:scale-100 group-hover/card:opacity-100 group-focus-within/card:scale-100 group-focus-within/card:opacity-100 max-sm:top-auto max-sm:bottom-3 max-sm:left-3 max-sm:h-auto max-sm:w-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:scale-100 max-sm:px-3 max-sm:py-1.5 max-sm:opacity-100 [@media(hover:none)]:top-auto [@media(hover:none)]:bottom-3 [@media(hover:none)]:left-3 [@media(hover:none)]:h-auto [@media(hover:none)]:w-auto [@media(hover:none)]:translate-x-0 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:scale-100 [@media(hover:none)]:px-3 [@media(hover:none)]:py-1.5 [@media(hover:none)]:opacity-100"
              onClick={handlePlayClick}
              aria-label={`Play ${name} video`}
            >
              <Play className="size-6 fill-current max-sm:size-3.5 [@media(hover:none)]:size-3.5" />
              <span className="hidden text-[0.68rem] font-bold tracking-[0.08em] uppercase whitespace-nowrap max-sm:inline [@media(hover:none)]:inline">
                Demo
              </span>
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-4 pt-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="text-base font-bold tracking-[-0.01em] text-foreground">
              {name}
            </h3>
            {period && image && (
              <span className="shrink-0 pt-0.5 text-[0.65rem] text-muted-foreground">
                {period.split(" - ")[0]}
              </span>
            )}
          </div>

          {tag && (
            <p className="mb-2 text-[0.7rem] font-medium text-accent/90 dark:text-muted-foreground">
              {tag}
            </p>
          )}

          <p className="mb-4 line-clamp-3 text-[0.78rem] leading-[1.6] text-secondary-foreground">
            {description}
          </p>

          {/* Tech Stack Badges */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {visibleTech.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="h-auto rounded border-border bg-transparent px-2 py-0.5 text-[0.68rem] font-normal text-secondary-foreground transition-colors group-hover/card:border-muted-foreground"
              >
                {t}
              </Badge>
            ))}
            {remainingTechCount > 0 && !isTechExpanded && (
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  onClick={() => setIsTechExpanded(true)}
                  aria-label={`Show ${remainingTechCount} more technologies: ${hiddenTech.join(", ")}`}
                  className="inline-flex h-auto cursor-pointer items-center rounded border border-border-light bg-border-light/60 px-2 py-0.5 font-mono text-[0.68rem] font-normal text-muted-foreground transition-colors hover:border-border hover:bg-border-light hover:text-foreground"
                >
                  +{remainingTechCount}
                </TooltipTrigger>
                <TooltipContent side="top" className="font-mono text-[0.7rem]">
                  <span>{hiddenTech.join(" · ")}</span>
                </TooltipContent>
              </Tooltip>
            )}
            {remainingTechCount > 0 && isTechExpanded && (
              <button
                type="button"
                onClick={() => setIsTechExpanded(false)}
                className="inline-flex h-auto cursor-pointer items-center rounded border border-border-light bg-transparent px-2 py-0.5 font-mono text-[0.68rem] font-normal text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                Show less
              </button>
            )}
          </div>

          {/* Action Links */}
          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border-light pt-3">
            {link && (
              <a
                href={link}
                className="inline-flex items-center gap-1.5 rounded-md border border-foreground/20 bg-foreground px-3 py-1.5 font-mono text-[0.72rem] font-medium text-background transition-opacity duration-200 hover:opacity-85"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={13} />
                Live Demo
              </a>
            )}
            {sourceUrl && (
              <a
                href={sourceUrl}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 font-mono text-[0.72rem] font-medium text-secondary-foreground transition-colors duration-200 hover:border-muted-foreground hover:bg-border-light hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={13} />
                Source
              </a>
            )}
            {video && (
              <button
                type="button"
                onClick={handlePlayClick}
                className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md border border-border-light bg-transparent px-2.5 py-1.5 font-mono text-[0.7rem] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <Play size={12} className="fill-current" />
                Video
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Fullscreen Video Modal using Base UI Dialog */}
      {video && (
        <Dialog open={isVideoModalOpen} onOpenChange={handleOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="fixed top-1/2 left-1/2 z-[1000] max-h-[90vh] w-[90vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 gap-0 border-0 bg-transparent p-0 shadow-none ring-0 outline-none sm:max-w-5xl"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{name} video player</DialogTitle>
            </DialogHeader>
            <DialogClose
              className="absolute -top-10 right-0 z-10 flex cursor-pointer items-center justify-center border-0 bg-transparent p-2 text-white outline-none transition-opacity duration-200 hover:opacity-70"
              aria-label="Close video"
            >
              <X size={24} />
            </DialogClose>
            <video
              ref={videoRef}
              src={video}
              controls
              autoPlay
              className="max-h-[85vh] w-full rounded-lg bg-black"
            >
              Your browser does not support the video tag.
            </video>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
