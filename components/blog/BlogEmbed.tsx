import React, { Suspense, lazy } from "react";
import { SHORTLIST_LAUNCH_VIDEO } from "@/data/media";
import { BlogVideo } from "./BlogVideo";

/**
 * Embeds for blog posts. In a post's Markdown, write an empty fenced block
 * whose language is the embed name, e.g.
 *
 *   ```iso:shortlist
 *   ```
 *
 * Heavy embeds are lazy-loaded so they only cost bytes on posts that use
 * them; video embeds fetch nothing until they're near the viewport.
 */
const ShortlistLaunchVideo: React.FC = () => (
  <BlogVideo
    video={SHORTLIST_LAUNCH_VIDEO}
    caption="Fig. 02 — The real extension on an example job page: score, confirm a skill, tailor, autofill. 29 s · sound on."
  />
);

const EMBEDS: Record<string, React.ComponentType> = {
  "iso:shortlist": lazy(() => import("../iso/ShortlistIso")),
  "video:shortlist-launch": ShortlistLaunchVideo,
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
