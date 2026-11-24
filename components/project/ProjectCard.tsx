import React, { useState, useRef, useCallback } from "react";
import { Play, X, Globe, Github } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
}

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
}) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      <div className="group/card flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background transition-[border-color,box-shadow,transform] duration-300 hover:border-[rgba(80,200,120,0.5)] hover:shadow-[0_0_20px_rgba(80,200,120,0.15)]">
        {/* Image Section */}
        <div className="relative m-3 mb-0 aspect-video w-[calc(100%-1.5rem)] shrink-0 overflow-hidden rounded-lg bg-border-light">
          {!isImageLoaded && image && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-lg animate-shimmer" />
          )}
          {image ? (
            <img
              src={image}
              alt={name}
              className={cn(
                "h-full w-full rounded-lg object-cover transition-[transform,filter] duration-300 group-hover/card:scale-[1.02] dark:grayscale",
                !isImageLoaded && "hidden",
              )}
              onLoad={() => setIsImageLoaded(true)}
            />
          ) : (
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-border-light to-border" />
          )}
          {video && (
            <button
              type="button"
              className="absolute top-1/2 left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 scale-90 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-white/80 bg-black/60 text-white opacity-0 backdrop-blur-[4px] transition-[opacity,transform,background-color] duration-250 hover:scale-110 hover:border-white hover:bg-black/80 group-hover/card:scale-100 group-hover/card:opacity-100 group-focus-within/card:scale-100 group-focus-within/card:opacity-100 max-sm:top-auto max-sm:bottom-[0.9rem] max-sm:left-[0.9rem] max-sm:h-auto max-sm:w-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:scale-100 max-sm:rounded-full max-sm:border-white/70 max-sm:bg-black/[0.72] max-sm:px-[0.85rem] max-sm:py-[0.55rem] max-sm:opacity-100 max-sm:shadow-[0_10px_24px_rgba(0,0,0,0.22)] max-sm:hover:scale-100 [@media(hover:none)]:top-auto [@media(hover:none)]:bottom-[0.9rem] [@media(hover:none)]:left-[0.9rem] [@media(hover:none)]:h-auto [@media(hover:none)]:w-auto [@media(hover:none)]:translate-x-0 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:scale-100 [@media(hover:none)]:rounded-full [@media(hover:none)]:border-white/70 [@media(hover:none)]:bg-black/[0.72] [@media(hover:none)]:px-[0.85rem] [@media(hover:none)]:py-[0.55rem] [@media(hover:none)]:opacity-100 [@media(hover:none)]:shadow-[0_10px_24px_rgba(0,0,0,0.22)] [@media(hover:none)]:hover:scale-100 [@media(pointer:coarse)]:top-auto [@media(pointer:coarse)]:bottom-[0.9rem] [@media(pointer:coarse)]:left-[0.9rem] [@media(pointer:coarse)]:h-auto [@media(pointer:coarse)]:w-auto [@media(pointer:coarse)]:translate-x-0 [@media(pointer:coarse)]:translate-y-0 [@media(pointer:coarse)]:scale-100 [@media(pointer:coarse)]:rounded-full [@media(pointer:coarse)]:border-white/70 [@media(pointer:coarse)]:bg-black/[0.72] [@media(pointer:coarse)]:px-[0.85rem] [@media(pointer:coarse)]:py-[0.55rem] [@media(pointer:coarse)]:opacity-100 [@media(pointer:coarse)]:shadow-[0_10px_24px_rgba(0,0,0,0.22)] [@media(pointer:coarse)]:hover:scale-100"
              onClick={handlePlayClick}
              aria-label={`Play ${name} video`}
            >
              <Play className="size-7 fill-current max-sm:size-4 [@media(hover:none)]:size-4 [@media(pointer:coarse)]:size-4" />
              <span className="hidden text-[0.72rem] font-bold tracking-[0.08em] uppercase whitespace-nowrap max-sm:inline [@media(hover:none)]:inline [@media(pointer:coarse)]:inline">
                Video demo
              </span>
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-4 pt-3">
          <h3 className="mb-1 block text-base font-bold tracking-[-0.01em] text-foreground">
            {name}
          </h3>
          {tag && <p className="mb-3 text-xs text-muted-foreground">{tag}</p>}
          {period && (
            <p className="mb-3 text-xs text-muted-foreground">{period}</p>
          )}
          <p className="mb-4 line-clamp-3 text-[0.8rem] leading-[1.6] text-secondary-foreground">
            {description}
          </p>

          {/* Tech Stack Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            {tech.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="h-auto rounded border-border bg-transparent px-2 py-1 text-[0.7rem] font-normal text-secondary-foreground transition-colors group-hover/card:border-muted-foreground"
              >
                {t}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto flex flex-nowrap gap-3 pt-2">
            {link && (
              <a
                href={link}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-[0.4rem] font-mono text-xs text-secondary-foreground transition-colors duration-200 hover:border-muted-foreground hover:bg-border-light hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe size={14} />
                Website
              </a>
            )}
            {sourceUrl && (
              <a
                href={sourceUrl}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-[0.4rem] font-mono text-xs text-secondary-foreground transition-colors duration-200 hover:border-muted-foreground hover:bg-border-light hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={14} />
                Source
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal using Base UI Dialog */}
      {video && (
        <Dialog open={isVideoModalOpen} onOpenChange={handleOpenChange}>
          <DialogPortal>
            <DialogOverlay className="z-50 bg-black/90 backdrop-blur-none" />
          </DialogPortal>
          <DialogContent
            showCloseButton={false}
            className="relative z-50 max-h-[90vh] w-full max-w-[90vw] gap-0 border-0 bg-transparent p-0 shadow-none ring-0 outline-none sm:max-w-[90vw]"
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
