/**
 * Large media hosted outside the site build. Files live on the orphan
 * `media/shortlist-launch` branch and are served by jsDelivr pinned to an
 * immutable commit, so they never end up in `dist/` and cache for a year.
 */

const SHORTLIST_MEDIA_BASE =
  "https://cdn.jsdelivr.net/gh/imRahul05/imRahul05.github.io@781c54b33516b3cb72a454198e13914f4bd3bd54";

export interface SiteVideo {
  /** Direct MP4 (H.264 + AAC) */
  src: string;
  /** First frame, shown before playback */
  poster: string;
  title: string;
  /** Short text alternative for screen readers and text-only outputs */
  description: string;
  durationSeconds: number;
  width: number;
  height: number;
}

export const SHORTLIST_LAUNCH_VIDEO: SiteVideo = {
  src: `${SHORTLIST_MEDIA_BASE}/shortlist-launch.mp4`,
  poster: `${SHORTLIST_MEDIA_BASE}/shortlist-launch-thumbnail.png`,
  title: "Shortlist launch",
  description:
    "Shortlist launch video, 29 seconds, with music. The Shortlist Chrome extension on an example job page: the match score card shows 69%, the user confirms a skill with “I have this” and the score rises to 78%, the Resume Studio highlights the job's skills, Autofill fills an application form, then “Your resume never leaves your browser” and the Shortlist logo with shortliistt.vercel.app.",
  durationSeconds: 29.5,
  width: 1080,
  height: 1080,
};

/** Videos a blog post can embed with an empty ```video:<name>``` fence. */
export const BLOG_VIDEOS: Record<string, SiteVideo> = {
  "shortlist-launch": SHORTLIST_LAUNCH_VIDEO,
};
