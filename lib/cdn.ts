/**
 * Cloudinary delivery helpers. Screenshots and videos are uploaded at full
 * resolution; these ask Cloudinary for a copy sized for where it's shown,
 * in the best format the browser supports (AVIF/WebP for images).
 * Non-Cloudinary URLs are returned unchanged.
 */

const CLOUDINARY =
  /^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/)/;

const transform = (url: string | undefined, params: string) => {
  if (!url) return url ?? "";
  const m = url.match(CLOUDINARY);
  if (!m) return url;
  // Skip URLs that already carry a transformation segment
  const rest = url.slice(m[1].length);
  if (/^[a-z]{1,3}_[^/]+\//.test(rest)) return url;
  return `${m[1]}${params}/${rest}`;
};

/** Responsive image: `width` is the largest CSS width it renders at (×2 for retina). */
export const cdnImage = (url: string | undefined, width: number) =>
  transform(url, `f_auto,q_auto,c_limit,w_${Math.round(width * 2)}`);

/** Small video (e.g. an avatar): keep MP4 for universal autoplay support. */
export const cdnVideo = (url: string | undefined, width: number) =>
  transform(url, `q_auto,c_limit,w_${Math.round(width * 2)}`);
