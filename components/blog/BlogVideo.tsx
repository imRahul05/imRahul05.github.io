import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { SiteVideo } from "@/data/media";

/**
 * A captioned video figure for blog posts. Neither the poster nor the video
 * is requested until the figure comes within `rootMargin` of the viewport,
 * and with preload="none" the video itself only loads when played.
 */
export const BlogVideo: React.FC<{
  video: SiteVideo;
  caption: string;
  className?: string;
  rootMargin?: string;
}> = ({ video, caption, className, rootMargin = "400px 0px" }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [near, setNear] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, rootMargin]);

  return (
    <figure
      ref={ref}
      className={cn(
        "cad-card mx-auto my-6 w-full max-w-[30rem] overflow-hidden",
        className,
      )}
    >
      <video
        src={near ? video.src : undefined}
        poster={near ? video.poster : undefined}
        controls
        playsInline
        preload="none"
        width={video.width}
        height={video.height}
        aria-label={video.description}
        className="block h-auto w-full bg-black"
        style={{ aspectRatio: `${video.width} / ${video.height}` }}
      >
        <a href={video.src}>Download the video (MP4)</a>
      </video>
      <figcaption className="border-t border-border px-4 py-2.5 font-mono text-[0.66rem] leading-[1.6] tracking-[0.04em] text-muted-foreground uppercase">
        {caption}
      </figcaption>
    </figure>
  );
};

export default BlogVideo;
