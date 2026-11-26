import React, { Suspense, lazy } from "react";

/**
 * Interactive embeds for blog posts. In a post's Markdown, write an empty
 * fenced block whose language is the embed name, e.g.
 *
 *   ```iso:shortlist
 *   ```
 *
 * Embeds are lazy-loaded so they only cost bytes on posts that use them.
 */
const EMBEDS: Record<string, React.LazyExoticComponent<React.FC>> = {
  "iso:shortlist": lazy(() => import("../iso/ShortlistIso")),
};

export const isBlogEmbed = (lang: string) => lang in EMBEDS;

export const BlogEmbed: React.FC<{ name: string }> = ({ name }) => {
  const Embed = EMBEDS[name];
  if (!Embed) return null;
  return (
    <Suspense
      fallback={
        <div className="cad-card my-6 grid aspect-[16/9] w-full place-items-center font-mono text-[0.7rem] tracking-[0.08em] text-muted-foreground uppercase">
          Loading 3D view…
        </div>
      }
    >
      <Embed />
    </Suspense>
  );
};
